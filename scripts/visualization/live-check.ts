import assert from "node:assert/strict";

import type { WorldGeography } from "../../src/map/types.js";
import { buildRuntimeCountrySummaries, toRuntimePeopleContext } from "../../src/providers/peoplegroups/model.js";
import type { PeopleGroupsApiRecord } from "../../src/providers/peoplegroups/types.js";
import { buildVisibleCountryRecords } from "../../src/providers/peoplegroups/visible.js";
import { buildLiveMissionCountrySummaries } from "../../src/visualization/live.js";
import { LIVE_MISSION_LAYERS, LIVE_MISSION_NO_DATA_COLOR, fillForLiveMissionLayer, formatLiveMissionLayerValue } from "../../src/visualization/liveLayers.js";
import { buildLiveMissionMapGeography } from "../../src/visualization/liveMapJoin.js";

function record(overrides: Partial<PeopleGroupsApiRecord> = {}): PeopleGroupsApiRecord {
  return {
    PEID: 8101,
    PGID: "PG008101",
    NmDisp: "Map Example People",
    NmAlt: null,
    ISOalpha3: "BEN",
    Ctry: "Benin",
    Regn: "Africa",
    RegnSub: "Western Africa",
    Pop: 120000,
    Latitude: 9,
    Longitude: 2,
    ROL: "fon",
    Lang: "Fon",
    LangFamily: "Niger-Congo",
    ROR: "R6",
    Rlgn: "Traditional Religion",
    RlgnDiv: "Traditional",
    EvngLvl: "Less than 2%",
    CongExst: "Yes",
    Plnting: "Active",
    EngStat: "Engaged",
    GSEC: 2,
    GSECbrf: "Initial Church Planting",
    GSEClng: "Synthetic GSEC description",
    SPI: 1,
    SPIdesc: "Synthetic SPI",
    LPI: 1,
    LPIname: "Synthetic LPI",
    LPIdesc: "Synthetic LPI description",
    Affbloc: "Example Bloc",
    PplClstr: "Example Cluster",
    PplNm: "Map Example People",
    Ethne: "Example Ethne",
    Bible: "Available",
    Jesus: "Not Available",
    ResTot: 2,
    PeopleDesc: null,
    LocationDesc: null,
    UpdatedDate: "2026-08-22T00:00:00.000Z",
    ...overrides,
  };
}

const records = [
  record(),
  record({ PEID: 8102, PGID: "PG008102", NmDisp: "Second Map People", Pop: 50000, GSEC: 1 }),
  record({ PEID: 8103, PGID: "PG008103", NmDisp: "Nigeria Map People", ISOalpha3: "NGA", Ctry: "Nigeria", Pop: null, GSEC: 5 }),
];

const contexts = records.map(toRuntimePeopleContext);
const countries = buildVisibleCountryRecords(contexts, buildRuntimeCountrySummaries(records));
const summaries = buildLiveMissionCountrySummaries(countries);
const index = new Map(summaries.map((summary) => [summary.iso3, summary]));
const benin = index.get("BEN");
assert.ok(benin, "Benin live mission summary missing.");
assert.equal(benin.peopleContextCount, 2);
assert.equal(benin.unreachedContextCount, 2);
assert.equal(benin.otherContextCount, 0);
assert.equal(benin.unknownContextCount, 0);
assert.equal(benin.knownPopulation, 170000);
assert.equal(benin.gsecKnownPopulation, 170000);
assert.equal(benin.unreachedKnownPopulation, 170000);
assert.equal(benin.unreachedPopulationShare, 100);
assert.equal(benin.unreachedContextShare, 100);
assert.equal(benin.gsecCoverage, 100);
assert.equal(benin.gsecPopulationCoverage, 100);
assert.equal(benin.populationCoverage, 100);
assert.match(benin.denominator, /people-group-in-country/);

const nigeria = index.get("NGA");
assert.ok(nigeria, "Nigeria live mission summary missing.");
assert.equal(nigeria.unreachedContextShare, 0);
assert.equal(nigeria.unreachedPopulationShare, null, "No population denominator must remain no-data rather than becoming 0%. ");
assert.equal(nigeria.populationCoverage, 0);
assert.equal(nigeria.gsecCoverage, 100);

const fakeGeography: WorldGeography = {
  type: "FeatureCollection",
  unreachedMetadata: {
    sourceId: "natural-earth",
    sourceDataset: "synthetic-map-fixture",
    sourceVersion: "test",
    sourceUrl: "https://www.naturalearthdata.com/",
    boundaryPresentation: "de-facto",
  },
  features: [
    {
      type: "Feature",
      id: "BEN",
      properties: { mapKey: "BEN", iso3: "BEN", adminA3: "BEN", name: "Benin", type: "Sovereign country", boundaryNote: null, sovereignty: null, continent: "Africa" },
      geometry: { type: "Polygon", coordinates: [[[1, 6], [3, 6], [3, 12], [1, 12], [1, 6]]] },
    },
    {
      type: "Feature",
      id: "YYY",
      properties: { mapKey: "YYY", iso3: "YYY", adminA3: "YYY", name: "No-data area", type: "Synthetic test area", boundaryNote: null, sovereignty: null, continent: "Synthetic" },
      geometry: { type: "Polygon", coordinates: [[[4, 6], [5, 6], [5, 7], [4, 7], [4, 6]]] },
    },
  ],
};

for (const layer of LIVE_MISSION_LAYERS) {
  const mapped = buildLiveMissionMapGeography(fakeGeography, index, layer.id);
  const withData = mapped.features.find((feature) => feature.properties.mapKey === "BEN")!;
  const withoutData = mapped.features.find((feature) => feature.properties.mapKey === "YYY")!;
  assert.equal(withData.properties.missionHasData, true, `${layer.id} should have deterministic live data.`);
  assert.notEqual(withData.properties.missionFill, LIVE_MISSION_NO_DATA_COLOR, `${layer.id} should render a data color.`);
  assert.equal(withData.properties.missionFill, fillForLiveMissionLayer(benin, layer.id));
  assert.notEqual(formatLiveMissionLayerValue(benin, layer.id), "No data");
  assert.equal(withoutData.properties.missionHasData, false);
  assert.equal(withoutData.properties.missionFill, LIVE_MISSION_NO_DATA_COLOR);
}

const serialized = JSON.stringify({ summaries, layers: LIVE_MISSION_LAYERS });
for (const forbidden of ["frontier", "JPScale", "complete-bible", "evangelicalPercent"]) {
  assert.equal(serialized.includes(forbidden), false, `U12D live mission model must not leak legacy ${forbidden} semantics.`);
}

console.log(`U12D live mission visualization checks passed: ${summaries.length} countries, ${LIVE_MISSION_LAYERS.length} source-native layers, explicit coverage and no-data semantics.`);
