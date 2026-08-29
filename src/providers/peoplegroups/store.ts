import { useEffect, useState } from "preact/hooks";

import {
  PEOPLE_GROUPS_CACHE_FRESH_MS,
  PEOPLE_GROUPS_CACHE_STALE_MAX_MS,
  cacheAgeMs,
  createIndexedDbPreparedPeopleGroupsCache,
  preparedPeopleGroupsSnapshotIsUsable,
  type PreparedPeopleGroupsSnapshot,
} from "./cache";
import { buildRuntimeCountrySummaries, buildRuntimePeopleEntities, toRuntimePeopleContext } from "./model";
import { createEmptyRuntimePeopleSearchIndex, getRuntimePeopleSearchIndex, type RuntimePeopleSearchIndex } from "./search-index";
import { createPeopleGroupsCorpusLoader, type PeopleGroupsCorpusLoadResult } from "./runtime";
import { buildVisibleCountryRecords, type VisibleCountryRecord } from "./visible";
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

interface SharedPeopleGroupsDerivedData {
  peopleByRouteKey: Map<number, RuntimePeopleEntity>;
  peopleByPeid: Map<number, RuntimePeopleEntity>;
  peopleSearchIndex: RuntimePeopleSearchIndex;
  countries: VisibleCountryRecord[];
  countriesByIso3: Map<string, VisibleCountryRecord>;
  eligiblePrayerPeople: RuntimePeopleEntity[];
  eligiblePrayerIds: Set<number>;
}

interface PeopleGroupsPreviewData {
  previewReady: boolean;
  previewRecordCount: number;
  previewEntities: RuntimePeopleEntity[];
  previewPeopleSearchIndex: RuntimePeopleSearchIndex;
}

export interface PeopleGroupsRuntimeSnapshot extends SharedPeopleGroupsDerivedData, PeopleGroupsPreviewData {
  generation: number;
  loading: boolean;
  refreshing: boolean;
  ready: boolean;
  hydrated: boolean;
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
const preparedCache = createIndexedDbPreparedPeopleGroupsCache();
const listeners = new Set<(value: PeopleGroupsRuntimeSnapshot) => void>();

function emptyDerivedData(): SharedPeopleGroupsDerivedData {
  return {
    peopleByRouteKey: new Map(),
    peopleByPeid: new Map(),
    peopleSearchIndex: createEmptyRuntimePeopleSearchIndex(),
    countries: [],
    countriesByIso3: new Map(),
    eligiblePrayerPeople: [],
    eligiblePrayerIds: new Set(),
  };
}

function emptyPreviewData(): PeopleGroupsPreviewData {
  return {
    previewReady: false,
    previewRecordCount: 0,
    previewEntities: [],
    previewPeopleSearchIndex: createEmptyRuntimePeopleSearchIndex(),
  };
}

export function buildSharedPeopleGroupsDerivedData(
  contexts: RuntimePeopleContext[],
  entities: RuntimePeopleEntity[],
  countrySummaries: RuntimeCountrySummary[],
): SharedPeopleGroupsDerivedData {
  const countries = buildVisibleCountryRecords(contexts, countrySummaries);
  const peopleSearchIndex = getRuntimePeopleSearchIndex(entities);
  const eligiblePrayerPeople = entities.filter((entity) => entity.reach.unreachedContexts === 1);
  return {
    peopleByRouteKey: new Map(entities.map((entity) => [entity.routeKey, entity])),
    peopleByPeid: new Map(entities.map((entity) => [entity.peid, entity])),
    peopleSearchIndex,
    countries,
    countriesByIso3: new Map(countries.map((country) => [country.iso3, country])),
    eligiblePrayerPeople,
    eligiblePrayerIds: new Set(eligiblePrayerPeople.map((entity) => entity.routeKey)),
  };
}

let snapshot: PeopleGroupsRuntimeSnapshot = {
  generation: 0,
  loading: false,
  refreshing: false,
  ready: false,
  hydrated: false,
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
  ...emptyDerivedData(),
  ...emptyPreviewData(),
};

let pendingLoad: Promise<void> | null = null;
let hydrationPromise: Promise<boolean> | null = null;
let hydrationAttempted = false;
let reconnectRefreshInstalled = false;

function publish(next: PeopleGroupsRuntimeSnapshot): void {
  snapshot = next;
  for (const listener of listeners) listener(snapshot);
}

function patch(values: Partial<PeopleGroupsRuntimeSnapshot>): void {
  publish({ ...snapshot, ...values });
}

function isOnline(): boolean {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

function materialize(records: PeopleGroupsApiRecord[]) {
  const contexts = records.map(toRuntimePeopleContext);
  const entities = buildRuntimePeopleEntities(records);
  const countrySummaries = buildRuntimeCountrySummaries(records);
  return {
    records,
    contexts,
    entities,
    countrySummaries,
    ...buildSharedPeopleGroupsDerivedData(contexts, entities, countrySummaries),
  };
}

function materializePreview(records: readonly PeopleGroupsApiRecord[]): PeopleGroupsPreviewData {
  const previewRecords = [...records];
  const previewEntities = buildRuntimePeopleEntities(previewRecords);
  return {
    previewReady: previewEntities.length > 0,
    previewRecordCount: previewRecords.length,
    previewEntities,
    previewPeopleSearchIndex: getRuntimePeopleSearchIndex(previewEntities),
  };
}

function preparedFromResult(
  result: PeopleGroupsCorpusLoadResult,
  materialized: ReturnType<typeof materialize>,
): PreparedPeopleGroupsSnapshot {
  return {
    schemaVersion: 1,
    key: "active",
    storedAt: result.loadedAt,
    totalPages: result.totalPages,
    totalRecords: result.totalRecords,
    records: materialized.records,
    contexts: materialized.contexts,
    entities: materialized.entities,
    countrySummaries: materialized.countrySummaries,
  };
}

async function persistPrepared(result: PeopleGroupsCorpusLoadResult, materialized: ReturnType<typeof materialize>): Promise<void> {
  try {
    await preparedCache.write(preparedFromResult(result, materialized));
  } catch {
    // The prepared snapshot is a performance optimization. The validated page cache remains the recovery source.
  }
}

async function hydratePreparedSnapshot(): Promise<boolean> {
  if (snapshot.ready) return true;
  if (hydrationAttempted && !hydrationPromise) return false;
  if (hydrationPromise) return hydrationPromise;

  hydrationAttempted = true;
  hydrationPromise = (async () => {
    try {
      const prepared = await preparedCache.read();
      if (!preparedPeopleGroupsSnapshotIsUsable(prepared)) return false;

      const age = cacheAgeMs(prepared);
      const online = isOnline();
      if (online && age > PEOPLE_GROUPS_CACHE_STALE_MAX_MS) return false;

      const stale = age > PEOPLE_GROUPS_CACHE_FRESH_MS;
      const derived = buildSharedPeopleGroupsDerivedData(prepared.contexts, prepared.entities, prepared.countrySummaries);
      publish({
        generation: snapshot.generation + 1,
        loading: false,
        refreshing: false,
        ready: true,
        hydrated: true,
        error: null,
        warning: stale
          ? online
            ? "Showing the last fully validated local PeopleGroups snapshot while fresh source data updates in the background."
            : "You are offline. Showing the last fully validated local PeopleGroups snapshot; it may be out of date and will refresh after reconnection."
          : null,
        stale,
        source: stale ? "cache-stale" : "cache-fresh",
        loadedAt: prepared.storedAt,
        progress: null,
        totalRecords: prepared.totalRecords,
        records: prepared.records,
        contexts: prepared.contexts,
        entities: prepared.entities,
        countrySummaries: prepared.countrySummaries,
        ...derived,
        ...emptyPreviewData(),
      });
      return true;
    } catch {
      return false;
    }
  })().finally(() => {
    hydrationPromise = null;
  });

  return hydrationPromise;
}

function refreshFromSource(forceRefresh: boolean): Promise<void> {
  if (pendingLoad) return pendingLoad;

  const blocking = !snapshot.ready;
  patch({
    loading: blocking,
    refreshing: !blocking,
    error: blocking ? null : snapshot.error,
    progress: null,
    ...(blocking ? emptyPreviewData() : {}),
  });

  pendingLoad = loader.load({
    forceRefresh,
    onProgress: (loadedPages, totalPages) => patch({ progress: { loadedPages, totalPages } }),
    onPartial: blocking
      ? (records, loadedPages, totalPages) => {
          if (snapshot.ready) return;
          patch({
            ...materializePreview(records),
            progress: { loadedPages, totalPages },
          });
        }
      : undefined,
  })
    .then((result) => {
      const materialized = materialize(result.records);
      publish({
        generation: snapshot.generation + 1,
        loading: false,
        refreshing: false,
        ready: true,
        hydrated: true,
        error: null,
        warning: result.warning,
        stale: result.stale,
        source: result.source,
        loadedAt: result.loadedAt,
        progress: null,
        totalRecords: result.totalRecords,
        ...materialized,
        ...emptyPreviewData(),
      });
      void persistPrepared(result, materialized);
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "PeopleGroups.org data could not be loaded.";
      if (snapshot.ready) {
        patch({
          loading: false,
          refreshing: false,
          error: null,
          warning: snapshot.warning ?? `Live PeopleGroups.org data could not be refreshed. ${message}`,
          progress: null,
        });
        return;
      }
      patch({
        loading: false,
        refreshing: false,
        ready: false,
        hydrated: true,
        error: message,
        warning: null,
        progress: null,
        ...emptyPreviewData(),
      });
    })
    .finally(() => {
      pendingLoad = null;
    });

  return pendingLoad;
}

export function getPeopleGroupsRuntimeSnapshot(): PeopleGroupsRuntimeSnapshot {
  return snapshot;
}

export async function ensurePeopleGroupsRuntime(forceRefresh = false): Promise<void> {
  if (forceRefresh) {
    await hydratePreparedSnapshot();
    await refreshFromSource(true);
    return;
  }

  if (snapshot.ready) {
    if (snapshot.stale && isOnline() && !pendingLoad) void refreshFromSource(true);
    return;
  }

  const hydrated = await hydratePreparedSnapshot();
  if (hydrated) {
    if (snapshot.stale && isOnline() && !pendingLoad) void refreshFromSource(true);
    return;
  }

  await refreshFromSource(false);
}

export function warmPeopleGroupsRuntime(): void {
  void hydratePreparedSnapshot();
}

export function installPeopleGroupsReconnectRefresh(): void {
  if (reconnectRefreshInstalled || typeof window === "undefined") return;
  reconnectRefreshInstalled = true;
  window.addEventListener("online", () => {
    if (pendingLoad) return;
    if (snapshot.error || snapshot.stale || snapshot.source === "cache-fresh" || snapshot.source === "cache-stale") {
      void ensurePeopleGroupsRuntime(true);
    }
  });
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
