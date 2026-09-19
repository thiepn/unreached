import { readFile } from "node:fs/promises";
import { classifyPeopleGroupsGsec, PEOPLE_GROUPS_SOURCE_ID } from "../../src/providers/peoplegroups/classification.js";
import { toRuntimePeopleContext } from "../../src/providers/peoplegroups/model.js";
import { loadSourceRegistry } from "../data/fixtures.js";
import { assertSourceUseAllowed } from "../data/source-policy.js";

function expectBlocked(action: () => void, label: string): void {
  let blocked = false;
  try {
    action();
  } catch {
    blocked = true;
  }
  if (!blocked) throw new Error(`Expected Phase 1 source gate to block ${label}.`);
}

for (const gsec of [0, 1, 2, 3]) {
  const assertion = classifyPeopleGroupsGsec({
    gsec,
    label: `GSEC ${gsec}`,
    sourceUpdatedAt: "2026-09-16T00:00:00.000Z",
  });
  if (assertion.classification !== "unreached") {
    throw new Error(`GSEC ${gsec} must remain source-defined unreached.`);
  }
  if (assertion.sourceId !== PEOPLE_GROUPS_SOURCE_ID) {
    throw new Error("Mission classification must retain provider source identity.");
  }
  if (!assertion.methodologyId.startsWith("imb-gsec-")) {
    throw new Error("Mission classification must retain an explicit IMB GSEC methodology identifier.");
  }
}

for (const gsec of [4, 5, 6]) {
  const assertion = classifyPeopleGroupsGsec({ gsec, label: `GSEC ${gsec}`, sourceUpdatedAt: null });
  if (assertion.classification !== "not-unreached") {
    throw new Error(`GSEC ${gsec} must be represented as not-unreached, not a stronger generic reached claim.`);
  }
}

const unknown = classifyPeopleGroupsGsec({ gsec: null, label: null, sourceUpdatedAt: null });
if (unknown.classification !== "unknown" || unknown.sourceCode !== null) {
  throw new Error("Missing GSEC must remain unknown without inferred source values.");
}

const runtimeContext = toRuntimePeopleContext({
  PEID: 1,
  PGID: "PG000001",
  NmDisp: "Phase One Fixture",
  ISOalpha3: "BEN",
  Ctry: "Benin",
  GSEC: 3,
  GSECbrf: "Less than 2% Evangelical, Dispersed CP Activity",
  UpdatedDate: "2026-09-16T00:00:00.000Z",
});
if (runtimeContext.reach.classification !== "unreached") {
  throw new Error("Compatibility runtime must preserve the current unreached classification.");
}
if (runtimeContext.reach.assertion.classification !== "unreached") {
  throw new Error("Compatibility runtime must expose the source-scoped Phase 1 assertion boundary.");
}
if (runtimeContext.reach.assertion.sourceCode !== runtimeContext.reach.sourceValue) {
  throw new Error("Compatibility runtime source value and classification assertion diverged.");
}

const registry = await loadSourceRegistry();
assertSourceUseAllowed(registry, "peoplegroups-org-api", "runtime-read");
assertSourceUseAllowed(registry, "peoplegroups-org-api", "public-release");
expectBlocked(
  () => assertSourceUseAllowed(registry, "peoplegroups-org-api", "browser-redistribution"),
  "PeopleGroups.org corpus redistribution",
);

// Phase 1 originally blocked Joshua Project through the focused 3.0 launch.
// Phase 13 is the separately reviewed integration that gate anticipated. The
// historical launch decision remains intact; only the narrow Phase 13 runtime
// comparison is now approved by the current source registry.
assertSourceUseAllowed(registry, "joshua-project-api", "runtime-read");
assertSourceUseAllowed(registry, "joshua-project-api", "public-release");
expectBlocked(
  () => assertSourceUseAllowed(registry, "joshua-project-api", "browser-redistribution"),
  "Joshua Project browser/bulk redistribution",
);

for (const sourceId of ["peoplegroups-org-api", "joshua-project-api"]) {
  const source = registry.sources.find((candidate) => candidate.id === sourceId);
  if (!source) throw new Error(`Missing Phase 1 source registry entry: ${sourceId}.`);
  if (Date.parse(source.termsReviewedAt) < Date.parse("2026-09-16")) {
    throw new Error(`${sourceId} terms review predates the Phase 1 source decision.`);
  }
}

const joshua = registry.sources.find((candidate) => candidate.id === "joshua-project-api");
if (!joshua || joshua.termsReviewedAt !== "2026-09-17") {
  throw new Error("Phase 13 must supersede the historical Joshua Project block only after a fresh terms review.");
}
for (const marker of ["manually reviewed", "no-store", "server-side secret", "do not average"]) {
  const policyText = [joshua.publicRedistribution, joshua.cacheStatus, joshua.permissionGate ?? "", ...joshua.requirements].join("\n").toLowerCase();
  if (!policyText.includes(marker.toLowerCase())) throw new Error(`Phase 13 Joshua Project policy is missing boundary: ${marker}`);
}

const phase1 = await readFile(new URL("../../docs/V3_PHASE1_SOURCE_ARCHITECTURE.md", import.meta.url), "utf8");
for (const requiredText of [
  "PeopleGroups.org / IMB-first",
  "canonical launch source",
  "Joshua Project",
  "not-unreached",
  "Phase 13",
]) {
  if (!phase1.includes(requiredText)) {
    throw new Error(`Phase 1 architecture document is missing required decision text: ${requiredText}.`);
  }
}

console.log("V3 Phase 1 source architecture checks passed: the canonical PeopleGroups/IMB launch decision and source-scoped classification boundary remain intact, while the separately reviewed Phase 13 Joshua Project comparison exception is constrained by its current policy gate.");
