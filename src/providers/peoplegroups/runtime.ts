import { createPeopleGroupsApiClient, type PeopleGroupsApiClient } from "./api";
import {
  PEOPLE_GROUPS_CACHE_FRESH_MS,
  PEOPLE_GROUPS_CACHE_STALE_MAX_MS,
  cacheAgeMs,
  createIndexedDbPeopleGroupsCache,
  type CachedPeopleGroupsPage,
  type PeopleGroupsPageCache,
} from "./cache";
import { peopleGroupsApiPageSchema, type PeopleGroupsApiRecord } from "./types";

export interface PeopleGroupsCorpusLoadResult {
  records: PeopleGroupsApiRecord[];
  source: "network" | "cache-fresh" | "cache-stale";
  stale: boolean;
  loadedAt: string;
  totalPages: number;
  totalRecords: number;
  warning: string | null;
}

export interface PeopleGroupsCorpusLoaderOptions {
  client?: PeopleGroupsApiClient;
  cache?: PeopleGroupsPageCache;
  now?: () => number;
  isOnline?: () => boolean;
}

interface ValidatedCache {
  pages: CachedPeopleGroupsPage[];
  records: PeopleGroupsApiRecord[];
  age: number;
}

async function readCompleteCache(cache: PeopleGroupsPageCache, now: number): Promise<{ pages: CachedPeopleGroupsPage[]; age: number } | null> {
  const first = await cache.read(1);
  if (!first || first.schemaVersion !== 1 || first.totalPages < 1) return null;

  const remaining = first.totalPages > 1
    ? await Promise.all(Array.from({ length: first.totalPages - 1 }, (_, index) => cache.read(index + 2)))
    : [];
  const pages: CachedPeopleGroupsPage[] = [first];

  for (let index = 0; index < remaining.length; index += 1) {
    const pageNumber = index + 2;
    const cached = remaining[index];
    if (
      !cached
      || cached.schemaVersion !== 1
      || cached.page !== pageNumber
      || cached.totalPages !== first.totalPages
      || cached.totalRecords !== first.totalRecords
      || cached.storedAt !== first.storedAt
    ) return null;
    pages.push(cached);
  }

  const oldestAge = Math.max(...pages.map((page) => cacheAgeMs(page, now)));
  return { pages, age: oldestAge };
}

function flattenValidated(pages: CachedPeopleGroupsPage[]): PeopleGroupsApiRecord[] {
  return pages.flatMap((page) => peopleGroupsApiPageSchema.parse(page.records));
}

async function readValidatedCache(cache: PeopleGroupsPageCache, now: number): Promise<ValidatedCache | null> {
  try {
    const cached = await readCompleteCache(cache, now);
    if (!cached) return null;
    const records = flattenValidated(cached.pages);
    const expectedRecords = cached.pages[0]?.totalRecords ?? null;
    if (expectedRecords !== null && records.length !== expectedRecords) return null;
    const pgids = new Set(records.map((record) => record.PGID));
    if (pgids.size !== records.length) return null;
    return { ...cached, records };
  } catch {
    return null;
  }
}

function cacheResult(cached: ValidatedCache, stale: boolean, warning: string | null): PeopleGroupsCorpusLoadResult {
  return {
    records: cached.records,
    source: stale ? "cache-stale" : "cache-fresh",
    stale,
    loadedAt: cached.pages[0]!.storedAt,
    totalPages: cached.pages.length,
    totalRecords: cached.records.length,
    warning,
  };
}

export function createPeopleGroupsCorpusLoader(options: PeopleGroupsCorpusLoaderOptions = {}) {
  const client = options.client ?? createPeopleGroupsApiClient();
  const cache = options.cache ?? createIndexedDbPeopleGroupsCache();
  const now = options.now ?? Date.now;
  const isOnline = options.isOnline ?? (() => typeof navigator === "undefined" || navigator.onLine !== false);

  async function load(params: { signal?: AbortSignal; forceRefresh?: boolean; onProgress?: (loadedPages: number, totalPages: number) => void } = {}): Promise<PeopleGroupsCorpusLoadResult> {
    const cached = await readValidatedCache(cache, now());
    if (!params.forceRefresh && cached && cached.age <= PEOPLE_GROUPS_CACHE_FRESH_MS) {
      return cacheResult(cached, false, null);
    }

    if (!isOnline()) {
      if (cached) {
        const stale = cached.age > PEOPLE_GROUPS_CACHE_FRESH_MS;
        return cacheResult(
          cached,
          stale,
          stale
            ? "You are offline. Showing the last fully validated local PeopleGroups snapshot; it may be out of date and will be refreshed after reconnection."
            : "You are offline. Showing a recent fully validated local PeopleGroups snapshot.",
        );
      }
      throw new Error("You are offline and no validated PeopleGroups cache is available yet. Reconnect once to prepare mission data for offline return.");
    }

    try {
      let totalPages = 0;
      const loadedAt = new Date(now()).toISOString();
      const pendingCachePages: CachedPeopleGroupsPage[] = [];
      const records = await client.fetchAll({
        signal: params.signal,
        onPage: (page) => {
          totalPages = page.totalPages;
          params.onProgress?.(page.page, page.totalPages);
          pendingCachePages.push({
            schemaVersion: 1,
            page: page.page,
            totalPages: page.totalPages,
            totalRecords: page.totalRecords,
            storedAt: loadedAt,
            records: page.records,
          });
        },
      });

      await Promise.allSettled(pendingCachePages.map((page) => cache.write(page)));

      return {
        records,
        source: "network",
        stale: false,
        loadedAt,
        totalPages,
        totalRecords: records.length,
        warning: null,
      };
    } catch (error) {
      if (cached && cached.age <= PEOPLE_GROUPS_CACHE_STALE_MAX_MS) {
        return cacheResult(
          cached,
          true,
          "Live PeopleGroups.org data could not be refreshed. Showing a previously validated local cache that may be out of date.",
        );
      }
      throw error;
    }
  }

  async function clearCache(): Promise<void> {
    try {
      await cache.clear();
    } catch {
      // Cache is an optimization only. Storage failures must not break runtime data access.
    }
  }

  return { load, clearCache };
}

export type PeopleGroupsCorpusLoader = ReturnType<typeof createPeopleGroupsCorpusLoader>;
