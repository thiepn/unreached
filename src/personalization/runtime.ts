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

// If durable browser storage is unavailable, retain the newest state in memory for
// this tab. This is intentionally only a fallback: successful localStorage writes
// remain the durable source of truth and continue to synchronize across tabs.
let memoryFallbackState: PersonalizationState | null = null;

function parseStored(raw: string | null): PersonalizationState | null {
  if (!raw) return null;
  try {
    return normalizePersonalizationState(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

function readDurablePersonalizationState(): PersonalizationState | null {
  try {
    return parseStored(window.localStorage.getItem(PERSONALIZATION_STORAGE_KEY))
      ?? parseStored(window.localStorage.getItem(LEGACY_PERSONALIZATION_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function readBrowserPersonalizationState(): PersonalizationState {
  if (typeof window === "undefined") return emptyPersonalizationState();
  return memoryFallbackState ?? readDurablePersonalizationState() ?? emptyPersonalizationState();
}

export function persistBrowserPersonalizationState(state: PersonalizationState): void {
  if (typeof window === "undefined") return;

  // Install the in-memory value before attempting durable persistence so every
  // hook and the sync runtime can observe the same update even if setItem throws.
  memoryFallbackState = state;
  try {
    window.localStorage.setItem(PERSONALIZATION_STORAGE_KEY, JSON.stringify(state));
    memoryFallbackState = null;
  } catch {
    // Storage can be disabled or quota-limited. The current tab keeps using the
    // in-memory state; persistence and cross-tab continuity resume on later writes.
  } finally {
    // The event is session-state propagation, not proof of durable persistence.
    window.dispatchEvent(new Event(PERSONALIZATION_CHANGE_EVENT));
  }
}

export function usePersonalization() {
  const [state, setState] = useState<PersonalizationState>(() => readBrowserPersonalizationState());

  useEffect(() => {
    const refresh = () => setState(readBrowserPersonalizationState());
    const onStorage = (event: StorageEvent) => {
      if (event.key !== PERSONALIZATION_STORAGE_KEY && event.key !== LEGACY_PERSONALIZATION_STORAGE_KEY) return;
      // A durable change from another tab becomes authoritative unless this tab is
      // currently carrying a newer value solely because its own writes are blocked.
      if (memoryFallbackState === null) refresh();
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
