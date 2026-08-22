import { datasetManifestSchema, validateDatasetInvariants } from "../../src/domain/index.js";
import { buildChunks } from "./chunk.js";
import { loadFixtureDataset, loadSourceRegistry } from "./fixtures.js";
import { assertSourceUseAllowed } from "./source-policy.js";

function expectBlocked(action: () => void, label: string): void {
  let blocked = false;
  try { action(); } catch { blocked = true; }
  if (!blocked) throw new Error(`Expected source policy to block ${label}`);
}

const registry = await loadSourceRegistry();
assertSourceUseAllowed(registry, "joshua-project-api", "development-ingestion");
assertSourceUseAllowed(registry, "natural-earth", "public-release");
expectBlocked(() => assertSourceUseAllowed(registry, "joshua-project-api", "public-release"), "Joshua Project public release before permission");
expectBlocked(() => assertSourceUseAllowed(registry, "joshua-project-api", "browser-redistribution"), "Joshua Project browser redistribution before permission");
expectBlocked(() => assertSourceUseAllowed(registry, "progress-bible-registered-data", "development-ingestion"), "ProgressBible ingestion without permission");

const { dataset, retrievedAt, sourceRecordCount } = await loadFixtureDataset();
const issues = validateDatasetInvariants(dataset);
if (issues.length) throw new Error(`Dataset invariant failures:\n${issues.map((issue) => `- ${issue.code}: ${issue.message}`).join("\n")}`);

const first = buildChunks(dataset);
const second = buildChunks(dataset);
if (JSON.stringify(first.map(({ json: _json, ...item }) => item)) !== JSON.stringify(second.map(({ json: _json, ...item }) => item))) {
  throw new Error("Chunk generation is not deterministic");
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
  chunks: first.map(({ json: _json, ...chunk }) => chunk),
});

if (!manifest.fixture) throw new Error("Synthetic validation dataset must remain marked as fixture");
console.log(`U2 data checks passed: ${sourceRecordCount} synthetic source records -> ${first.length} deterministic chunks.`);
