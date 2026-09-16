import type { PeopleContextProfile, EditorialContextProfilePackage } from "../context/types";
import {
  editorialProfileSchema,
  type EditorialClaim,
  type EditorialProfile,
  type EditorialSection,
  type EditorialSectionKey,
} from "./schemas";

const ALL_SECTION_KEYS: EditorialSectionKey[] = [
  "overview",
  "identity-context",
  "geography-context",
  "culture-history",
  "language-context",
  "religion-community",
  "gospel-context",
  "scripture-access",
];

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function slugFromSourcePath(sourcePath: string): string {
  const name = sourcePath.split("/").at(-1) ?? "profile";
  return name.replace(/\.json$/i, "").toLocaleLowerCase("en").replace(/[^a-z0-9._-]+/g, "-");
}

function dimensionSection(dimension: PeopleContextProfile["claims"][number]["dimension"]): EditorialSectionKey {
  switch (dimension) {
    case "identity": return "identity-context";
    case "geography": return "geography-context";
    case "culture":
    case "history":
    case "social-identity":
    case "legal-political":
    case "conflict-displacement": return "culture-history";
    case "religion-community": return "religion-community";
    case "language-media": return "scripture-access";
    case "church-presence":
    case "access-gap": return "gospel-context";
  }
}

function addClaimSection(map: Map<string, Set<EditorialSectionKey>>, claimId: string, sectionKey: EditorialSectionKey): void {
  const keys = map.get(claimId) ?? new Set<EditorialSectionKey>();
  keys.add(sectionKey);
  map.set(claimId, keys);
}

function buildClaimSections(profile: PeopleContextProfile): Map<string, Set<EditorialSectionKey>> {
  const map = new Map<string, Set<EditorialSectionKey>>();
  for (const claim of profile.claims) addClaimSection(map, claim.id, dimensionSection(claim.dimension));
  for (const id of profile.whoTheyAre.claimIds) addClaimSection(map, id, "overview");
  for (const id of profile.religionAndCommunity?.claimIds ?? []) addClaimSection(map, id, "religion-community");
  for (const section of profile.whyUnreached) {
    for (const id of section.claimIds) addClaimSection(map, id, "gospel-context");
  }
  return map;
}

function mappedClaims(profile: PeopleContextProfile, claimSections: Map<string, Set<EditorialSectionKey>>): EditorialClaim[] {
  return profile.claims.map((claim) => ({
    id: claim.id,
    sectionKeys: [...(claimSections.get(claim.id) ?? new Set([dimensionSection(claim.dimension)]))],
    kind: claim.kind,
    evidenceLevel: claim.evidenceLevel,
    certainty: claim.certainty,
    temporalClass: claim.temporalClass,
    text: claim.text,
    citationIds: claim.citationIds,
    asOf: claim.asOf,
    reviewAfter: claim.reviewAfter,
    sensitivity: claim.sensitivity,
    interpretationNote: claim.interpretationNote,
  }));
}

function sectionFromClaims(
  key: EditorialSectionKey,
  heading: string,
  claims: EditorialClaim[],
): EditorialSection | null {
  const matching = claims.filter((claim) => claim.sectionKeys.includes(key));
  if (!matching.length) return null;
  return {
    key,
    heading,
    body: matching.map((claim) => claim.text).join(" "),
    claimIds: matching.map((claim) => claim.id),
  };
}

function buildSections(profile: PeopleContextProfile, claims: EditorialClaim[]): EditorialSection[] {
  const sections: EditorialSection[] = [{
    key: "overview",
    heading: "Who they are",
    body: profile.whoTheyAre.summary,
    claimIds: profile.whoTheyAre.claimIds,
  }];

  const optionalSections: Array<EditorialSection | null> = [
    sectionFromClaims("geography-context", "Where this profile is situated", claims),
    sectionFromClaims("culture-history", "Context and history", claims),
    sectionFromClaims("language-context", "Language context", claims),
    profile.religionAndCommunity
      ? {
          key: "religion-community",
          heading: "Religion and community",
          body: profile.religionAndCommunity.summary,
          claimIds: profile.religionAndCommunity.claimIds,
        }
      : sectionFromClaims("religion-community", "Religion and community", claims),
    {
      key: "gospel-context",
      heading: "Gospel-access context",
      body: [profile.whyUnreachedIntro, ...profile.whyUnreached.map((section) => section.summary)].join(" "),
      claimIds: unique(profile.whyUnreached.flatMap((section) => section.claimIds)),
    },
    sectionFromClaims("scripture-access", "Scripture and Christian resources", claims),
  ];

  for (const section of optionalSections) if (section) sections.push(section);
  return sections;
}

function prayerPrompts(profile: PeopleContextProfile, claims: EditorialClaim[]) {
  const gospelIds = unique(profile.whyUnreached.flatMap((section) => section.claimIds));
  const resourceIds = claims
    .filter((claim) => claim.sectionKeys.includes("scripture-access"))
    .map((claim) => claim.id);
  const identityIds = profile.whoTheyAre.claimIds;
  const name = profile.identity.verifiedPeopleName;

  return [
    {
      id: `prayer:${profile.peid}-witness`,
      category: "witness" as const,
      text: `Pray for faithful, humble and loving Christian witness among ${name}, shaped by wisdom rather than stereotypes.`,
      basisClaimIds: gospelIds.length ? gospelIds : identityIds,
      origin: "reviewed-template" as const,
      scriptureReference: "Colossians 4:5–6",
    },
    {
      id: `prayer:${profile.peid}-resources`,
      category: resourceIds.length ? "scripture-resources" as const : "wisdom" as const,
      text: resourceIds.length
        ? `Pray that reported Scripture and Christian resources connected with ${name} would be understandable, accessible and used wisely in their real community contexts.`
        : `Pray for wise, truthful and locally appropriate ways for ${name} communities to encounter Scripture and Christian witness.`,
      basisClaimIds: resourceIds.length ? resourceIds : (gospelIds.length ? gospelIds : identityIds),
      origin: "reviewed-template" as const,
      scriptureReference: "2 Timothy 3:15–17",
    },
  ];
}

function adaptedReview(profile: PeopleContextProfile, tier: EditorialProfile["tier"]): EditorialProfile["review"] {
  const old = profile.review;
  const publishedReviewed = tier === "reviewed" && old.status === "published";
  return {
    status: tier === "reviewed" ? (publishedReviewed ? "published" : "reviewed") : old.status === "published" ? "reviewed" : old.status,
    reviewedAt: old.reviewedAt,
    reviewerRole: old.reviewerRole,
    aiAssisted: old.aiAssisted,
    checklist: {
      identityChecked: old.checklist.namingChecked && old.checklist.identityMatchChecked,
      materialClaimsCited: old.checklist.materialClaimsCited,
      currentClaimsFresh: old.checklist.currentClaimsFresh,
      sourceQualityChecked: old.checklist.materialClaimsCited && old.checklist.sourceLicensingChecked,
      noStereotypeShortcuts: old.checklist.noStereotypeShortcuts,
      religionNuanced: old.checklist.religionNuanced,
      sensitiveDataChecked: old.checklist.sensitiveDataChecked,
      licensingChecked: old.checklist.sourceLicensingChecked,
      sectionCoverageChecked: true,
      prayerLanguageChecked: true,
    },
  };
}

/**
 * Transitional Phase 3 bridge for the twelve already-reviewed V2 editorial
 * shards. It changes their identity vocabulary and publication envelope, not
 * the factual claims themselves.
 *
 * Missing final-atlas dimensions remain explicit research gaps. Phase 3 does
 * not generate filler paragraphs merely to make a profile appear complete.
 */
export function adaptLegacyContextPackageToV3Editorial(
  pkg: EditorialContextProfilePackage,
  sourcePath: string,
): EditorialProfile {
  const profile = pkg.profile;
  const slug = slugFromSourcePath(sourcePath);
  const claimSections = buildClaimSections(profile);
  const claims = mappedClaims(profile, claimSections);
  const sections = buildSections(profile, claims);
  const publishedKeys = new Set(sections.map((section) => section.key));
  const tier: EditorialProfile["tier"] = profile.review.status === "published" && profile.review.qualityTier === 3
    ? "reviewed"
    : "enhanced";

  return editorialProfileSchema.parse({
    schemaVersion: 1,
    id: `editorial-profile:${slug}`,
    tier,
    peopleId: `people:peoplegroups:${profile.peid}`,
    peopleContextIds: profile.identity.pgidAnchors.map((pgid) => `people-context:peoplegroups:${pgid.toLocaleLowerCase("en")}`),
    title: profile.identity.verifiedPeopleName,
    deck: profile.whoTheyAre.summary,
    sections,
    claims,
    sources: pkg.sources,
    prayerPrompts: prayerPrompts(profile, claims),
    researchGaps: ALL_SECTION_KEYS
      .filter((key) => !publishedKeys.has(key))
      .map((sectionKey) => ({
        sectionKey,
        note: "No separately reviewed Phase 3 editorial section is published for this dimension yet; structured source data may still exist in the mission model.",
      })),
    legacyContextProfile: {
      sourcePath,
      legacyPeopleEntityId: profile.peopleEntityId,
      peid: profile.peid,
    },
    review: adaptedReview(profile, tier),
  });
}

export function createSourceEditorialProfile(input: {
  id: string;
  peopleId: EditorialProfile["peopleId"];
  peopleContextIds: EditorialProfile["peopleContextIds"];
  title: string;
  deck: string;
}): EditorialProfile {
  return editorialProfileSchema.parse({
    schemaVersion: 1,
    id: input.id,
    tier: "source",
    peopleId: input.peopleId,
    peopleContextIds: input.peopleContextIds,
    title: input.title,
    deck: input.deck,
    sections: [],
    claims: [],
    sources: [],
    prayerPrompts: [],
    researchGaps: ALL_SECTION_KEYS.map((sectionKey) => ({
      sectionKey,
      note: "No reviewed editorial treatment has been published for this dimension yet.",
    })),
    legacyContextProfile: null,
    review: {
      status: "source-only",
      reviewedAt: null,
      reviewerRole: null,
      aiAssisted: false,
      checklist: {
        identityChecked: false,
        materialClaimsCited: false,
        currentClaimsFresh: false,
        sourceQualityChecked: false,
        noStereotypeShortcuts: false,
        religionNuanced: false,
        sensitiveDataChecked: false,
        licensingChecked: false,
        sectionCoverageChecked: false,
        prayerLanguageChecked: false,
      },
    },
  });
}
