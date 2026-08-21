import { useCallback, useEffect, useMemo, useState } from "preact/hooks";

import {
  clearRecentVisits,
  emptyPersonalizationState,
  normalizePersonalizationState,
  recordRecentVisit,
  removeSavedPerson,
  toggleSavedPersonSnapshot,
} from "./model";
import type { PersonalizationState, RecentVisit, SavedPersonSnapshot } from "./types";

const STORAGE_KEY = "unreached.personal.v1";
const CHANGE_EVENT = "unreached:personalization-change";

function readBrowserState(): PersonalizationState {
  if (typeof window === "undefined") return emptyPersonalizationState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyPersonalizationState();
    return normalizePersonalizationState(JSON.parse(raw) as unknown);
  } catch {
    return emptyPersonalizationState();
  }
}

function persistBrowserState(state: PersonalizationState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Storage can be disabled or quota-limited. The current UI state still updates.
  }
}

export function usePersonalization() {
  const [state, setState] = useState<PersonalizationState>(() => readBrowserState());

  useEffect(() => {
    const refresh = () => setState(readBrowserState());
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) refresh();
    };
    window.addEventListener(CHANGE_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const apply = useCallback((update: (current: PersonalizationState) => PersonalizationState) => {
    const next = update(readBrowserState());
    setState(next);
    persistBrowserState(next);
  }, []);

  const toggleSavedPerson = useCallback((snapshot: Omit<SavedPersonSnapshot, "savedAt">) => {
    apply((current) => toggleSavedPersonSnapshot(current, snapshot));
  }, [apply]);

  const removeSaved = useCallback((sourcePeopleId: number) => {
    apply((current) => removeSavedPerson(current, sourcePeopleId));
  }, [apply]);

  const recordRecent = useCallback((visit: Omit<RecentVisit, "visitedAt">) => {
    apply((current) => recordRecentVisit(current, visit));
  }, [apply]);

  const clearRecent = useCallback(() => {
    apply(clearRecentVisits);
  }, [apply]);

  return useMemo(() => ({ state, toggleSavedPerson, removeSaved, recordRecent, clearRecent }), [state, toggleSavedPerson, removeSaved, recordRecent, clearRecent]);
}
