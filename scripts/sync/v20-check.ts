import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");
const pkg = JSON.parse(await readText("package.json")) as { version?: string; scripts?: Record<string, string> };
const version = String(pkg.version ?? "0.0.0").split(".").map((part) => Number(part));
if ((version[0] ?? 0) < 2) throw new Error(`v2 private-sync capability gate requires package version >=2.0.0: ${String(pkg.version)}`);
if (!pkg.scripts?.["sync:check"]?.includes("scripts/sync/v20-check.ts")) throw new Error("Private-sync certification script is not wired.");

const personalizationTypes = await readText("src/personalization/types.ts");
const personalizationModel = await readText("src/personalization/model.ts");
const personalizationRuntime = await readText("src/personalization/runtime.ts");
if (!personalizationTypes.includes("version: z.literal(2)")) throw new Error("Personalization schema v2 must be preserved.");
if (!personalizationRuntime.includes('"unreached.personal.v2"')) throw new Error("The existing local personalization storage key must be preserved.");
for (const marker of ["memoryFallbackState", "PERSONALIZATION_CHANGE_EVENT", "finally", "dispatchEvent"]) {
  if (!personalizationRuntime.includes(marker)) throw new Error(`Phase 1 storage fallback missing ${marker}.`);
}
if (!personalizationModel.includes("MAX_PRAYER_LIST = 100")) throw new Error("Phase 1 expects the existing 100-person prayer-list boundary.");

const syncTypes = await readText("src/sync/types.ts");
const syncRuntime = await readText("src/sync/runtime.ts");
const syncClient = await readText("src/sync/client.ts");
const reconcile = await readText("src/sync/reconcile.ts");
const accountPage = await readText("src/pages/AccountPage.tsx");
const workerRouter = await readText("worker/src/index.ts");
const workerMutations = await readText("worker/src/mutations.ts");
const worker = `${workerRouter}\n${workerMutations}`;
const migration = await readText("worker/migrations/0001_private_continuity.sql");
const phase1Migration = await readText("worker/migrations/0002_phase1_atomic_mutations.sql");
const phase4Migration = await readText("worker/migrations/0003_hash_only_identity.sql");
const deploy = await readText(".github/workflows/deploy-sync-worker.yml");
const router = await readText("src/app/router.ts");
const app = await readText("src/app/App.tsx");
const main = await readText("src/main.tsx");
const workerConfig = await readText("worker/wrangler.template.jsonc");

if (!syncRuntime.includes('"unreached.sync.v1"')) throw new Error("Sync metadata storage must remain separate from personalization v2 and migrate in place.");
for (const marker of ['SyncKind = "saved" | "prayer"', "baseItemRevision", "mutationId", "pending", "mirror", "accountMismatchEmail", "authenticationRequired"]) {
  if (!syncTypes.includes(marker)) throw new Error(`Sync contract missing ${marker}.`);
}
for (const marker of [
  "captureLocalDiff",
  "enablePrivateSyncWithMerge",
  "disconnectPrivateSync",
  "createMutationId",
  "crypto.randomUUID",
  "crypto.getRandomValues",
  "lastPrayedAt",
  "applyingRemoteState",
  "snapshotMatchesBoundAccount",
  "takeSyncMutationBatch",
  "reconcileSnapshot",
  "readSyncAccessToken",
  "memoryFallbackSyncState",
]) {
  if (!syncRuntime.includes(marker)) throw new Error(`Phase 1 local sync runtime missing ${marker}.`);
}
if (syncRuntime.includes("Math.random")) throw new Error("Mutation IDs must never fall back to Math.random.");
if (!syncRuntime.includes("readBrowserPersonalizationState") || !syncRuntime.includes("persistBrowserPersonalizationState")) throw new Error("Sync must bridge the existing browser-local state rather than replace it.");

for (const marker of [
  "SyncCapacityError",
  "mergeForFirstActivation",
  "reconcileSnapshot",
  "previousMirror",
  "sentMutations",
  "protectedKeys",
  "MAX_PRAYER_LIST",
  "No local or remote entries were discarded",
  "Nothing was merged or uploaded",
]) {
  if (!reconcile.includes(marker)) throw new Error(`Phase 1 reconciliation layer missing ${marker}.`);
}

const protocolSurface = `${syncTypes}\n${syncClient}\n${worker}`;
for (const forbidden of [
  "recentVisit", "recentVisits", "visitedAt", "sessionHistory", "sessionCount", "completionRate", "completionPercent",
  "sessionScore", "sessionStreak", "prayerCount", "prayerTotal", "prayerMinutesTotal", "leaderboard", "peoplegroups.org", "/wp-json/pg/v1"
]) {
  if (protocolSurface.toLowerCase().includes(forbidden.toLowerCase())) throw new Error(`Private sync protocol contains forbidden field/reference: ${forbidden}`);
}

for (const marker of [
  "https://unreached-private-continuity.thiepn.workers.dev",
  '"unreached.sync.access.v1"',
  "sessionStorage",
  "Authorization",
  "Bearer",
  'credentials: "omit"',
  'mode: "cors"',
  "storeSyncAccessToken",
  "clearSyncAccessToken",
  "deleteRemoteAccount",
  "exportRemoteAccount",
  "openSyncSignIn",
  "SYNC_MAX_MUTATIONS = 200",
  "SYNC_MAX_BODY_BYTES = 64 * 1024",
  "takeSyncMutationBatch",
  "TextEncoder",
]) {
  if (!syncClient.includes(marker)) throw new Error(`Phase 1 sync client missing ${marker}.`);
}
if (syncClient.includes('credentials: "include"')) throw new Error("Workers.dev sync must not depend on cross-site cookies.");
if (syncClient.includes("localStorage")) throw new Error("Access identity tokens must not be persisted in localStorage.");

for (const marker of [
  "Merge this device & enable sync",
  "Nothing is uploaded while you remain signed out",
  "Recent browsing history stays on this device",
  "No prayer history",
  "PeopleGroups.org corpus",
  "Delete private account data",
  "Disconnect this device",
  "SYNC_BACKEND_ORIGIN",
  "event.origin !== SYNC_BACKEND_ORIGIN",
  "storeSyncAccessToken",
  "Sync paused · different account",
  "Sync paused · sign in again",
  "Sign in again",
]) {
  if (!accountPage.includes(marker)) throw new Error(`Account surface missing explicit privacy/auth marker: ${marker}`);
}

for (const marker of [
  "Cf-Access-Jwt-Assertion",
  "Authorization",
  "Bearer",
  "createRemoteJWKSet",
  "jwtVerify",
  "env.ACCESS_AUD",
  "sha256Hex",
  "MAX_BODY_BYTES",
  "MAX_MUTATIONS",
  "last_prayed_at",
  "PRIVATE_PREFIX}/export",
  "PRIVATE_PREFIX}/account",
  "Access-Control-Allow-Origin",
  "Access-Control-Allow-Headers",
  "env.APP_ORIGIN",
  "postMessage",
  "accessTokenFromRequest",
  "applyMutationAtomic",
]) {
  if (!workerRouter.includes(marker)) throw new Error(`Worker router missing security/protocol marker: ${marker}`);
}
if (!workerRouter.includes('request.headers.get("Cf-Access-Jwt-Assertion")')) throw new Error("Sign-in bootstrap must require a Cloudflare Access assertion.");
if (!workerRouter.includes("identity_hash") || !workerRouter.includes("VALUES (?1, ?1, ?1, 0, ?2, ?2)")) throw new Error("Phase 4 Worker must persist only the hash-derived identity.");
if (workerRouter.includes(".bind(identity.userId, identity.email, now)")) throw new Error("Phase 4 Worker must not persist the verified plaintext email.");

for (const marker of [
  "env.DB.batch(statements)",
  "claim_token",
  "outcome = 'applied'",
  "applied_revision",
  "revision > ?7",
  "'upsert' AND present = 0",
  "'delete' AND present = 1",
  "ON CONFLICT(user_id, mutation_id) DO NOTHING",
  "json_set",
]) {
  if (!workerMutations.includes(marker)) throw new Error(`Phase 1 atomic mutation implementation missing ${marker}.`);
}
for (const forbidden of ["Math.random", "prayer_history", "prayer_count", "recent", "peoplegroups.org", "/wp-json/pg/v1"]) {
  if (worker.toLowerCase().includes(forbidden.toLowerCase())) throw new Error(`Worker contains forbidden implementation/reference: ${forbidden}`);
}

for (const table of ["sync_users", "sync_items", "sync_mutations"]) if (!migration.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) throw new Error(`D1 base migration missing ${table}.`);
if (!migration.includes("ON DELETE CASCADE")) throw new Error("Account deletion must cascade private sync rows.");
for (const column of ["claim_token", "outcome", "applied_revision"]) {
  if (!phase1Migration.includes(`ADD COLUMN ${column}`)) throw new Error(`Phase 1 D1 migration missing ${column}.`);
}
if (!phase4Migration.includes("ADD COLUMN identity_hash") || !phase4Migration.includes("SET email = user_id") || !phase4Migration.includes("SET email = NEW.user_id")) throw new Error("Phase 4 D1 migration must scrub and enforce hash-only identity storage.");
for (const trigger of ["sync_users_hash_only_after_insert", "sync_users_hash_only_after_email_update"]) {
  if (!phase4Migration.includes(trigger)) throw new Error(`Phase 4 D1 migration missing ${trigger}.`);
}

for (const marker of ["nodejs_compat", '"workers_dev": true', '"DB"', "__D1_DATABASE_ID__", "__ACCESS_AUD__", "observability"]) {
  if (!workerConfig.includes(marker)) throw new Error(`Wrangler template missing ${marker}.`);
}
if (workerConfig.includes('"routes"') || workerConfig.includes("www.thiepn.dev/unreached-sync/*")) throw new Error("Worker must not depend on thiepn.dev being a Cloudflare-managed zone.");

for (const marker of [
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_ACCOUNT_ID",
  "/d1/database",
  "/workers/subdomain",
  "workers.dev",
  "identity_providers",
  "/access",
  "migrations apply",
  "npm run deploy",
  "unreached-sync/health",
  "unreached-sync/private/auth/start",
]) {
  if (!deploy.includes(marker)) throw new Error(`Production deployment workflow missing ${marker}.`);
}

if (!router.includes('"/account": "account"')) throw new Error("Account route is not registered.");
if (!app.includes("AccountPage") || !app.includes('case "account"')) throw new Error("Account page is not materialized by the app.");
if (!main.includes("initializePrivateSyncRuntime();") || !main.includes('"./styles/account/base.css"')) throw new Error("Private sync runtime/style is not initialized.");

const offlineGate = await readText("scripts/offline/v19-check.ts");
if (offlineGate.includes('pkg.version !== "1.9.0"')) throw new Error("v1.9 capability gate must remain forward-compatible.");

console.log("Phase 1 private-sync architecture checks passed: storage fallback, capacity-safe first merge, causal reconciliation, account binding, byte/count batching, symmetric stale-conflict handling, atomic D1 mutation claims, latest-only prayer timestamps, session-only verified bearer auth, export/delete controls, and no recent-history/corpus/performance sync.");
