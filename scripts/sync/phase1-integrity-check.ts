import { MAX_PRAYER_LIST } from "../../src/personalization/model";
import type { PersonalizationState, PrayerListEntry, SavedPersonSnapshot } from "../../src/personalization/types";
import { SYNC_MAX_BODY_BYTES, SYNC_MAX_MUTATIONS, syncMutationRequestBytes, takeSyncMutationBatch } from "../../src/sync/client";
import { mergeForFirstActivation, reconcileSnapshot, SyncCapacityError, syncKey } from "../../src/sync/reconcile";
import type { SyncItem, SyncMutation, SyncSnapshot } from "../../src/sync/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function saved(id: number, savedAt = "2026-08-26T12:00:00.000Z"): SavedPersonSnapshot {
  return {
    sourcePeopleId: id,
    peopleGroupId: `people-entity:peoplegroups:${id}`,
    name: `Saved ${id}`,
    largestCountryName: "Testland",
    primaryLanguageName: "Test",
    classification: "unreached",
    frontier: false,
    savedAt,
  };
}

function prayer(id: number, lastPrayedAt: string | null = null): PrayerListEntry {
  return {
    sourcePeopleId: id,
    peopleGroupId: `people-entity:peoplegroups:${id}`,
    name: `Prayer ${id}`,
    countryName: "Testland",
    languageName: "Test",
    addedAt: "2026-08-26T12:00:00.000Z",
    lastPrayedAt,
  };
}

function state(savedPeoples: SavedPersonSnapshot[] = [], prayerList: PrayerListEntry[] = []): PersonalizationState {
  return { version: 2, savedPeoples, prayerList, recent: [] };
}

function item(kind: "saved" | "prayer", id: number, present: boolean, revision: number, payload?: SavedPersonSnapshot | PrayerListEntry): SyncItem {
  return {
    kind,
    sourcePeopleId: id,
    present,
    revision,
    payload: present ? payload ?? (kind === "saved" ? saved(id) : prayer(id)) : null,
    lastPrayedAt: kind === "prayer" && present ? ((payload as PrayerListEntry | undefined)?.lastPrayedAt ?? null) : null,
    updatedAt: "2026-08-26T12:00:00.000Z",
  };
}

function snapshot(items: SyncItem[], revision = Math.max(0, ...items.map((entry) => entry.revision)), email = "owner@example.com"): SyncSnapshot {
  return { account: { email }, revision, items };
}

let mutationCounter = 0;
const mutationId = () => `00000000-0000-4000-8000-${String(++mutationCounter).padStart(12, "0")}`;

function mutation(kind: "saved" | "prayer", id: number, action: "upsert" | "delete", baseItemRevision: number, payload?: SavedPersonSnapshot | PrayerListEntry): SyncMutation {
  return {
    mutationId: mutationId(),
    kind,
    sourcePeopleId: id,
    action,
    baseItemRevision,
    payload: action === "upsert" ? payload ?? (kind === "saved" ? saved(id) : prayer(id)) : null,
    lastPrayedAt: action === "upsert" && kind === "prayer" ? ((payload as PrayerListEntry | undefined)?.lastPrayedAt ?? null) : null,
  };
}

// 1. First activation must never create an invalid >100 prayer state or silently
// truncate either side. It must fail before persistence/upload.
{
  const local = state([], Array.from({ length: 60 }, (_, index) => prayer(index + 1)));
  const remote = snapshot(Array.from({ length: 60 }, (_, index) => item("prayer", index + 61, true, index + 1, prayer(index + 61))), 60);
  let threw = false;
  try {
    mergeForFirstActivation(local, remote);
  } catch (error) {
    threw = error instanceof SyncCapacityError;
  }
  assert(threw, "A 120-person first-activation union must fail with SyncCapacityError instead of being persisted or truncated.");
  assert(local.prayerList.length === 60, "Capacity rejection must not mutate the local personalization object.");
}

// 2. The boundary itself remains valid and deterministic.
{
  const local = state([], Array.from({ length: 50 }, (_, index) => prayer(index + 1)));
  const remote = snapshot(Array.from({ length: 50 }, (_, index) => item("prayer", index + 51, true, index + 1, prayer(index + 51))), 50);
  const merged = mergeForFirstActivation(local, remote);
  assert(merged.prayerList.length === MAX_PRAYER_LIST, "A 100-person union must remain valid.");
  assert(new Set(merged.prayerList.map((entry) => entry.sourcePeopleId)).size === MAX_PRAYER_LIST, "First-activation merge must not duplicate prayer entries.");
}

// 3. A remote-only deletion must flow down instead of being mistaken for a new
// local save and resurrected.
{
  const previous = item("saved", 1, true, 1, saved(1));
  const result = reconcileSnapshot({
    personalization: state([saved(1)]),
    previousMirror: { [syncKey("saved", 1)]: previous },
    currentPending: [],
    snapshot: snapshot([item("saved", 1, false, 2)], 2),
    sentMutations: [],
    mutationId,
  });
  assert(result.personalization.savedPeoples.length === 0, "A newer remote tombstone must remove an unchanged local mirror copy.");
  assert(result.pending.length === 0, "A remote-only deletion must not create a resurrection mutation.");
}

// 4. If the user deletes while an older pull request is in flight, the stale
// response must not re-add the item; a newly detected delete stays pending.
{
  const previous = item("saved", 2, true, 4, saved(2));
  const result = reconcileSnapshot({
    personalization: state([]),
    previousMirror: { [syncKey("saved", 2)]: previous },
    currentPending: [],
    snapshot: snapshot([previous], 4),
    sentMutations: [],
    mutationId,
  });
  assert(result.personalization.savedPeoples.length === 0, "An in-flight stale pull must not undo a newer local delete.");
  assert(result.pending.length === 1 && result.pending[0]?.action === "delete", "The newer local delete must remain queued.");
  assert(result.pending[0]?.baseItemRevision === 4, "The newly detected delete must be based on the current returned revision.");
}

// 5. If a delete was sent and the user intentionally re-adds before its response
// arrives, the response tombstone must not erase that newer local choice.
{
  const previous = item("saved", 3, true, 8, saved(3, "2026-08-26T10:00:00.000Z"));
  const sentDelete = mutation("saved", 3, "delete", 8);
  const newerLocal = saved(3, "2026-08-26T12:30:00.000Z");
  const result = reconcileSnapshot({
    personalization: state([newerLocal]),
    previousMirror: { [syncKey("saved", 3)]: previous },
    currentPending: [sentDelete],
    snapshot: snapshot([item("saved", 3, false, 9)], 9),
    sentMutations: [sentDelete],
    mutationId,
  });
  assert(result.personalization.savedPeoples[0]?.savedAt === newerLocal.savedAt, "A response to an older delete must not erase a later local re-add.");
  assert(result.pending.length === 1 && result.pending[0]?.action === "upsert", "The later local re-add must become a new pending upsert.");
  assert(result.pending[0]?.baseItemRevision === 9, "The re-add must be rebased onto the returned tombstone revision.");
}

// 6. Symmetric client-side case: a sent upsert followed by a newer local delete
// must retain the delete when the server returns the upsert.
{
  const previousTombstone = item("saved", 4, false, 10);
  const sentUpsert = mutation("saved", 4, "upsert", 10, saved(4));
  const result = reconcileSnapshot({
    personalization: state([]),
    previousMirror: { [syncKey("saved", 4)]: previousTombstone },
    currentPending: [sentUpsert],
    snapshot: snapshot([item("saved", 4, true, 11, saved(4))], 11),
    sentMutations: [sentUpsert],
    mutationId,
  });
  assert(result.personalization.savedPeoples.length === 0, "A response to an older upsert must not undo a later local delete.");
  assert(result.pending.length === 1 && result.pending[0]?.action === "delete", "The later local delete must remain pending.");
  assert(result.pending[0]?.baseItemRevision === 11, "The later delete must rebase onto the returned present revision.");
}

// 7. Exact audit scenario: device A queued a delete at revision 1 while offline;
// device B later deleted and intentionally re-added the item at revision 3. The
// reconnect pull must NOT rebase A's old delete to revision 3. The Worker can then
// reject base 1 against the newer present revision, after which A converges to B.
{
  const original = item("saved", 5, true, 1, saved(5));
  const staleOfflineDelete = mutation("saved", 5, "delete", 1);
  const newerReAdd = item("saved", 5, true, 3, saved(5, "2026-08-26T13:00:00.000Z"));
  const pulled = reconcileSnapshot({
    personalization: state([]),
    previousMirror: { [syncKey("saved", 5)]: original },
    currentPending: [staleOfflineDelete],
    snapshot: snapshot([newerReAdd], 3),
    sentMutations: [],
    mutationId,
  });
  assert(pulled.personalization.savedPeoples.length === 0, "The local offline delete stays protected until the server judges its causal base.");
  assert(pulled.pending[0]?.mutationId === staleOfflineDelete.mutationId, "The old pending mutation identity must be preserved across the reconnect pull.");
  assert(pulled.pending[0]?.baseItemRevision === 1, "A reconnect pull must not rebase an old offline delete onto the newer re-add revision.");

  const afterConflict = reconcileSnapshot({
    personalization: pulled.personalization,
    previousMirror: pulled.mirror,
    currentPending: pulled.pending,
    snapshot: snapshot([newerReAdd], 3),
    sentMutations: [staleOfflineDelete],
    mutationId,
  });
  assert(afterConflict.pending.length === 0, "Once the stale delete is rejected, it must not retry forever.");
  assert(afterConflict.personalization.savedPeoples[0]?.sourcePeopleId === 5, "The newer intentional re-add must win over the old offline delete.");
}

// 8. Symmetric stale case: an old offline upsert must keep its original base so a
// newer remote tombstone can reject it instead of being silently resurrected.
{
  const originalTombstone = item("saved", 6, false, 1);
  const staleOfflineUpsert = mutation("saved", 6, "upsert", 1, saved(6));
  const newerDelete = item("saved", 6, false, 3);
  const pulled = reconcileSnapshot({
    personalization: state([saved(6)]),
    previousMirror: { [syncKey("saved", 6)]: originalTombstone },
    currentPending: [staleOfflineUpsert],
    snapshot: snapshot([newerDelete], 3),
    sentMutations: [],
    mutationId,
  });
  assert(pulled.pending[0]?.baseItemRevision === 1, "A reconnect pull must not rebase an old offline upsert onto a newer tombstone.");

  const afterConflict = reconcileSnapshot({
    personalization: pulled.personalization,
    previousMirror: pulled.mirror,
    currentPending: pulled.pending,
    snapshot: snapshot([newerDelete], 3),
    sentMutations: [staleOfflineUpsert],
    mutationId,
  });
  assert(afterConflict.pending.length === 0, "A rejected stale upsert must clear after the authoritative snapshot is returned.");
  assert(afterConflict.personalization.savedPeoples.length === 0, "The newer tombstone must win over the stale offline upsert.");
}

// 9. Pending queues must drain in bounded requests rather than permanently fail
// once they exceed either the 200-mutation or 64 KiB server limit.
{
  const queue = Array.from({ length: 450 }, (_, index) => mutation("saved", 10_000 + index, "delete", index));
  const originalIds = queue.map((entry) => entry.mutationId);
  const drainedIds: string[] = [];
  let remaining = [...queue];
  let batches = 0;
  while (remaining.length > 0) {
    const batch = takeSyncMutationBatch(remaining);
    assert(batch.length > 0, "Batcher must always make progress for valid mutations.");
    assert(batch.length <= SYNC_MAX_MUTATIONS, "No client batch may exceed the server mutation-count limit.");
    assert(syncMutationRequestBytes(batch) <= SYNC_MAX_BODY_BYTES, "No client batch may exceed the server byte limit.");
    drainedIds.push(...batch.map((entry) => entry.mutationId));
    remaining = remaining.slice(batch.length);
    batches += 1;
  }
  assert(batches >= 3, "A 450-mutation queue must be split across multiple requests.");
  assert(drainedIds.join("|") === originalIds.join("|"), "Batching must preserve every mutation exactly once and in order.");
}

// 10. Byte size, not just mutation count, must constrain batches.
{
  const bulky = Array.from({ length: 200 }, (_, index) => {
    const payload = saved(20_000 + index);
    payload.name = `Bulk ${index} ${"x".repeat(150)}`;
    return mutation("saved", payload.sourcePeopleId, "upsert", 0, payload);
  });
  let remaining = [...bulky];
  let total = 0;
  while (remaining.length > 0) {
    const batch = takeSyncMutationBatch(remaining);
    assert(batch.length > 0, "Byte-constrained batching must make progress for schema-sized payloads.");
    assert(syncMutationRequestBytes(batch) <= SYNC_MAX_BODY_BYTES, "Byte-constrained batch exceeded 64 KiB.");
    total += batch.length;
    remaining = remaining.slice(batch.length);
  }
  assert(total === bulky.length, "Byte-constrained batching must drain the complete queue.");
}

console.log("Phase 1 sync integrity scenarios passed: capacity-safe activation, remote-only convergence, in-flight local-change protection, stale offline mutation bases preserved against newer opposing state, symmetric conflict convergence, and mutation queues bounded by count and bytes.");
