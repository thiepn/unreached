import {
  PERSONALIZATION_CHANGE_EVENT,
  persistBrowserPersonalizationState,
  readBrowserPersonalizationState,
} from "../personalization/runtime";
import {
  clearSyncAccessToken,
  deleteRemoteAccount,
  getRemoteSyncState,
  pushRemoteMutations,
  readSyncAccessToken,
  takeSyncMutationBatch,
  SyncApiError,
} from "./client";
import {
  currentItems,
  equivalentDesired,
  mergeForFirstActivation,
  mirrorFromSnapshot,
  reconcileSnapshot,
  syncKey,
} from "./reconcile";
import type { LocalSyncState, SyncItem, SyncKind, SyncMutation, SyncRuntimeStatus, SyncSnapshot } from "./types";

export const SYNC_STORAGE_KEY = "unreached.sync.v1";
export const SYNC_CHANGE_EVENT = "unreached:sync-change";

let applyingRemoteState = false;
let inFlight: Promise<void> | null = null;
let scheduled: number | null = null;
let initialized = false;
let memoryFallbackSyncState: LocalSyncState | null = null;

interface StoredSyncStateCandidate {
  version?: unknown;
  enabled?: unknown;
  accountEmail?: unknown;
  accountMismatchEmail?: unknown;
  lastServerRevision?: unknown;
  mirror?: unknown;
  pending?: unknown;
  lastSyncedAt?: unknown;
  lastError?: unknown;
}

function emptySyncState(): LocalSyncState {
  return {
    version: 2,
    enabled: false,
    accountEmail: null,
    accountMismatchEmail: null,
    lastServerRevision: 0,
    mirror: {},
    pending: [],
    lastSyncedAt: null,
    lastError: null,
  };
}

function stringOrNull(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function normalizeSyncState(value: unknown): LocalSyncState | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as StoredSyncStateCandidate;
  if (candidate.version !== 1 && candidate.version !== 2) return null;
  if (typeof candidate.enabled !== "boolean") return null;
  if (!stringOrNull(candidate.accountEmail ?? null)) return null;
  if (!Number.isSafeInteger(candidate.lastServerRevision) || Number(candidate.lastServerRevision) < 0) return null;
  if (!candidate.mirror || typeof candidate.mirror !== "object" || Array.isArray(candidate.mirror)) return null;
  if (!Array.isArray(candidate.pending)) return null;
  if (!stringOrNull(candidate.lastSyncedAt ?? null) || !stringOrNull(candidate.lastError ?? null)) return null;
  if (candidate.version === 2 && !stringOrNull(candidate.accountMismatchEmail ?? null)) return null;

  return {
    version: 2,
    enabled: candidate.enabled,
    accountEmail: (candidate.accountEmail ?? null) as string | null,
    accountMismatchEmail: candidate.version === 2 ? (candidate.accountMismatchEmail ?? null) as string | null : null,
    lastServerRevision: Number(candidate.lastServerRevision),
    mirror: candidate.mirror as Record<string, SyncItem>,
    pending: candidate.pending as SyncMutation[],
    lastSyncedAt: (candidate.lastSyncedAt ?? null) as string | null,
    lastError: (candidate.lastError ?? null) as string | null,
  };
}

export function readLocalSyncState(): LocalSyncState {
  if (typeof window === "undefined") return emptySyncState();
  if (memoryFallbackSyncState) return memoryFallbackSyncState;
  try {
    const raw = window.localStorage.getItem(SYNC_STORAGE_KEY);
    if (!raw) return emptySyncState();
    return normalizeSyncState(JSON.parse(raw) as unknown) ?? emptySyncState();
  } catch {
    return emptySyncState();
  }
}

function persistLocalSyncState(state: LocalSyncState): void {
  if (typeof window === "undefined") return;
  memoryFallbackSyncState = state;
  try {
    window.localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(state));
    memoryFallbackSyncState = null;
  } catch {
    // Sync metadata remains available for the current tab. If the tab closes,
    // browser-local personalization is still authoritative and no remote write is
    // attempted without a newly established session/account binding.
  } finally {
    window.dispatchEvent(new Event(SYNC_CHANGE_EVENT));
  }
}

function mutationMatchesDesired(mutation: SyncMutation, local: SyncItem | undefined): boolean {
  if (mutation.action === "delete") return !local?.present;
  if (!local?.present) return false;
  return JSON.stringify(mutation.payload ?? null) === JSON.stringify(local.payload ?? null)
    && (mutation.lastPrayedAt ?? null) === (local.lastPrayedAt ?? null);
}

function createMutationId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  if (typeof crypto.getRandomValues !== "function") {
    throw new Error("A secure browser random-number source is required for private sync.");
  }

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}

function newMutation(local: SyncItem | undefined, remote: SyncItem | undefined, kind: SyncKind, sourcePeopleId: number): SyncMutation {
  return {
    mutationId: createMutationId(),
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
  const pendingByKey = new Map(sync.pending.map((mutation) => [syncKey(mutation.kind, mutation.sourcePeopleId), mutation]));
  const keys = new Set([...Object.keys(sync.mirror), ...local.keys(), ...pendingByKey.keys()]);
  const pending: SyncMutation[] = [];

  for (const key of keys) {
    const [kindValue, idValue] = key.split(":");
    const kind: SyncKind = kindValue === "prayer" ? "prayer" : "saved";
    const sourcePeopleId = Number(idValue);
    if (!Number.isSafeInteger(sourcePeopleId) || sourcePeopleId <= 0) continue;
    const desired = local.get(key);
    const remote = sync.mirror[key];
    if (equivalentDesired(desired, remote)) continue;

    const existing = pendingByKey.get(key);
    pending.push(existing && mutationMatchesDesired(existing, desired)
      ? existing
      : newMutation(desired, remote, kind, sourcePeopleId));
  }

  const next = { ...sync, pending };
  persistLocalSyncState(next);
  return next;
}

function normalizedEmail(value: string): string {
  return value.trim().toLowerCase();
}

function snapshotMatchesBoundAccount(snapshot: SyncSnapshot): boolean {
  const sync = readLocalSyncState();
  const remoteEmail = normalizedEmail(snapshot.account.email);
  const boundEmail = sync.accountEmail ? normalizedEmail(sync.accountEmail) : null;
  if (boundEmail && boundEmail !== remoteEmail) {
    persistLocalSyncState({
      ...sync,
      accountMismatchEmail: remoteEmail,
      lastError: `Private sync is paused because this device is bound to ${sync.accountEmail}, but the current sign-in is ${remoteEmail}. No pending changes were uploaded. Sign in with the bound account or disconnect this device before merging with a different account.`,
    });
    return false;
  }
  return true;
}

function applySnapshot(snapshot: SyncSnapshot, sentMutations: SyncMutation[]): void {
  const currentSync = readLocalSyncState();
  const result = reconcileSnapshot({
    personalization: readBrowserPersonalizationState(),
    previousMirror: currentSync.mirror,
    currentPending: currentSync.pending,
    snapshot,
    sentMutations,
    mutationId: createMutationId,
  });

  applyingRemoteState = true;
  try {
    persistBrowserPersonalizationState(result.personalization);
  } finally {
    applyingRemoteState = false;
  }

  persistLocalSyncState({
    ...currentSync,
    enabled: true,
    accountEmail: normalizedEmail(snapshot.account.email),
    accountMismatchEmail: null,
    lastServerRevision: snapshot.revision,
    mirror: result.mirror,
    pending: result.pending,
    lastSyncedAt: new Date().toISOString(),
    lastError: null,
  });
}

function storeAuthenticationRequired(): void {
  const sync = readLocalSyncState();
  persistLocalSyncState({
    ...sync,
    lastError: "Private sync is paused in this tab until you sign in again. Local Saved and prayer-list changes remain available and will not be uploaded to another account automatically.",
  });
}

function storeSyncError(error: unknown): void {
  const sync = readLocalSyncState();
  if (error instanceof SyncApiError && error.status === 401) clearSyncAccessToken();
  const message = error instanceof Error ? error.message : "Private sync failed.";
  persistLocalSyncState({
    ...sync,
    lastError: error instanceof SyncApiError && error.status === 401
      ? "Private sync is paused because the sign-in session expired. Sign in again; local changes remain pending."
      : message,
  });
}

function online(): boolean {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

export async function syncNow(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const captured = captureLocalDiff();
    if (!captured.enabled || !online()) return;
    if (!readSyncAccessToken()) {
      storeAuthenticationRequired();
      return;
    }

    try {
      // Never upload a pending mutation before verifying that the current Access
      // identity still matches the account this browser sync state is bound to.
      const initialSnapshot = await getRemoteSyncState();
      if (!readLocalSyncState().enabled || !snapshotMatchesBoundAccount(initialSnapshot)) return;
      applySnapshot(initialSnapshot, []);

      let batches = 0;
      while (online()) {
        const current = captureLocalDiff();
        if (!current.enabled || current.pending.length === 0) break;
        const batch = takeSyncMutationBatch(current.pending);
        if (batch.length === 0) break;

        const snapshot = await pushRemoteMutations(batch);
        if (!readLocalSyncState().enabled || !snapshotMatchesBoundAccount(snapshot)) return;
        applySnapshot(snapshot, batch);

        batches += 1;
        if (batches >= 1_000) throw new Error("Private sync stopped after an unusually large number of batches. Remaining changes are still pending locally.");
      }
    } catch (error) {
      storeSyncError(error);
    }
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

export async function enablePrivateSyncWithMerge(): Promise<void> {
  const snapshot = await getRemoteSyncState();
  const merged = mergeForFirstActivation(readBrowserPersonalizationState(), snapshot);

  persistLocalSyncState({
    version: 2,
    enabled: true,
    accountEmail: normalizedEmail(snapshot.account.email),
    accountMismatchEmail: null,
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
    accountMismatchEmail: state.accountMismatchEmail,
    authenticationRequired: state.enabled && !readSyncAccessToken(),
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
  if (typeof window === "undefined" || initialized) return;
  initialized = true;
  window.addEventListener(PERSONALIZATION_CHANGE_EVENT, () => {
    if (!applyingRemoteState && readLocalSyncState().enabled && readSyncAccessToken()) scheduleSync();
  });
  window.addEventListener("online", () => {
    if (readLocalSyncState().enabled && readSyncAccessToken()) scheduleSync();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && readLocalSyncState().enabled && readSyncAccessToken()) scheduleSync();
  });
  if (readLocalSyncState().enabled && readSyncAccessToken()) scheduleSync();
}
