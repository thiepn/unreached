import { mkdir, readFile, writeFile } from "node:fs/promises";
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

for (const script of ["v3:phase12-readiness", "v3:phase12-certify", "v3:phase12-visual", "v3:phase12-editorial-queue"]) {
  if (!pkg.scripts?.[script]) throw new Error(`Phase 12 package script is not wired: ${script}.`);
}

const report = {
  generatedAt: new Date().toISOString(),
  reviewedProfileTarget: PHASE12_REVIEWED_PROFILE_TARGET,
  reviewedProfileCount: catalog.reviewedProfiles.length,
  remainingReviewedProfiles: catalog.remaining,
  contentGate: catalog.remaining === 0 ? "pass" : "blocked",
  maplibrePackage,
  maplibreLock,
  automatedFoundation: "ready",
  note: catalog.remaining === 0
    ? "The editorial count gate is satisfied; strict certification must still run before shipping."
    : `${catalog.remaining} additional substantial profiles still require maintainer evidence review and publication before Unreached 3.0 can ship.`,
};

await mkdir(resolve(root, "artifacts/v3-phase12"), { recursive: true });
await writeFile(resolve(root, "artifacts/v3-phase12/readiness.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

const status = catalog.remaining === 0 ? "READY FOR STRICT CERTIFICATION" : "CONTENT GATE BLOCKED";
console.log(`V3 Phase 12 automated readiness passed. Editorial depth: ${catalog.reviewedProfiles.length}/${PHASE12_REVIEWED_PROFILE_TARGET} substantial reviewed profiles; ${catalog.remaining} remaining. ${status}. MapLibre ${maplibreLock} security migration and release-gate wiring are present.`);
