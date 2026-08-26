import { useEffect, useState } from "preact/hooks";

import type { MapCountryFeature, MapCountryProperties, WorldGeography } from "./types";

export interface GeographyState {
  data: WorldGeography | null;
  error: string | null;
  loading: boolean;
  generation: number;
  countries: MapCountryFeature[];
  countriesByIso3: Map<string, MapCountryFeature>;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function parseProperties(value: unknown): MapCountryProperties {
  if (!value || typeof value !== "object") throw new Error("Map feature properties are missing.");
  const p = value as Record<string, unknown>;
  if (typeof p.mapKey !== "string" || !p.mapKey) throw new Error("Map feature mapKey is invalid.");
  if (typeof p.name !== "string" || !p.name) throw new Error("Map feature name is invalid.");
  if (typeof p.type !== "string" || !p.type) throw new Error("Map feature type is invalid.");
  if (!isNullableString(p.iso3) || !isNullableString(p.adminA3) || !isNullableString(p.boundaryNote) || !isNullableString(p.sovereignty) || !isNullableString(p.continent)) {
    throw new Error(`Map feature ${p.mapKey} contains invalid optional properties.`);
  }
  return {
    mapKey: p.mapKey,
    iso3: p.iso3,
    adminA3: p.adminA3,
    name: p.name,
    type: p.type,
    boundaryNote: p.boundaryNote,
    sovereignty: p.sovereignty,
    continent: p.continent,
  };
}

function parseGeography(value: unknown): WorldGeography {
  if (!value || typeof value !== "object") throw new Error("World geography is not an object.");
  const root = value as Record<string, unknown>;
  if (root.type !== "FeatureCollection" || !Array.isArray(root.features)) throw new Error("World geography is not a FeatureCollection.");

  const metadata = root.unreachedMetadata;
  if (!metadata || typeof metadata !== "object") throw new Error("World geography source metadata is missing.");
  const m = metadata as Record<string, unknown>;
  if (m.sourceId !== "natural-earth" || m.boundaryPresentation !== "de-facto" || typeof m.sourceDataset !== "string" || typeof m.sourceVersion !== "string" || typeof m.sourceUrl !== "string") {
    throw new Error("World geography source metadata is invalid.");
  }

  const features = root.features.map((value, index): MapCountryFeature => {
    if (!value || typeof value !== "object") throw new Error(`Map feature ${index} is invalid.`);
    const feature = value as Record<string, unknown>;
    if (feature.type !== "Feature" || typeof feature.id !== "string") throw new Error(`Map feature ${index} has no stable id.`);
    if (!feature.geometry || typeof feature.geometry !== "object") throw new Error(`Map feature ${index} has no geometry.`);
    const geometry = feature.geometry as { type?: unknown; coordinates?: unknown };
    if ((geometry.type !== "Polygon" && geometry.type !== "MultiPolygon") || !Array.isArray(geometry.coordinates)) {
      throw new Error(`Map feature ${index} has unsupported geometry.`);
    }
    return {
      type: "Feature",
      id: feature.id,
      properties: parseProperties(feature.properties),
      geometry: geometry as MapCountryFeature["geometry"],
    };
  });

  return {
    type: "FeatureCollection",
    features,
    unreachedMetadata: {
      sourceId: "natural-earth",
      sourceDataset: m.sourceDataset,
      sourceVersion: m.sourceVersion,
      sourceUrl: m.sourceUrl,
      boundaryPresentation: "de-facto",
    },
  };
}

const listeners = new Set<(value: GeographyState) => void>();
let snapshot: GeographyState = {
  data: null,
  error: null,
  loading: false,
  generation: 0,
  countries: [],
  countriesByIso3: new Map(),
};
let pendingLoad: Promise<void> | null = null;

function publish(next: GeographyState): void {
  snapshot = next;
  for (const listener of listeners) listener(snapshot);
}

export function getWorldGeographySnapshot(): GeographyState {
  return snapshot;
}

export function ensureWorldGeography(): Promise<void> {
  if (snapshot.data) return Promise.resolve();
  if (pendingLoad) return pendingLoad;

  publish({ ...snapshot, loading: true, error: null });
  const url = `${import.meta.env.BASE_URL}maps/world-countries.geojson`;
  pendingLoad = fetch(url, { cache: "no-cache" })
    .then((response) => {
      if (!response.ok) throw new Error(`Map data request failed (${response.status}).`);
      return response.json() as Promise<unknown>;
    })
    .then((value) => {
      const data = parseGeography(value);
      const countries = [...data.features].sort((a, b) => a.properties.name.localeCompare(b.properties.name, "en"));
      const countriesByIso3 = new Map<string, MapCountryFeature>();
      for (const feature of countries) {
        const rawIso = feature.properties.iso3 || feature.properties.adminA3;
        const iso3 = typeof rawIso === "string" ? rawIso.toUpperCase() : "";
        if (/^[A-Z]{3}$/.test(iso3) && !countriesByIso3.has(iso3)) countriesByIso3.set(iso3, feature);
      }
      publish({ data, error: null, loading: false, generation: snapshot.generation + 1, countries, countriesByIso3 });
    })
    .catch((error: unknown) => {
      publish({ ...snapshot, data: null, error: error instanceof Error ? error.message : "Map data could not be loaded.", loading: false });
    })
    .finally(() => {
      pendingLoad = null;
    });
  return pendingLoad;
}

export function useWorldGeography(enabled = true): GeographyState {
  const [state, setState] = useState<GeographyState>(() => snapshot);
  useEffect(() => {
    listeners.add(setState);
    setState(snapshot);
    if (enabled) void ensureWorldGeography();
    return () => {
      listeners.delete(setState);
    };
  }, [enabled]);
  return state;
}
