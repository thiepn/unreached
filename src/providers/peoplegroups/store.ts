import { useEffect, useState } from "preact/hooks";

import { buildRuntimeCountrySummaries, buildRuntimePeopleEntities, toRuntimePeopleContext } from "./model";
import { createPeopleGroupsCorpusLoader } from "./runtime";
import type {
  PeopleGroupsApiRecord,
  RuntimeCountrySummary,
  RuntimePeopleContext,
  RuntimePeopleEntity,
} from "./types";

export interface PeopleGroupsRuntimeProgress {
  loadedPages: number;
  totalPages: number;
}

export interface PeopleGroupsRuntimeSnapshot {
  loading: boolean;
  ready: boolean;
  error: string | null;
  warning: string | null;
  stale: boolean;
  source: "network" | "cache-fresh" | "cache-stale" | null;
  loadedAt: string | null;
  progress: PeopleGroupsRuntimeProgress | null;
  totalRecords: number;
  records: PeopleGroupsApiRecord[];
  contexts: RuntimePeopleContext[];
  entities: RuntimePeopleEntity[];
  countrySummaries: RuntimeCountrySummary[];
}

const loader = createPeopleGroupsCorpusLoader();
const listeners = new Set<(value: PeopleGroupsRuntimeSnapshot) => void>();

let snapshot: PeopleGroupsRuntimeSnapshot = {
  loading: false,
  ready: false,
  error: null,
  warning: null,
  stale: false,
  source: null,
  loadedAt: null,
  progress: null,
  totalRecords: 0,
  records: [],
  contexts: [],
  entities: [],
  countrySummaries: [],
};

let pendingLoad: Promise<void> | null = null;

function publish(next: PeopleGroupsRuntimeSnapshot): void {
  snapshot = next;
  for (const listener of listeners) listener(snapshot);
}

function patch(values: Partial<PeopleGroupsRuntimeSnapshot>): void {
  publish({ ...snapshot, ...values });
}

export function getPeopleGroupsRuntimeSnapshot(): PeopleGroupsRuntimeSnapshot {
  return snapshot;
}

export function ensurePeopleGroupsRuntime(forceRefresh = false): Promise<void> {
  if (pendingLoad) return pendingLoad;
  if (snapshot.ready && !forceRefresh) return Promise.resolve();

  patch({
    loading: true,
    error: null,
    warning: forceRefresh ? snapshot.warning : null,
    progress: null,
  });

  pendingLoad = loader.load({
    forceRefresh,
    onProgress: (loadedPages, totalPages) => patch({ progress: { loadedPages, totalPages } }),
  })
    .then((result) => {
      const contexts = result.records.map(toRuntimePeopleContext);
      const entities = buildRuntimePeopleEntities(result.records);
      const countrySummaries = buildRuntimeCountrySummaries(result.records);
      publish({
        loading: false,
        ready: true,
        error: null,
        warning: result.warning,
        stale: result.stale,
        source: result.source,
        loadedAt: result.loadedAt,
        progress: null,
        totalRecords: result.totalRecords,
        records: result.records,
        contexts,
        entities,
        countrySummaries,
      });
    })
    .catch((error: unknown) => {
      patch({
        loading: false,
        ready: false,
        error: error instanceof Error ? error.message : "PeopleGroups.org data could not be loaded.",
        warning: null,
        progress: null,
      });
    })
    .finally(() => {
      pendingLoad = null;
    });

  return pendingLoad;
}

export function usePeopleGroupsRuntimeStore(enabled = true): PeopleGroupsRuntimeSnapshot & { retry: () => void } {
  const [state, setState] = useState<PeopleGroupsRuntimeSnapshot>(() => snapshot);

  useEffect(() => {
    listeners.add(setState);
    setState(snapshot);
    if (enabled) void ensurePeopleGroupsRuntime();
    return () => {
      listeners.delete(setState);
    };
  }, [enabled]);

  return {
    ...state,
    retry: () => { void ensurePeopleGroupsRuntime(true); },
  };
}
