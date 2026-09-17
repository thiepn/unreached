import {
  legacyPersonalizationStateV1Schema,
  legacyPersonalizationStateV2Schema,
  personalizationStateSchema,
  type PersonalizationState,
  type PrayerListEntry,
  type RecentVisit,
  type SavedPersonSnapshot,
} from "./types";

export const PERSONALIZATION_VERSION = 3 as const;
export const MAX_RECENT_VISITS = 12;
export const MAX_PRAYER_LIST = 100;
export const MAX_PERSONAL_NOTES = 200;
export const MAX_PERSONAL_NOTE_LENGTH = 2000;
export const MAX_PRAYER_MEMORY = 30;

export type PrayerPersonSnapshot = Omit<PrayerListEntry, "addedAt" | "lastPrayedAt">;

export function emptyPersonalizationState(): PersonalizationState {
  return {
    version: PERSONALIZATION_VERSION,
    savedPeoples: [],
    prayerList: [],
    recent: [],
    personalNotes: [],
    prayerMemory: [],
  };
}

export function normalizePersonalizationState(raw: unknown): PersonalizationState {
  const current = personalizationStateSchema.safeParse(raw);
  if (current.success) return current.data;

  const legacyV2 = legacyPersonalizationStateV2Schema.safeParse(raw);
  if (legacyV2.success) {
    return {
      version: PERSONALIZATION_VERSION,
      savedPeoples: legacyV2.data.savedPeoples,
      prayerList: legacyV2.data.prayerList,
      recent: legacyV2.data.recent,
      personalNotes: [],
      prayerMemory: [],
    };
  }

  const legacyV1 = legacyPersonalizationStateV1Schema.safeParse(raw);
  if (legacyV1.success) {
    return {
      version: PERSONALIZATION_VERSION,
      savedPeoples: legacyV1.data.savedPeoples,
      prayerList: [],
      recent: legacyV1.data.recent,
      personalNotes: [],
      prayerMemory: [],
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

function withoutOrphanedNote(
  state: PersonalizationState,
  sourcePeopleId: number,
  savedPeoples: PersonalizationState["savedPeoples"],
  prayerList: PersonalizationState["prayerList"],
) {
  const stillRemembered = savedPeoples.some((person) => person.sourcePeopleId === sourcePeopleId)
    || prayerList.some((person) => person.sourcePeopleId === sourcePeopleId);
  return stillRemembered
    ? state.personalNotes
    : state.personalNotes.filter((note) => note.sourcePeopleId !== sourcePeopleId);
}

export function removeSavedPerson(state: PersonalizationState, sourcePeopleId: number): PersonalizationState {
  const savedPeoples = state.savedPeoples.filter((person) => person.sourcePeopleId !== sourcePeopleId);
  return {
    ...state,
    savedPeoples,
    personalNotes: withoutOrphanedNote(state, sourcePeopleId, savedPeoples, state.prayerList),
  };
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
  const prayerList = state.prayerList.filter((person) => person.sourcePeopleId !== sourcePeopleId);
  return {
    ...state,
    prayerList,
    personalNotes: withoutOrphanedNote(state, sourcePeopleId, state.savedPeoples, prayerList),
  };
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
  const prayedAt = now.toISOString();
  const current = state.prayerList.find((person) => person.sourcePeopleId === snapshot.sourcePeopleId);
  const recorded: PrayerListEntry = {
    ...snapshot,
    addedAt: current?.addedAt ?? prayedAt,
    lastPrayedAt: prayedAt,
  };
  const prayerList = current
    ? state.prayerList.map((person) => person.sourcePeopleId === snapshot.sourcePeopleId ? recorded : person)
    : [recorded, ...state.prayerList].slice(0, MAX_PRAYER_LIST);
  const prayerMemory = [
    { ...snapshot, prayedAt },
    ...state.prayerMemory,
  ].slice(0, MAX_PRAYER_MEMORY);
  return { ...state, prayerList, prayerMemory };
}

export function setPersonalNote(
  state: PersonalizationState,
  sourcePeopleId: number,
  text: string,
  now = new Date(),
): PersonalizationState {
  const normalized = text.trim().slice(0, MAX_PERSONAL_NOTE_LENGTH);
  const remaining = state.personalNotes.filter((note) => note.sourcePeopleId !== sourcePeopleId);
  if (!normalized) return { ...state, personalNotes: remaining };

  const isKnown = state.savedPeoples.some((person) => person.sourcePeopleId === sourcePeopleId)
    || state.prayerList.some((person) => person.sourcePeopleId === sourcePeopleId);
  if (!isKnown) return state;

  return {
    ...state,
    personalNotes: [
      { sourcePeopleId, text: normalized, updatedAt: now.toISOString() },
      ...remaining,
    ].slice(0, MAX_PERSONAL_NOTES),
  };
}

export function clearPrayerMemory(state: PersonalizationState): PersonalizationState {
  return { ...state, prayerMemory: [] };
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
