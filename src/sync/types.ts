import type { PrayerListEntry, SavedPersonSnapshot } from "../personalization/types";

export type SyncKind = "saved" | "prayer";
export type SyncAction = "upsert" | "delete";

export interface SyncAccount {
  email: string;
}

export interface SyncItem {
  kind: SyncKind;
  sourcePeopleId: number;
  present: boolean;
  revision: number;
  payload: SavedPersonSnapshot | PrayerListEntry | null;
  lastPrayedAt: string | null;
  updatedAt: string;
}

export interface SyncSnapshot {
  account: SyncAccount;
  revision: number;
  items: SyncItem[];
}

export interface SyncMutation {
  mutationId: string;
  kind: SyncKind;
  sourcePeopleId: number;
  action: SyncAction;
  baseItemRevision: number;
  payload: SavedPersonSnapshot | PrayerListEntry | null;
  lastPrayedAt: string | null;
}

export interface SyncRequest {
  mutations: SyncMutation[];
}

export interface LocalSyncState {
  version: 1;
  enabled: boolean;
  accountEmail: string | null;
  lastServerRevision: number;
  mirror: Record<string, SyncItem>;
  pending: SyncMutation[];
  lastSyncedAt: string | null;
  lastError: string | null;
}

export interface SyncRuntimeStatus {
  configured: boolean;
  enabled: boolean;
  accountEmail: string | null;
  pending: number;
  lastSyncedAt: string | null;
  lastError: string | null;
}
