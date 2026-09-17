import { PHASE12_REVIEWED_PROFILE_TARGET, loadPhase12EditorialCatalog } from "./phase12-content.js";

const catalog = await loadPhase12EditorialCatalog();

if (catalog.reviewedProfiles.length < PHASE12_REVIEWED_PROFILE_TARGET) {
  throw new Error(
    `Unreached 3.0 strict certification blocked: ${catalog.reviewedProfiles.length}/${PHASE12_REVIEWED_PROFILE_TARGET} substantial reviewed profiles are published. `
    + `${catalog.remaining} additional profiles still require evidence research, maintainer review, publication metadata, and Phase 3 editorial integrity checks. `
    + "AI-generated drafts, source-only records, and unreviewed candidates do not satisfy this release gate.",
  );
}

if (catalog.profiles.some((profile) => profile.tier !== "reviewed" || profile.review.status !== "published")) {
  throw new Error("Unreached 3.0 strict certification requires every profile counted in the Phase 12 publication manifest to meet the reviewed/published editorial contract.");
}

console.log(`Unreached 3.0 strict editorial certification passed with ${catalog.reviewedProfiles.length} substantial reviewed profiles. Continue with the complete security, browser, accessibility, offline, privacy, source-policy and production release gates before publishing.`);
