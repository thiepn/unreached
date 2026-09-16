import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  adaptLegacyContextPackageToV3Editorial,
  assertEditorialCatalogIntegrity,
  assertEditorialProfileIntegrity,
  createSourceEditorialProfile,
  editorialExemplarManifestSchema,
  editorialProfileSchema,
  type EditorialProfile,
} from "../../src/editorial/index.js";
import { editorialContextManifestSchema, editorialContextProfilePackageSchema } from "../../src/context/types.js";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");
const readJson = async <T>(path: string): Promise<T> => JSON.parse(await readText(path)) as T;
const now = new Date();

function expectFailure(action: () => void, label: string): void {
  let failed = false;
  try {
    action();
  } catch {
    failed = true;
  }
  if (!failed) throw new Error(`Expected Phase 3 editorial policy to reject ${label}.`);
}

const exemplarManifest = editorialExemplarManifestSchema.parse(
  await readJson<unknown>("data/v3/editorial/exemplars.json"),
);
const legacyManifest = editorialContextManifestSchema.parse(
  await readJson<unknown>("public/data/context/manifest.v1.json"),
);

const allProfiles: EditorialProfile[] = [];
const bySourcePath = new Map<string, EditorialProfile>();
for (const publicUrl of legacyManifest.profileUrls) {
  const sourcePath = `public/${publicUrl}`;
  const legacyPackage = editorialContextProfilePackageSchema.parse(await readJson<unknown>(sourcePath));
  const profile = adaptLegacyContextPackageToV3Editorial(legacyPackage, sourcePath);
  editorialProfileSchema.parse(profile);
  assertEditorialProfileIntegrity(profile, now);
  allProfiles.push(profile);
  bySourcePath.set(sourcePath, profile);
}
assertEditorialCatalogIntegrity(allProfiles, now);

if (allProfiles.length !== legacyManifest.profileCount) {
  throw new Error(`Expected ${legacyManifest.profileCount} migrated editorial profiles, received ${allProfiles.length}.`);
}

const exemplarProfiles = exemplarManifest.profiles.map((entry) => {
  const profile = bySourcePath.get(entry.sourceProfilePath);
  if (!profile) throw new Error(`Editorial exemplar source is absent from the current reviewed manifest: ${entry.sourceProfilePath}.`);
  if (profile.id !== `editorial-profile:${entry.slug}`) {
    throw new Error(`Editorial exemplar slug ${entry.slug} does not match adapted profile ${profile.id}.`);
  }
  return profile;
});

const reviewedExemplars = exemplarProfiles.filter((profile) => profile.tier === "reviewed" && profile.review.status === "published");
if (reviewedExemplars.length < exemplarManifest.minimumReviewedProfiles) {
  throw new Error(`Phase 3 requires at least ${exemplarManifest.minimumReviewedProfiles} reviewed exemplar profiles; found ${reviewedExemplars.length}.`);
}

for (const profile of reviewedExemplars) {
  if (!profile.peopleId.startsWith("people:peoplegroups:")) {
    throw new Error(`${profile.id} does not use the Phase 2 provider-qualified people identity.`);
  }
  if (!profile.peopleContextIds.every((id) => id.startsWith("people-context:peoplegroups:"))) {
    throw new Error(`${profile.id} does not use Phase 2 provider-qualified people-context identities.`);
  }
  if (!profile.sections.some((section) => section.key === "overview")) throw new Error(`${profile.id} lacks overview.`);
  if (!profile.sections.some((section) => section.key === "gospel-context")) throw new Error(`${profile.id} lacks gospel context.`);
  if (profile.prayerPrompts.length < 2) throw new Error(`${profile.id} lacks contextual prayer prompts.`);
  if (!profile.researchGaps.length && profile.sections.length < 8) {
    throw new Error(`${profile.id} hides incomplete editorial coverage instead of declaring research gaps.`);
  }
}

// Prove that the lowest tier can represent a truthful source-only profile
// without manufacturing editorial prose.
const sourceOnly = createSourceEditorialProfile({
  id: "editorial-profile:phase3-source-only-fixture",
  peopleId: "people:peoplegroups:999999",
  peopleContextIds: ["people-context:peoplegroups:pg999999"],
  title: "Source-only fixture",
  deck: "Structured source data is available; reviewed editorial context has not been published.",
});
assertEditorialProfileIntegrity(sourceOnly, now);
if (sourceOnly.sections.length || sourceOnly.claims.length || sourceOnly.prayerPrompts.length) {
  throw new Error("Source-only profile manufactured editorial content.");
}

const baseline = reviewedExemplars[0];
if (!baseline) throw new Error("No reviewed Phase 3 exemplar available for negative-policy checks.");

const missingCitation = structuredClone(baseline);
missingCitation.claims[0]!.citationIds = ["editorial-source:does-not-exist"];
expectFailure(() => assertEditorialProfileIntegrity(missingCitation, now), "a missing citation");

const stale = structuredClone(baseline);
const currentClaim = stale.claims.find((claim) => claim.temporalClass === "current");
if (!currentClaim) throw new Error("Reviewed exemplar must include a current claim for freshness verification.");
currentClaim.reviewAfter = "2026-01-01";
expectFailure(() => assertEditorialProfileIntegrity(stale, now), "a stale current claim");

const restricted = structuredClone(baseline);
restricted.claims[0]!.sensitivity = "restricted";
expectFailure(() => assertEditorialProfileIntegrity(restricted, now), "restricted material in a published profile");

const fakeCompleteness = structuredClone(sourceOnly);
fakeCompleteness.sections = [{
  key: "overview",
  heading: "Invented overview",
  body: "This source-only fixture should never be allowed to pose as reviewed editorial content.",
  claimIds: ["claim:invented"],
}];
expectFailure(() => assertEditorialProfileIntegrity(fakeCompleteness, now), "editorial prose inside a source-only profile");

const phase3Doc = await readText("docs/V3_PHASE3_EDITORIAL_CONTENT_SYSTEM.md");
for (const marker of [
  "Reviewed profile",
  "Enhanced profile",
  "Source profile",
  "research gaps",
  "Phase 2 mission model",
  "ten reviewed exemplars",
  "Phase 4",
]) {
  if (!phase3Doc.includes(marker)) throw new Error(`Phase 3 documentation is missing required marker: ${marker}.`);
}

console.log(
  `V3 Phase 3 editorial checks passed: ${allProfiles.length} current reviewed shards adapt to the V3 model, ${reviewedExemplars.length} seed reviewed exemplars pass citation/freshness/sensitivity/prayer/coverage gates, and source-only profiles cannot manufacture editorial depth.`,
);
