import type { Feature, FeatureCollection } from "geojson";

import type { MapCountryProperties, WorldGeography } from "../map/types";
import { fillForLayer, formatLayerValue, layerHasData } from "./layers";
import type { CountryMissionSummary, MissionLayerId, MissionVisualizationDataset } from "./types";

export interface MissionMapProperties extends MapCountryProperties {
  missionIso3: string | null;
  missionHasData: boolean;
  missionFill: string;
  missionValueLabel: string;
}

export type MissionMapFeature = Feature<WorldGeography["features"][number]["geometry"], MissionMapProperties>;
export type MissionMapGeography = FeatureCollection<WorldGeography["features"][number]["geometry"], MissionMapProperties> & Pick<WorldGeography, "unreachedMetadata">;

export function indexCountrySummaries(dataset: MissionVisualizationDataset | null): Map<string, CountryMissionSummary> {
  return new Map((dataset?.countries ?? []).map((summary) => [summary.iso3, summary]));
}

export function summaryForMapProperties(properties: MapCountryProperties, index: Map<string, CountryMissionSummary>): CountryMissionSummary | null {
  const candidates = [properties.iso3, properties.adminA3].filter((value): value is string => value !== null);
  for (const candidate of candidates) {
    const summary = index.get(candidate);
    if (summary) return summary;
  }
  return null;
}

export function buildMissionMapGeography(geography: WorldGeography, dataset: MissionVisualizationDataset | null, layer: MissionLayerId): MissionMapGeography {
  const index = indexCountrySummaries(dataset);
  return {
    type: "FeatureCollection",
    unreachedMetadata: geography.unreachedMetadata,
    features: geography.features.map((feature): MissionMapFeature => {
      const summary = summaryForMapProperties(feature.properties, index);
      return {
        type: "Feature",
        id: feature.id,
        geometry: feature.geometry,
        properties: {
          ...feature.properties,
          missionIso3: summary?.iso3 ?? null,
          missionHasData: layerHasData(summary, layer),
          missionFill: fillForLayer(summary, layer),
          missionValueLabel: formatLayerValue(summary, layer),
        },
      };
    }),
  };
}
