import { useCallback, useEffect, useMemo, useState } from "preact/hooks";

import {
  clearRecentVisits,
  emptyPersonalizationState,
  normalizePersonalizationState,
  recordPrayerForPerson,
  recordRecentVisit,
  removePrayerPerson,
  removeSavedPerson,
  togglePrayerPerson,
  toggleSavedPersonSnapshot,
  type PrayerPersonSnapshot,
} from "./model";
import type { PersonalizationState, RecentVisit, SavedPersonSnapshot } from "./types";

export const PERSONALIZATION_STORAGE_KEY = "unreached.personal.v2";
export const LEGACY_PERSONALIZATION_STORAGE_KEY = "unreached.personal.v1";
export const PERSONALIZATION_CHANGE_EVENT = "unreached:personalization-change";

function parseStored(raw: string | null): PersonalizationState | null {
  if (!raw) return null;
  try {
    return normalizePersonalizationState(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function readBrowserPersonalizationState(): PersonalizationState {
  if (typeof window === "undefined") return emptyPersonalizationState();
  try {
    return parseStored(window.localStorage.getItem(PERSONALIZATION_STORAGE_KEY))
      ?? parseStored(window.localStorage.getItem(LEGACY_PERSONALIZATION_STORAGE_KEY))
      ?? emptyPersonalizationState();
  } catch {
    return emptyPersonalizationState();
  }
}

export function persistBrowserPersonalizationState(state: PersonalizationState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PERSONALIZATION_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event(PERSONALIZATION_CHANGE_EVENT));
  } catch {
    // Storage can be disabled or quota-limited. The current session state remains usable.
  }
}

export function usePersonalization() {
  const [state, setState] = useState<PersonalizationState>(() => readBrowserPersonalizationState());

  useEffect(() => {
    const refresh = () => setState(readBrowserPersonalizationState());
    const onStorage = (event: StorageEvent) => {
      if (event.key === PERSONALIZATION_STORAGE_KEY || event.key === LEGACY_PERSONALIZATION_STORAGE_KEY) refresh();
    };
    window.addEventListener(PERSONALIZATION_CHANGE_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(PERSONALIZATION_CHANGE_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const apply = useCallback((update: (current: PersonalizationState) => PersonalizationState) => {
    setState((current) => {
      const next = update(current);
      persistBrowserPersonalizationState(next);
      return next;
    });
  }, []);

  const toggleSavedPerson = useCallback((snapshot: Omit<SavedPersonSnapshot, "savedAt">) => {
    apply((current) => toggleSavedPersonSnapshot(current, snapshot));
  }, [apply]);

  const removeSaved = useCallback((sourcePeopleId: number) => {
    apply((current) => removeSavedPerson(current, sourcePeopleId));
  }, [apply]);

  const togglePrayer = useCallback((snapshot: PrayerPersonSnapshot) => {
    apply((current) => togglePrayerPerson(current, snapshot));
  }, [apply]);

  const removePrayer = useCallback((sourcePeopleId: number) => {
    apply((current) => removePrayerPerson(current, sourcePeopleId));
  }, [apply]);

  const recordPrayer = useCallback((snapshot: PrayerPersonSnapshot) => {
    apply((current) => recordPrayerForPerson(current, snapshot));
  }, [apply]);

  const recordRecent = useCallback((visit: Omit<RecentVisit, "visitedAt">) => {
    apply((current) => recordRecentVisit(current, visit));
  }, [apply]);

  const clearRecent = useCallback(() => {
    apply(clearRecentVisits);
  }, [apply]);

  return useMemo(() => ({
    state,
    toggleSavedPerson,
    removeSaved,
    togglePrayer,
    removePrayer,
    recordPrayer,
    recordRecent,
    clearRecent,
  }), [state, toggleSavedPerson, removeSaved, togglePrayer, removePrayer, recordPrayer, recordRecent, clearRecent]);
}
