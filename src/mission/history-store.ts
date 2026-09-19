import type { PeopleProfileRecord } from "../peoples/profile";
import {
  createPeopleGroupsHistoryObservation,
  mergeMissionHistoryObservations,
  missionHistoryObservationSchema,
  type MissionHistoryObservation,
} from "./history";

export const MISSION_HISTORY_DB = "unreached-mission-history-v1";
export const MISSION_HISTORY_STORE = "peoplegroups-observations";
export const MISSION_HISTORY_LIMIT_PER_RECORD = 24;

const memory = new Map<string, MissionHistoryObservation[]>();

function canUseIndexedDb(): boolean {
  return typeof indexedDB !== "undefined";
}

function openHistoryDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(MISSION_HISTORY_DB, 1);
    request.onerror = () => reject(request.error ?? new Error("Mission history could not be opened."));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MISSION_HISTORY_STORE)) {
        const store = db.createObjectStore(MISSION_HISTORY_STORE, { keyPath: "id" });
        store.createIndex("pgid", "pgid", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function readIndexedHistory(pgid: string): Promise<MissionHistoryObservation[]> {
  const db = await openHistoryDb();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(MISSION_HISTORY_STORE, "readonly");
      const index = transaction.objectStore(MISSION_HISTORY_STORE).index("pgid");
      const request = index.getAll(pgid);
      request.onerror = () => reject(request.error ?? new Error("Mission history could not be read."));
      request.onsuccess = () => {
        try {
          resolve((request.result as unknown[]).map((item) => missionHistoryObservationSchema.parse(item)));
        } catch (error) {
          reject(error);
        }
      };
    });
  } finally {
    db.close();
  }
}

async function replaceIndexedHistory(
  previous: readonly MissionHistoryObservation[],
  next: readonly MissionHistoryObservation[],
): Promise<void> {
  const db = await openHistoryDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(MISSION_HISTORY_STORE, "readwrite");
      const store = transaction.objectStore(MISSION_HISTORY_STORE);
      const keep = new Set(next.map((item) => item.id));
      for (const item of previous) if (!keep.has(item.id)) store.delete(item.id);
      for (const item of next) store.put(item);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Mission history could not be written."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Mission history write was aborted."));
    });
  } finally {
    db.close();
  }
}

export async function readPeopleGroupsHistory(pgid: string): Promise<MissionHistoryObservation[]> {
  if (!canUseIndexedDb()) return structuredClone(memory.get(pgid) ?? []);
  const values = await readIndexedHistory(pgid);
  return values
    .sort((left, right) => Date.parse(right.firstObservedAt) - Date.parse(left.firstObservedAt))
    .slice(0, MISSION_HISTORY_LIMIT_PER_RECORD);
}

export async function recordPeopleGroupsObservation(record: PeopleProfileRecord): Promise<MissionHistoryObservation[]> {
  const context = record.contexts[0]!;
  const incoming = createPeopleGroupsHistoryObservation(record);

  if (!canUseIndexedDb()) {
    const next = mergeMissionHistoryObservations(
      memory.get(context.pgid) ?? [],
      incoming,
      MISSION_HISTORY_LIMIT_PER_RECORD,
    );
    memory.set(context.pgid, structuredClone(next));
    return next;
  }

  const previous = await readIndexedHistory(context.pgid);
  const next = mergeMissionHistoryObservations(previous, incoming, MISSION_HISTORY_LIMIT_PER_RECORD);
  await replaceIndexedHistory(previous, next);
  return next;
}

export async function resetPeopleGroupsHistory(record: PeopleProfileRecord): Promise<MissionHistoryObservation[]> {
  const context = record.contexts[0]!;
  const incoming = createPeopleGroupsHistoryObservation(record);

  if (!canUseIndexedDb()) {
    memory.set(context.pgid, [structuredClone(incoming)]);
    return [incoming];
  }

  const previous = await readIndexedHistory(context.pgid);
  await replaceIndexedHistory(previous, [incoming]);
  return [incoming];
}
