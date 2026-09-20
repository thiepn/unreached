import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

import {
  buildGuidedRegionAtlas,
  guidedJourneyPath,
  parseGuidedJourney,
} from "../../src/guided-atlas/model";
import type { AtlasRegionSummary } from "../../src/geography/regions";
import type { MapCountryFeature } from "../../src/map/types";
import {
  buildRuntimePeopleEntities,
  type PeopleGroupsApiRecord,
} from "../../src/providers/peoplegroups";
import type { LiveMissionCountrySummary } from "../../src/visualization/liveTypes";

const root = process.cwd();
const read = (path: string) => readFile(resolve(root, path), "utf8");

function requireText(source: string, marker: string, label: string): void {
  if (!source.includes(marker)) throw new Error("V3 Phase 18: missing " + label + ": " + marker);
}

async function filesUnder(path: string): Promise<string[]> {
  const entries = await readdir(resolve(root, path), { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const child = path + "/" + entry.name;
    return entry.isDirectory() ? filesUnder(child) : [child];
  }));
  return nested.flat();
}

function countryFeature(iso3: string, name: string): MapCountryFeature {
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
      continent: "Africa",
    },
    geometry: {
      type: "Polygon",
      coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]],
    },
  };
}

function missionSummary(iso3: string, name: string, peopleContextCount = 1): LiveMissionCountrySummary {
  return {
    iso3,
    name,
    peopleContextCount,
    unreachedContextCount: peopleContextCount,
    otherContextCount: 0,
    unknownContextCount: 0,
    gsecKnownContextCount: peopleContextCount,
    populationKnownContextCount: peopleContextCount,
    knownPopulation: peopleContextCount * 100000,
    gsecKnownPopulation: peopleContextCount * 100000,
    unreachedKnownPopulation: peopleContextCount * 100000,
    unreachedPopulationShare: 100,
    unreachedContextShare: 100,
    gsecCoverage: 100,
    gsecPopulationCoverage: 100,
    populationCoverage: 100,
    sourceUpdatedAt: "2026-09-20T00:00:00.000Z",
    denominator: "people-group-in-country records returned by PeopleGroups.org",
    methodologyVersion: "u12d-imb-gsec-map-v1",
  };
}

const countryFixtures = [
  ["BEN", "Benin"],
  ["CMR", "Cameroon"],
  ["ETH", "Ethiopia"],
  ["GHA", "Ghana"],
  ["KEN", "Kenya"],
  ["NGA", "Nigeria"],
  ["SDN", "Sudan"],
  ["TZA", "Tanzania"],
] as const;

const region: AtlasRegionSummary = {
  id: "africa",
  name: "Africa",
  countries: countryFixtures.map(([iso3, name]) => countryFeature(iso3, name)),
  countryCount: countryFixtures.length,
  missionCountryCount: countryFixtures.length,
  peopleContextCount: 9,
  unreachedContextCount: 9,
  knownRepresentedPopulation: 900000,
  unreachedKnownPopulation: 900000,
};

const records: PeopleGroupsApiRecord[] = [
  ...countryFixtures.map(([iso3, name], index) => ({
    PEID: 980001 + index,
    PGID: "PG" + (980001 + index),
    NmDisp: name + " Guide People",
    ISOalpha3: iso3,
    Ctry: name,
    Pop: 100000,
    ROL: "fon",
    Lang: "Guide Language",
    LangFamily: "Guide Family",
    GSEC: 2,
    GSECbrf: "Initial Church Planting",
    PplNm: name + " Guide People",
    UpdatedDate: "2026-09-20T00:00:00.000Z",
  })),
  {
    PEID: 980099,
    PGID: "PG980099",
    NmDisp: "Aardvark Source Profile",
    ISOalpha3: "BEN",
    Ctry: "Benin",
    Pop: 90000,
    ROL: "fon",
    Lang: "Guide Language",
    LangFamily: "Guide Family",
    GSEC: 2,
    GSECbrf: "Initial Church Planting",
    PplNm: "Aardvark Source Profile",
    UpdatedDate: "2026-09-20T00:00:00.000Z",
  },
];

const peoples = buildRuntimePeopleEntities(records);
const reviewedBeninPeid = 980001;
const missionByIso3 = new Map<string, LiveMissionCountrySummary>(
  countryFixtures.map(([iso3, name]) => [iso3, missionSummary(iso3, name)]),
);

const guide = buildGuidedRegionAtlas({
  region,
  missionByIso3,
  peoples,
  reviewedPeids: new Set([reviewedBeninPeid]),
  pathwayLimit: 6,
});

if (guide.pathways.length !== 6) {
  throw new Error("Phase 18 must cap the synthetic regional guide at six pathways.");
}
if (guide.pathways[0]?.countryName !== "Benin" || guide.pathways[0]?.sourcePeopleId !== reviewedBeninPeid) {
  throw new Error("Phase 18 must prefer the reviewed profile inside a selected country without treating it as mission priority.");
}
if (!guide.pathways.every((pathway) => pathway.steps.map((step) => step.id).join(",") === "region,country,people,prayer")) {
  throw new Error("Phase 18 pathway sequence must remain Region → Country → People → Prayer.");
}
if (!guide.pathways.every((pathway) => pathway.steps[1]?.href.includes("journey=africa") && pathway.steps[1]?.href.includes("focus=" + pathway.sourcePeopleId))) {
  throw new Error("Phase 18 country links must carry URL-only journey state.");
}
if (!guide.essay.paragraphs.some((paragraph) => paragraph.includes("not a regional census population"))) {
  throw new Error("Phase 18 regional essay must preserve population-denominator limits.");
}
if (!guide.selectionMethod.includes("not mission-priority ranking")) {
  throw new Error("Phase 18 selection method must explicitly reject mission-priority interpretation.");
}

const secondGuide = buildGuidedRegionAtlas({
  region,
  missionByIso3,
  peoples,
  reviewedPeids: new Set([reviewedBeninPeid]),
  pathwayLimit: 6,
});
if (JSON.stringify(guide.pathways) !== JSON.stringify(secondGuide.pathways)) {
  throw new Error("Phase 18 pathway selection must be deterministic.");
}

const encoded = guidedJourneyPath("/countries/BEN", "africa", 980001);
if (encoded !== "/countries/BEN?journey=africa&focus=980001") {
  throw new Error("Phase 18 guided journey URL encoding changed unexpectedly: " + encoded);
}
const parsed = parseGuidedJourney(new URLSearchParams("journey=africa&focus=980001"));
if (!parsed || parsed.regionId !== "africa" || parsed.focusPeid !== 980001) {
  throw new Error("Phase 18 guided journey URL parsing failed.");
}
for (const invalid of [
  new URLSearchParams("journey=&focus=980001"),
  new URLSearchParams("journey=Africa!&focus=980001"),
  new URLSearchParams("journey=africa&focus=0"),
  new URLSearchParams("journey=africa&focus=not-a-number"),
]) {
  if (parseGuidedJourney(invalid) !== null) throw new Error("Phase 18 invalid guided journey state must fail closed.");
}

for (const path of [
  "src/guided-atlas/model.ts",
  "src/components/GuidedRegionAtlasPanel.tsx",
  "src/components/GuidedJourneyBanner.tsx",
  "src/styles/guided-atlas.css",
  "docs/V3_PHASE18_GUIDED_MISSION_ATLAS.md",
  "tests/e2e/v3-phase18-guided-atlas.spec.ts",
  ".github/workflows/v3-phase18-guided-mission-atlas.yml",
]) {
  if (!existsSync(resolve(root, path))) throw new Error("V3 Phase 18 required file is missing: " + path);
}

const model = await read("src/guided-atlas/model.ts");
for (const marker of [
  "Region → Country → People → Prayer",
  "reviewed editorial profile is preferred for learning depth",
  "This is not mission-priority ranking",
  "journey",
  "focus",
]) requireText(model, marker, "guided atlas model");
for (const forbidden of ["localStorage", "sessionStorage", "indexedDB", "priorityScore", "urgencyScore", "missionScore"]) {
  if (model.includes(forbidden)) throw new Error("Phase 18 model contains forbidden progress/ranking mechanism: " + forbidden);
}

const regionPanel = await read("src/components/GuidedRegionAtlasPanel.tsx");
for (const marker of [
  "Guided mission atlas",
  "Region → Country → People → Prayer",
  "not mission ranking",
  "How pathways are selected",
  "data-phase18-guided-atlas",
]) requireText(regionPanel, marker, "guided region UI");
if (regionPanel.includes("Phase 18")) throw new Error("Public guided atlas UI must not expose roadmap numbering.");

const banner = await read("src/components/GuidedJourneyBanner.tsx");
for (const marker of [
  "Guided mission atlas · Step",
  "Journey progress",
  "Previous step",
  "data-guided-journey-step",
]) requireText(banner, marker, "guided journey banner");

const regionPage = await read("src/pages/RegionPage.tsx");
requireText(regionPage, "<GuidedRegionAtlasPanel", "region guide integration");

const countryPage = await read("src/pages/CountryPage.tsx");
for (const marker of ["parseGuidedJourney(readHashSearchParams())", "guidedPeople", 'step="country"']) requireText(countryPage, marker, "country journey validation");

const peoplePage = await read("src/pages/PeoplePage.tsx");
for (const marker of ["parseGuidedJourney(readHashSearchParams())", "journey.focusPeid === record.peid", 'step="people"']) requireText(peoplePage, marker, "people journey validation");

const prayerPage = await read("src/pages/PrayerFocusPage.tsx");
for (const marker of ["journey.focusPeid === sourcePeopleId", "journeyRegion?.id === journey.regionId", 'step="prayer"']) requireText(prayerPage, marker, "prayer journey validation");

const about = await read("src/pages/AboutPage.tsx");
for (const marker of [
  "Guided mission atlas",
  "Guides teach; they do not rank.",
  "teaching depth only",
]) requireText(about, marker, "public guided-atlas methodology disclosure");

const docs = await read("docs/V3_PHASE18_GUIDED_MISSION_ATLAS.md");
for (const marker of [
  "Gate D",
  "Region → Country → People → Prayer",
  "teaching-depth criterion",
  "URL-only journey state",
  "unsourced cultural essays",
]) requireText(docs, marker, "Phase 18 documentation");

const legal = await read("docs/DATA_AND_LEGAL_POLICY.md");
for (const marker of [
  "Phase 18 guided mission atlas",
  "SOURCE-GROUNDED LEARNING LAYER ONLY",
  "mission-priority signal",
  "URL-only journey state",
]) requireText(legal, marker, "Phase 18 legal policy");

for (const directory of ["src/sync", "worker/src"]) {
  const files = await filesUnder(directory);
  for (const path of files.filter((item) => /\.(ts|tsx)$/.test(item))) {
    const source = await read(path);
    if (source.includes("guided-atlas") || source.includes("GuidedJourneyState") || source.includes("guidedJourney")) {
      throw new Error("Phase 18 guided journey must not enter persistence/sync/server boundary: " + path);
    }
  }
}

const guidedSourceFiles = [
  await read("src/guided-atlas/model.ts"),
  await read("src/components/GuidedJourneyBanner.tsx"),
  await read("src/components/GuidedRegionAtlasPanel.tsx"),
].join("\n");
for (const forbidden of ["localStorage", "sessionStorage", "indexedDB", "fetch(", "analytics", "telemetry"]) {
  if (guidedSourceFiles.includes(forbidden)) throw new Error("Phase 18 guided source layer contains forbidden persistence/network/telemetry mechanism: " + forbidden);
}

const pkg = await read("package.json");
requireText(pkg, '"v3:phase18-check": "tsx scripts/v3/phase18-check.ts"', "Phase 18 package gate");
requireText(pkg, "npm run v3:phase17-check && npm run v3:phase18-check", "blocking Phase 18 build integration");
requireText(pkg, '"v3:phase18-visual": "playwright test tests/e2e/v3-phase18-guided-atlas.spec.ts --project=chromium --project=mobile-chromium --workers=1"', "Phase 18 visual gate");

console.log("V3 Phase 18 Guided Mission Atlas checks passed: regional prose is source-derived, pathways are deterministic and non-ranking, reviewed coverage affects teaching depth only, URL journey state validates across Country → People → Prayer, and no guide progress enters persistence, sync, server storage, analytics or telemetry.");
