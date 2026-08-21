import { mkdir, readFile, writeFile } from "node:fs/promises";

import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";

import { assertSourceUseAllowed, sourceRegistrySchema } from "../data/source-policy.js";
import {
  NATURAL_EARTH_DATASET,
  NATURAL_EARTH_URL,
  NATURAL_EARTH_VERSION,
  SOURCE_REGISTRY,
  WORLD_MAP_OUTPUT,
} from "./config.js";

type CountryGeometry = Polygon | MultiPolygon;

type RawProperties = Record<string, unknown>;

interface RawFeature {
  type?: unknown;
  properties?: RawProperties;
  geometry?: unknown;
}

interface RawFeatureCollection {
  type?: unknown;
  features?: unknown;
}

interface BrowserCountryProperties {
  mapKey: string;
  iso3: string | null;
  adminA3: string | null;
  name: string;
  type: string;
  boundaryNote: string | null;
  sovereignty: string | null;
  continent: string | null;
}

function text(properties: RawProperties, key: string): string | null {
  const value = properties[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed && trimmed !== "-99" ? trimmed : null;
}

function integer(properties: RawProperties, key: string): number | null {
  const value = properties[key];
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function iso3(value: string | null): string | null {
  return value && /^[A-Z]{3}$/.test(value) ? value : null;
}

function geometry(value: unknown): CountryGeometry {
  if (!value || typeof value !== "object") throw new Error("Natural Earth feature has no geometry object.");
  const candidate = value as { type?: unknown; coordinates?: unknown };
  if ((candidate.type !== "Polygon" && candidate.type !== "MultiPolygon") || !Array.isArray(candidate.coordinates)) {
    throw new Error(`Unsupported Natural Earth geometry: ${String(candidate.type)}`);
  }
  return candidate as CountryGeometry;
}

function parseRawCollection(value: unknown): RawFeature[] {
  if (!value || typeof value !== "object") throw new Error("Natural Earth response is not an object.");
  const collection = value as RawFeatureCollection;
  if (collection.type !== "FeatureCollection" || !Array.isArray(collection.features)) {
    throw new Error("Natural Earth response is not a GeoJSON FeatureCollection.");
  }
  return collection.features as RawFeature[];
}

async function assertPolicy(): Promise<void> {
  const rawRegistry = JSON.parse(await readFile(SOURCE_REGISTRY, "utf8")) as unknown;
  const registry = sourceRegistrySchema.parse(rawRegistry);
  assertSourceUseAllowed(registry, "natural-earth", "development-ingestion");
  assertSourceUseAllowed(registry, "natural-earth", "public-release");
  assertSourceUseAllowed(registry, "natural-earth", "browser-redistribution");
}

async function main(): Promise<void> {
  await assertPolicy();

  const response = await fetch(NATURAL_EARTH_URL, {
    headers: { "User-Agent": "Unreached-Map-Build/0.3" },
  });
  if (!response.ok) throw new Error(`Natural Earth download failed: ${response.status} ${response.statusText}`);

  const rawFeatures = parseRawCollection(JSON.parse(await response.text()) as unknown);
  const usedKeys = new Set<string>();

  const features: Array<Feature<CountryGeometry, BrowserCountryProperties>> = rawFeatures.map((raw, index) => {
    const properties = raw.properties;
    if (!properties || typeof properties !== "object") throw new Error(`Natural Earth feature ${index} has no properties.`);

    const featureGeometry = geometry(raw.geometry);
    const name = text(properties, "NAME_EN") ?? text(properties, "ADMIN") ?? text(properties, "NAME_LONG") ?? text(properties, "NAME");
    if (!name) throw new Error(`Natural Earth feature ${index} has no usable name.`);

    const standardIso3 = iso3(text(properties, "ISO_A3"));
    const adminA3 = iso3(text(properties, "ADM0_A3"));
    const neId = integer(properties, "NE_ID");
    let mapKey = standardIso3 ?? adminA3 ?? (neId !== null ? `NE-${neId}` : `NE-INDEX-${index}`);
    if (usedKeys.has(mapKey)) mapKey = `${mapKey}-${neId ?? index}`;
    usedKeys.add(mapKey);

    return {
      type: "Feature",
      id: mapKey,
      properties: {
        mapKey,
        iso3: standardIso3,
        adminA3,
        name,
        type: text(properties, "TYPE") ?? "Admin-0 area",
        boundaryNote: text(properties, "NOTE_BRK"),
        sovereignty: text(properties, "SOVEREIGNT"),
        continent: text(properties, "CONTINENT"),
      },
      geometry: featureGeometry,
    };
  });

  features.sort((a, b) => a.properties.name.localeCompare(b.properties.name, "en"));

  const output: FeatureCollection<CountryGeometry, BrowserCountryProperties> & {
    unreachedMetadata: {
      sourceId: string;
      sourceDataset: string;
      sourceVersion: string;
      sourceUrl: string;
      boundaryPresentation: string;
    };
  } = {
    type: "FeatureCollection",
    features,
    unreachedMetadata: {
      sourceId: "natural-earth",
      sourceDataset: NATURAL_EARTH_DATASET,
      sourceVersion: NATURAL_EARTH_VERSION,
      sourceUrl: NATURAL_EARTH_URL,
      boundaryPresentation: "de-facto",
    },
  };

  await mkdir(new URL("./", WORLD_MAP_OUTPUT), { recursive: true });
  await writeFile(WORLD_MAP_OUTPUT, `${JSON.stringify(output)}\n`, "utf8");
  console.log(`Built ${features.length} Natural Earth map features → public/maps/world-countries.geojson`);
}

await main();
