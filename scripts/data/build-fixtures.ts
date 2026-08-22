import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { datasetManifestSchema } from "../../src/domain/index.js";
import { buildChunks } from "./chunk.js";
import { loadFixtureDataset } from "./fixtures.js";

const outputRoot = resolve("data/generated-fixtures");
const { dataset, retrievedAt, sourceRecordCount } = await loadFixtureDataset();
const chunks = buildChunks(dataset);

await rm(outputRoot, { recursive: true, force: true });
for (const chunk of chunks) {
  const target = resolve(outputRoot, chunk.path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, chunk.json, "utf8");
}

const manifest = datasetManifestSchema.parse({
  schemaVersion: 1,
  datasetVersion: "fixture-u2-v1",
  generatedAt: retrievedAt,
  fixture: true,
  sources: [{ sourceId: "joshua-project-api", retrievedAt, recordCount: sourceRecordCount, fixture: true }],
  counts: {
    regions: dataset.regions.length,
    religions: dataset.religions.length,
    countries: dataset.countries.length,
    peopleGroups: dataset.peopleGroups.length,
    peopleGroupsInCountries: dataset.peopleGroupsInCountries.length,
    languages: dataset.languages.length,
  },
  chunks: chunks.map(({ json: _json, ...chunk }) => chunk),
});

await mkdir(outputRoot, { recursive: true });
await writeFile(resolve(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Wrote ${chunks.length} fixture chunks to ${outputRoot}`);
