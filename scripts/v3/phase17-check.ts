import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

import { buildPeopleGeographicIntelligence } from "../../src/geography/intelligence";
import type { MapCountryFeature } from "../../src/map/types";
import {
  buildRuntimePeopleEntities,
  type PeopleGroupsApiRecord,
} from "../../src/providers/peoplegroups";
import { sourceRegistrySchema } from "../data/source-policy";

const root = process.cwd();
const read = (path: string) => readFile(resolve(root, path), "utf8");

function requireText(source: string, marker: string, label: string): void {
  if (!source.includes(marker)) throw new Error("V3 Phase 17: missing " + label + ": " + marker);
}

async function filesUnder(path: string): Promise<string[]> {
  const entries = await readdir(resolve(root, path), { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const child = path + "/" + entry.name;
    return entry.isDirectory() ? filesUnder(child) : [child];
  }));
  return nested.flat();
}

function countryFeature(iso3: string, name: string, continent: string): MapCountryFeature {
  return {
    type: "Feature",
    id: iso3,
    properties: {
      mapKey: iso3,
      iso3,
      adminA3: iso3,
      name,
      type: "Sovereign country",
      boundaryNote: null,
      sovereignty: name,
      continent,
    },
    geometry: {
      type: "Polygon",
      coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]],
    },
  };
}

const records: PeopleGroupsApiRecord[] = [
  {
    PEID: 970001,
    PGID: "PG970001",
    NmDisp: "Geo Test People",
    ISOalpha3: "BEN",
    Ctry: "Benin",
    Regn: "Africa",
    RegnSub: "Western Africa",
    Pop: 120000,
    ROL: "fon",
    Lang: "Fon",
    LangFamily: "Niger-Congo",
    GSEC: 2,
    PplNm: "Geo Test People",
    PplClstr: "Geo Cluster",
    Affbloc: "Geo Affinity",
    UpdatedDate: "2026-09-20T00:00:00.000Z",
  },
  {
    PEID: 970002,
    PGID: "PG970002",
    NmDisp: "Geo Related People",
    ISOalpha3: "NGA",
    Ctry: "Nigeria",
    Regn: "Africa",
    RegnSub: "Western Africa",
    Pop: null,
    ROL: "fon",
    Lang: "Fon",
    LangFamily: "Niger-Congo",
    GSEC: 5,
    PplNm: "  geo   test people  ",
    PplClstr: "Geo Cluster",
    Affbloc: "Geo Affinity",
    UpdatedDate: "2026-09-20T00:00:00.000Z",
  },
  {
    PEID: 970003,
    PGID: "PG970003",
    NmDisp: "Cluster Only People",
    ISOalpha3: "GHA",
    Ctry: "Ghana",
    Regn: "Africa",
    RegnSub: "Western Africa",
    Pop: 50000,
    ROL: "ewe",
    Lang: "Ewe",
    LangFamily: "Niger-Congo",
    GSEC: 2,
    PplNm: "Different ROP3 People",
    PplClstr: "Geo Cluster",
    Affbloc: "Geo Affinity",
    UpdatedDate: "2026-09-20T00:00:00.000Z",
  },
];

const entities = buildRuntimePeopleEntities(records);
const subject = entities.find((item) => item.peid === 970001);
if (!subject) throw new Error("Phase 17 synthetic subject missing.");

const geography = new Map<string, MapCountryFeature>([
  ["BEN", countryFeature("BEN", "Benin", "Africa")],
  ["NGA", countryFeature("NGA", "Nigeria", "Africa")],
  ["GHA", countryFeature("GHA", "Ghana", "Africa")],
]);

const intelligence = buildPeopleGeographicIntelligence(subject, entities, geography);

if (intelligence.records.length !== 2) {
  throw new Error("Phase 17 distribution must contain current PGID plus exact ROP3 matches only.");
}
if (!intelligence.records.some((item) => item.pgid === "PG970001" && item.evidence === "current-pgid")) {
  throw new Error("Phase 17 current PGID must remain direct geographic evidence.");
}
if (!intelligence.records.some((item) => item.pgid === "PG970002" && item.evidence === "same-rop3-taxonomy")) {
  throw new Error("Phase 17 normalized exact ROP3 cross-country match was not retained.");
}
if (intelligence.records.some((item) => item.pgid === "PG970003")) {
  throw new Error("Phase 17 must not convert cluster/affinity-only matches into distribution evidence.");
}
if (intelligence.countries.map((item) => item.iso3).sort().join(",") !== "BEN,NGA") {
  throw new Error("Phase 17 country aggregation failed.");
}
if (intelligence.regions.length !== 1 || intelligence.regions[0]?.name !== "Africa" || intelligence.regions[0]?.countryCount !== 2) {
  throw new Error("Phase 17 Natural Earth continent grouping failed.");
}
if (intelligence.knownPopulation !== 120000 || intelligence.populationKnownRecordCount !== 1 || intelligence.populationCoverageComplete) {
  throw new Error("Phase 17 partial population coverage semantics failed.");
}
if (intelligence.distributionEvidence !== "cross-country-source-taxonomy") {
  throw new Error("Phase 17 cross-country source-taxonomy evidence state failed.");
}
if (intelligence.diasporaStatus !== "not-established") {
  throw new Error("Phase 17 must not infer diaspora status from ROP3 distribution.");
}

const currentOnly = buildPeopleGeographicIntelligence(subject, [subject], geography);
if (currentOnly.records.length !== 1 || currentOnly.countries.length !== 1 || currentOnly.distributionEvidence !== "current-country-only") {
  throw new Error("Phase 17 current-country-only fallback failed.");
}
if (currentOnly.diasporaStatus !== "not-established") {
  throw new Error("Phase 17 diaspora must remain not-established even with only the focal PGID.");
}

for (const path of [
  "src/geography/intelligence.ts",
  "src/components/AdvancedGeographicIntelligencePanel.tsx",
  "src/styles/people/geographic-intelligence.css",
  "docs/V3_PHASE17_ADVANCED_GEOGRAPHIC_INTELLIGENCE.md",
  "tests/e2e/v3-phase17-geographic-intelligence.spec.ts",
  ".github/workflows/v3-phase17-advanced-geographic-intelligence.yml",
]) {
  if (!existsSync(resolve(root, path))) throw new Error("V3 Phase 17 required file is missing: " + path);
}

const model = await read("src/geography/intelligence.ts");
for (const marker of [
  '"same-rop3-taxonomy"',
  'distributionEvidence: "current-country-only" | "cross-country-source-taxonomy"',
  'diasporaStatus: "not-established"',
  "exact same normalized ROP3 people-name field",
  "country-context",
]) requireText(model, marker, "geographic intelligence model");

for (const forbidden of [
  "peopleCluster",
  "affinityBloc",
  "coordinates",
  "latitude",
  "longitude",
  "migrationRoute",
  "cityPopulation",
  "diasporaPopulation",
]) {
  if (model.includes(forbidden)) throw new Error("Phase 17 model contains forbidden precision/inference surface: " + forbidden);
}

const panel = await read("src/components/AdvancedGeographicIntelligencePanel.tsx");
for (const marker of [
  "Advanced geographic intelligence",
  "Country-level evidence, not a diaspora map.",
  "Load wider source distribution",
  "No cross-country ROP3 match is present in the current corpus.",
  "Diaspora evidence",
  "Not established",
  "data-phase17-geographic-intelligence",
]) requireText(panel, marker, "geographic intelligence UI");
if (panel.includes("Phase 17")) throw new Error("Public geographic UI must not expose roadmap numbering.");

const page = await read("src/pages/PeoplePage.tsx");
requireText(page, "<AdvancedGeographicIntelligencePanel record={record} countriesByIso3={geography.countriesByIso3} />", "people-profile geographic integration");

const main = await read("src/main.tsx");
requireText(main, 'import "./styles/people/geographic-intelligence.css";', "geographic intelligence stylesheet import");

const about = await read("src/pages/AboutPage.tsx");
for (const marker of [
  "Source-linked distribution",
  "Distribution is not diaspora.",
  "exact ROP3",
  "migration routes",
]) requireText(about, marker, "public geographic methodology disclosure");

const docs = await read("docs/V3_PHASE17_ADVANCED_GEOGRAPHIC_INTELLIGENCE.md");
for (const marker of [
  "Gate D",
  "Diaspora evidence: not established",
  "same ROP3",
  "country-context precision",
  "Load wider source distribution",
]) requireText(docs, marker, "Phase 17 documentation");

const legal = await read("docs/DATA_AND_LEGAL_POLICY.md");
for (const marker of [
  "Phase 17 advanced geographic intelligence",
  "COUNTRY-CONTEXT SOURCE EVIDENCE ONLY",
  "same cluster or same affinity bloc",
  "diaspora claim",
]) requireText(legal, marker, "Phase 17 legal policy");

const registry = sourceRegistrySchema.parse(JSON.parse(await read("data/source-registry.json")) as unknown);
const peopleGroups = registry.sources.find((source) => source.id === "peoplegroups-org-api");
const naturalEarth = registry.sources.find((source) => source.id === "natural-earth");
if (!peopleGroups?.runtimeReadAllowed || peopleGroups.browserRedistributionAllowed) {
  throw new Error("Phase 17 must preserve PeopleGroups runtime-read/static-redistribution boundary.");
}
if (!naturalEarth?.publicReleaseAllowed || !naturalEarth.browserRedistributionAllowed) {
  throw new Error("Phase 17 Natural Earth geographic grouping requires the existing public-domain approval.");
}
if (registry.sources.some((source) => source.contentTypes.some((type) => type.toLowerCase().includes("diaspora")))) {
  throw new Error("Phase 17 must not silently add an uncertified diaspora provider/source type.");
}

for (const directory of ["src/sync", "worker/src"]) {
  const files = await filesUnder(directory);
  for (const path of files.filter((item) => /\.(ts|tsx)$/.test(item))) {
    const source = await read(path);
    if (source.includes("advanced-geographic-intelligence") || source.includes("PeopleGeographicIntelligence")) {
      throw new Error("Phase 17 geographic intelligence must not enter persistence/sync boundary: " + path);
    }
  }
}

const pkg = await read("package.json");
requireText(pkg, '"v3:phase17-check": "tsx scripts/v3/phase17-check.ts"', "Phase 17 package gate");
requireText(pkg, "npm run v3:phase16-check && npm run v3:phase17-check", "blocking Phase 17 build integration");
requireText(pkg, '"v3:phase17-visual": "playwright test tests/e2e/v3-phase17-geographic-intelligence.spec.ts --project=chromium --project=mobile-chromium --workers=1"', "Phase 17 visual gate");

console.log("V3 Phase 17 Advanced Geographic Intelligence checks passed: current PGID evidence is preserved, exact normalized ROP3 matches alone form cross-country distribution, cluster/affinity-only records are excluded, Natural Earth supplies continent grouping only, population coverage remains explicit, diaspora remains not-established, and no city/migration/point precision or persistence surface is introduced.");
