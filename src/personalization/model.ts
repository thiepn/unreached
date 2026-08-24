import {
  legacyPersonalizationStateV1Schema,
  personalizationStateSchema,
  type PersonalizationState,
  type PrayerListEntry,
  type RecentVisit,
  type SavedPersonSnapshot,
} from "./types";

export const PERSONALIZATION_VERSION = 2 as const;
export const MAX_RECENT_VISITS = 12;
export const MAX_PRAYER_LIST = 100;

export type PrayerPersonSnapshot = Omit<PrayerListEntry, "addedAt" | "lastPrayedAt">;

export function emptyPersonalizationState(): PersonalizationState {
  return { version: PERSONALIZATION_VERSION, savedPeoples: [], prayerList: [], recent: [] };
}

export function normalizePersonalizationState(raw: unknown): PersonalizationState {
  const current = personalizationStateSchema.safeParse(raw);
  if (current.success) return current.data;

  const legacy = legacyPersonalizationStateV1Schema.safeParse(raw);
  if (legacy.success) {
    return {
      version: PERSONALIZATION_VERSION,
      savedPeoples: legacy.data.savedPeoples,
      prayerList: [],
      recent: legacy.data.recent,
    };
  }

  return emptyPersonalizationState();
}

export function isPersonSaved(state: PersonalizationState, sourcePeopleId: number): boolean {
  return state.savedPeoples.some((person) => person.sourcePeopleId === sourcePeopleId);
}

export function savePersonSnapshot(
  state: PersonalizationState,
  snapshot: Omit<SavedPersonSnapshot, "savedAt">,
  now = new Date(),
): PersonalizationState {
  const savedAt = now.toISOString();
  const savedPeoples = [
    { ...snapshot, savedAt },
    ...state.savedPeoples.filter((person) => person.sourcePeopleId !== snapshot.sourcePeopleId),
  ];
  return { ...state, savedPeoples };
}

export function removeSavedPerson(state: PersonalizationState, sourcePeopleId: number): PersonalizationState {
  return { ...state, savedPeoples: state.savedPeoples.filter((person) => person.sourcePeopleId !== sourcePeopleId) };
}

export function toggleSavedPersonSnapshot(
  state: PersonalizationState,
  snapshot: Omit<SavedPersonSnapshot, "savedAt">,
  now = new Date(),
): PersonalizationState {
  return isPersonSaved(state, snapshot.sourcePeopleId)
    ? removeSavedPerson(state, snapshot.sourcePeopleId)
    : savePersonSnapshot(state, snapshot, now);
}

export function isPrayerListed(state: PersonalizationState, sourcePeopleId: number): boolean {
  return state.prayerList.some((person) => person.sourcePeopleId === sourcePeopleId);
}

export function addPrayerPerson(
  state: PersonalizationState,
  snapshot: PrayerPersonSnapshot,
  now = new Date(),
): PersonalizationState {
  const existing = state.prayerList.find((person) => person.sourcePeopleId === snapshot.sourcePeopleId);
  const entry: PrayerListEntry = {
    ...snapshot,
    addedAt: existing?.addedAt ?? now.toISOString(),
    lastPrayedAt: existing?.lastPrayedAt ?? null,
  };
  const prayerList = [entry, ...state.prayerList.filter((person) => person.sourcePeopleId !== snapshot.sourcePeopleId)].slice(0, MAX_PRAYER_LIST);
  return { ...state, prayerList };
}

export function removePrayerPerson(state: PersonalizationState, sourcePeopleId: number): PersonalizationState {
  return { ...state, prayerList: state.prayerList.filter((person) => person.sourcePeopleId !== sourcePeopleId) };
}

export function togglePrayerPerson(
  state: PersonalizationState,
  snapshot: PrayerPersonSnapshot,
  now = new Date(),
): PersonalizationState {
  return isPrayerListed(state, snapshot.sourcePeopleId)
    ? removePrayerPerson(state, snapshot.sourcePeopleId)
    : addPrayerPerson(state, snapshot, now);
}

export function recordPrayerForPerson(
  state: PersonalizationState,
  snapshot: PrayerPersonSnapshot,
  now = new Date(),
): PersonalizationState {
  const current = state.prayerList.find((person) => person.sourcePeopleId === snapshot.sourcePeopleId);
  const recorded: PrayerListEntry = {
    ...snapshot,
    addedAt: current?.addedAt ?? now.toISOString(),
    lastPrayedAt: now.toISOString(),
  };
  const prayerList = current
    ? state.prayerList.map((person) => person.sourcePeopleId === snapshot.sourcePeopleId ? recorded : person)
    : [recorded, ...state.prayerList].slice(0, MAX_PRAYER_LIST);
  return { ...state, prayerList };
}

export function recordRecentVisit(
  state: PersonalizationState,
  visit: Omit<RecentVisit, "visitedAt">,
  now = new Date(),
): PersonalizationState {
  const visitedAt = now.toISOString();
  const recent = [
    { ...visit, visitedAt },
    ...state.recent.filter((item) => !(item.kind === visit.kind && item.key === visit.key)),
  ].slice(0, MAX_RECENT_VISITS);
  return { ...state, recent };
}

export function clearRecentVisits(state: PersonalizationState): PersonalizationState {
  return { ...state, recent: [] };
}
