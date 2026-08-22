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
  if (failed.length) throw new Error(`${profile.peopleGroupId} has incomplete editorial review checks: ${failed.join(", ")}.`);
}

function allClaimIds(profile: PeopleContextProfile): Set<string> {
  return new Set(profile.claims.map((claim) => claim.id));
}

export function assertContextDatasetIntegrity(dataset: EditorialContextDataset, now = new Date()): void {
  const sourceIds = new Set(dataset.sources.map((source) => source.id));
  if (sourceIds.size !== dataset.sources.length) throw new Error("Editorial source IDs must be unique.");

  const profileKeys = new Set<string>();
  for (const profile of dataset.profiles) {
    if (profileKeys.has(profile.peopleGroupId)) throw new Error(`Duplicate contextual profile ${profile.peopleGroupId}.`);
    profileKeys.add(profile.peopleGroupId);
    if (profile.peopleGroupId !== `people:${profile.sourcePeopleId}`) throw new Error(`${profile.peopleGroupId} does not match sourcePeopleId ${profile.sourcePeopleId}.`);

    const ids = allClaimIds(profile);
    if (ids.size !== profile.claims.length) throw new Error(`${profile.peopleGroupId} contains duplicate claim IDs.`);
    const referenced = [
      ...profile.whoTheyAre.claimIds,
      ...(profile.religionAndCommunity?.claimIds ?? []),
      ...profile.whyUnreached.flatMap((section) => section.claimIds),
    ];
    for (const claimId of referenced) if (!ids.has(claimId)) throw new Error(`${profile.peopleGroupId} references missing ${claimId}.`);

    for (const sourceId of profile.sourceIds) if (!sourceIds.has(sourceId)) throw new Error(`${profile.peopleGroupId} references missing source ${sourceId}.`);

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
      if (!profile.review.reviewedAt || !profile.review.reviewerRole) throw new Error(`${profile.peopleGroupId} is published without review metadata.`);
      const stale = profile.claims.filter((claim) => isClaimStale(claim, now));
      if (stale.length) throw new Error(`${profile.peopleGroupId} has stale current claims: ${stale.map((claim) => claim.id).join(", ")}.`);
    }
  }
}

export function assertContextMatchesPeople(dataset: EditorialContextDataset, people: Array<{ peopleGroupId: string; sourcePeopleId: number }>): void {
  const peopleById = new Map(people.map((record) => [record.peopleGroupId, record.sourcePeopleId]));
  for (const profile of dataset.profiles) {
    const sourcePeopleId = peopleById.get(profile.peopleGroupId);
    if (sourcePeopleId === undefined) throw new Error(`Editorial profile ${profile.peopleGroupId} has no canonical people record.`);
    if (sourcePeopleId !== profile.sourcePeopleId) throw new Error(`Editorial profile ${profile.peopleGroupId} source ID does not match canonical people record.`);
  }
}
