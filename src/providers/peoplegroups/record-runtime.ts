import { PeopleGroupsApiError, createPeopleGroupsApiClient, type PeopleGroupsApiClient } from "./api";
import {
  PEOPLE_GROUPS_CACHE_FRESH_MS,
  PEOPLE_GROUPS_CACHE_STALE_MAX_MS,
  cacheAgeMs,
  createIndexedDbPeopleGroupsRecordCache,
  type CachedPeopleGroupsRecord,
  type PeopleGroupsRecordCache,
} from "./cache";
import { peopleGroupsApiRecordSchema, type PeopleGroupsApiRecord } from "./types";

export interface PeopleGroupsRecordLoadResult {
  record: PeopleGroupsApiRecord;
  source: "network" | "cache-fresh" | "cache-stale";
  stale: boolean;
  loadedAt: string;
  warning: string | null;
}

export interface PeopleGroupsRecordLoaderOptions {
  client?: PeopleGroupsApiClient;
  cache?: PeopleGroupsRecordCache;
  now?: () => number;
  isOnline?: () => boolean;
}

export function peopleGroupsPgidForRouteKey(routeKey: number): string {
  if (!Number.isInteger(routeKey) || routeKey <= 0) throw new PeopleGroupsApiError("Invalid PeopleGroups.org PEID route key.", "bounds");
  return `PG${String(routeKey).padStart(6, "0")}`;
}

function validatedCachedRecord(
  cached: CachedPeopleGroupsRecord | null,
  routeKey: number,
  pgid: string,
): CachedPeopleGroupsRecord | null {
  if (!cached || cached.schemaVersion !== 1 || cached.pgid !== pgid || !Number.isFinite(Date.parse(cached.storedAt))) return null;
  const parsed = peopleGroupsApiRecordSchema.safeParse(cached.record);
  if (!parsed.success || parsed.data.PGID !== pgid || parsed.data.PEID !== routeKey) return null;
  return { ...cached, record: parsed.data };
}

function cachedResult(cached: CachedPeopleGroupsRecord, stale: boolean, warning: string | null): PeopleGroupsRecordLoadResult {
  return {
    record: cached.record,
    source: stale ? "cache-stale" : "cache-fresh",
    stale,
    loadedAt: cached.storedAt,
    warning,
  };
}

export function createPeopleGroupsRecordLoader(options: PeopleGroupsRecordLoaderOptions = {}) {
  const client = options.client ?? createPeopleGroupsApiClient();
  const cache = options.cache ?? createIndexedDbPeopleGroupsRecordCache();
  const now = options.now ?? Date.now;
  const isOnline = options.isOnline ?? (() => typeof navigator === "undefined" || navigator.onLine !== false);

  async function load(
    routeKey: number,
    params: { signal?: AbortSignal; forceRefresh?: boolean } = {},
  ): Promise<PeopleGroupsRecordLoadResult> {
    const pgid = peopleGroupsPgidForRouteKey(routeKey);
    let cached: CachedPeopleGroupsRecord | null = null;
    try {
      cached = validatedCachedRecord(await cache.read(pgid), routeKey, pgid);
    } catch {
      cached = null;
    }

    const age = cached ? cacheAgeMs(cached, now()) : Number.POSITIVE_INFINITY;
    if (!params.forceRefresh && cached && age <= PEOPLE_GROUPS_CACHE_FRESH_MS) return cachedResult(cached, false, null);

    if (!isOnline()) {
      if (cached) {
        return cachedResult(
          cached,
          age > PEOPLE_GROUPS_CACHE_FRESH_MS,
          age > PEOPLE_GROUPS_CACHE_FRESH_MS
            ? "You are offline. Showing the last validated local PeopleGroups record; it may be out of date and will refresh after reconnection."
            : "You are offline. Showing a recent validated local PeopleGroups record.",
        );
      }
      throw new Error("You are offline and this PeopleGroups record has not been cached in this browser yet.");
    }

    try {
      const record = await client.fetchByPgid(pgid, params.signal);
      if (record.PEID !== routeKey || record.PGID !== pgid) {
        throw new PeopleGroupsApiError(`PeopleGroups.org identity mismatch for PEID ${routeKey} / ${pgid}.`, "schema");
      }
      const loadedAt = new Date(now()).toISOString();
      try {
        await cache.write({ schemaVersion: 1, pgid, storedAt: loadedAt, record });
      } catch {
        // Route-record caching is an optimization; a valid network response remains usable.
      }
      return { record, source: "network", stale: false, loadedAt, warning: null };
    } catch (error) {
      if (error instanceof PeopleGroupsApiError && error.code === "http" && error.status === 404) throw error;
      if (cached && age <= PEOPLE_GROUPS_CACHE_STALE_MAX_MS) {
        return cachedResult(
          cached,
          true,
          "Live PeopleGroups.org data could not be refreshed. Showing a previously validated local record that may be out of date.",
        );
      }
      throw error;
    }
  }

  async function clearCache(): Promise<void> {
    try {
      await cache.clear();
    } catch {
      // Cache is an optimization only.
    }
  }

  return { load, clearCache };
}

export type PeopleGroupsRecordLoader = ReturnType<typeof createPeopleGroupsRecordLoader>;
