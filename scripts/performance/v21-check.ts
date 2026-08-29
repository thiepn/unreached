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
const runtime = await readText("src/providers/peoplegroups/runtime.ts");
const main = await readText("src/main.tsx");
const api = await readText("src/providers/peoplegroups/api.ts");
const peopleLive = await readText("src/peoples/live.ts");
const peoplesPage = await readText("src/pages/PeoplesPage.tsx");
const routePreload = await readText("src/app/route-preload.ts");
const appShell = await readText("src/components/AppShell.tsx");
const index = await readText("index.html");
const browserSpec = await readText("tests/e2e/v21-instant-data.spec.ts");
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
  "previewReady: boolean",
  "previewPeopleSearchIndex",
  "materializePreview",
]) {
  if (!store.includes(marker)) throw new Error(`P2.1 stale-while-revalidate runtime missing ${marker}.`);
}

const localOnlyWarmup = `export function warmPeopleGroupsRuntime(): void {\n  void hydratePreparedSnapshot();\n}`;
if (!store.includes(localOnlyWarmup)) {
  throw new Error("P2.1 startup warming must hydrate only the prepared local snapshot and must not trigger a provider request.");
}

for (const marker of ["installPeopleGroupsReconnectRefresh", "warmPeopleGroupsRuntime();", "render(<App />"]) {
  if (!main.includes(marker)) throw new Error(`P2.1 startup warming missing ${marker}.`);
}
const warmIndex = main.indexOf("warmPeopleGroupsRuntime();");
const renderIndex = main.indexOf("render(<App />");
if (warmIndex < 0 || renderIndex < 0 || warmIndex > renderIndex) {
  throw new Error("P2.1 prepared snapshot hydration must start before the application render.");
}
if (main.includes("requestIdleCallback") || main.includes("setTimeout(warmPeopleGroupsRuntime")) {
  throw new Error("P2.1 prepared snapshot hydration must not wait for an idle callback or timer.");
}

for (const marker of ["onPartial", "publishPartial", "loadedPages", "totalPages"]) {
  if (!api.includes(marker)) throw new Error(`P2.1 progressive API loading missing ${marker}.`);
}
if (!runtime.includes("onPartial: params.onPartial")) throw new Error("P2.1 corpus loader must forward validated partial batches.");
for (const marker of ["partial", "interactive", "previewEntities", "previewPeopleSearchIndex"]) {
  if (!peopleLive.includes(marker)) throw new Error(`P2.1 People Explorer preview wrapper missing ${marker}.`);
}
for (const marker of [
  "data-progressive-catalog",
  "Loading the complete catalog",
  "explorer.interactive",
  'explorer.partial ? "loaded " : ""',
  "source records",
]) {
  if (!peoplesPage.includes(marker)) throw new Error(`P2.1 truthful progressive People Explorer UI missing ${marker}.`);
}

for (const marker of ["preloadRoute", 'import("../pages/PeoplesPage")', 'import("../pages/PrayPage")']) {
  if (!routePreload.includes(marker)) throw new Error(`P2.1 route-intent preloading missing ${marker}.`);
}
for (const marker of ["onPointerEnter", "onPointerDown", "onFocus", "preloadRoute"]) {
  if (!appShell.includes(marker)) throw new Error(`P2.1 navigation intent preloading missing ${marker}.`);
}
for (const marker of [
  '<link rel="dns-prefetch" href="//peoplegroups.org" />',
  '<link rel="preconnect" href="https://peoplegroups.org" crossorigin />',
]) {
  if (!index.includes(marker)) throw new Error(`P2.1 provider connection warming missing ${marker}.`);
}

for (const marker of [
  "prepared cache hydrates on non-data routes without idle callbacks",
  "cold People Explorer is usable before the full corpus finishes",
]) {
  if (!browserSpec.includes(marker)) throw new Error(`P2.1 browser loading certification missing ${marker}.`);
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

console.log("P2.1 instant-data checks passed: prepared-cache hydration starts immediately, cold People Explorer can use validated partial pages without claiming complete coverage, navigation/API connections prewarm opportunistically, stale-while-revalidate and no-static-mirror boundaries remain intact.");
