import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { createMissionClassificationAssertion } from "../../src/mission/classification";
import { joshuaProjectMissionAssertion, joshuaProjectComparisonRecordSchema } from "../../src/mission/joshua-project";
import { compareMissionAssertions, REVIEWED_MISSION_SOURCE_CROSSWALKS } from "../../src/mission/multi-source";
import { assertSourceUseAllowed, sourceRegistrySchema } from "../data/source-policy";

const root = process.cwd();
const read = (path: string) => readFile(resolve(root, path), "utf8");

function requireText(source: string, marker: string, label: string): void {
  if (!source.includes(marker)) throw new Error(`V3 Phase 13: missing ${label}: ${marker}`);
}

for (const path of [
  "src/mission/multi-source.ts",
  "src/mission/joshua-project.ts",
  "src/mission/multi-source-client.ts",
  "src/components/MultiSourceMissionPanel.tsx",
  "worker/src/joshua-project.ts",
  "docs/V3_PHASE13_MULTI_SOURCE_MISSION_INTELLIGENCE.md",
  ".github/workflows/v3-phase13-multi-source-intelligence.yml",
]) {
  if (!existsSync(resolve(root, path))) throw new Error(`V3 Phase 13 required file is missing: ${path}`);
}

if (REVIEWED_MISSION_SOURCE_CROSSWALKS.length !== 3) throw new Error("Phase 13 must begin with exactly three manually reviewed cross-source links.");
const pgKeys = new Set<string>();
const jpKeys = new Set<string>();
for (const item of REVIEWED_MISSION_SOURCE_CROSSWALKS) {
  const pgKey = `${item.peopleGroupsPeid}:${item.peopleGroupsPgid}:${item.peopleGroupsCountryIso3}`;
  if (pgKeys.has(pgKey)) throw new Error(`Duplicate PeopleGroups crosswalk identity: ${pgKey}`);
  if (jpKeys.has(item.joshuaPeopleId3Rog3)) throw new Error(`Duplicate Joshua Project crosswalk identity: ${item.joshuaPeopleId3Rog3}`);
  if (item.reviewedAt !== "2026-09-17" || item.evidence.length < 3) throw new Error(`Crosswalk ${pgKey} is not explicitly reviewed with evidence.`);
  pgKeys.add(pgKey);
  jpKeys.add(item.joshuaPeopleId3Rog3);
}

const imbUnreached = createMissionClassificationAssertion({
  sourceId: "peoplegroups-org-api",
  methodologyId: "imb-gsec-v1",
  classification: "unreached",
  sourceCode: 1,
  sourceLabel: "GSEC 1",
  definition: "Synthetic Phase 13 PeopleGroups assertion",
  basis: ["GSEC 1"],
  sourceUpdatedAt: null,
});
const imbOther = createMissionClassificationAssertion({ ...imbUnreached, classification: "not-unreached", sourceCode: 5, sourceLabel: "GSEC 5" });
const imbUnknown = createMissionClassificationAssertion({ ...imbUnreached, classification: "unknown", sourceCode: null, sourceLabel: null });
const jpRecord = joshuaProjectComparisonRecordSchema.parse({
  source: "joshua-project-api",
  peopleId3: 12140,
  rog3: "CH",
  peopleId3Rog3: "12140CH",
  peopleName: "Hui",
  countryName: "China",
  percentAdherents: 0.6,
  percentEvangelical: 0.1,
  jpScale: 1,
  leastReached: true,
  frontier: true,
  retrievedAt: "2026-09-17T18:00:00.000Z",
  sourceProfileUrl: "https://joshuaproject.net/people_groups/12140/CH",
});
const jpAssertion = joshuaProjectMissionAssertion(jpRecord);
if (jpAssertion.classification !== "unreached" || !jpAssertion.basis.some((item) => item.includes("LeastReached"))) {
  throw new Error("Phase 13 must retain Joshua Project LeastReached as the source classification instead of recalculating it from percentages.");
}
if (compareMissionAssertions(imbUnreached, jpAssertion).state !== "agreement") throw new Error("Phase 13 agreement state is broken.");
if (compareMissionAssertions(imbOther, jpAssertion).state !== "disagreement") throw new Error("Phase 13 disagreement state is broken.");
if (compareMissionAssertions(imbUnknown, jpAssertion).state !== "incomplete") throw new Error("Phase 13 incomplete state is broken.");

const registry = sourceRegistrySchema.parse(JSON.parse(await read("data/source-registry.json")) as unknown);
assertSourceUseAllowed(registry, "joshua-project-api", "runtime-read");
assertSourceUseAllowed(registry, "joshua-project-api", "public-release");
const jpPolicy = registry.sources.find((source) => source.id === "joshua-project-api");
if (!jpPolicy || jpPolicy.browserRedistributionAllowed || jpPolicy.commercialUse !== false || jpPolicy.termsReviewedAt !== "2026-09-17") {
  throw new Error("Phase 13 Joshua Project policy must remain non-commercial, no-bulk/browser-redistribution and freshly reviewed.");
}
for (const phrase of ["manual", "LeastReached", "do not average", "server-side secret"]) {
  if (!jpPolicy.requirements.some((requirement) => requirement.toLowerCase().includes(phrase.toLowerCase()))) {
    throw new Error(`Phase 13 Joshua Project policy is missing requirement: ${phrase}`);
  }
}

const panel = await read("src/components/MultiSourceMissionPanel.tsx");
for (const marker of [
  "Compare source methodologies",
  "Compare mission sources",
  "Data provided by Joshua Project",
  "does not average",
  "data-comparison-state",
  "LeastReached",
]) requireText(panel, marker, "multi-source UI boundary");

const page = await read("src/pages/PeoplePage.tsx");
requireText(page, "<MultiSourceMissionPanel record={record} />", "people-profile integration");

const edgeAdapter = await read("worker/src/joshua-project.ts");
for (const marker of ["12140CH", "15755CH", "14327AF", "APPROVED_LINKS", "PeopleID3ROG3", "leastReached", "sourceProfileUrl"]) {
  requireText(edgeAdapter, marker, "narrow Joshua Project edge adapter");
}
for (const forbidden of ["caches.open", "env.DB", "localStorage", "sessionStorage"]) {
  if (edgeAdapter.includes(forbidden)) throw new Error(`Phase 13 edge adapter must not persist Joshua Project records: ${forbidden}`);
}

const worker = await read("worker/src/index.ts");
for (const marker of ["MISSION_SOURCE_PREFIX", "JOSHUA_PROJECT_API_KEY", "fetchJoshuaComparisonRecord", "Cache-Control\": \"no-store", "Origin not allowed"]) {
  requireText(worker, marker, "credential/caching edge boundary");
}
if (worker.includes("api.joshuaproject.net") || worker.includes("api_key=")) {
  throw new Error("Joshua Project upstream details and credentials belong in the dedicated server-side adapter, not browser-facing route code.");
}

const client = await read("src/mission/multi-source-client.ts");
if (client.includes("JOSHUA_PROJECT_API_KEY") || client.includes("api_key")) throw new Error("Browser code must never contain the Joshua Project API credential name or query parameter.");
requireText(client, "cache: \"no-store\"", "browser no-store request");

const about = await read("src/pages/AboutPage.tsx");
for (const marker of ["Source comparison", "Cross-source identity is reviewed, not guessed.", "Disagreement stays visible.", "Phase 13 · post-3.0 gate"]) {
  requireText(about, marker, "public methodology disclosure");
}

const docs = await read("docs/V3_PHASE13_MULTI_SOURCE_MISSION_INTELLIGENCE.md");
for (const marker of ["Gate D", "manual crosswalk", "agreement", "disagreement", "incomplete", "JOSHUA_PROJECT_API_KEY", "no-store", "Phase 14"]) {
  requireText(docs, marker, "Phase 13 documentation");
}

const pkg = await read("package.json");
requireText(pkg, '"v3:phase13-check": "tsx scripts/v3/phase13-check.ts"', "Phase 13 package gate");
requireText(pkg, "npm run v3:phase12-readiness && npm run v3:phase13-check", "blocking Phase 13 build integration");

console.log("V3 Phase 13 Multi-Source Mission Intelligence checks passed: reviewed provider crosswalks, source-native classifications, explicit comparison states, on-demand no-store Joshua Project access, server-only credentials, attribution and Gate D boundaries are enforced.");
