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
assertSourceUseAllowed(registry, "peoplegroups-org-api", "development-ingestion");
assertSourceUseAllowed(registry, "peoplegroups-org-api", "runtime-read");
assertSourceUseAllowed(registry, "peoplegroups-org-api", "public-release");
assertSourceUseAllowed(registry, "joshua-project-api", "runtime-read");
assertSourceUseAllowed(registry, "joshua-project-api", "public-release");
assertSourceUseAllowed(registry, "natural-earth", "public-release");
expectBlocked(() => assertSourceUseAllowed(registry, "joshua-project-api", "browser-redistribution"), "Joshua Project browser/bulk redistribution");
expectBlocked(() => assertSourceUseAllowed(registry, "peoplegroups-org-api", "browser-redistribution"), "PeopleGroups.org static browser redistribution");
expectBlocked(() => assertSourceUseAllowed(registry, "progress-bible-registered-data", "development-ingestion"), "ProgressBible ingestion without permission");
expectBlocked(() => assertSourceUseAllowed(registry, "progress-bible-registered-data", "runtime-read"), "ProgressBible runtime reads without permission");

const joshua = registry.sources.find((source) => source.id === "joshua-project-api");
if (!joshua || joshua.termsReviewedAt !== "2026-09-17" || joshua.commercialUse !== false) {
  throw new Error("Joshua Project Phase 13 runtime approval must remain tied to the 2026-09-17 non-commercial policy review.");
}
if (!joshua.cacheStatus.includes("no-store") || !joshua.permissionGate?.includes("Gate D")) {
  throw new Error("Joshua Project Phase 13 runtime approval must retain no-store handling and the post-3.0 Gate D prerequisite.");
}

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
console.log(`Source-policy checks passed: PeopleGroups remains the canonical runtime, Phase 13 permits only the reviewed Joshua Project comparison path, browser redistribution remains blocked, and ${sourceRecordCount} synthetic records produce ${first.length} deterministic chunks.`);
