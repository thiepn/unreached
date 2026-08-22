import type { PeopleGroupsApiRecord } from "./types";

export const PEOPLE_GROUPS_CACHE_DB = "unreached-peoplegroups-v1";
export const PEOPLE_GROUPS_CACHE_STORE = "pages";
export const PEOPLE_GROUPS_CACHE_FRESH_MS = 24 * 60 * 60 * 1000;
export const PEOPLE_GROUPS_CACHE_STALE_MAX_MS = 7 * 24 * 60 * 60 * 1000;

export interface CachedPeopleGroupsPage {
  schemaVersion: 1;
  page: number;
  totalPages: number;
  totalRecords: number | null;
  storedAt: string;
  records: PeopleGroupsApiRecord[];
}

export interface PeopleGroupsPageCache {
  read(page: number): Promise<CachedPeopleGroupsPage | null>;
  write(value: CachedPeopleGroupsPage): Promise<void>;
  clear(): Promise<void>;
}

export function createMemoryPeopleGroupsCache(): PeopleGroupsPageCache {
  const pages = new Map<number, CachedPeopleGroupsPage>();
  return {
    read: async (page) => pages.get(page) ?? null,
    write: async (value) => { pages.set(value.page, structuredClone(value)); },
    clear: async () => { pages.clear(); },
  };
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PEOPLE_GROUPS_CACHE_DB, 1);
    request.onerror = () => reject(request.error ?? new Error("PeopleGroups cache could not be opened."));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PEOPLE_GROUPS_CACHE_STORE)) db.createObjectStore(PEOPLE_GROUPS_CACHE_STORE, { keyPath: "page" });
    };
    request.onsuccess = () => resolve(request.result);
  });
}

export function createIndexedDbPeopleGroupsCache(): PeopleGroupsPageCache {
  if (typeof indexedDB === "undefined") return createMemoryPeopleGroupsCache();

  async function withStore<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await openDb();
    try {
      return await new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(PEOPLE_GROUPS_CACHE_STORE, mode);
        const request = action(transaction.objectStore(PEOPLE_GROUPS_CACHE_STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("PeopleGroups cache operation failed."));
        transaction.onerror = () => reject(transaction.error ?? new Error("PeopleGroups cache transaction failed."));
      });
    } finally {
      db.close();
    }
  }

  return {
    read: async (page) => {
      const value = await withStore<CachedPeopleGroupsPage | undefined>("readonly", (store) => store.get(page));
      return value ?? null;
    },
    write: async (value) => { await withStore<IDBValidKey>("readwrite", (store) => store.put(value)); },
    clear: async () => { await withStore<undefined>("readwrite", (store) => store.clear()); },
  };
}

export function cacheAgeMs(page: CachedPeopleGroupsPage, now = Date.now()): number {
  const stored = Date.parse(page.storedAt);
  return Number.isFinite(stored) ? Math.max(0, now - stored) : Number.POSITIVE_INFINITY;
}
