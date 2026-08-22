import type { Feature, FeatureCollection } from "geojson";

import type { MapCountryProperties, WorldGeography } from "../map/types";
import {
  fillForLiveMissionLayer,
  formatLiveMissionLayerValue,
  liveLayerHasData,
} from "./liveLayers";
import type { LiveMissionCountrySummary, LiveMissionLayerId } from "./liveTypes";

export interface LiveMissionMapProperties extends MapCountryProperties {
  missionIso3: string | null;
  missionHasData: boolean;
  missionFill: string;
  missionValueLabel: string;
}

export type LiveMissionMapFeature = Feature<WorldGeography["features"][number]["geometry"], LiveMissionMapProperties>;
export type LiveMissionMapGeography = FeatureCollection<WorldGeography["features"][number]["geometry"], LiveMissionMapProperties> & Pick<WorldGeography, "unreachedMetadata">;

export function liveMissionSummaryForMapProperties(
  properties: MapCountryProperties,
  index: Map<string, LiveMissionCountrySummary>,
): LiveMissionCountrySummary | null {
  const candidates = [properties.iso3, properties.adminA3].filter((value): value is string => value !== null);
  for (const candidate of candidates) {
    const summary = index.get(candidate);
    if (summary) return summary;
  }
  return null;
}

export function buildLiveMissionMapGeography(
  geography: WorldGeography,
  index: Map<string, LiveMissionCountrySummary>,
  layer: LiveMissionLayerId,
): LiveMissionMapGeography {
  return {
    type: "FeatureCollection",
    unreachedMetadata: geography.unreachedMetadata,
    features: geography.features.map((feature): LiveMissionMapFeature => {
      const summary = liveMissionSummaryForMapProperties(feature.properties, index);
      return {
        type: "Feature",
        id: feature.id,
        geometry: feature.geometry,
        properties: {
          ...feature.properties,
          missionIso3: summary?.iso3 ?? null,
          missionHasData: liveLayerHasData(summary, layer),
          missionFill: fillForLiveMissionLayer(summary, layer),
          missionValueLabel: formatLiveMissionLayerValue(summary, layer),
        },
      };
    }),
  };
}
