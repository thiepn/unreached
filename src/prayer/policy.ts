import type { EditorialContextDataset, PeopleContextProfile } from "../context/types";
import type { PeopleExplorerRecord } from "../peoples/types";
import type { PrayerDataset, PrayerProfile, PrayerPrompt } from "./types";

function dateMs(value: string): number {
  return Date.parse(`${value}T00:00:00Z`);
}

export function isPrayerPromptStale(prompt: PrayerPrompt, now = new Date()): boolean {
  if (prompt.temporalClass !== "current") return false;
  if (!prompt.reviewAfter) return true;
  return dateMs(prompt.reviewAfter) < now.getTime();
}

function assertReview(profile: PrayerProfile): void {
  if (profile.review.status !== "published") return;
  if (!profile.review.reviewedAt || !profile.review.reviewerRole) {
    throw new Error(`${profile.peopleGroupId} prayer guide is published without review metadata.`);
  }
  const failed = Object.entries(profile.review.checklist).filter(([, value]) => !value).map(([key]) => key);
  if (failed.length) throw new Error(`${profile.peopleGroupId} prayer review is incomplete: ${failed.join(", ")}.`);
}

function contextProfileFor(dataset: EditorialContextDataset, profile: PrayerProfile): PeopleContextProfile | null {
  return dataset.profiles.find((item) => item.peopleGroupId === profile.peopleGroupId) ?? null;
}

function assertContextReferences(profile: PrayerProfile, context: PeopleContextProfile | null): void {
  const referenced = [
    ...profile.whyPray.contextClaimIds,
    ...profile.prompts.flatMap((prompt) => prompt.contextClaimIds),
  ];
  if (!referenced.length) return;
  if (!context) throw new Error(`${profile.peopleGroupId} prayer guide references context claims but has no U7 contextual profile.`);
  const claimIds = new Set(context.claims.map((claim) => claim.id));
  for (const claimId of referenced) {
    if (!claimIds.has(claimId)) throw new Error(`${profile.peopleGroupId} prayer guide references missing contextual claim ${claimId}.`);
  }
}

export function assertPrayerDatasetIntegrity(
  dataset: PrayerDataset,
  people: PeopleExplorerRecord[],
  contextDataset: EditorialContextDataset,
  now = new Date(),
): void {
  const peopleById = new Map(people.map((item) => [item.peopleGroupId, item]));
  const profileIds = new Set<string>();

  for (const profile of dataset.profiles) {
    if (profileIds.has(profile.peopleGroupId)) throw new Error(`Duplicate prayer profile ${profile.peopleGroupId}.`);
    profileIds.add(profile.peopleGroupId);
    if (profile.peopleGroupId !== `people:${profile.sourcePeopleId}`) throw new Error(`${profile.peopleGroupId} does not match sourcePeopleId.`);

    const canonical = peopleById.get(profile.peopleGroupId);
    if (!canonical) throw new Error(`${profile.peopleGroupId} prayer guide has no canonical U6 people record.`);
    if (canonical.sourcePeopleId !== profile.sourcePeopleId) throw new Error(`${profile.peopleGroupId} prayer source ID does not match U6.`);
    if (canonical.name !== profile.peopleName) throw new Error(`${profile.peopleGroupId} prayer display name is out of sync with U6.`);

    const promptIds = new Set(profile.prompts.map((prompt) => prompt.id));
    if (promptIds.size !== profile.prompts.length) throw new Error(`${profile.peopleGroupId} contains duplicate prayer prompt IDs.`);

    const categories = new Set(profile.prompts.map((prompt) => prompt.category));
    if (categories.size < 4) throw new Error(`${profile.peopleGroupId} prayer guide must cover at least four prayer categories.`);
    if (!categories.has("gospel")) throw new Error(`${profile.peopleGroupId} prayer guide requires a gospel prompt.`);
    if (!categories.has("believers") && !categories.has("church")) throw new Error(`${profile.peopleGroupId} prayer guide requires a believers or church prompt.`);

    for (const prompt of profile.prompts) {
      if (prompt.grounding === "biblical" && prompt.scriptureReferences.length === 0) throw new Error(`${prompt.id} is biblically grounded but has no Scripture reference.`);
      if (prompt.grounding === "contextual" && prompt.contextClaimIds.length === 0) throw new Error(`${prompt.id} is contextually grounded but has no context claim.`);
      if (prompt.grounding === "mixed" && (prompt.contextClaimIds.length === 0 || prompt.scriptureReferences.length === 0)) throw new Error(`${prompt.id} mixed grounding requires context and Scripture.`);
      if (prompt.temporalClass === "current" && (!prompt.asOf || !prompt.reviewAfter)) throw new Error(`${prompt.id} is current and requires asOf plus reviewAfter.`);
      if (profile.review.status === "published" && prompt.sensitivity === "restricted") throw new Error(`${prompt.id} is restricted and cannot be published.`);
      if (profile.review.status === "published" && isPrayerPromptStale(prompt, now)) throw new Error(`${prompt.id} is stale.`);
    }

    assertContextReferences(profile, contextProfileFor(contextDataset, profile));
    assertReview(profile);
  }
}

export function dateKeyLocal(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function selectDailyPrayerProfile(profiles: PrayerProfile[], dateKey: string, countryIso3?: string | null): PrayerProfile | null {
  const eligible = profiles
    .filter((profile) => profile.review.status === "published" && profile.featuredDaily)
    .filter((profile) => !countryIso3 || profile.countryIso3s.includes(countryIso3))
    .sort((a, b) => a.sourcePeopleId - b.sourcePeopleId);
  if (!eligible.length) return null;
  return eligible[stableHash(`${dateKey}:${countryIso3 ?? "WORLD"}`) % eligible.length] ?? null;
}

export function prayerFlow(profile: PrayerProfile, minutes: 2 | 5 | 10): PrayerPrompt[] {
  const limit = minutes === 2 ? 3 : minutes === 5 ? 5 : 7;
  return profile.prompts.slice(0, Math.min(limit, profile.prompts.length));
}
