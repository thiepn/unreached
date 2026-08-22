import { readFile } from "node:fs/promises";

import { WORLD_MAP_OUTPUT } from "./config.js";

interface BrowserFeature {
  id?: unknown;
  properties?: { mapKey?: unknown; name?: unknown };
  geometry?: { type?: unknown; coordinates?: unknown };
}

interface BrowserCollection {
  type?: unknown;
  features?: unknown;
  unreachedMetadata?: { sourceId?: unknown; sourceVersion?: unknown; boundaryPresentation?: unknown };
}

function fail(message: string): never {
  throw new Error(`Geography validation failed: ${message}`);
}

async function main(): Promise<void> {
  const parsed = JSON.parse(await readFile(WORLD_MAP_OUTPUT, "utf8")) as BrowserCollection;
  if (parsed.type !== "FeatureCollection" || !Array.isArray(parsed.features)) fail("output is not a FeatureCollection");
  if (parsed.features.length < 170 || parsed.features.length > 300) fail(`unexpected feature count ${parsed.features.length}`);
  if (parsed.unreachedMetadata?.sourceId !== "natural-earth") fail("source metadata is missing");
  if (parsed.unreachedMetadata.sourceVersion !== "5.1.1") fail("source version is not pinned to 5.1.1");
  if (parsed.unreachedMetadata.boundaryPresentation !== "de-facto") fail("boundary presentation is not documented");

  const keys = new Set<string>();
  for (const [index, value] of parsed.features.entries()) {
    const feature = value as BrowserFeature;
    if (typeof feature.id !== "string") fail(`feature ${index} has no stable string id`);
    const mapKey = feature.properties?.mapKey;
    const name = feature.properties?.name;
    if (typeof mapKey !== "string" || !mapKey) fail(`feature ${index} has no mapKey`);
    if (typeof name !== "string" || !name) fail(`feature ${index} has no name`);
    if (keys.has(mapKey)) fail(`duplicate mapKey ${mapKey}`);
    keys.add(mapKey);
    if (feature.geometry?.type !== "Polygon" && feature.geometry?.type !== "MultiPolygon") fail(`feature ${mapKey} has unsupported geometry`);
    if (!Array.isArray(feature.geometry.coordinates)) fail(`feature ${mapKey} has no coordinates`);
  }

  console.log(`Validated ${parsed.features.length} compact Natural Earth map features.`);
}

await main();
