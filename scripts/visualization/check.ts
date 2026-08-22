import assert from "node:assert/strict";

import type { WorldGeography } from "../../src/map/types.js";
import { buildMissionVisualizationDataset } from "../../src/visualization/aggregate.js";
import { MISSION_LAYERS, NO_DATA_COLOR, fillForLayer, formatLayerValue } from "../../src/visualization/layers.js";
import { buildMissionMapGeography, indexCountrySummaries } from "../../src/visualization/mapJoin.js";
import { missionVisualizationDatasetSchema } from "../../src/visualization/types.js";
import { loadFixtureDataset } from "../data/fixtures.js";

const { dataset, retrievedAt } = await loadFixtureDataset();
const visualization = buildMissionVisualizationDataset(dataset, retrievedAt);
missionVisualizationDatasetSchema.parse(visualization);

assert.equal(visualization.fixture, true, "Visualization fixture flag must survive aggregation.");
assert.equal(visualization.countries.length, 1, "Synthetic fixture should produce exactly one country summary.");

const summary = visualization.countries[0]!;
assert.equal(summary.iso3, "XZZ");
assert.equal(summary.peopleGroupCount, 1);
assert.equal(summary.unreachedGroupCount, 1);
assert.equal(summary.frontierGroupCount, 1);
assert.equal(summary.unreachedShare, 100);
assert.equal(summary.frontierShare, 100);
assert.equal(summary.evangelicalPercent, 0.1);
assert.equal(summary.primaryReligionName, "Islam");
assert.equal(summary.scriptureStatus, "portions");
assert.equal(summary.coverage.classification, 100);
assert.equal(summary.coverage.evangelical, 100);

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
      id: "XZZ",
      properties: {
        mapKey: "XZZ",
        iso3: "XZZ",
        adminA3: "XZZ",
        name: "Exampleland",
        type: "Synthetic test area",
        boundaryNote: null,
        sovereignty: null,
        continent: "Synthetic",
      },
      geometry: {
        type: "Polygon",
        coordinates: [[[69, 39], [71, 39], [71, 41], [69, 41], [69, 39]]],
      },
    },
    {
      type: "Feature",
      id: "YYY",
      properties: {
        mapKey: "YYY",
        iso3: "YYY",
        adminA3: "YYY",
        name: "No-data area",
        type: "Synthetic test area",
        boundaryNote: null,
        sovereignty: null,
        continent: "Synthetic",
      },
      geometry: {
        type: "Polygon",
        coordinates: [[[72, 39], [74, 39], [74, 41], [72, 41], [72, 39]]],
      },
    },
  ],
};

const index = indexCountrySummaries(visualization);
assert.equal(index.get("XZZ")?.countryId, "country:XZZ");

for (const layer of MISSION_LAYERS) {
  const mapped = buildMissionMapGeography(fakeGeography, visualization, layer.id);
  const withData = mapped.features.find((feature) => feature.properties.mapKey === "XZZ")!;
  const withoutData = mapped.features.find((feature) => feature.properties.mapKey === "YYY")!;
  assert.equal(withData.properties.missionHasData, true, `${layer.id} should have synthetic data.`);
  assert.notEqual(withData.properties.missionFill, NO_DATA_COLOR, `${layer.id} should have a data color.`);
  assert.notEqual(formatLayerValue(summary, layer.id), "No data", `${layer.id} should format a value.`);
  assert.equal(withData.properties.missionFill, fillForLayer(summary, layer.id));
  assert.equal(withoutData.properties.missionHasData, false, `${layer.id} should preserve missing-data state.`);
  assert.equal(withoutData.properties.missionFill, NO_DATA_COLOR, `${layer.id} missing data must use the neutral color.`);
}

console.log("Mission visualization checks passed: aggregation, coverage, all five layers, geography join, and no-data semantics.");
