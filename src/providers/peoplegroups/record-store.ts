import { useEffect, useState } from "preact/hooks";

import { PeopleGroupsApiError } from "./api";
import { buildRuntimePeopleEntities } from "./model";
import { createPeopleGroupsRecordLoader } from "./record-runtime";
import { getPeopleGroupsRuntimeSnapshot, usePeopleGroupsRuntimeStore } from "./store";
import type { RuntimePeopleEntity } from "./types";

export type PeopleGroupsRouteRecordSource = "network" | "cache-fresh" | "cache-stale" | "corpus" | null;

export interface PeopleGroupsRouteRecordSnapshot {
  routeKey: number;
  loading: boolean;
  ready: boolean;
  notFound: boolean;
  error: string | null;
  warning: string | null;
  stale: boolean;
  source: PeopleGroupsRouteRecordSource;
  loadedAt: string | null;
  entity: RuntimePeopleEntity | null;
}

const loader = createPeopleGroupsRecordLoader();
const states = new Map<number, PeopleGroupsRouteRecordSnapshot>();
const pending = new Map<number, Promise<void>>();
const listeners = new Map<number, Set<(value: PeopleGroupsRouteRecordSnapshot) => void>>();

function emptyState(routeKey: number): PeopleGroupsRouteRecordSnapshot {
  return {
    routeKey,
    loading: false,
    ready: false,
    notFound: false,
    error: null,
    warning: null,
    stale: false,
    source: null,
    loadedAt: null,
    entity: null,
  };
}

function currentState(routeKey: number): PeopleGroupsRouteRecordSnapshot {
  return states.get(routeKey) ?? emptyState(routeKey);
}

function publish(routeKey: number, next: PeopleGroupsRouteRecordSnapshot): void {
  states.set(routeKey, next);
  for (const listener of listeners.get(routeKey) ?? []) listener(next);
}

function canonicalFromCorpus(routeKey: number): PeopleGroupsRouteRecordSnapshot | null {
  const corpus = getPeopleGroupsRuntimeSnapshot();
  if (!corpus.ready) return null;
  const entity = corpus.peopleByRouteKey.get(routeKey) ?? null;
  return {
    routeKey,
    loading: false,
    ready: Boolean(entity),
    notFound: !entity,
    error: null,
    warning: corpus.warning,
    stale: corpus.stale,
    source: "corpus",
    loadedAt: corpus.loadedAt,
    entity,
  };
}

function identityMatches(a: RuntimePeopleEntity, b: RuntimePeopleEntity): boolean {
  return a.peid === b.peid
    && a.routeKey === b.routeKey
    && a.contexts[0]?.pgid === b.contexts[0]?.pgid;
}

export function getPeopleGroupsRouteRecordSnapshot(routeKey: number): PeopleGroupsRouteRecordSnapshot {
  return canonicalFromCorpus(routeKey) ?? currentState(routeKey);
}

export function ensurePeopleGroupsRouteRecord(routeKey: number, forceRefresh = false): Promise<void> {
  const canonical = canonicalFromCorpus(routeKey);
  if (canonical) {
    publish(routeKey, canonical);
    return Promise.resolve();
  }

  const existingPending = pending.get(routeKey);
  if (existingPending) return existingPending;

  const existing = currentState(routeKey);
  if (!forceRefresh && existing.ready && existing.entity && !existing.stale) return Promise.resolve();

  publish(routeKey, { ...existing, loading: true, notFound: false, error: null });
  const request = loader.load(routeKey, { forceRefresh })
    .then((result) => {
      const entity = buildRuntimePeopleEntities([result.record])[0] ?? null;
      if (!entity || entity.routeKey !== routeKey) throw new Error(`PeopleGroups.org record ${routeKey} could not be materialized safely.`);
      publish(routeKey, {
        routeKey,
        loading: false,
        ready: true,
        notFound: false,
        error: null,
        warning: result.warning,
        stale: result.stale,
        source: result.source,
        loadedAt: result.loadedAt,
        entity,
      });
    })
    .catch((error: unknown) => {
      if (error instanceof PeopleGroupsApiError && error.code === "http" && error.status === 404) {
        publish(routeKey, {
          ...emptyState(routeKey),
          notFound: true,
          source: "network",
        });
        return;
      }
      publish(routeKey, {
        ...emptyState(routeKey),
        error: error instanceof Error ? error.message : "PeopleGroups.org record could not be loaded.",
      });
    })
    .finally(() => {
      pending.delete(routeKey);
    });

  pending.set(routeKey, request);
  return request;
}

export function usePeopleGroupsRouteRecord(routeKey: number, enabled = true): PeopleGroupsRouteRecordSnapshot & { retry: () => void } {
  const corpus = usePeopleGroupsRuntimeStore(false);
  const [routeState, setRouteState] = useState<PeopleGroupsRouteRecordSnapshot>(() => currentState(routeKey));

  useEffect(() => {
    const set = listeners.get(routeKey) ?? new Set<(value: PeopleGroupsRouteRecordSnapshot) => void>();
    set.add(setRouteState);
    listeners.set(routeKey, set);
    setRouteState(currentState(routeKey));
    if (enabled) void ensurePeopleGroupsRouteRecord(routeKey);
    return () => {
      const current = listeners.get(routeKey);
      current?.delete(setRouteState);
      if (current && current.size === 0) listeners.delete(routeKey);
    };
  }, [routeKey, enabled]);

  if (corpus.ready) {
    const corpusEntity = corpus.peopleByRouteKey.get(routeKey) ?? null;
    if (corpusEntity) {
      if (routeState.entity && !identityMatches(routeState.entity, corpusEntity)) {
        return {
          ...routeState,
          loading: false,
          ready: false,
          notFound: false,
          error: `PeopleGroups.org route identity changed for PEID ${routeKey}; refusing to combine mismatched record generations.`,
          entity: null,
          retry: () => { void ensurePeopleGroupsRouteRecord(routeKey, true); },
        };
      }
      return {
        routeKey,
        loading: false,
        ready: true,
        notFound: false,
        error: null,
        warning: corpus.warning,
        stale: corpus.stale,
        source: "corpus",
        loadedAt: corpus.loadedAt,
        entity: corpusEntity,
        retry: () => { void ensurePeopleGroupsRouteRecord(routeKey, true); },
      };
    }
    return {
      ...emptyState(routeKey),
      notFound: true,
      source: "corpus",
      loadedAt: corpus.loadedAt,
      retry: () => { void ensurePeopleGroupsRouteRecord(routeKey, true); },
    };
  }

  return {
    ...routeState,
    retry: () => { void ensurePeopleGroupsRouteRecord(routeKey, true); },
  };
}
