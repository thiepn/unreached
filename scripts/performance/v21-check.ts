import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");
const pkg = JSON.parse(await readText("package.json")) as { version?: string; scripts?: Record<string, string> };

const version = String(pkg.version ?? "0.0.0").split(".").map((part) => Number(part));
if ((version[0] ?? 0) < 2 || ((version[0] ?? 0) === 2 && (version[1] ?? 0) < 1)) {
  throw new Error(`P2.1 requires package version >=2.1.0; received ${String(pkg.version)}.`);
}
if (!pkg.scripts?.["instant-data:check"]?.includes("scripts/performance/v21-check.ts")) {
  throw new Error("P2.1 instant-data certification script is not wired.");
}
if (!pkg.scripts?.build?.includes("instant-data:check")) {
  throw new Error("P2.1 instant-data certification must run in the production build gate.");
}

const cache = await readText("src/providers/peoplegroups/cache.ts");
const store = await readText("src/providers/peoplegroups/store.ts");
const main = await readText("src/main.tsx");
const api = await readText("src/providers/peoplegroups/api.ts");
const legal = await readText("docs/PEOPLEGROUPS_DATA_SOURCE.md");

for (const marker of [
  'PEOPLE_GROUPS_PREPARED_STORE = "prepared"',
  'PEOPLE_GROUPS_RECORD_STORE = "records"',
  "PreparedPeopleGroupsSnapshot",
  "createIndexedDbPreparedPeopleGroupsCache",
  "preparedPeopleGroupsSnapshotIsUsable",
  "indexedDB.open(PEOPLE_GROUPS_CACHE_DB, 3)",
]) {
  if (!cache.includes(marker)) throw new Error(`P2.1 prepared/cache architecture missing ${marker}.`);
}

for (const marker of [
  "refreshing: boolean",
  "hydratePreparedSnapshot",
  "PEOPLE_GROUPS_CACHE_STALE_MAX_MS",
  "loading: blocking",
  "refreshing: !blocking",
  "void refreshFromSource(true)",
  "persistPrepared",
  "warmPeopleGroupsRuntime",
]) {
  if (!store.includes(marker)) throw new Error(`P2.1 stale-while-revalidate runtime missing ${marker}.`);
}

const localOnlyWarmup = `export function warmPeopleGroupsRuntime(): void {\n  void hydratePreparedSnapshot();\n}`;
if (!store.includes(localOnlyWarmup)) {
  throw new Error("P2.1 startup warming must hydrate only the prepared local snapshot and must not trigger a provider request.");
}

for (const marker of [
  "installPeopleGroupsReconnectRefresh",
  "requestIdleCallback",
  "warmPeopleGroupsRuntime",
]) {
  if (!main.includes(marker)) throw new Error(`P2.1 startup warming missing ${marker}.`);
}

if (!api.includes('cache: "no-store"')) throw new Error("P2.1 must preserve direct-provider no-store semantics; local prepared data is the cache boundary.");
if (!api.includes("fetchByPgid")) throw new Error("P2.1 must preserve the provider-supported single-PGID request path for route-specific activation.");
if (!legal.includes("static browser-accessible mirror of the complete API dataset")) {
  throw new Error("P2.1 must preserve the documented no-static-mirror data boundary.");
}

for (const forbidden of [
  "public/peoplegroups.json",
  "src/data/peoplegroups.json",
  "dist/peoplegroups.json",
]) {
  if (cache.includes(forbidden) || store.includes(forbidden) || main.includes(forbidden)) {
    throw new Error(`P2.1 must not introduce a static PeopleGroups corpus mirror: ${forbidden}`);
  }
}

console.log("P2.1 instant-data checks passed: prepared one-read hydration, local-only idle startup, non-blocking stale-while-revalidate on demand, version-3 cache stores, reconnect refresh, and no static provider mirror.");
