import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { buildSearchDocuments, searchDocuments } from "../../src/discovery/search";

const root = process.cwd();
const read = (path: string) => readFile(resolve(root, path), "utf8");

function requireText(source: string, marker: string, label: string): void {
  if (!source.includes(marker)) throw new Error(`V3 Phase 9: missing ${label}: ${marker}`);
}

const required = [
  "src/pages/SearchPage.tsx",
  "src/discovery/search.ts",
  "src/discovery/shared.ts",
  "src/discovery/collections.ts",
  "src/pages/PeoplesPage.tsx",
  "src/styles/atlas-foundation/discovery.css",
  "docs/V3_PHASE9_SEARCH_DISCOVERY_COLLECTIONS.md",
  "tests/e2e/v3-phase9-search-discovery.spec.ts",
];
for (const path of required) {
  if (!existsSync(resolve(root, path))) throw new Error(`V3 Phase 9 required file is missing: ${path}`);
}

const documents = buildSearchDocuments({
  peoples: [{ sourcePeopleId: 42, name: "Demo People", primaryLanguageName: "Demo Language", largestCountryName: "Demo Country" }],
  regions: [{ id: "demo-region", name: "Demo Region", countryNames: ["Demo Country"] }],
  countries: [{ iso3: "DEM", name: "Demo Country", regionName: "Demo Region" }],
  languages: [{ iso6393: "dmo", name: "Demo Language", countryNames: ["Demo Country"], peopleNames: ["Demo People"] }],
});
if (documents.length !== 4) throw new Error(`V3 Phase 9 unified search expected four domain documents, got ${documents.length}.`);
for (const domain of ["people", "region", "country", "language"] as const) {
  if (!documents.some((document) => document.domain === domain)) throw new Error(`V3 Phase 9 unified search is missing ${domain}.`);
}
if (searchDocuments(documents, "Demo Region")[0]?.domain !== "region") throw new Error("V3 Phase 9 exact region search must resolve the atlas region first.");
if (searchDocuments(documents, "42")[0]?.href !== "#/peoples/42") throw new Error("V3 Phase 9 source-ID search must preserve the definitive people URL.");

const router = await read("src/app/router.ts");
requireText(router, '| "search"', "Search route ID");
requireText(router, '"/search": "search"', "Search route mapping");

const app = await read("src/app/App.tsx");
requireText(app, 'import("../pages/SearchPage")', "lazy Search page");
requireText(app, 'case "search": page = <SearchPage />;', "Search route rendering");

const shared = await read("src/discovery/shared.ts");
requireText(shared, "atlasRegionForCountry", "canonical atlas-region indexing");
requireText(shared, "regions: buildRegionInputs(geography)", "region documents in shared search");

const searchPage = await read("src/pages/SearchPage.tsx");
for (const marker of [
  "Find a people or place.",
  '"people", "region", "country", "language"',
  "Reviewed context",
  "Source profile",
  "does not indicate that a people group is more important",
]) requireText(searchPage, marker, "Search product contract");

const collections = await read("src/discovery/collections.ts");
for (const marker of [
  'id: "reviewed-context"',
  'id: "across-regions"',
  'id: "language-pathways"',
  "not a ranking of mission importance or urgency",
  "not scored or ranked",
]) requireText(collections, marker, "guided collection contract");
if (collections.includes("population.knownValue")) throw new Error("V3 Phase 9 guided collections must not use population magnitude as a hidden importance ranking.");

const peoplesPage = await read("src/pages/PeoplesPage.tsx");
for (const marker of [
  "Begin with a path, not a filter wall.",
  "buildDiscoveryCollections",
  "Refine results",
  "Reviewed coverage describes research depth, not mission importance.",
  'href={hrefFor(`/peoples/${people.routeKey}`)}',
]) requireText(peoplesPage, marker, "Peoples discovery contract");
if (peoplesPage.includes("bibleAvailability") && !peoplesPage.includes('bibleAvailability: ""')) throw new Error("V3 Phase 9 should not restore the old Bible-label filter wall.");

const dialog = await read("src/components/SearchDialog.tsx");
for (const marker of ["Regions", "Full search", "/search", "Reviewed context", "Source profile"]) requireText(dialog, marker, "quick-search handoff");

const main = await read("src/main.tsx");
const discoveryIndex = main.indexOf('import "./styles/atlas-foundation/discovery.css";');
const accessibilityIndex = main.indexOf('import "./styles/foundation/accessibility.css";');
if (discoveryIndex < 0 || accessibilityIndex < 0 || discoveryIndex > accessibilityIndex) throw new Error("V3 Phase 9 discovery styles must load before the final accessibility layer.");

const packageJson = await read("package.json");
requireText(packageJson, '"v3:phase9-check": "tsx scripts/v3/phase9-check.ts"', "Phase 9 package gate");
requireText(packageJson, "npm run v3:phase8-check && npm run v3:phase9-check", "blocking Phase 9 build integration");

const docs = await read("docs/V3_PHASE9_SEARCH_DISCOVERY_COLLECTIONS.md");
for (const marker of ["Search, Discovery & Collections", "Review depth is not importance", "World → Region → Country → People", "Phase 10", "no mission-priority score"]) requireText(docs, marker, "Phase 9 documentation");

console.log("V3 Phase 9 checks passed: unified four-domain search, direct definitive-profile routing, reduced people-filter complexity, transparent non-ranking guided collections, and editorial-depth labeling are enforced.");
