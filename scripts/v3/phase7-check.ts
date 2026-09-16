import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { atlasRegionForCountry, buildAtlasRegions } from "../../src/geography/regions";
import type { MapCountryFeature } from "../../src/map/types";
import type { LiveMissionCountrySummary } from "../../src/visualization/liveTypes";

const root = process.cwd();
const read = (path: string) => readFile(resolve(root, path), "utf8");

function requireText(source: string, marker: string, label: string): void {
  if (!source.includes(marker)) throw new Error(`V3 Phase 7: missing ${label}: ${marker}`);
}

for (const path of [
  "src/geography/regions.ts",
  "src/pages/RegionsPage.tsx",
  "src/pages/RegionPage.tsx",
  "src/styles/atlas-foundation/geography.css",
  "tests/e2e/v3-phase7-regions-countries.spec.ts",
  "docs/V3_PHASE7_REGIONS_COUNTRIES.md",
]) {
  if (!existsSync(resolve(root, path))) throw new Error(`V3 Phase 7 required file is missing: ${path}`);
}

const regionModel = await read("src/geography/regions.ts");
for (const marker of [
  "Natural Earth continent field",
  "atlasRegionForCountry",
  "buildAtlasRegions",
  "routeCodeForCountry",
]) requireText(regionModel, marker, "region-model contract");
if (regionModel.includes("providers/peoplegroups") || regionModel.includes(".Regn") || regionModel.includes(".RegnSub")) {
  throw new Error("V3 Phase 7 must not use PeopleGroups region fields as canonical geographic identity.");
}

const africaFeature = {
  type: "Feature",
  id: "BEN",
  properties: { mapKey: "BEN", iso3: "BEN", adminA3: "BEN", name: "Benin", type: "Sovereign country", boundaryNote: null, sovereignty: "Benin", continent: "Africa" },
  geometry: { type: "Polygon", coordinates: [] },
} as unknown as MapCountryFeature;
const asiaFeature = {
  type: "Feature",
  id: "KAZ",
  properties: { mapKey: "KAZ", iso3: "KAZ", adminA3: "KAZ", name: "Kazakhstan", type: "Sovereign country", boundaryNote: null, sovereignty: "Kazakhstan", continent: "Asia" },
  geometry: { type: "Polygon", coordinates: [] },
} as unknown as MapCountryFeature;
const beninMission: LiveMissionCountrySummary = {
  iso3: "BEN",
  name: "Benin",
  peopleContextCount: 2,
  unreachedContextCount: 2,
  otherContextCount: 0,
  unknownContextCount: 0,
  gsecKnownContextCount: 2,
  populationKnownContextCount: 2,
  knownPopulation: 170000,
  gsecKnownPopulation: 170000,
  unreachedKnownPopulation: 170000,
  unreachedPopulationShare: 100,
  unreachedContextShare: 100,
  gsecCoverage: 100,
  gsecPopulationCoverage: 100,
  populationCoverage: 100,
  sourceUpdatedAt: null,
  denominator: "people-group-in-country records returned by PeopleGroups.org",
  methodologyVersion: "u12d-imb-gsec-map-v1",
};
const mission = new Map<string, LiveMissionCountrySummary>([["BEN", beninMission]]);

const syntheticRegions = buildAtlasRegions([africaFeature, asiaFeature], mission);
if (syntheticRegions.length !== 2) throw new Error("V3 Phase 7 synthetic region grouping failed.");
const africa = syntheticRegions.find((region) => region.id === "africa");
if (!africa || africa.countryCount !== 1 || africa.peopleContextCount !== 2 || africa.unreachedContextCount !== 2 || africa.knownRepresentedPopulation !== 170000) {
  throw new Error("V3 Phase 7 region aggregation failed to preserve country/source totals.");
}
if (atlasRegionForCountry(africaFeature)?.name !== "Africa") throw new Error("V3 Phase 7 Natural Earth region identity failed.");

const router = await read("src/app/router.ts");
for (const marker of ['| "regions"', '"/regions": "regions"', 'path.match(/^\\/regions\\/([a-z0-9-]+)$/i)', "regionSlug"]) requireText(router, marker, "region route");

const app = await read("src/app/App.tsx");
for (const marker of ["RegionPage", "RegionsPage", 'case "regions"']) requireText(app, marker, "region route rendering");

const regionsPage = await read("src/pages/RegionsPage.tsx");
for (const marker of ["Explore by region.", "buildAtlasRegions", "Natural Earth", "data-v3-region-grid"]) requireText(regionsPage, marker, "region index");
if (regionsPage.includes("../providers/peoplegroups")) throw new Error("V3 Phase 7 region index imports provider modules directly.");

const regionPage = await read("src/pages/RegionPage.tsx");
for (const marker of ["Continue into a country", "v3-region-summary", "data-v3-region-country-grid", "formatLiveMissionLayerValue"]) requireText(regionPage, marker, "region detail");
if (regionPage.includes("../providers/peoplegroups")) throw new Error("V3 Phase 7 region detail imports provider modules directly.");

const countriesPage = await read("src/pages/CountriesPage.tsx");
for (const marker of ["World → Region → Country", "Choose a part of the world", "v3-country-region-strip", 'hrefFor(`/regions/${region.id}`)']) requireText(countriesPage, marker, "country index hierarchy");
if (countriesPage.includes("../providers/peoplegroups")) throw new Error("V3 Phase 7 country index imports provider modules directly.");

const countryPage = await read("src/pages/CountryPage.tsx");
for (const marker of ["v3-country-page", "atlasRegionForCountry", 'hrefFor(`/regions/${region.id}`)', "Country → People", "ATLAS_COUNTRY_SOURCE"]) requireText(countryPage, marker, "country detail hierarchy");
if (countryPage.includes("../providers/peoplegroups")) throw new Error("V3 Phase 7 country detail imports provider modules directly.");

const countryBoundary = await read("src/countries/live.ts");
for (const marker of ["useAtlasCountryExplorer", "AtlasCountryRuntimeRecord", "ATLAS_COUNTRY_SOURCE", "Transitional product-facing country boundary"]) requireText(countryBoundary, marker, "country source boundary");

const main = await read("src/main.tsx");
const geographyImport = 'import "./styles/atlas-foundation/geography.css";';
const accessibilityImport = 'import "./styles/foundation/accessibility.css";';
requireText(main, geographyImport, "geography stylesheet import");
if (main.indexOf(geographyImport) > main.indexOf(accessibilityImport)) throw new Error("V3 Phase 7 geography styles must load before accessibility.");

const phase4 = await read("scripts/v3/phase4-check.ts");
for (const page of ["RegionsPage.tsx", "RegionPage.tsx", "CountriesPage.tsx", "CountryPage.tsx"]) requireText(phase4, `\"${page}\"`, "Phase 4 migration allowlist");

const browser = await read("tests/e2e/v3-phase7-regions-countries.spec.ts");
for (const marker of ["country directory starts with regions", "region route continues into countries", "country breadcrumb is World Region Country", "country continues into people", "geographic hierarchy stays usable on mobile"]) requireText(browser, marker, "Phase 7 browser certification");

const docs = await read("docs/V3_PHASE7_REGIONS_COUNTRIES.md");
for (const marker of ["World → Region → Country → People", "Natural Earth continent", "PeopleGroups region/subregion labels", "Phase 8 — Definitive People Profile"]) requireText(docs, marker, "Phase 7 documentation");

const pkg = await read("package.json");
requireText(pkg, '"v3:phase7-check": "tsx scripts/v3/phase7-check.ts"', "Phase 7 package script");
requireText(pkg, "npm run v3:phase6-check && npm run v3:phase7-check", "blocking Phase 7 build integration");

console.log("V3 Phase 7 geographic hierarchy checks passed: Natural Earth region identity, World → Region → Country → People navigation, source-scoped mission summaries, country source boundary, V3 geographic surfaces, and mobile/browser acceptance are enforced.");
