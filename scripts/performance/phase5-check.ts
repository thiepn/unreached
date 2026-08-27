import { performance } from "node:perf_hooks";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { buildSearchDocuments, searchDocuments } from "../../src/discovery/search.js";
import { buildLiveLanguageRecords, filterLiveLanguages, getLiveLanguageSearchIndex } from "../../src/languages/live.js";
import { filterLivePeople, type LivePeopleFilterState } from "../../src/peoples/live.js";
import { filterLivePrayerEntities } from "../../src/prayer/live.js";
import { buildRuntimePeopleEntities, toRuntimePeopleContext } from "../../src/providers/peoplegroups/model.js";
import { getRuntimePeopleSearchIndex } from "../../src/providers/peoplegroups/search-index.js";
import type { PeopleGroupsApiRecord } from "../../src/providers/peoplegroups/types.js";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");
const CORPUS_SIZE = 12_370;
const FILTER_BUDGET_MS = 50;
const SEARCH_BUDGET_MS = 50;

function languageCode(index: number): string {
  const value = index % (26 * 26 * 26);
  return String.fromCharCode(97 + Math.floor(value / 676), 97 + Math.floor((value % 676) / 26), 97 + (value % 26));
}

const countryCodes = ["BEN", "NGA", "GHA", "IND", "BRA", "MEX", "IDN", "PAK", "KEN", "ETH"] as const;
const countryNames = ["Benin", "Nigeria", "Ghana", "India", "Brazil", "Mexico", "Indonesia", "Pakistan", "Kenya", "Ethiopia"] as const;
const religions = ["Islam", "Hinduism", "Traditional Religion", "Buddhism", "Christianity"] as const;

const sourceRecords: PeopleGroupsApiRecord[] = Array.from({ length: CORPUS_SIZE }, (_, index) => {
  const peid = 200_000 + index;
  const countryIndex = index % countryCodes.length;
  const languageIndex = index % 420;
  return {
    PEID: peid,
    PGID: `PG${String(peid).padStart(6, "0")}`,
    NmDisp: `Synthetic People ${index}`,
    NmAlt: index % 5 === 0 ? `Community ${index}` : null,
    ISOalpha3: countryCodes[countryIndex],
    Ctry: countryNames[countryIndex],
    Regn: "Synthetic Region",
    RegnSub: "Synthetic Subregion",
    Pop: 5_000 + index * 137,
    ROL: languageCode(languageIndex),
    Lang: `Synthetic Language ${languageIndex}`,
    LangFamily: `Family ${languageIndex % 20}`,
    ROR: `R${index % religions.length}`,
    Rlgn: religions[index % religions.length],
    GSEC: index % 7,
    GSECbrf: `GSEC ${index % 7}`,
    Affbloc: `Affinity ${index % 12}`,
    PplClstr: `Cluster ${index % 80}`,
    PplNm: `Synthetic People ${index}`,
    Ethne: `Ethne ${index % 60}`,
    Bible: index % 3 === 0 ? "Available" : index % 3 === 1 ? "Not Available" : "Unknown",
    Jesus: index % 2 === 0 ? "Available" : "Not Available",
    ResTot: index % 8,
    UpdatedDate: "2026-08-27T00:00:00.000Z",
  };
});

const contexts = sourceRecords.map(toRuntimePeopleContext);
const entities = buildRuntimePeopleEntities(sourceRecords);
const peopleIndex = getRuntimePeopleSearchIndex(entities);
if (peopleIndex.records.length !== CORPUS_SIZE || peopleIndex.byRouteKey.size !== CORPUS_SIZE) {
  throw new Error("Phase 5 prepared PeopleGroups index did not cover the synthetic corpus exactly once.");
}
if (getRuntimePeopleSearchIndex(entities) !== peopleIndex) {
  throw new Error("Phase 5 PeopleGroups index must be reused for the same corpus generation.");
}

function medianTiming(label: string, work: () => unknown, runs = 9): number {
  const timings: number[] = [];
  for (let index = 0; index < runs; index += 1) {
    const started = performance.now();
    work();
    const elapsed = performance.now() - started;
    if (index >= 2) timings.push(elapsed);
  }
  timings.sort((a, b) => a - b);
  const median = timings[Math.floor(timings.length / 2)] ?? Number.POSITIVE_INFINITY;
  if (!Number.isFinite(median)) throw new Error(`${label} benchmark did not produce a finite timing.`);
  return median;
}

const peopleQueryState: LivePeopleFilterState = {
  query: "Synthetic People 1236",
  status: "all",
  countryIso3: "",
  language: "",
  religion: "",
  bibleAvailability: "",
  minimumPopulation: 0,
  sort: "population-desc",
};
const peopleFilterState: LivePeopleFilterState = {
  query: "",
  status: "unreached-only",
  countryIso3: "BEN",
  language: "",
  religion: "Islam",
  bibleAvailability: "Available",
  minimumPopulation: 100_000,
  sort: "gsec-asc",
};

const peopleQueryResult = filterLivePeople(entities, peopleQueryState, peopleIndex);
if (!peopleQueryResult.some((entity) => entity.displayName === "Synthetic People 12369")) {
  throw new Error("Phase 5 prepared people search changed query semantics.");
}
filterLivePeople(entities, peopleFilterState, peopleIndex);

const prayerEligible = entities.filter((entity) => entity.reach.unreachedContexts === 1);
const prayerResult = filterLivePrayerEntities(prayerEligible, "Synthetic People 12369", null, peopleIndex);
if (prayerResult[0]?.displayName !== "Synthetic People 12369") {
  throw new Error("Phase 5 prepared prayer search changed query semantics.");
}

const languageRecords = buildLiveLanguageRecords(contexts);
const languageIndex = getLiveLanguageSearchIndex(languageRecords);
if (getLiveLanguageSearchIndex(languageRecords) !== languageIndex) {
  throw new Error("Phase 5 language search index must be reused for the same language generation.");
}
const languageResult = filterLiveLanguages(languageRecords, {
  query: "Synthetic People 12369",
  reach: "all",
  bible: "all",
  sort: "name",
}, languageIndex);
if (!languageResult.length) throw new Error("Phase 5 prepared language search changed people-name search semantics.");

const searchDocumentsIndex = buildSearchDocuments({
  peoples: peopleIndex.records.map((prepared) => ({
    sourcePeopleId: prepared.entity.routeKey,
    name: prepared.entity.displayName,
    primaryLanguageName: prepared.entity.primaryLanguage?.name,
    primaryReligionName: prepared.entity.primaryReligion?.name,
    largestCountryName: prepared.entity.contexts[0]?.country.name,
    cluster: prepared.peopleCluster,
    affinityBloc: prepared.affinityBloc,
  })),
  countries: countryCodes.map((iso3, index) => ({ iso3, name: countryNames[index]!, regionName: "Synthetic Region" })),
  languages: languageRecords.map((record) => ({
    iso6393: record.iso6393,
    name: record.name,
    familyName: record.familyName,
    branchName: null,
    countryNames: record.countries.map((country) => country.name),
    peopleNames: record.peoples.map((people) => people.name),
  })),
});
if (searchDocuments(searchDocumentsIndex, "Synthetic People 12369", 18)[0]?.label !== "Synthetic People 12369") {
  throw new Error("Phase 5 global search ranking changed exact-match behavior.");
}

const timings = {
  peopleQuery: medianTiming("people query", () => filterLivePeople(entities, peopleQueryState, peopleIndex)),
  peopleFilters: medianTiming("people filters", () => filterLivePeople(entities, peopleFilterState, peopleIndex)),
  prayerQuery: medianTiming("prayer query", () => filterLivePrayerEntities(prayerEligible, "Synthetic People 12369", null, peopleIndex)),
  languageQuery: medianTiming("language query", () => filterLiveLanguages(languageRecords, { query: "Synthetic People 12369", reach: "all", bible: "all", sort: "name" }, languageIndex)),
  globalSearch: medianTiming("global search", () => searchDocuments(searchDocumentsIndex, "Synthetic People 12369", 18)),
};

for (const [label, value] of Object.entries(timings)) {
  const budget = label === "globalSearch" ? SEARCH_BUDGET_MS : FILTER_BUDGET_MS;
  if (value > budget) throw new Error(`Phase 5 ${label} median ${value.toFixed(1)}ms exceeds ${budget}ms budget on the ${CORPUS_SIZE}-record certification corpus.`);
}

const store = await readText("src/providers/peoplegroups/store.ts");
const searchIndexSource = await readText("src/providers/peoplegroups/search-index.ts");
const peoples = await readText("src/peoples/live.ts");
const peoplePage = await readText("src/pages/PeoplesPage.tsx");
const prayer = await readText("src/prayer/live.ts");
const prayerPage = await readText("src/pages/PrayPage.tsx");
const languages = await readText("src/languages/live.ts");
const languagePage = await readText("src/pages/LanguagesPage.tsx");
const globalSearch = await readText("src/discovery/search.ts");
const packageJson = JSON.parse(await readText("package.json")) as { scripts?: Record<string, string> };

for (const marker of ["peopleSearchIndex", "getRuntimePeopleSearchIndex(entities)"]) {
  if (!store.includes(marker)) throw new Error(`Phase 5 shared store missing prepared search ownership: ${marker}.`);
}
for (const marker of ["searchText", "prayerSearchText", "countryIso3s", "languageKeys", "religionKeys", "bibleAvailability", "gsecMin", "population", "options"]) {
  if (!searchIndexSource.includes(marker)) throw new Error(`Phase 5 PeopleGroups prepared index missing ${marker}.`);
}
if (peoples.includes("flatMap") || peoples.includes("entityTaxonomy")) throw new Error("Phase 5 People Explorer hot filter path must not rebuild taxonomy/context haystacks.");
if (!peoplePage.includes("explorer.peopleSearchIndex.options") || !peoplePage.includes("explorer.peopleSearchIndex)")) throw new Error("Phase 5 People page must consume store-owned filter options and prepared index.");
if (!prayer.includes("filterLivePrayerEntities") || !prayerPage.includes("useDebouncedValue(query, 100)") || !prayerPage.includes("prayer.peopleSearchIndex")) throw new Error("Phase 5 Prayer search must be debounced and consume the shared prepared index.");
if (!languages.includes("getLiveLanguageSearchIndex") || languages.includes("const haystack")) throw new Error("Phase 5 Language filtering must use a generation-scoped prepared search index.");
if (!languagePage.includes("explorer.searchIndex")) throw new Error("Phase 5 Language page must pass its shared prepared search index.");
for (const marker of ["normalizedLabel", "compactLabel", "insertBest"]) {
  if (!globalSearch.includes(marker)) throw new Error(`Phase 5 global search optimization missing ${marker}.`);
}
if (globalSearch.includes("normalize(doc.label)")) throw new Error("Phase 5 global search must not normalize document labels per query.");
if (!packageJson.scripts?.["instant-data:check"]?.includes("scripts/performance/phase5-check.ts")) throw new Error("Phase 5 performance certification is not wired into the build gate.");

console.log(`Phase 5 search/index performance checks passed on ${CORPUS_SIZE.toLocaleString("en-US")} synthetic records: people query ${timings.peopleQuery.toFixed(1)}ms, people filters ${timings.peopleFilters.toFixed(1)}ms, prayer ${timings.prayerQuery.toFixed(1)}ms, language ${timings.languageQuery.toFixed(1)}ms, global search ${timings.globalSearch.toFixed(1)}ms.`);
