import type { EditorialClaim, EditorialProfile } from "./schemas";

const PROHIBITED_EDITORIAL_SHORTCUTS = [
  "primitive",
  "backward",
  "hostile religion",
  "spiritually resistant",
  "their culture rejects christianity",
  "they are muslim, therefore unreached",
  "they are hindu, therefore unreached",
  "they are buddhist, therefore unreached",
  "no one has heard the gospel",
];

const PROHIBITED_PRAYER_PRESSURE = [
  "streak",
  "score",
  "leaderboard",
  "points",
  "spiritual target",
  "conquer this people",
];

function dateMs(value: string): number {
  return Date.parse(`${value}T00:00:00Z`);
}

export function isEditorialClaimStale(claim: EditorialClaim, now = new Date()): boolean {
  if (claim.temporalClass !== "current") return false;
  if (!claim.reviewAfter) return true;
  return dateMs(claim.reviewAfter) < now.getTime();
}

function assertUnique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`${label} must be unique.`);
}

function assertReviewChecklist(profile: EditorialProfile): void {
  const failed = Object.entries(profile.review.checklist)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (failed.length) {
    throw new Error(`${profile.id} has incomplete review checks: ${failed.join(", ")}.`);
  }
}

function assertClaimEvidence(profile: EditorialProfile, claim: EditorialClaim, sourceIds: Set<string>): void {
  assertUnique(claim.sectionKeys, `${claim.id} section keys`);
  assertUnique(claim.citationIds, `${claim.id} citations`);

  for (const citationId of claim.citationIds) {
    if (!sourceIds.has(citationId)) throw new Error(`${claim.id} references missing source ${citationId}.`);
  }

  if (claim.evidenceLevel === "B" && claim.citationIds.length < 2) {
    throw new Error(`${claim.id} is evidence synthesis but cites fewer than two sources.`);
  }
  if (claim.evidenceLevel === "C") {
    if (claim.kind !== "interpretation") throw new Error(`${claim.id} is Level C and must be interpretation.`);
    if (claim.certainty === "high") throw new Error(`${claim.id} is Level C and cannot claim high certainty.`);
    if (!claim.interpretationNote) throw new Error(`${claim.id} is Level C and requires an interpretation note.`);
  }
  if (claim.temporalClass === "current" && (!claim.asOf || !claim.reviewAfter)) {
    throw new Error(`${claim.id} is current and requires asOf plus reviewAfter.`);
  }
  if (claim.sensitivity === "restricted" && profile.review.status === "published") {
    throw new Error(`${claim.id} is restricted and cannot ship in a published profile.`);
  }

  const lowered = `${claim.text} ${claim.interpretationNote ?? ""}`.toLocaleLowerCase("en");
  const shortcut = PROHIBITED_EDITORIAL_SHORTCUTS.find((phrase) => lowered.includes(phrase));
  if (shortcut) throw new Error(`${claim.id} contains prohibited editorial shortcut: ${shortcut}.`);
}

function assertTierContract(profile: EditorialProfile): void {
  const sectionKeys = new Set(profile.sections.map((section) => section.key));

  if (profile.tier === "source") {
    if (profile.review.status !== "source-only") throw new Error(`${profile.id} source tier must use source-only status.`);
    if (profile.sections.length || profile.claims.length || profile.sources.length || profile.prayerPrompts.length) {
      throw new Error(`${profile.id} source tier must not pretend to contain reviewed editorial material.`);
    }
    return;
  }

  if (profile.review.status === "source-only") throw new Error(`${profile.id} editorial tier cannot use source-only status.`);
  if (profile.sources.length === 0) throw new Error(`${profile.id} editorial tier requires sources.`);

  if (profile.tier === "enhanced") {
    if (profile.sections.length < 2 || profile.claims.length < 2) {
      throw new Error(`${profile.id} enhanced tier requires at least two sourced editorial sections and claims.`);
    }
    return;
  }

  if (profile.review.status !== "published") throw new Error(`${profile.id} reviewed tier must be published.`);
  if (!sectionKeys.has("overview")) throw new Error(`${profile.id} reviewed tier requires an overview section.`);
  if (!sectionKeys.has("gospel-context")) throw new Error(`${profile.id} reviewed tier requires gospel context.`);
  const hasHumanContext = ["identity-context", "culture-history", "religion-community", "geography-context"]
    .some((key) => sectionKeys.has(key as never));
  if (!hasHumanContext) throw new Error(`${profile.id} reviewed tier requires at least one human-context section.`);
  if (profile.sections.length < 3 || profile.claims.length < 4) {
    throw new Error(`${profile.id} reviewed tier is too thin to function as a reviewed editorial profile.`);
  }
  if (profile.prayerPrompts.length < 2) {
    throw new Error(`${profile.id} reviewed tier requires at least two contextual prayer prompts.`);
  }
}

/**
 * Enforce V3 editorial publication integrity.
 *
 * A `reviewed` profile means its published material has passed the editorial
 * standard; it does not mean every possible atlas section is researched.
 * Missing depth is represented explicitly through `researchGaps` rather than
 * filled with generated prose.
 */
export function assertEditorialProfileIntegrity(profile: EditorialProfile, now = new Date()): void {
  assertUnique(profile.peopleContextIds, `${profile.id} people context IDs`);
  assertUnique(profile.sources.map((source) => source.id), `${profile.id} source IDs`);
  assertUnique(profile.claims.map((claim) => claim.id), `${profile.id} claim IDs`);
  assertUnique(profile.sections.map((section) => section.key), `${profile.id} section keys`);
  assertUnique(profile.prayerPrompts.map((prompt) => prompt.id), `${profile.id} prayer prompt IDs`);
  assertUnique(profile.researchGaps.map((gap) => gap.sectionKey), `${profile.id} research-gap section keys`);

  const sourceIds = new Set(profile.sources.map((source) => source.id));
  const claimsById = new Map(profile.claims.map((claim) => [claim.id, claim]));
  for (const claim of profile.claims) assertClaimEvidence(profile, claim, sourceIds);

  for (const section of profile.sections) {
    assertUnique(section.claimIds, `${profile.id}/${section.key} claim references`);
    for (const claimId of section.claimIds) {
      const claim = claimsById.get(claimId);
      if (!claim) throw new Error(`${profile.id}/${section.key} references missing ${claimId}.`);
      if (!claim.sectionKeys.includes(section.key)) {
        throw new Error(`${claimId} does not declare its referenced section ${section.key}.`);
      }
    }
  }

  for (const prompt of profile.prayerPrompts) {
    assertUnique(prompt.basisClaimIds, `${prompt.id} basis claims`);
    for (const claimId of prompt.basisClaimIds) {
      if (!claimsById.has(claimId)) throw new Error(`${prompt.id} references missing basis claim ${claimId}.`);
    }
    const lowered = prompt.text.toLocaleLowerCase("en");
    const pressure = PROHIBITED_PRAYER_PRESSURE.find((phrase) => lowered.includes(phrase));
    if (pressure) throw new Error(`${prompt.id} contains prohibited prayer-pressure language: ${pressure}.`);
  }

  const sectionKeys = new Set(profile.sections.map((section) => section.key));
  for (const gap of profile.researchGaps) {
    if (sectionKeys.has(gap.sectionKey)) throw new Error(`${profile.id} marks ${gap.sectionKey} as both published and a research gap.`);
  }

  assertTierContract(profile);

  if (profile.review.status === "published") {
    if (!profile.review.reviewedAt || !profile.review.reviewerRole) {
      throw new Error(`${profile.id} is published without review metadata.`);
    }
    assertReviewChecklist(profile);
    const stale = profile.claims.filter((claim) => isEditorialClaimStale(claim, now));
    if (stale.length) {
      throw new Error(`${profile.id} has stale current claims: ${stale.map((claim) => claim.id).join(", ")}.`);
    }
  }
}

export function assertEditorialCatalogIntegrity(profiles: EditorialProfile[], now = new Date()): void {
  assertUnique(profiles.map((profile) => profile.id), "Editorial profile IDs");
  for (const profile of profiles) assertEditorialProfileIntegrity(profile, now);
}
