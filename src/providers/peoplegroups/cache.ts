import type {
  PeopleGroupsApiRecord,
  RuntimeCountrySummary,
  RuntimePeopleContext,
  RuntimePeopleEntity,
} from "./types";

export const PEOPLE_GROUPS_CACHE_DB = "unreached-peoplegroups-v1";
export const PEOPLE_GROUPS_CACHE_STORE = "pages";
export const PEOPLE_GROUPS_PREPARED_STORE = "prepared";
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

export interface PreparedPeopleGroupsSnapshot {
  schemaVersion: 1;
  key: "active";
  storedAt: string;
  totalPages: number;
  totalRecords: number;
  records: PeopleGroupsApiRecord[];
  contexts: RuntimePeopleContext[];
  entities: RuntimePeopleEntity[];
  countrySummaries: RuntimeCountrySummary[];
}

export interface PeopleGroupsPageCache {
  read(page: number): Promise<CachedPeopleGroupsPage | null>;
  write(value: CachedPeopleGroupsPage): Promise<void>;
  clear(): Promise<void>;
}

export interface PreparedPeopleGroupsCache {
  read(): Promise<PreparedPeopleGroupsSnapshot | null>;
  write(value: PreparedPeopleGroupsSnapshot): Promise<void>;
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

export function createMemoryPreparedPeopleGroupsCache(): PreparedPeopleGroupsCache {
  let active: PreparedPeopleGroupsSnapshot | null = null;
  return {
    read: async () => active ? structuredClone(active) : null,
    write: async (value) => { active = structuredClone(value); },
    clear: async () => { active = null; },
  };
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PEOPLE_GROUPS_CACHE_DB, 2);
    request.onerror = () => reject(request.error ?? new Error("PeopleGroups cache could not be opened."));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PEOPLE_GROUPS_CACHE_STORE)) db.createObjectStore(PEOPLE_GROUPS_CACHE_STORE, { keyPath: "page" });
      if (!db.objectStoreNames.contains(PEOPLE_GROUPS_PREPARED_STORE)) db.createObjectStore(PEOPLE_GROUPS_PREPARED_STORE, { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const request = action(transaction.objectStore(storeName));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("PeopleGroups cache operation failed."));
      transaction.onerror = () => reject(transaction.error ?? new Error("PeopleGroups cache transaction failed."));
    });
  } finally {
    db.close();
  }
}

export function createIndexedDbPeopleGroupsCache(): PeopleGroupsPageCache {
  if (typeof indexedDB === "undefined") return createMemoryPeopleGroupsCache();

  return {
    read: async (page) => {
      const value = await withStore<CachedPeopleGroupsPage | undefined>(PEOPLE_GROUPS_CACHE_STORE, "readonly", (store) => store.get(page));
      return value ?? null;
    },
    write: async (value) => { await withStore<IDBValidKey>(PEOPLE_GROUPS_CACHE_STORE, "readwrite", (store) => store.put(value)); },
    clear: async () => { await withStore<undefined>(PEOPLE_GROUPS_CACHE_STORE, "readwrite", (store) => store.clear()); },
  };
}

export function createIndexedDbPreparedPeopleGroupsCache(): PreparedPeopleGroupsCache {
  if (typeof indexedDB === "undefined") return createMemoryPreparedPeopleGroupsCache();

  return {
    read: async () => {
      const value = await withStore<PreparedPeopleGroupsSnapshot | undefined>(PEOPLE_GROUPS_PREPARED_STORE, "readonly", (store) => store.get("active"));
      return value ?? null;
    },
    write: async (value) => { await withStore<IDBValidKey>(PEOPLE_GROUPS_PREPARED_STORE, "readwrite", (store) => store.put(value)); },
    clear: async () => { await withStore<undefined>(PEOPLE_GROUPS_PREPARED_STORE, "readwrite", (store) => store.clear()); },
  };
}

export function preparedPeopleGroupsSnapshotIsUsable(value: PreparedPeopleGroupsSnapshot | null): value is PreparedPeopleGroupsSnapshot {
  if (!value || value.schemaVersion !== 1 || value.key !== "active") return false;
  if (!Number.isFinite(Date.parse(value.storedAt))) return false;
  if (!Number.isInteger(value.totalPages) || value.totalPages < 1) return false;
  if (!Number.isInteger(value.totalRecords) || value.totalRecords < 1) return false;
  if (!Array.isArray(value.records) || value.records.length !== value.totalRecords) return false;
  if (!Array.isArray(value.contexts) || value.contexts.length !== value.totalRecords) return false;
  if (!Array.isArray(value.entities) || !value.entities.length) return false;
  if (!Array.isArray(value.countrySummaries) || !value.countrySummaries.length) return false;

  const pgids = new Set<string>();
  for (const record of value.records) {
    if (!record || typeof record.PGID !== "string" || !/^PG[0-9]+$/.test(record.PGID) || pgids.has(record.PGID)) return false;
    pgids.add(record.PGID);
  }
  return pgids.size === value.totalRecords;
}

export function cacheAgeMs(value: { storedAt: string }, now = Date.now()): number {
  const stored = Date.parse(value.storedAt);
  return Number.isFinite(stored) ? Math.max(0, now - stored) : Number.POSITIVE_INFINITY;
}
