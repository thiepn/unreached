import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");
const pkg = JSON.parse(await readText("package.json")) as { version?: string; scripts?: Record<string, string> };
const version = String(pkg.version ?? "0.0.0").split(".").map((part) => Number(part));
if ((version[0] ?? 0) < 2) throw new Error(`v2.0 capability gate requires package version >=2.0.0: ${String(pkg.version)}`);
if (!pkg.scripts?.["sync:check"]?.includes("scripts/sync/v20-check.ts")) throw new Error("v2.0 sync certification script is not wired.");

const personalizationTypes = await readText("src/personalization/types.ts");
const personalizationRuntime = await readText("src/personalization/runtime.ts");
if (!personalizationTypes.includes("version: z.literal(2)")) throw new Error("v2.0 must preserve personalization schema v2.");
if (!personalizationRuntime.includes('"unreached.personal.v2"')) throw new Error("v2.0 must preserve the existing local personalization storage key.");

const syncTypes = await readText("src/sync/types.ts");
const syncRuntime = await readText("src/sync/runtime.ts");
const syncClient = await readText("src/sync/client.ts");
const accountPage = await readText("src/pages/AccountPage.tsx");
const worker = await readText("worker/src/index.ts");
const migration = await readText("worker/migrations/0001_private_continuity.sql");
const deploy = await readText(".github/workflows/deploy-sync-worker.yml");
const router = await readText("src/app/router.ts");
const app = await readText("src/app/App.tsx");
const main = await readText("src/main.tsx");
const workerConfig = await readText("worker/wrangler.template.jsonc");

if (!syncRuntime.includes('"unreached.sync.v1"')) throw new Error("v2.0 sync metadata must remain separate from personalization v2.");
for (const marker of ['SyncKind = "saved" | "prayer"', "baseItemRevision", "mutationId", "pending", "mirror"]) {
  if (!syncTypes.includes(marker)) throw new Error(`v2.0 sync contract missing ${marker}.`);
}
for (const marker of ["captureLocalDiff", "enablePrivateSyncWithMerge", "disconnectPrivateSync", "createMutationId", "crypto.randomUUID", "crypto.getRandomValues", "lastPrayedAt", "applyingRemoteState"]) {
  if (!syncRuntime.includes(marker)) throw new Error(`v2.0 local sync runtime missing ${marker}.`);
}
if (syncRuntime.includes("Math.random")) throw new Error("v2.0 mutation IDs must never fall back to Math.random.");
if (!syncRuntime.includes("readBrowserPersonalizationState") || !syncRuntime.includes("persistBrowserPersonalizationState")) throw new Error("v2.0 sync must bridge the existing browser-local state rather than replace it.");

const protocolSurface = `${syncTypes}\n${syncClient}\n${worker}`;
for (const forbidden of [
  "recentVisit", "recentVisits", "visitedAt", "sessionHistory", "sessionCount", "completionRate", "completionPercent",
  "sessionScore", "sessionStreak", "prayerCount", "prayerTotal", "prayerMinutesTotal", "leaderboard", "peoplegroups.org", "/wp-json/pg/v1"
]) {
  if (protocolSurface.toLowerCase().includes(forbidden.toLowerCase())) throw new Error(`v2.0 private sync protocol contains forbidden field/reference: ${forbidden}`);
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
]) {
  if (!syncClient.includes(marker)) throw new Error(`v2.0 sync client missing ${marker}.`);
}
if (syncClient.includes('credentials: "include"')) throw new Error("v2.0 workers.dev sync must not depend on cross-site cookies.");
if (syncClient.includes("localStorage")) throw new Error("v2.0 Access identity tokens must not be persisted in localStorage.");

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
]) {
  if (!accountPage.includes(marker)) throw new Error(`v2.0 account surface missing explicit privacy/auth marker: ${marker}`);
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
  "current.present === 0",
  "current.revision > mutation.baseItemRevision",
  "sync_mutations",
  "last_prayed_at",
  "PRIVATE_PREFIX}/export",
  "PRIVATE_PREFIX}/account",
  "Access-Control-Allow-Origin",
  "Access-Control-Allow-Headers",
  "env.APP_ORIGIN",
  "postMessage",
  "accessTokenFromRequest",
]) {
  if (!worker.includes(marker)) throw new Error(`v2.0 Worker missing security/conflict marker: ${marker}`);
}
if (!worker.includes('request.headers.get("Cf-Access-Jwt-Assertion")')) throw new Error("v2.0 sign-in bootstrap must require a Cloudflare Access assertion.");
for (const forbidden of ["Math.random", "prayer_history", "prayer_count", "recent", "peoplegroups.org", "/wp-json/pg/v1"]) {
  if (worker.toLowerCase().includes(forbidden.toLowerCase())) throw new Error(`v2.0 Worker contains forbidden implementation/reference: ${forbidden}`);
}

for (const table of ["sync_users", "sync_items", "sync_mutations"]) if (!migration.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) throw new Error(`v2.0 D1 migration missing ${table}.`);
if (!migration.includes("ON DELETE CASCADE")) throw new Error("v2.0 account deletion must cascade private sync rows.");

for (const marker of ["nodejs_compat", '"workers_dev": true', '"DB"', "__D1_DATABASE_ID__", "__ACCESS_AUD__", "observability"]) {
  if (!workerConfig.includes(marker)) throw new Error(`v2.0 Wrangler template missing ${marker}.`);
}
if (workerConfig.includes('"routes"') || workerConfig.includes("www.thiepn.dev/unreached-sync/*")) throw new Error("v2.0 Worker must not depend on thiepn.dev being a Cloudflare-managed zone.");

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
  if (!deploy.includes(marker)) throw new Error(`v2.0 production deployment workflow missing ${marker}.`);
}

if (!router.includes('"/account": "account"')) throw new Error("v2.0 account route is not registered.");
if (!app.includes("AccountPage") || !app.includes('case "account"')) throw new Error("v2.0 Account page is not materialized by the app.");
if (!main.includes("initializePrivateSyncRuntime();") || !main.includes('"./styles/v20.css"')) throw new Error("v2.0 private sync runtime/style is not initialized.");

const offlineGate = await readText("scripts/offline/v19-check.ts");
if (offlineGate.includes('pkg.version !== "1.9.0"')) throw new Error("v1.9 capability gate must remain forward-compatible for v2.0.");

console.log("v2.0 private continuity checks passed: optional local-first accounts, explicit merge, secure mutation IDs, tombstones, latest-only prayer timestamp, workers.dev Access bootstrap + session-only verified bearer bridge, strict CORS, D1 backend, export/delete controls, no recent history/corpus/performance sync.");
