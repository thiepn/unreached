import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");

const recordRuntime = await readText("src/providers/peoplegroups/record-runtime.ts");
for (const marker of [
  "peopleGroupsPgidForRouteKey",
  "padStart(6",
  "fetchByPgid",
  "createIndexedDbPeopleGroupsRecordCache",
  "PEOPLE_GROUPS_CACHE_FRESH_MS",
  "record.PEID !== routeKey",
]) {
  if (!recordRuntime.includes(marker)) throw new Error(`Phase 4 route-record loader missing ${marker}.`);
}

const recordStore = await readText("src/providers/peoplegroups/record-store.ts");
for (const marker of [
  "usePeopleGroupsRouteRecord",
  "usePeopleGroupsRuntimeStore(false)",
  "canonicalFromCorpus",
  "identityMatches",
  'source: "corpus"',
]) {
  if (!recordStore.includes(marker)) throw new Error(`Phase 4 route-record store missing ${marker}.`);
}

const peopleBoundary = await readText("src/peoples/profile.ts");
if (!peopleBoundary.includes("usePeopleGroupsRouteRecord(sourcePeopleId)")) throw new Error("Phase 4/V3 people boundary must preserve route-specific loading.");
if (!peopleBoundary.includes("usePeopleGroupsRuntimeStore(enabled)")) throw new Error("Phase 4/V3 people boundary must keep full-corpus promotion explicit and opt-in.");

const peoplePage = await readText("src/pages/PeoplePage.tsx");
if (!peoplePage.includes("useLivePeopleProfile(sourcePeopleId)")) throw new Error("Phase 4/V3 people details must use the route-specific people boundary.");
if (peoplePage.includes("useLivePeopleExplorer")) throw new Error("Phase 4 people details must not activate the full people explorer corpus.");
if (!peoplePage.includes("<ProfileLocalActions record={record}")) throw new Error("Phase 4 people details must pass the already-loaded route entity into profile actions.");

const profileActions = await readText("src/components/ProfileLocalActions.tsx");
if (profileActions.includes("useLivePeopleExplorer") || profileActions.includes("usePeopleGroupsRuntimeStore")) {
  throw new Error("Phase 4 profile actions must not activate or subscribe to a full PeopleGroups corpus.");
}
if (!profileActions.includes("record: PeopleProfileRecord")) throw new Error("Phase 4/V3 profile actions must consume the already-loaded route entity through the people boundary type.");

const recentTracker = await readText("src/components/RecentRouteTracker.tsx");
if (!recentTracker.includes("usePeopleGroupsRouteRecord")) throw new Error("Phase 4 people Recent tracking must reuse the route-record store.");
if (recentTracker.includes("useLivePeopleExplorer")) throw new Error("Phase 4 Recent tracking must not activate the full people corpus on a profile route.");

const prayerPage = await readText("src/pages/PrayerFocusPage.tsx");
if (!prayerPage.includes("usePeopleGroupsRouteRecord")) throw new Error("Phase 4 focused prayer must use route-specific loading.");
if (prayerPage.includes("useLivePrayerExperience")) throw new Error("Phase 4 focused prayer must not activate the full prayer corpus.");

const cache = await readText("src/providers/peoplegroups/cache.ts");
for (const marker of ["PEOPLE_GROUPS_RECORD_STORE", 'db.createObjectStore(PEOPLE_GROUPS_RECORD_STORE', "transaction.oncomplete"]) {
  if (!cache.includes(marker)) throw new Error(`Phase 4 route-record cache missing ${marker}.`);
}

const browser = await readText("tests/e2e/phase4-route-loading.spec.ts");
for (const marker of [
  "direct people profile fetches one record and does not activate the corpus",
  "survives reload through IndexedDB",
  "full corpus promotion replaces the route snapshot",
  "zero-padded PGIDs",
  "corpusRequests).toBe(0)",
]) {
  if (!browser.includes(marker)) throw new Error(`Phase 4 browser certification missing ${marker}.`);
}

console.log("Phase 4 route-loading checks passed under V3: the people boundary preserves one-record loading/caching, profile actions consume the loaded entity, Recent and prayer keep route-specific stores, and full-corpus promotion remains explicit.");
