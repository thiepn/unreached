import {
  PERSONALIZATION_CHANGE_EVENT,
  persistBrowserPersonalizationState,
  readBrowserPersonalizationState,
} from "../personalization/runtime";
import type { PersonalizationState, PrayerListEntry, SavedPersonSnapshot } from "../personalization/types";
import {
  deleteRemoteAccount,
  getRemoteSyncState,
  pushRemoteMutations,
  type SyncApiError,
} from "./client";
import type { LocalSyncState, SyncItem, SyncKind, SyncMutation, SyncRuntimeStatus, SyncSnapshot } from "./types";

export const SYNC_STORAGE_KEY = "unreached.sync.v1";
export const SYNC_CHANGE_EVENT = "unreached:sync-change";

let applyingRemoteState = false;
let inFlight: Promise<void> | null = null;
let scheduled: number | null = null;

function emptySyncState(): LocalSyncState {
  return {
    version: 1,
    enabled: false,
    accountEmail: null,
    lastServerRevision: 0,
    mirror: {},
    pending: [],
    lastSyncedAt: null,
    lastError: null,
  };
}

function syncKey(kind: SyncKind, sourcePeopleId: number): string {
  return `${kind}:${sourcePeopleId}`;
}

function isSyncState(value: unknown): value is LocalSyncState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LocalSyncState>;
  return candidate.version === 1
    && typeof candidate.enabled === "boolean"
    && Array.isArray(candidate.pending)
    && Boolean(candidate.mirror && typeof candidate.mirror === "object");
}

export function readLocalSyncState(): LocalSyncState {
  if (typeof window === "undefined") return emptySyncState();
  try {
    const raw = window.localStorage.getItem(SYNC_STORAGE_KEY);
    if (!raw) return emptySyncState();
    const parsed = JSON.parse(raw) as unknown;
    return isSyncState(parsed) ? parsed : emptySyncState();
  } catch {
    return emptySyncState();
  }
}

function persistLocalSyncState(state: LocalSyncState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event(SYNC_CHANGE_EVENT));
  } catch {
    // Private sync is optional. Local personalization remains the source of truth if storage is unavailable.
  }
}

function mirrorFromSnapshot(snapshot: SyncSnapshot): Record<string, SyncItem> {
  return Object.fromEntries(snapshot.items.map((item) => [syncKey(item.kind, item.sourcePeopleId), item]));
}

function latestTimestamp(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return Date.parse(a) >= Date.parse(b) ? a : b;
}

function mergeRemoteIntoPersonalization(current: PersonalizationState, snapshot: SyncSnapshot): PersonalizationState {
  let savedPeoples = [...current.savedPeoples];
  let prayerList = [...current.prayerList];

  for (const item of snapshot.items) {
    if (item.kind === "saved") {
      const existing = savedPeoples.find((person) => person.sourcePeopleId === item.sourcePeopleId);
      savedPeoples = savedPeoples.filter((person) => person.sourcePeopleId !== item.sourcePeopleId);
      if (item.present && item.payload && "savedAt" in item.payload) {
        const remote = item.payload as SavedPersonSnapshot;
        savedPeoples.push(existing && Date.parse(existing.savedAt) > Date.parse(remote.savedAt) ? existing : remote);
      }
      continue;
    }

    const existing = prayerList.find((person) => person.sourcePeopleId === item.sourcePeopleId);
    prayerList = prayerList.filter((person) => person.sourcePeopleId !== item.sourcePeopleId);
    if (item.present && item.payload && "addedAt" in item.payload) {
      const remote = item.payload as PrayerListEntry;
      prayerList.push({
        ...remote,
        lastPrayedAt: latestTimestamp(existing?.lastPrayedAt ?? null, remote.lastPrayedAt),
      });
    }
  }

  return { ...current, savedPeoples, prayerList };
}

function currentItems(state: PersonalizationState): Map<string, SyncItem> {
  const now = new Date().toISOString();
  const entries: SyncItem[] = [
    ...state.savedPeoples.map((payload) => ({
      kind: "saved" as const,
      sourcePeopleId: payload.sourcePeopleId,
      present: true,
      revision: 0,
      payload,
      lastPrayedAt: null,
      updatedAt: payload.savedAt || now,
    })),
    ...state.prayerList.map((payload) => ({
      kind: "prayer" as const,
      sourcePeopleId: payload.sourcePeopleId,
      present: true,
      revision: 0,
      payload,
      lastPrayedAt: payload.lastPrayedAt,
      updatedAt: payload.lastPrayedAt ?? payload.addedAt ?? now,
    })),
  ];
  return new Map(entries.map((item) => [syncKey(item.kind, item.sourcePeopleId), item]));
}

function equivalentDesired(local: SyncItem | undefined, remote: SyncItem | undefined): boolean {
  const localPresent = Boolean(local?.present);
  const remotePresent = Boolean(remote?.present);
  if (localPresent !== remotePresent) return false;
  if (!localPresent) return true;
  return JSON.stringify(local?.payload ?? null) === JSON.stringify(remote?.payload ?? null)
    && (local?.lastPrayedAt ?? null) === (remote?.lastPrayedAt ?? null);
}

function newMutation(local: SyncItem | undefined, remote: SyncItem | undefined, kind: SyncKind, sourcePeopleId: number): SyncMutation {
  return {
    mutationId: crypto.randomUUID(),
    kind,
    sourcePeopleId,
    action: local?.present ? "upsert" : "delete",
    baseItemRevision: remote?.revision ?? 0,
    payload: local?.present ? local.payload : null,
    lastPrayedAt: local?.present && kind === "prayer" ? local.lastPrayedAt : null,
  };
}

function captureLocalDiff(): LocalSyncState {
  const sync = readLocalSyncState();
  if (!sync.enabled) return sync;

  const local = currentItems(readBrowserPersonalizationState());
  const keys = new Set([...Object.keys(sync.mirror), ...local.keys()]);
  let pending = [...sync.pending];

  for (const key of keys) {
    const [kindValue, idValue] = key.split(":");
    const kind = kindValue === "prayer" ? "prayer" : "saved";
    const sourcePeopleId = Number(idValue);
    if (!Number.isSafeInteger(sourcePeopleId) || sourcePeopleId <= 0) continue;
    const desired = local.get(key);
    const remote = sync.mirror[key];
    if (equivalentDesired(desired, remote)) {
      pending = pending.filter((mutation) => syncKey(mutation.kind, mutation.sourcePeopleId) !== key);
      continue;
    }
    const replacement = newMutation(desired, remote, kind, sourcePeopleId);
    pending = [
      ...pending.filter((mutation) => syncKey(mutation.kind, mutation.sourcePeopleId) !== key),
      replacement,
    ];
  }

  const next = { ...sync, pending };
  persistLocalSyncState(next);
  return next;
}

function applySnapshot(snapshot: SyncSnapshot, sentMutationIds: Set<string>): void {
  const currentSync = readLocalSyncState();
  const mirror = mirrorFromSnapshot(snapshot);
  const pending = currentSync.pending
    .filter((mutation) => !sentMutationIds.has(mutation.mutationId))
    .map((mutation) => ({
      ...mutation,
      baseItemRevision: mirror[syncKey(mutation.kind, mutation.sourcePeopleId)]?.revision ?? 0,
    }));

  persistLocalSyncState({
    ...currentSync,
    enabled: true,
    accountEmail: snapshot.account.email,
    lastServerRevision: snapshot.revision,
    mirror,
    pending,
    lastSyncedAt: new Date().toISOString(),
    lastError: null,
  });

  applyingRemoteState = true;
  try {
    persistBrowserPersonalizationState(mergeRemoteIntoPersonalization(readBrowserPersonalizationState(), snapshot));
  } finally {
    applyingRemoteState = false;
  }
}

function storeSyncError(error: unknown): void {
  const sync = readLocalSyncState();
  const message = error instanceof Error ? error.message : "Private sync failed.";
  persistLocalSyncState({ ...sync, lastError: message });
}

export async function syncNow(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const captured = captureLocalDiff();
    if (!captured.enabled || typeof navigator !== "undefined" && navigator.onLine === false) return;
    const sent = [...captured.pending];
    const sentIds = new Set(sent.map((mutation) => mutation.mutationId));
    try {
      const snapshot = sent.length > 0 ? await pushRemoteMutations(sent) : await getRemoteSyncState();
      applySnapshot(snapshot, sentIds);
    } catch (error) {
      storeSyncError(error as SyncApiError);
    }
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

export async function enablePrivateSyncWithMerge(): Promise<void> {
  const snapshot = await getRemoteSyncState();
  const merged = mergeRemoteIntoPersonalization(readBrowserPersonalizationState(), snapshot);
  persistLocalSyncState({
    version: 1,
    enabled: true,
    accountEmail: snapshot.account.email,
    lastServerRevision: snapshot.revision,
    mirror: mirrorFromSnapshot(snapshot),
    pending: [],
    lastSyncedAt: null,
    lastError: null,
  });

  applyingRemoteState = true;
  try {
    persistBrowserPersonalizationState(merged);
  } finally {
    applyingRemoteState = false;
  }

  captureLocalDiff();
  await syncNow();
}

export function disconnectPrivateSync(): void {
  persistLocalSyncState(emptySyncState());
}

export async function deletePrivateAccountAndDisconnect(): Promise<void> {
  await deleteRemoteAccount();
  disconnectPrivateSync();
}

export function getSyncRuntimeStatus(): SyncRuntimeStatus {
  const state = readLocalSyncState();
  return {
    configured: true,
    enabled: state.enabled,
    accountEmail: state.accountEmail,
    pending: state.pending.length,
    lastSyncedAt: state.lastSyncedAt,
    lastError: state.lastError,
  };
}

function scheduleSync(): void {
  if (scheduled !== null) window.clearTimeout(scheduled);
  scheduled = window.setTimeout(() => {
    scheduled = null;
    void syncNow();
  }, 250);
}

export function initializePrivateSyncRuntime(): void {
  if (typeof window === "undefined") return;
  window.addEventListener(PERSONALIZATION_CHANGE_EVENT, () => {
    if (!applyingRemoteState && readLocalSyncState().enabled) scheduleSync();
  });
  window.addEventListener("online", scheduleSync);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && readLocalSyncState().enabled) scheduleSync();
  });
  if (readLocalSyncState().enabled) scheduleSync();
}
