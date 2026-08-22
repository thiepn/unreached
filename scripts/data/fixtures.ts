import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { normalizedDatasetSchema, type NormalizedDataset } from "../../src/domain/index.js";
import { adaptLanguageRecord, adaptPgacRecord, adaptPgicRecord } from "./joshua/adapter.js";
import { sourceRegistrySchema, assertSourceUseAllowed, type SourceRegistry } from "./source-policy.js";

const fixtureSchema = z.object({
  fixture: z.literal(true),
  retrievedAt: z.string().min(1),
  pgic: z.array(z.unknown()).min(1),
  pgac: z.array(z.unknown()).min(1),
  languages: z.array(z.unknown()).min(1),
});

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8")) as unknown;
}

export async function loadSourceRegistry(root = process.cwd()): Promise<SourceRegistry> {
  return sourceRegistrySchema.parse(await readJson(resolve(root, "data/source-registry.json")));
}

export async function loadFixtureDataset(root = process.cwd()): Promise<{ dataset: NormalizedDataset; retrievedAt: string; sourceRecordCount: number }> {
  const registry = await loadSourceRegistry(root);
  assertSourceUseAllowed(registry, "joshua-project-api", "development-ingestion");
  const fixture = fixtureSchema.parse(await readJson(resolve(root, "data/fixtures/joshua.synthetic.json")));
  const context = { retrievedAt: fixture.retrievedAt };
  const bundles = fixture.pgic.map((row) => adaptPgicRecord(row, context));
  const unique = <T extends { id: string }>(items: Array<T | null>): T[] => [...new Map(items.filter((item): item is T => item !== null).map((item) => [item.id, item])).values()];

  const dataset = normalizedDatasetSchema.parse({
    schemaVersion: 1,
    fixture: true,
    regions: unique(bundles.map((item) => item.region)),
    religions: unique(bundles.map((item) => item.religion)),
    countries: unique(bundles.map((item) => item.country)),
    peopleGroups: fixture.pgac.map((row) => adaptPgacRecord(row, context)),
    peopleGroupsInCountries: bundles.map((item) => item.peopleGroupInCountry),
    languages: fixture.languages.map((row) => adaptLanguageRecord(row, context)),
  });

  return { dataset, retrievedAt: fixture.retrievedAt, sourceRecordCount: fixture.pgic.length + fixture.pgac.length + fixture.languages.length };
}
