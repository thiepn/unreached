export type WorkerSyncKind = "saved" | "prayer";
export type WorkerSyncAction = "upsert" | "delete";

export interface WorkerSyncMutation {
  mutationId: string;
  kind: WorkerSyncKind;
  sourcePeopleId: number;
  action: WorkerSyncAction;
  baseItemRevision: number;
  payload: unknown | null;
  lastPrayedAt: string | null;
}

function createClaimToken(): string {
  if (typeof crypto.randomUUID !== "function") throw new Error("Private sync could not create a mutation claim.");
  return crypto.randomUUID();
}

export async function applyMutationAtomic(env: Env, userId: string, mutation: WorkerSyncMutation): Promise<void> {
  const claim = createClaimToken();
  const now = new Date().toISOString();

  const statements: D1PreparedStatement[] = [
    // Only the request that successfully inserts this unique claim token may
    // advance the account revision or alter the item. A duplicate mutation ID
    // therefore becomes a true no-op even when duplicate requests race.
    env.DB.prepare(`
      INSERT INTO sync_mutations (user_id, mutation_id, created_at, claim_token, outcome, applied_revision)
      VALUES (?1, ?2, ?3, ?4, 'claimed', NULL)
      ON CONFLICT(user_id, mutation_id) DO NOTHING
    `).bind(userId, mutation.mutationId, now, claim),

    // Opposing state created after this mutation's base revision wins in both
    // directions: a newer tombstone blocks a stale upsert, and a newer present
    // item blocks a stale delete. A user who first receives that newer state can
    // intentionally act again with its current revision as the new base.
    env.DB.prepare(`
      UPDATE sync_users
      SET revision = revision + 1, updated_at = ?4
      WHERE user_id = ?1
        AND EXISTS (
          SELECT 1 FROM sync_mutations
          WHERE user_id = ?1 AND mutation_id = ?2 AND claim_token = ?3 AND outcome = 'claimed'
        )
        AND NOT EXISTS (
          SELECT 1 FROM sync_items
          WHERE user_id = ?1 AND kind = ?5 AND source_people_id = ?6
            AND revision > ?7
            AND ((?8 = 'upsert' AND present = 0) OR (?8 = 'delete' AND present = 1))
        )
    `).bind(
      userId,
      mutation.mutationId,
      claim,
      now,
      mutation.kind,
      mutation.sourcePeopleId,
      mutation.baseItemRevision,
      mutation.action,
    ),

    env.DB.prepare(`
      UPDATE sync_mutations
      SET applied_revision = (SELECT revision FROM sync_users WHERE user_id = ?1), outcome = 'applied'
      WHERE user_id = ?1 AND mutation_id = ?2 AND claim_token = ?3 AND outcome = 'claimed'
        AND NOT EXISTS (
          SELECT 1 FROM sync_items
          WHERE user_id = ?1 AND kind = ?4 AND source_people_id = ?5
            AND revision > ?6
            AND ((?7 = 'upsert' AND present = 0) OR (?7 = 'delete' AND present = 1))
        )
    `).bind(
      userId,
      mutation.mutationId,
      claim,
      mutation.kind,
      mutation.sourcePeopleId,
      mutation.baseItemRevision,
      mutation.action,
    ),
  ];

  if (mutation.action === "delete") {
    statements.push(env.DB.prepare(`
      INSERT INTO sync_items (user_id, kind, source_people_id, present, payload_json, last_prayed_at, revision, updated_at)
      SELECT ?1, ?2, ?3, 0, NULL, NULL, m.applied_revision, ?6
      FROM sync_mutations m
      WHERE m.user_id = ?1 AND m.mutation_id = ?4 AND m.claim_token = ?5
        AND m.outcome = 'applied' AND m.applied_revision IS NOT NULL
      ON CONFLICT(user_id, kind, source_people_id) DO UPDATE SET
        present = 0,
        payload_json = NULL,
        last_prayed_at = NULL,
        revision = excluded.revision,
        updated_at = excluded.updated_at
    `).bind(userId, mutation.kind, mutation.sourcePeopleId, mutation.mutationId, claim, now));
  } else {
    statements.push(env.DB.prepare(`
      INSERT INTO sync_items (user_id, kind, source_people_id, present, payload_json, last_prayed_at, revision, updated_at)
      SELECT ?1, ?2, ?3, 1, ?6, ?7, m.applied_revision, ?8
      FROM sync_mutations m
      WHERE m.user_id = ?1 AND m.mutation_id = ?4 AND m.claim_token = ?5
        AND m.outcome = 'applied' AND m.applied_revision IS NOT NULL
      ON CONFLICT(user_id, kind, source_people_id) DO UPDATE SET
        present = 1,
        payload_json = excluded.payload_json,
        last_prayed_at = CASE
          WHEN ?2 = 'prayer' AND sync_items.present = 1 THEN
            CASE
              WHEN sync_items.last_prayed_at IS NULL THEN excluded.last_prayed_at
              WHEN excluded.last_prayed_at IS NULL THEN sync_items.last_prayed_at
              WHEN sync_items.last_prayed_at >= excluded.last_prayed_at THEN sync_items.last_prayed_at
              ELSE excluded.last_prayed_at
            END
          ELSE excluded.last_prayed_at
        END,
        revision = excluded.revision,
        updated_at = excluded.updated_at
    `).bind(
      userId,
      mutation.kind,
      mutation.sourcePeopleId,
      mutation.mutationId,
      claim,
      JSON.stringify(mutation.payload),
      mutation.lastPrayedAt,
      now,
    ));

    if (mutation.kind === "prayer") {
      // Keep the payload snapshot's latest-only timestamp aligned with the
      // conflict-merged indexed column returned in API snapshots.
      statements.push(env.DB.prepare(`
        UPDATE sync_items
        SET payload_json = json_set(payload_json, '$.lastPrayedAt', last_prayed_at)
        WHERE user_id = ?1 AND kind = 'prayer' AND source_people_id = ?2
          AND revision = (
            SELECT applied_revision FROM sync_mutations
            WHERE user_id = ?1 AND mutation_id = ?3 AND claim_token = ?4 AND outcome = 'applied'
          )
      `).bind(userId, mutation.sourcePeopleId, mutation.mutationId, claim));
    }
  }

  statements.push(env.DB.prepare(`
    UPDATE sync_mutations
    SET outcome = 'conflict'
    WHERE user_id = ?1 AND mutation_id = ?2 AND claim_token = ?3 AND outcome = 'claimed'
  `).bind(userId, mutation.mutationId, claim));

  // Cloudflare D1 executes batch() as one SQL transaction. Any failing statement
  // rolls back the claim, revision, item write and mutation ledger together.
  await env.DB.batch(statements);
}
