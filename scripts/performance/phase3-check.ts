import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");

const store = await readText("src/providers/peoplegroups/store.ts");
for (const marker of [
  "generation: number",
  "peopleByRouteKey",
  "peopleByPeid",
  "countriesByIso3",
  "eligiblePrayerPeople",
  "eligiblePrayerIds",
  "buildSharedPeopleGroupsDerivedData",
  "buildVisibleCountryRecords(contexts, countrySummaries)",
]) {
  if (!store.includes(marker)) throw new Error(`Phase 3 PeopleGroups shared store missing ${marker}.`);
}

const peoples = await readText("src/peoples/live.ts");
if (peoples.includes("new Map(runtime.entities")) throw new Error("Phase 3 people explorer must consume store-owned identity maps.");
if (peoples.includes("useMemo")) throw new Error("Phase 3 people explorer must not rebuild shared indexes per hook instance.");

const countries = await readText("src/countries/live.ts");
if (countries.includes("buildVisibleCountryRecords") || countries.includes("useMemo")) throw new Error("Phase 3 country explorer must consume store-owned country derivations.");

const languages = await readText("src/languages/live.ts");
for (const marker of ["sharedLanguageCache", "getSharedLiveLanguageData", "languagesByIso", "bibleLabels"]) {
  if (!languages.includes(marker)) throw new Error(`Phase 3 shared language selector missing ${marker}.`);
}
if (languages.includes("useMemo")) throw new Error("Phase 3 language explorer must not rebuild language maps per hook instance.");

const prayer = await readText("src/prayer/live.ts");
if (!prayer.includes("runtime.eligiblePrayerPeople") || prayer.includes("useMemo")) throw new Error("Phase 3 prayer experience must consume store-owned eligibility.");

const geography = await readText("src/map/geography.ts");
for (const marker of ["const listeners", "let pendingLoad", "ensureWorldGeography", "countriesByIso3", "generation", "cache: \"no-cache\""]) {
  if (!geography.includes(marker)) throw new Error(`Phase 3 geography singleton missing ${marker}.`);
}
if (geography.includes("new AbortController")) throw new Error("Phase 3 geography loading must not be tied to individual component lifetimes.");

const editorial = await readText("src/context/runtime.ts");
for (const marker of ["const listeners", "let pendingLoad", "ensureEditorialContext", "profilesByPeid", "generation", "cache: \"no-cache\""]) {
  if (!editorial.includes(marker)) throw new Error(`Phase 3 editorial singleton missing ${marker}.`);
}
if (editorial.includes("new AbortController")) throw new Error("Phase 3 editorial loading must not be tied to individual component lifetimes.");

const sharedSearch = await readText("src/discovery/shared.ts");
for (const marker of ["peopleGeneration", "geographyGeneration", "useSharedSearchDocuments", "getSharedLiveLanguageData", "runtime.countriesByIso3"]) {
  if (!sharedSearch.includes(marker)) throw new Error(`Phase 3 shared search index missing ${marker}.`);
}

const searchDialog = await readText("src/components/SearchDialog.tsx");
if (!searchDialog.includes("useSharedSearchDocuments")) throw new Error("Phase 3 SearchDialog must consume the shared search index.");
for (const forbidden of ["useLivePeopleExplorer", "useLiveCountryExplorer", "useLiveLanguageExplorer", "useWorldGeography"]) {
  if (searchDialog.includes(forbidden)) throw new Error(`Phase 3 SearchDialog still independently subscribes to ${forbidden}.`);
}

const visualization = await readText("src/visualization/live.ts");
if (!visualization.includes("runtime.countries") || visualization.includes("buildVisibleCountryRecords(runtime.contexts")) throw new Error("Phase 3 visualization must reuse the shared country derivation.");

const browser = await readText("tests/e2e/phase3-shared-data.spec.ts");
for (const marker of ["reuses geography across Explore and global search", "reuses one editorial publication across profile and coverage routes", "geographyRequests", "editorialStatusRequests"]) {
  if (!browser.includes(marker)) throw new Error(`Phase 3 browser certification missing ${marker}.`);
}

console.log("Phase 3 shared-data architecture checks passed: corpus identity/country/prayer indexes are shared, language derivations are memoized once per corpus, geography/editorial are singleton lifecycles, and global search consumes shared generations.");
