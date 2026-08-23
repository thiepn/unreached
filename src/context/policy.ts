import type { RuntimePeopleEntity } from "../providers/peoplegroups";
import type { EditorialContextDataset, ContextClaim, PeopleContextProfile } from "./types";

const PROHIBITED_SHORTCUTS = [
  "spiritually resistant",
  "their culture rejects christianity",
  "they are muslim, therefore unreached",
  "they are hindu, therefore unreached",
  "no one has heard the gospel",
];

function dateMs(value: string): number {
  return Date.parse(`${value}T00:00:00Z`);
}

export function isClaimStale(claim: ContextClaim, now = new Date()): boolean {
  if (claim.temporalClass !== "current") return false;
  if (!claim.reviewAfter) return true;
  return dateMs(claim.reviewAfter) < now.getTime();
}

export function claimLabel(claim: ContextClaim): string {
  if (claim.evidenceLevel === "A") return "Sourced fact";
  if (claim.evidenceLevel === "B") return "Evidence synthesis";
  return "Interpretation";
}

function assertChecklist(profile: PeopleContextProfile): void {
  const failed = Object.entries(profile.review.checklist).filter(([, value]) => !value).map(([key]) => key);
  if (failed.length) throw new Error(`${profile.peopleEntityId} has incomplete editorial review checks: ${failed.join(", ")}.`);
}

function allClaimIds(profile: PeopleContextProfile): Set<string> {
  return new Set(profile.claims.map((claim) => claim.id));
}

function assertIdentityContract(profile: PeopleContextProfile): void {
  const identity = profile.identity;
  if (profile.peopleEntityId !== `people-entity:peoplegroups:${profile.peid}`) throw new Error(`${profile.peopleEntityId} does not match PEID ${profile.peid}.`);
  if (identity.targetPeid !== profile.peid) throw new Error(`${profile.peopleEntityId} identity target does not match profile PEID.`);
  if (!identity.matchEvidence.includes("provider-peid")) throw new Error(`${profile.peopleEntityId} identity evidence must include provider-peid.`);
  if (!identity.matchEvidence.includes("provider-pgid")) throw new Error(`${profile.peopleEntityId} identity evidence must include provider-pgid.`);
  if (new Set(identity.matchEvidence).size !== identity.matchEvidence.length) throw new Error(`${profile.peopleEntityId} contains duplicate identity evidence labels.`);
  if (new Set(identity.pgidAnchors).size !== identity.pgidAnchors.length) throw new Error(`${profile.peopleEntityId} contains duplicate PGID anchors.`);
  if (identity.origin === "legacy-migrated") {
    if (!identity.legacyPeopleGroupId || !identity.legacySourcePeopleId) throw new Error(`${profile.peopleEntityId} migrated identity must retain legacy provenance.`);
    if (identity.legacyPeopleGroupId !== `people:${identity.legacySourcePeopleId}`) throw new Error(`${profile.peopleEntityId} legacy identity provenance is inconsistent.`);
  } else if (identity.legacyPeopleGroupId !== null || identity.legacySourcePeopleId !== null) {
    throw new Error(`${profile.peopleEntityId} PEID-native profile must not claim legacy provenance.`);
  }
}

export function assertContextDatasetIntegrity(dataset: EditorialContextDataset, now = new Date()): void {
  const sourceIds = new Set(dataset.sources.map((source) => source.id));
  if (sourceIds.size !== dataset.sources.length) throw new Error("Editorial source IDs must be unique.");

  const profileKeys = new Set<string>();
  for (const profile of dataset.profiles) {
    if (profileKeys.has(profile.peopleEntityId)) throw new Error(`Duplicate contextual profile ${profile.peopleEntityId}.`);
    profileKeys.add(profile.peopleEntityId);
    assertIdentityContract(profile);

    const ids = allClaimIds(profile);
    if (ids.size !== profile.claims.length) throw new Error(`${profile.peopleEntityId} contains duplicate claim IDs.`);
    const referenced = [
      ...profile.whoTheyAre.claimIds,
      ...(profile.religionAndCommunity?.claimIds ?? []),
      ...profile.whyUnreached.flatMap((section) => section.claimIds),
    ];
    for (const claimId of referenced) if (!ids.has(claimId)) throw new Error(`${profile.peopleEntityId} references missing ${claimId}.`);

    for (const sourceId of profile.sourceIds) if (!sourceIds.has(sourceId)) throw new Error(`${profile.peopleEntityId} references missing source ${sourceId}.`);

    for (const claim of profile.claims) {
      const distinctCitations = new Set(claim.citationIds);
      for (const citation of distinctCitations) if (!sourceIds.has(citation)) throw new Error(`${claim.id} references missing source ${citation}.`);
      if (claim.evidenceLevel === "B" && distinctCitations.size < 2) throw new Error(`${claim.id} is Level B synthesis but has fewer than two sources.`);
      if (claim.evidenceLevel === "C") {
        if (claim.kind !== "interpretation") throw new Error(`${claim.id} is Level C and must be labeled interpretation.`);
        if (claim.certainty === "high") throw new Error(`${claim.id} is Level C and cannot claim high certainty.`);
        if (!claim.interpretationNote) throw new Error(`${claim.id} is Level C and needs an interpretation note.`);
      }
      if (claim.temporalClass === "current" && (!claim.asOf || !claim.reviewAfter)) throw new Error(`${claim.id} is current and requires asOf plus reviewAfter.`);
      if (claim.sensitivity === "restricted" && profile.review.status === "published") throw new Error(`${claim.id} contains restricted material and cannot be published.`);
      const lowered = claim.text.toLocaleLowerCase("en");
      const shortcut = PROHIBITED_SHORTCUTS.find((phrase) => lowered.includes(phrase));
      if (shortcut) throw new Error(`${claim.id} contains prohibited shortcut language: ${shortcut}.`);
    }

    if (profile.review.status === "published") {
      assertChecklist(profile);
      if (!profile.review.reviewedAt || !profile.review.reviewerRole) throw new Error(`${profile.peopleEntityId} is published without review metadata.`);
      const stale = profile.claims.filter((claim) => isClaimStale(claim, now));
      if (stale.length) throw new Error(`${profile.peopleEntityId} has stale current claims: ${stale.map((claim) => claim.id).join(", ")}.`);
    }
  }
}

export function assertContextMatchesRuntimePeople(dataset: EditorialContextDataset, people: RuntimePeopleEntity[]): void {
  const peopleByPeid = new Map(people.map((record) => [record.peid, record]));
  for (const profile of dataset.profiles) {
    const record = peopleByPeid.get(profile.peid);
    if (!record) throw new Error(`Editorial profile ${profile.peopleEntityId} has no current PeopleGroups PEID.`);
    if (record.id !== profile.peopleEntityId) throw new Error(`Editorial profile ${profile.peopleEntityId} does not match runtime entity ${record.id}.`);

    const pgids = new Set(record.contexts.map((context) => context.pgid));
    for (const pgid of profile.identity.pgidAnchors) if (!pgids.has(pgid)) throw new Error(`${profile.peopleEntityId} identity anchor ${pgid} is absent from the current PEID.`);

    const countries = new Set(record.contexts.map((context) => context.country.iso3));
    for (const iso3 of profile.identity.countryIso3Anchors) if (!countries.has(iso3)) throw new Error(`${profile.peopleEntityId} country identity anchor ${iso3} is absent from the current PEID.`);

    const languages = new Set(record.contexts.map((context) => context.language.iso6393).filter((value): value is string => value !== null));
    for (const iso6393 of profile.identity.languageIso6393Anchors) if (!languages.has(iso6393)) throw new Error(`${profile.peopleEntityId} language identity anchor ${iso6393} is absent from the current PEID.`);

    const names = record.contexts.map((context) => context.displayName.toLocaleLowerCase("en"));
    const expected = profile.identity.verifiedPeopleName.toLocaleLowerCase("en");
    if (!names.some((name) => name.includes(expected) || expected.includes(name))) throw new Error(`${profile.peopleEntityId} verified name does not match the current PEID context names.`);
  }
}
