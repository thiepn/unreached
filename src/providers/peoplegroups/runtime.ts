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
}

interface ValidatedCache {
  pages: CachedPeopleGroupsPage[];
  records: PeopleGroupsApiRecord[];
  age: number;
}

async function readCompleteCache(cache: PeopleGroupsPageCache, now: number): Promise<{ pages: CachedPeopleGroupsPage[]; age: number } | null> {
  const first = await cache.read(1);
  if (!first || first.schemaVersion !== 1 || first.totalPages < 1) return null;
  const pages: CachedPeopleGroupsPage[] = [first];
  for (let page = 2; page <= first.totalPages; page += 1) {
    const cached = await cache.read(page);
    if (
      !cached
      || cached.schemaVersion !== 1
      || cached.page !== page
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

export function createPeopleGroupsCorpusLoader(options: PeopleGroupsCorpusLoaderOptions = {}) {
  const client = options.client ?? createPeopleGroupsApiClient();
  const cache = options.cache ?? createIndexedDbPeopleGroupsCache();
  const now = options.now ?? Date.now;

  async function load(params: { signal?: AbortSignal; forceRefresh?: boolean; onProgress?: (loadedPages: number, totalPages: number) => void } = {}): Promise<PeopleGroupsCorpusLoadResult> {
    const cached = await readValidatedCache(cache, now());
    if (!params.forceRefresh && cached && cached.age <= PEOPLE_GROUPS_CACHE_FRESH_MS) {
      return {
        records: cached.records,
        source: "cache-fresh",
        stale: false,
        loadedAt: cached.pages[0]!.storedAt,
        totalPages: cached.pages.length,
        totalRecords: cached.records.length,
        warning: null,
      };
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

      // The live corpus is authoritative. Cache writes begin only after the entire
      // provider snapshot has passed schema, pagination, count, and duplicate checks.
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
        return {
          records: cached.records,
          source: "cache-stale",
          stale: true,
          loadedAt: cached.pages[0]!.storedAt,
          totalPages: cached.pages.length,
          totalRecords: cached.records.length,
          warning: "Live PeopleGroups.org data could not be refreshed. Showing a previously validated local cache that may be out of date.",
        };
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
