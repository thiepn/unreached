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

async function readCompleteCache(cache: PeopleGroupsPageCache, now: number): Promise<{ pages: CachedPeopleGroupsPage[]; age: number } | null> {
  const first = await cache.read(1);
  if (!first || first.schemaVersion !== 1 || first.totalPages < 1) return null;
  const pages: CachedPeopleGroupsPage[] = [first];
  for (let page = 2; page <= first.totalPages; page += 1) {
    const cached = await cache.read(page);
    if (!cached || cached.schemaVersion !== 1 || cached.totalPages !== first.totalPages || cached.totalRecords !== first.totalRecords) return null;
    pages.push(cached);
  }
  const oldestAge = Math.max(...pages.map((page) => cacheAgeMs(page, now)));
  return { pages, age: oldestAge };
}

function flattenValidated(pages: CachedPeopleGroupsPage[]): PeopleGroupsApiRecord[] {
  return pages.flatMap((page) => peopleGroupsApiPageSchema.parse(page.records));
}

export function createPeopleGroupsCorpusLoader(options: PeopleGroupsCorpusLoaderOptions = {}) {
  const client = options.client ?? createPeopleGroupsApiClient();
  const cache = options.cache ?? createIndexedDbPeopleGroupsCache();
  const now = options.now ?? Date.now;

  async function load(params: { signal?: AbortSignal; forceRefresh?: boolean; onProgress?: (loadedPages: number, totalPages: number) => void } = {}): Promise<PeopleGroupsCorpusLoadResult> {
    const cached = await readCompleteCache(cache, now());
    if (!params.forceRefresh && cached && cached.age <= PEOPLE_GROUPS_CACHE_FRESH_MS) {
      const records = flattenValidated(cached.pages);
      return {
        records,
        source: "cache-fresh",
        stale: false,
        loadedAt: cached.pages[0]!.storedAt,
        totalPages: cached.pages.length,
        totalRecords: records.length,
        warning: null,
      };
    }

    try {
      let totalPages = 0;
      const loadedAt = new Date(now()).toISOString();
      const records = await client.fetchAll({
        signal: params.signal,
        onPage: (page) => {
          totalPages = page.totalPages;
          params.onProgress?.(page.page, page.totalPages);
          void cache.write({
            schemaVersion: 1,
            page: page.page,
            totalPages: page.totalPages,
            totalRecords: page.totalRecords,
            storedAt: loadedAt,
            records: page.records,
          });
        },
      });
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
        const records = flattenValidated(cached.pages);
        return {
          records,
          source: "cache-stale",
          stale: true,
          loadedAt: cached.pages[0]!.storedAt,
          totalPages: cached.pages.length,
          totalRecords: records.length,
          warning: "Live PeopleGroups.org data could not be refreshed. Showing a previously validated local cache that may be out of date.",
        };
      }
      throw error;
    }
  }

  return { load, clearCache: () => cache.clear() };
}

export type PeopleGroupsCorpusLoader = ReturnType<typeof createPeopleGroupsCorpusLoader>;
