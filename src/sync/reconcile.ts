import { MAX_PRAYER_LIST } from "../personalization/model";
import type { PersonalizationState, PrayerListEntry, SavedPersonSnapshot } from "../personalization/types";
import type { SyncItem, SyncKind, SyncMutation, SyncSnapshot } from "./types";

export class SyncCapacityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SyncCapacityError";
  }
}

export function syncKey(kind: SyncKind, sourcePeopleId: number): string {
  return `${kind}:${sourcePeopleId}`;
}

export function mirrorFromSnapshot(snapshot: SyncSnapshot): Record<string, SyncItem> {
  return Object.fromEntries(snapshot.items.map((item) => [syncKey(item.kind, item.sourcePeopleId), item]));
}

function latestTimestamp(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return Date.parse(a) >= Date.parse(b) ? a : b;
}

export function currentItems(state: PersonalizationState): Map<string, SyncItem> {
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

export function equivalentDesired(local: SyncItem | undefined, remote: SyncItem | undefined): boolean {
  const localPresent = Boolean(local?.present);
  const remotePresent = Boolean(remote?.present);
  if (localPresent !== remotePresent) return false;
  if (!localPresent) return true;
  return JSON.stringify(local?.payload ?? null) === JSON.stringify(remote?.payload ?? null)
    && (local?.lastPrayedAt ?? null) === (remote?.lastPrayedAt ?? null);
}

function desiredFromMutation(mutation: SyncMutation): SyncItem | undefined {
  if (mutation.action === "delete") return undefined;
  return {
    kind: mutation.kind,
    sourcePeopleId: mutation.sourcePeopleId,
    present: true,
    revision: mutation.baseItemRevision,
    payload: mutation.payload,
    lastPrayedAt: mutation.lastPrayedAt,
    updatedAt: "",
  };
}

function mutationFor(
  local: SyncItem | undefined,
  remote: SyncItem | undefined,
  kind: SyncKind,
  sourcePeopleId: number,
  mutationId: () => string,
): SyncMutation {
  return {
    mutationId: mutationId(),
    kind,
    sourcePeopleId,
    action: local?.present ? "upsert" : "delete",
    baseItemRevision: remote?.revision ?? 0,
    payload: local?.present ? local.payload : null,
    lastPrayedAt: local?.present && kind === "prayer" ? local.lastPrayedAt : null,
  };
}

function assertEffectivePrayerCapacity(
  local: Map<string, SyncItem>,
  remote: Record<string, SyncItem>,
  protectedKeys: Set<string>,
): void {
  const keys = new Set([
    ...[...local.keys()].filter((key) => key.startsWith("prayer:")),
    ...Object.keys(remote).filter((key) => key.startsWith("prayer:")),
  ]);
  let count = 0;
  for (const key of keys) {
    const item = protectedKeys.has(key) ? local.get(key) : remote[key];
    if (item?.present) count += 1;
  }
  if (count > MAX_PRAYER_LIST) {
    throw new SyncCapacityError(
      `Private sync paused because the combined prayer list would contain ${count} people, above this app's ${MAX_PRAYER_LIST}-person limit. Remove at least ${count - MAX_PRAYER_LIST} prayer-list ${count - MAX_PRAYER_LIST === 1 ? "entry" : "entries"} on one device, then sync again. No local or remote entries were discarded.`,
    );
  }
}

export function mergeRemoteSnapshot(
  current: PersonalizationState,
  snapshot: SyncSnapshot,
  protectedKeys: Set<string>,
): PersonalizationState {
  const local = currentItems(current);
  const remote = mirrorFromSnapshot(snapshot);
  assertEffectivePrayerCapacity(local, remote, protectedKeys);

  let savedPeoples = [...current.savedPeoples];
  let prayerList = [...current.prayerList];

  for (const item of snapshot.items) {
    const key = syncKey(item.kind, item.sourcePeopleId);
    if (protectedKeys.has(key)) continue;

    if (item.kind === "saved") {
      savedPeoples = savedPeoples.filter((person) => person.sourcePeopleId !== item.sourcePeopleId);
      if (item.present && item.payload && "savedAt" in item.payload) {
        savedPeoples.push(item.payload as SavedPersonSnapshot);
      }
      continue;
    }

    const existing = prayerList.find((person) => person.sourcePeopleId === item.sourcePeopleId);
    prayerList = prayerList.filter((person) => person.sourcePeopleId !== item.sourcePeopleId);
    if (item.present && item.payload && "addedAt" in item.payload) {
      const remotePrayer = item.payload as PrayerListEntry;
      prayerList.push({
        ...remotePrayer,
        lastPrayedAt: latestTimestamp(existing?.lastPrayedAt ?? null, remotePrayer.lastPrayedAt),
      });
    }
  }

  return { ...current, savedPeoples, prayerList };
}

export function mergeForFirstActivation(current: PersonalizationState, snapshot: SyncSnapshot): PersonalizationState {
  const remotePresentPrayerIds = new Set(
    snapshot.items.filter((item) => item.kind === "prayer" && item.present).map((item) => item.sourcePeopleId),
  );
  const localPrayerIds = new Set(current.prayerList.map((item) => item.sourcePeopleId));
  const unionPrayerCount = new Set([...remotePresentPrayerIds, ...localPrayerIds]).size;
  if (unionPrayerCount > MAX_PRAYER_LIST) {
    throw new SyncCapacityError(
      `Private sync cannot be enabled yet because this device and the private account contain ${unionPrayerCount} distinct prayer-list people together, above the ${MAX_PRAYER_LIST}-person limit. Remove at least ${unionPrayerCount - MAX_PRAYER_LIST} ${unionPrayerCount - MAX_PRAYER_LIST === 1 ? "entry" : "entries"} first. Nothing was merged or uploaded.`,
    );
  }

  let savedPeoples = [...current.savedPeoples];
  let prayerList = [...current.prayerList];

  for (const item of snapshot.items) {
    if (!item.present || !item.payload) continue;
    if (item.kind === "saved" && "savedAt" in item.payload) {
      const existing = savedPeoples.find((person) => person.sourcePeopleId === item.sourcePeopleId);
      if (!existing) savedPeoples.push(item.payload as SavedPersonSnapshot);
      continue;
    }
    if (item.kind === "prayer" && "addedAt" in item.payload) {
      const remotePrayer = item.payload as PrayerListEntry;
      const existingIndex = prayerList.findIndex((person) => person.sourcePeopleId === item.sourcePeopleId);
      if (existingIndex < 0) {
        prayerList.push(remotePrayer);
      } else {
        const existing = prayerList[existingIndex]!;
        prayerList[existingIndex] = {
          ...existing,
          lastPrayedAt: latestTimestamp(existing.lastPrayedAt, remotePrayer.lastPrayedAt),
        };
      }
    }
  }

  return { ...current, savedPeoples, prayerList };
}

export interface ReconcileSnapshotInput {
  personalization: PersonalizationState;
  previousMirror: Record<string, SyncItem>;
  currentPending: SyncMutation[];
  snapshot: SyncSnapshot;
  sentMutations: SyncMutation[];
  mutationId: () => string;
}

export interface ReconcileSnapshotResult {
  personalization: PersonalizationState;
  mirror: Record<string, SyncItem>;
  pending: SyncMutation[];
  protectedKeys: Set<string>;
}

export function reconcileSnapshot(input: ReconcileSnapshotInput): ReconcileSnapshotResult {
  const local = currentItems(input.personalization);
  const mirror = mirrorFromSnapshot(input.snapshot);
  const sentIds = new Set(input.sentMutations.map((mutation) => mutation.mutationId));
  const sentByKey = new Map(input.sentMutations.map((mutation) => [syncKey(mutation.kind, mutation.sourcePeopleId), mutation]));
  const unsentByKey = new Map(
    input.currentPending
      .filter((mutation) => !sentIds.has(mutation.mutationId))
      .map((mutation) => [syncKey(mutation.kind, mutation.sourcePeopleId), mutation]),
  );

  const keys = new Set([
    ...Object.keys(input.previousMirror),
    ...Object.keys(mirror),
    ...local.keys(),
    ...sentByKey.keys(),
    ...unsentByKey.keys(),
  ]);
  const protectedKeys = new Set<string>();
  const pending: SyncMutation[] = [];

  for (const key of keys) {
    const [kindValue, idValue] = key.split(":");
    const kind: SyncKind = kindValue === "prayer" ? "prayer" : "saved";
    const sourcePeopleId = Number(idValue);
    if (!Number.isSafeInteger(sourcePeopleId) || sourcePeopleId <= 0) continue;

    const localDesired = local.get(key);
    const remote = mirror[key];
    const existingUnsent = unsentByKey.get(key);
    if (existingUnsent) {
      if (!equivalentDesired(localDesired, remote)) {
        protectedKeys.add(key);
        pending.push({ ...existingUnsent, baseItemRevision: remote?.revision ?? 0 });
      }
      continue;
    }

    const sent = sentByKey.get(key);
    if (sent) {
      const sentDesired = desiredFromMutation(sent);
      if (!equivalentDesired(localDesired, sentDesired) && !equivalentDesired(localDesired, remote)) {
        protectedKeys.add(key);
        pending.push(mutationFor(localDesired, remote, kind, sourcePeopleId, input.mutationId));
      }
      continue;
    }

    const previousRemote = input.previousMirror[key];
    if (equivalentDesired(localDesired, previousRemote)) {
      // Local state did not change since the previous mirror; a newer remote value
      // is authoritative and may safely flow into personalization.
      continue;
    }

    if (!equivalentDesired(localDesired, remote)) {
      protectedKeys.add(key);
      pending.push(mutationFor(localDesired, remote, kind, sourcePeopleId, input.mutationId));
    }
  }

  return {
    personalization: mergeRemoteSnapshot(input.personalization, input.snapshot, protectedKeys),
    mirror,
    pending,
    protectedKeys,
  };
}
