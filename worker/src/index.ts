import { createRemoteJWKSet, decodeJwt, jwtVerify } from "jose";

const PRIVATE_PREFIX = "/unreached-sync/private";
const MAX_BODY_BYTES = 64 * 1024;
const MAX_MUTATIONS = 200;
const CLASSIFICATIONS = new Set(["unreached", "reached", "unknown", "unreached-only", "other-only", "mixed"]);

type SyncKind = "saved" | "prayer";
type SyncAction = "upsert" | "delete";

interface SavedPayload {
  sourcePeopleId: number;
  peopleGroupId: string;
  name: string;
  largestCountryName: string | null;
  primaryLanguageName: string | null;
  classification: string;
  frontier: boolean | null;
  savedAt: string;
}

interface PrayerPayload {
  sourcePeopleId: number;
  peopleGroupId: string;
  name: string;
  countryName: string | null;
  languageName: string | null;
  addedAt: string;
  lastPrayedAt: string | null;
}

type AllowedPayload = SavedPayload | PrayerPayload;

interface Mutation {
  mutationId: string;
  kind: SyncKind;
  sourcePeopleId: number;
  action: SyncAction;
  baseItemRevision: number;
  payload: AllowedPayload | null;
  lastPrayedAt: string | null;
}

interface ItemRow {
  kind: SyncKind;
  source_people_id: number;
  present: number;
  payload_json: string | null;
  last_prayed_at: string | null;
  revision: number;
  updated_at: string;
}

interface UserRow {
  revision: number;
}

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function json(value: unknown, status = 200): Response {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function text(value: string, status = 200, contentType = "text/plain; charset=utf-8"): Response {
  return new Response(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": contentType,
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function normalizedIsoTimestamp(value: unknown, nullable = false): string | null {
  if (nullable && value === null) return null;
  if (typeof value !== "string" || value.length < 10 || value.length > 64 || Number.isNaN(Date.parse(value))) {
    throw new HttpError(400, "Invalid sync timestamp.");
  }
  return new Date(value).toISOString();
}

function boundedString(value: unknown, field: string, nullable = false, max = 180): string | null {
  if (nullable && value === null) return null;
  if (typeof value !== "string") throw new HttpError(400, `Invalid ${field}.`);
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) throw new HttpError(400, `Invalid ${field}.`);
  return trimmed;
}

function sourcePeopleId(value: unknown): number {
  if (!Number.isSafeInteger(value) || Number(value) <= 0) throw new HttpError(400, "Invalid sourcePeopleId.");
  return Number(value);
}

function peopleGroupId(value: unknown): string {
  const id = boundedString(value, "peopleGroupId", false, 80) as string;
  if (!/^(?:people:[0-9]+|people-entity:peoplegroups:[0-9]+)$/.test(id)) throw new HttpError(400, "Invalid peopleGroupId.");
  return id;
}

function sanitizeSavedPayload(raw: unknown, expectedId: number): SavedPayload {
  if (!raw || typeof raw !== "object") throw new HttpError(400, "Invalid saved payload.");
  const value = raw as Record<string, unknown>;
  const id = sourcePeopleId(value.sourcePeopleId);
  if (id !== expectedId) throw new HttpError(400, "Saved payload identity mismatch.");
  const classification = boundedString(value.classification, "classification", false, 40) as string;
  if (!CLASSIFICATIONS.has(classification)) throw new HttpError(400, "Invalid classification.");
  if (!(typeof value.frontier === "boolean" || value.frontier === null)) throw new HttpError(400, "Invalid frontier value.");
  return {
    sourcePeopleId: id,
    peopleGroupId: peopleGroupId(value.peopleGroupId),
    name: boundedString(value.name, "name") as string,
    largestCountryName: boundedString(value.largestCountryName, "largestCountryName", true),
    primaryLanguageName: boundedString(value.primaryLanguageName, "primaryLanguageName", true),
    classification,
    frontier: value.frontier,
    savedAt: normalizedIsoTimestamp(value.savedAt) as string,
  };
}

function sanitizePrayerPayload(raw: unknown, expectedId: number): PrayerPayload {
  if (!raw || typeof raw !== "object") throw new HttpError(400, "Invalid prayer payload.");
  const value = raw as Record<string, unknown>;
  const id = sourcePeopleId(value.sourcePeopleId);
  if (id !== expectedId) throw new HttpError(400, "Prayer payload identity mismatch.");
  return {
    sourcePeopleId: id,
    peopleGroupId: peopleGroupId(value.peopleGroupId),
    name: boundedString(value.name, "name") as string,
    countryName: boundedString(value.countryName, "countryName", true),
    languageName: boundedString(value.languageName, "languageName", true),
    addedAt: normalizedIsoTimestamp(value.addedAt) as string,
    lastPrayedAt: normalizedIsoTimestamp(value.lastPrayedAt, true),
  };
}

function sanitizeMutation(raw: unknown): Mutation {
  if (!raw || typeof raw !== "object") throw new HttpError(400, "Invalid sync mutation.");
  const value = raw as Record<string, unknown>;
  const mutationId = boundedString(value.mutationId, "mutationId", false, 80) as string;
  if (!/^[0-9a-f-]{16,80}$/i.test(mutationId)) throw new HttpError(400, "Invalid mutationId.");
  const kind = value.kind === "saved" || value.kind === "prayer" ? value.kind : null;
  const action = value.action === "upsert" || value.action === "delete" ? value.action : null;
  if (!kind || !action) throw new HttpError(400, "Invalid sync mutation kind or action.");
  const id = sourcePeopleId(value.sourcePeopleId);
  const base = Number(value.baseItemRevision);
  if (!Number.isSafeInteger(base) || base < 0) throw new HttpError(400, "Invalid baseItemRevision.");
  if (action === "delete") return { mutationId, kind, sourcePeopleId: id, action, baseItemRevision: base, payload: null, lastPrayedAt: null };
  const payload = kind === "saved" ? sanitizeSavedPayload(value.payload, id) : sanitizePrayerPayload(value.payload, id);
  const lastPrayedAt = kind === "prayer" ? normalizedIsoTimestamp(value.lastPrayedAt, true) : null;
  if (kind === "prayer") (payload as PrayerPayload).lastPrayedAt = lastPrayedAt;
  return { mutationId, kind, sourcePeopleId: id, action, baseItemRevision: base, payload, lastPrayedAt };
}

async function readJsonLimited(request: Request): Promise<unknown> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) throw new HttpError(413, "Sync request is too large.");
  if (!request.body) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let textBody = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new HttpError(413, "Sync request is too large.");
    }
    textBody += decoder.decode(value, { stream: true });
  }
  textBody += decoder.decode();
  try {
    return JSON.parse(textBody) as unknown;
  } catch {
    throw new HttpError(400, "Invalid JSON request.");
  }
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function authenticate(request: Request, env: Env): Promise<{ email: string; userId: string }> {
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token) throw new HttpError(401, "Sign in is required for private sync.");

  let issuer: string;
  try {
    const decoded = decodeJwt(token);
    issuer = typeof decoded.iss === "string" ? decoded.iss.replace(/\/$/, "") : "";
  } catch {
    throw new HttpError(401, "Invalid Access identity token.");
  }
  const issuerUrl = new URL(issuer || "https://invalid.invalid");
  if (issuerUrl.protocol !== "https:" || !issuerUrl.hostname.endsWith(".cloudflareaccess.com")) throw new HttpError(401, "Invalid Access token issuer.");

  try {
    const jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
    const verified = await jwtVerify(token, jwks, { issuer, audience: env.ACCESS_AUD });
    const email = typeof verified.payload.email === "string" ? verified.payload.email.trim().toLowerCase() : "";
    if (!email || email.length > 320) throw new Error("missing email");
    return { email, userId: await sha256Hex(email) };
  } catch {
    throw new HttpError(401, "Access identity could not be verified.");
  }
}

async function ensureUser(env: Env, identity: { email: string; userId: string }): Promise<void> {
  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO sync_users (user_id, email, revision, created_at, updated_at)
    VALUES (?1, ?2, 0, ?3, ?3)
    ON CONFLICT(user_id) DO UPDATE SET email = excluded.email, updated_at = excluded.updated_at
  `).bind(identity.userId, identity.email, now).run();
}

async function currentUserRevision(env: Env, userId: string): Promise<number> {
  const row = await env.DB.prepare("SELECT revision FROM sync_users WHERE user_id = ?1").bind(userId).first<UserRow>();
  return row?.revision ?? 0;
}

async function nextRevision(env: Env, userId: string): Promise<number> {
  const row = await env.DB.prepare(`
    UPDATE sync_users SET revision = revision + 1, updated_at = ?2 WHERE user_id = ?1 RETURNING revision
  `).bind(userId, new Date().toISOString()).first<UserRow>();
  if (!row) throw new HttpError(500, "Private sync revision could not be advanced.");
  return row.revision;
}

function parsePayload(row: ItemRow): AllowedPayload | null {
  if (!row.payload_json) return null;
  try {
    return JSON.parse(row.payload_json) as AllowedPayload;
  } catch {
    return null;
  }
}

function itemFromRow(row: ItemRow) {
  return {
    kind: row.kind,
    sourcePeopleId: row.source_people_id,
    present: row.present === 1,
    revision: row.revision,
    payload: parsePayload(row),
    lastPrayedAt: row.last_prayed_at,
    updatedAt: row.updated_at,
  };
}

async function snapshot(env: Env, identity: { email: string; userId: string }) {
  await ensureUser(env, identity);
  const rows = await env.DB.prepare(`
    SELECT kind, source_people_id, present, payload_json, last_prayed_at, revision, updated_at
    FROM sync_items WHERE user_id = ?1 ORDER BY kind, source_people_id
  `).bind(identity.userId).all<ItemRow>();
  return {
    account: { email: identity.email },
    revision: await currentUserRevision(env, identity.userId),
    items: rows.results.map(itemFromRow),
  };
}

function laterTimestamp(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return Date.parse(a) >= Date.parse(b) ? a : b;
}

async function recordMutation(env: Env, userId: string, mutationId: string): Promise<void> {
  await env.DB.prepare(`
    INSERT OR IGNORE INTO sync_mutations (user_id, mutation_id, created_at) VALUES (?1, ?2, ?3)
  `).bind(userId, mutationId, new Date().toISOString()).run();
}

async function applyMutation(env: Env, userId: string, mutation: Mutation): Promise<void> {
  const duplicate = await env.DB.prepare(`
    SELECT mutation_id FROM sync_mutations WHERE user_id = ?1 AND mutation_id = ?2
  `).bind(userId, mutation.mutationId).first<{ mutation_id: string }>();
  if (duplicate) return;

  const current = await env.DB.prepare(`
    SELECT kind, source_people_id, present, payload_json, last_prayed_at, revision, updated_at
    FROM sync_items WHERE user_id = ?1 AND kind = ?2 AND source_people_id = ?3
  `).bind(userId, mutation.kind, mutation.sourcePeopleId).first<ItemRow>();

  // A deletion created by another device after this mutation's base revision wins. This prevents
  // an old offline upsert from silently resurrecting an item. A user can intentionally re-add it
  // after receiving the tombstone in a later sync, which gives the new upsert the current revision.
  if (mutation.action === "upsert" && current && current.present === 0 && current.revision > mutation.baseItemRevision) {
    await recordMutation(env, userId, mutation.mutationId);
    return;
  }

  const revision = await nextRevision(env, userId);
  const now = new Date().toISOString();

  if (mutation.action === "delete") {
    await env.DB.prepare(`
      INSERT INTO sync_items (user_id, kind, source_people_id, present, payload_json, last_prayed_at, revision, updated_at)
      VALUES (?1, ?2, ?3, 0, NULL, NULL, ?4, ?5)
      ON CONFLICT(user_id, kind, source_people_id) DO UPDATE SET
        present = 0, payload_json = NULL, last_prayed_at = NULL, revision = excluded.revision, updated_at = excluded.updated_at
    `).bind(userId, mutation.kind, mutation.sourcePeopleId, revision, now).run();
    await recordMutation(env, userId, mutation.mutationId);
    return;
  }

  let payload = mutation.payload;
  let lastPrayedAt = mutation.lastPrayedAt;
  if (mutation.kind === "prayer" && current?.present === 1 && current.revision > mutation.baseItemRevision) {
    lastPrayedAt = laterTimestamp(current.last_prayed_at, mutation.lastPrayedAt);
    if (payload && "addedAt" in payload) payload = { ...payload, lastPrayedAt };
  }

  await env.DB.prepare(`
    INSERT INTO sync_items (user_id, kind, source_people_id, present, payload_json, last_prayed_at, revision, updated_at)
    VALUES (?1, ?2, ?3, 1, ?4, ?5, ?6, ?7)
    ON CONFLICT(user_id, kind, source_people_id) DO UPDATE SET
      present = 1,
      payload_json = excluded.payload_json,
      last_prayed_at = excluded.last_prayed_at,
      revision = excluded.revision,
      updated_at = excluded.updated_at
  `).bind(userId, mutation.kind, mutation.sourcePeopleId, JSON.stringify(payload), lastPrayedAt, revision, now).run();
  await recordMutation(env, userId, mutation.mutationId);
}

function authCompletionPage(origin: string): Response {
  const safeOrigin = JSON.stringify(origin);
  const html = `<!doctype html><meta charset="utf-8"><title>Unreached private sync</title><body><p>Sign-in complete. You can return to Unreached.</p><script>try{window.opener&&window.opener.postMessage({type:"unreached-private-sync-authenticated"},${safeOrigin});}finally{window.close();}</script></body>`;
  return new Response(html, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": `default-src 'none'; script-src 'unsafe-inline'; style-src 'none'; base-uri 'none'; frame-ancestors 'none'`,
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export default {
  async fetch(request, env): Promise<Response> {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/unreached-sync/health" && request.method === "GET") {
        return json({ ok: true, service: "unreached-private-continuity", version: "2.0.0" });
      }
      if (!url.pathname.startsWith(PRIVATE_PREFIX)) return json({ error: "Not found" }, 404);

      const identity = await authenticate(request, env);
      await ensureUser(env, identity);

      if (url.pathname === `${PRIVATE_PREFIX}/auth/start` && request.method === "GET") {
        const requested = url.searchParams.get("returnOrigin");
        return authCompletionPage(requested === env.APP_ORIGIN ? requested : env.APP_ORIGIN);
      }

      if (url.pathname === `${PRIVATE_PREFIX}/state` && request.method === "GET") {
        return json(await snapshot(env, identity));
      }

      if (url.pathname === `${PRIVATE_PREFIX}/sync` && request.method === "POST") {
        const body = await readJsonLimited(request);
        const mutationsRaw = body && typeof body === "object" && Array.isArray((body as { mutations?: unknown }).mutations)
          ? (body as { mutations: unknown[] }).mutations
          : null;
        if (!mutationsRaw) throw new HttpError(400, "Sync request requires a mutations array.");
        if (mutationsRaw.length > MAX_MUTATIONS) throw new HttpError(400, `At most ${MAX_MUTATIONS} mutations may be sent at once.`);
        for (const raw of mutationsRaw) await applyMutation(env, identity.userId, sanitizeMutation(raw));
        return json(await snapshot(env, identity));
      }

      if (url.pathname === `${PRIVATE_PREFIX}/export` && request.method === "GET") {
        const state = await snapshot(env, identity);
        return json({ exportedAt: new Date().toISOString(), account: state.account, items: state.items });
      }

      if (url.pathname === `${PRIVATE_PREFIX}/account` && request.method === "DELETE") {
        await env.DB.prepare("DELETE FROM sync_users WHERE user_id = ?1").bind(identity.userId).run();
        return json({ deleted: true });
      }

      return json({ error: "Not found" }, 404);
    } catch (error) {
      if (error instanceof HttpError) return json({ error: error.message }, error.status);
      console.error(JSON.stringify({ event: "unreached_private_sync_error", message: error instanceof Error ? error.message : String(error) }));
      return json({ error: "Private sync encountered an internal error." }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
