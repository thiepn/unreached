import { personalizationStateSchema, type PersonalizationState, type RecentVisit, type SavedPersonSnapshot } from "./types";

export const PERSONALIZATION_VERSION = 1 as const;
export const MAX_RECENT_VISITS = 12;

export function emptyPersonalizationState(): PersonalizationState {
  return { version: PERSONALIZATION_VERSION, savedPeoples: [], recent: [] };
}

export function normalizePersonalizationState(raw: unknown): PersonalizationState {
  const parsed = personalizationStateSchema.safeParse(raw);
  return parsed.success ? parsed.data : emptyPersonalizationState();
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
