import { createRemoteJWKSet, decodeJwt, jwtVerify } from "jose";

import { applyMutationAtomic, type WorkerSyncMutation } from "./mutations";

const PRIVATE_PREFIX = "/unreached-sync/private";
const HEALTH_PATH = "/unreached-sync/health";
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
type Mutation = Omit<WorkerSyncMutation, "payload"> & { payload: AllowedPayload | null };

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

interface AccessIdentity {
  email: string;
  userId: string;
  token: string;
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
      "X-Frame-Options": "DENY",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    },
  });
}

function corsHeaders(env: Env): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": env.APP_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "600",
    "Vary": "Origin",
  };
}

function withCors(response: Response, request: Request, env: Env): Response {
  if (request.headers.get("Origin") !== env.APP_ORIGIN) return response;
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(corsHeaders(env))) headers.set(name, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function accessTokenFromRequest(request: Request): string | null {
  const assertion = request.headers.get("Cf-Access-Jwt-Assertion")?.trim();
  if (assertion) return assertion;
  const authorization = request.headers.get("Authorization")?.trim() ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
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

async function authenticate(request: Request, env: Env): Promise<AccessIdentity> {
  const token = accessTokenFromRequest(request);
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
    return { email, userId: await sha256Hex(email), token };
  } catch {
    throw new HttpError(401, "Access identity could not be verified.");
  }
}

async function ensureUser(env: Env, identity: { userId: string }): Promise<void> {
  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO sync_users (user_id, email, identity_hash, revision, created_at, updated_at)
    VALUES (?1, ?1, ?1, 0, ?2, ?2)
    ON CONFLICT(user_id) DO UPDATE SET
      email = excluded.email,
      identity_hash = excluded.identity_hash,
      updated_at = excluded.updated_at
  `).bind(identity.userId, now).run();
}

async function currentUserRevision(env: Env, userId: string): Promise<number> {
  const row = await env.DB.prepare("SELECT revision FROM sync_users WHERE user_id = ?1").bind(userId).first<UserRow>();
  return row?.revision ?? 0;
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

function authCompletionPage(origin: string, token: string): Response {
  const safeOrigin = JSON.stringify(origin);
  const safeToken = JSON.stringify(token);
  const html = `<!doctype html><meta charset="utf-8"><title>Unreached private sync</title><body><p>Sign-in complete. You can return to Unreached.</p><script>try{window.opener&&window.opener.postMessage({type:"unreached-private-sync-authenticated",token:${safeToken}},${safeOrigin});}finally{window.close();}</script></body>`;
  return new Response(html, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": `default-src 'none'; script-src 'unsafe-inline'; style-src 'none'; base-uri 'none'; frame-ancestors 'none'`,
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    },
  });
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === HEALTH_PATH && request.method === "GET") {
    return json({ ok: true, service: "unreached-private-continuity", version: "2.0.0" });
  }
  if (!url.pathname.startsWith(PRIVATE_PREFIX)) return json({ error: "Not found" }, 404);

  if (url.pathname === `${PRIVATE_PREFIX}/auth/start` && request.method === "GET") {
    if (!request.headers.get("Cf-Access-Jwt-Assertion")) throw new HttpError(401, "Cloudflare Access sign-in is required.");
    const identity = await authenticate(request, env);
    await ensureUser(env, identity);
    const requested = url.searchParams.get("returnOrigin");
    return authCompletionPage(requested === env.APP_ORIGIN ? requested : env.APP_ORIGIN, identity.token);
  }

  const identity = await authenticate(request, env);
  await ensureUser(env, identity);

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
    for (const raw of mutationsRaw) await applyMutationAtomic(env, identity.userId, sanitizeMutation(raw));
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
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      if (request.headers.get("Origin") !== env.APP_ORIGIN) return json({ error: "Origin not allowed" }, 403);
      if (url.pathname !== HEALTH_PATH && !url.pathname.startsWith(PRIVATE_PREFIX)) return json({ error: "Not found" }, 404);
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders(env),
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
        },
      });
    }

    try {
      return withCors(await handleRequest(request, env), request, env);
    } catch (error) {
      if (error instanceof HttpError) return withCors(json({ error: error.message }, error.status), request, env);
      console.error(JSON.stringify({ event: "unreached_private_sync_error", message: error instanceof Error ? error.message : String(error) }));
      return withCors(json({ error: "Private sync encountered an internal error." }, 500), request, env);
    }
  },
} satisfies ExportedHandler<Env>;
