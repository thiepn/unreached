import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { createPeopleGroupsApiClient } from "../../src/providers/peoplegroups/api.js";
import { createMemoryPeopleGroupsCache } from "../../src/providers/peoplegroups/cache.js";
import { createPeopleGroupsCorpusLoader } from "../../src/providers/peoplegroups/runtime.js";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");
const pkg = JSON.parse(await readText("package.json")) as { version?: string };
const versionMatch = /^(\d+)\.(\d+)\.(\d+)$/.exec(pkg.version ?? "");
const major = Number(versionMatch?.[1] ?? -1);
const minor = Number(versionMatch?.[2] ?? -1);
if (!versionMatch || major < 1 || (major === 1 && minor < 9)) throw new Error(`v1.9+ package capability mismatch: ${String(pkg.version)}`);

const now = Date.parse("2026-08-25T00:00:00.000Z");
const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
let networkCalls = 0;
const client = createPeopleGroupsApiClient({
  fetchImpl: (async () => {
    networkCalls += 1;
    throw new Error("offline test must not reach network");
  }) as typeof fetch,
});
const cache = createMemoryPeopleGroupsCache();
await cache.write({ schemaVersion: 1, page: 1, totalPages: 1, totalRecords: 0, storedAt: thirtyDaysAgo, records: [] });
const offlineLoader = createPeopleGroupsCorpusLoader({ client, cache, now: () => now, isOnline: () => false });
const offlineResult = await offlineLoader.load({ forceRefresh: true });
if (networkCalls !== 0) throw new Error("v1.9 offline loader attempted the PeopleGroups network.");
if (offlineResult.source !== "cache-stale" || !offlineResult.stale || offlineResult.loadedAt !== thirtyDaysAgo) throw new Error("v1.9 must preserve and explicitly mark an old validated offline snapshot as stale.");
if (!offlineResult.warning?.includes("offline") || !offlineResult.warning.includes("validated")) throw new Error("v1.9 stale offline snapshot warning is not explicit enough.");

const emptyOfflineLoader = createPeopleGroupsCorpusLoader({ client, cache: createMemoryPeopleGroupsCache(), now: () => now, isOnline: () => false });
let emptyOfflineMessage = "";
try {
  await emptyOfflineLoader.load();
} catch (error) {
  emptyOfflineMessage = error instanceof Error ? error.message : String(error);
}
if (!emptyOfflineMessage.includes("no validated PeopleGroups cache") || !emptyOfflineMessage.includes("Reconnect once")) throw new Error("v1.9 first-offline behavior must fail clearly without inventing data.");

const vite = await readText("vite.config.ts");
for (const marker of ["unreached-phase2-deployment-safe-offline-shell", "OFFLINE_CACHE_PREFIX", "PRECACHE", "request.mode === \"navigate\"", "url.origin !== self.location.origin", "listPublicFiles"]) {
  if (!vite.includes(marker)) throw new Error(`v1.9+ Vite offline shell missing contract marker: ${marker}`);
}
if (vite.includes("peoplegroups.org")) throw new Error("v1.9+ service-worker generation must not cache or proxy PeopleGroups.org.");

const offlineRuntime = await readText("src/offline/runtime.ts");
for (const marker of ["serviceWorker.register", "import.meta.env.BASE_URL", "installPeopleGroupsReconnectRefresh", "Registration failure must not break the app"]) {
  if (!offlineRuntime.includes(marker)) throw new Error(`v1.9+ offline runtime missing: ${marker}`);
}

const store = await readText("src/providers/peoplegroups/store.ts");
for (const marker of ["installPeopleGroupsReconnectRefresh", 'window.addEventListener("online"', "ensurePeopleGroupsRuntime(true)"]) {
  if (!store.includes(marker)) throw new Error(`v1.9 reconnect refresh missing: ${marker}`);
}

const dataStatus = await readText("src/components/DataStatus.tsx");
for (const marker of ["data-data-state", "Live mission data", "Cached mission data", "Stale cached mission data", "Offline · no mission cache", "Snapshot"]) {
  if (!dataStatus.includes(marker)) throw new Error(`v1.9 visible data-state UI missing: ${marker}`);
}

const main = await readText("src/main.tsx");
if (!main.includes("initializeOfflineRuntime();") || !main.includes('"./styles/v19.css"')) throw new Error("v1.9 runtime/style entrypoint wiring is incomplete.");

const manifest = JSON.parse(await readText("public/site.webmanifest")) as { id?: string; start_url?: string; scope?: string; display?: string; shortcuts?: unknown[] };
if (manifest.id !== "/unreached/" || manifest.start_url !== "/unreached/#/" || manifest.scope !== "/unreached/" || manifest.display !== "standalone") throw new Error("v1.9 installable manifest scope/start/display contract failed.");
if (!Array.isArray(manifest.shortcuts) || manifest.shortcuts.length < 3) throw new Error("v1.9 manifest must expose useful Explore/Pray/Saved shortcuts.");

const v18 = await readText("scripts/prayer/v18-check.ts");
if (v18.includes('pkg.version !== "1.8.0"')) throw new Error("v1.8 capability gate must remain forward-compatible.");

console.log("v1.9+ offline resilience checks passed: installable shell, owned-asset offline boundary, explicit data provenance, old validated offline fallback, first-offline failure safety, and reconnect refresh.");
