import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { PHASE12_REVIEWED_PROFILE_TARGET, loadPhase12EditorialCatalog } from "./phase12-content.js";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");

function versionAtLeast(value: string, minimum: [number, number, number]): boolean {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(value);
  if (!match) return false;
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);
  if (major !== minimum[0]) return major > minimum[0];
  if (minor !== minimum[1]) return minor > minimum[1];
  return patch >= minimum[2];
}

const catalog = await loadPhase12EditorialCatalog();
const pkg = JSON.parse(await readText("package.json")) as { dependencies?: Record<string, string>; scripts?: Record<string, string> };
const lock = JSON.parse(await readText("package-lock.json")) as {
  packages?: Record<string, { version?: string; dependencies?: Record<string, string> }>;
};
const maplibrePackage = pkg.dependencies?.["maplibre-gl"] ?? "";
const maplibreLock = lock.packages?.["node_modules/maplibre-gl"]?.version ?? "";
if (!versionAtLeast(maplibrePackage, [6, 4, 1]) || !versionAtLeast(maplibreLock, [6, 4, 1])) {
  throw new Error(`Phase 12 requires MapLibre GL JS >=6.4.1 in package.json and lockfile; found ${maplibrePackage || "missing"} / ${maplibreLock || "missing"}.`);
}

const worldMap = await readText("src/map/WorldMap.tsx");
for (const marker of ["GPUInitializationError", "maplibre-gl-worker.mjs?worker&url", "setWorkerUrl", 'contextType: "webgl2"', "country finder below"]) {
  if (!worldMap.includes(marker)) throw new Error(`Phase 12 MapLibre 6 migration missing ${marker}.`);
}

const docs = await readText("docs/V3_PHASE12_CONTENT_CERTIFICATION.md");
for (const marker of [
  "100 substantial reviewed profiles",
  "AI-assisted candidate material does not count as reviewed",
  "MapLibre GL JS 6.4.1",
  "Phase 13",
  "strict certification",
]) {
  if (!docs.includes(marker)) throw new Error(`Phase 12 certification document missing: ${marker}`);
}

const workbenchDocs = await readText("docs/V3_PHASE12_EDITORIAL_WORKBENCH.md");
for (const marker of [
  "data/v3/editorial/candidates/",
  "v3:phase12-candidate-check",
  "does not count",
  "Maintainer publication boundary",
]) {
  if (!workbenchDocs.includes(marker)) throw new Error(`Phase 12 editorial workbench document missing: ${marker}`);
}

const evidenceAuditLoader = await readText("scripts/v3/phase12-evidence-audits.ts");
for (const marker of ["pre-review-only", "not maintainer approval", "evidence-audits.json"]) {
  if (!evidenceAuditLoader.includes(marker)) throw new Error(`Phase 12 evidence-audit loader is missing boundary: ${marker}`);
}

const reviewCandidateScript = await readText("scripts/v3/phase12-review-candidate.ts");
const reviewWorkbenchScript = await readText("scripts/v3/phase12-review-workbench.ts");
for (const [label, source] of [
  ["single-candidate review", reviewCandidateScript],
  ["workbench review", reviewWorkbenchScript],
] as const) {
  for (const marker of ["liveMission", "live.GSEC", "outside the Phase 12 GSEC 0–3 scope"]) {
    if (!source.includes(marker)) throw new Error(`Phase 12 ${label} is missing live mission-scope guard: ${marker}`);
  }
}

for (const marker of ["Phase 12 Maintainer Review", "Evidence sources", "Human maintainer checks"]) {
  if (!reviewCandidateScript.includes(marker)) throw new Error(`Phase 12 single-candidate review is missing reviewer packet marker: ${marker}`);
}
for (const marker of ["Live source snapshot", "Evidence sources", "Maintainer checks"]) {
  if (!reviewWorkbenchScript.includes(marker)) throw new Error(`Phase 12 workbench review is missing reviewer packet marker: ${marker}`);
}

const liveAuditScript = await readText("scripts/v3/phase12-live-candidate-audit.ts");
for (const marker of ["identity-mismatch", "out-of-scope", "provider-error", "live-candidate-audit.json", "non-blocking-live-diagnostic"]) {
  if (!liveAuditScript.includes(marker)) throw new Error(`Phase 12 live candidate audit is missing diagnostic boundary: ${marker}`);
}

const reviewBatchRegistry = await readText("data/v3/editorial/review-batches.json");
const reviewBatchLoader = await readText("scripts/v3/phase12-review-batches.ts");
for (const marker of ["human-review-required", "\"issue\"", "\"candidates\""]) {
  if (!reviewBatchRegistry.includes(marker)) throw new Error(`Phase 12 review-batch registry is missing accountability marker: ${marker}`);
}
for (const marker of ["reviewAssignmentMap", "assigned to more than one human review batch", "issueUrl"]) {
  if (!reviewBatchLoader.includes(marker)) throw new Error(`Phase 12 review-batch loader is missing accountability guard: ${marker}`);
}

const liveResearchScript = await readText("scripts/v3/phase12-live-research-batches.ts");
for (const marker of ["non-ranking-live-research-registry", "research-ready", "provider-error", "index.json", "publicationEffect"]) {
  if (!liveResearchScript.includes(marker)) throw new Error(`Phase 12 live research-batch audit is missing boundary: ${marker}`);
}

for (const script of [
  "v3:phase12-candidate-check",
  "v3:phase12-readiness",
  "v3:phase12-certify",
  "v3:phase12-visual",
  "v3:phase12-editorial-queue",
  "v3:phase12-editorial-scaffold",
  "v3:phase12-editorial-scaffold-batch",
  "v3:phase12-review-candidate",
  "v3:phase12-review-workbench",
  "v3:phase12-live-candidate-audit",
  "v3:phase12-live-research-batches",
]) {
  if (!pkg.scripts?.[script]) throw new Error(`Phase 12 package script is not wired: ${script}.`);
}

const candidateFiles = (await readdir(resolve(root, "data/v3/editorial/candidates")))
  .filter((name) => name.endsWith(".json"))
  .sort();
if (!candidateFiles.length) throw new Error("Phase 12 editorial candidate workbench is empty.");

const report = {
  generatedAt: new Date().toISOString(),
  reviewedProfileTarget: PHASE12_REVIEWED_PROFILE_TARGET,
  reviewedProfileCount: catalog.reviewedProfiles.length,
  remainingReviewedProfiles: catalog.remaining,
  draftCandidateCount: candidateFiles.length,
  draftCandidateFiles: candidateFiles,
  candidatePublicationEffect: "none",
  contentGate: catalog.remaining === 0 ? "pass" : "blocked",
  maplibrePackage,
  maplibreLock,
  automatedFoundation: "ready",
  note: catalog.remaining === 0
    ? "The editorial count gate is satisfied; strict certification must still run before shipping."
    : `${catalog.remaining} additional substantial profiles still require maintainer evidence review and publication before Unreached 3.0 can ship. Draft workbench candidates do not count until reviewed and published.`,
};

await mkdir(resolve(root, "artifacts/v3-phase12"), { recursive: true });
await writeFile(resolve(root, "artifacts/v3-phase12/readiness.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

const status = catalog.remaining === 0 ? "READY FOR STRICT CERTIFICATION" : "CONTENT GATE BLOCKED";
console.log(`V3 Phase 12 automated readiness passed. Editorial depth: ${catalog.reviewedProfiles.length}/${PHASE12_REVIEWED_PROFILE_TARGET} substantial reviewed profiles; ${catalog.remaining} remaining; ${candidateFiles.length} review-workbench draft${candidateFiles.length === 1 ? "" : "s"}. ${status}. MapLibre ${maplibreLock} security migration and release-gate wiring are present.`);
