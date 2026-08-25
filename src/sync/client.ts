import type { SyncMutation, SyncSnapshot } from "./types";

export const SYNC_API_BASE = "/unreached-sync";

export class SyncApiError extends Error {
  status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "SyncApiError";
    this.status = status;
  }
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!response.ok) {
    let message = `Private sync request failed (${response.status})`;
    try {
      const parsed = JSON.parse(text) as { error?: string };
      if (parsed.error) message = parsed.error;
    } catch {
      // Access may redirect signed-out fetches to an HTML login surface.
    }
    throw new SyncApiError(message, response.status);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new SyncApiError("Private sync returned an invalid response.", response.status);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`${SYNC_API_BASE}${path}`, {
      ...init,
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
    return await readJson<T>(response);
  } catch (error) {
    if (error instanceof SyncApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") throw new SyncApiError("Private sync did not respond in time.");
    throw new SyncApiError("Private sync is unavailable. Local data is still safe on this device.");
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function checkSyncHealth(): Promise<boolean> {
  try {
    const result = await request<{ ok?: boolean }>("/health");
    return result.ok === true;
  } catch {
    return false;
  }
}

export function getRemoteSyncState(): Promise<SyncSnapshot> {
  return request<SyncSnapshot>("/private/state");
}

export function pushRemoteMutations(mutations: SyncMutation[]): Promise<SyncSnapshot> {
  return request<SyncSnapshot>("/private/sync", {
    method: "POST",
    body: JSON.stringify({ mutations }),
  });
}

export function exportRemoteAccount(): Promise<{ exportedAt: string; account: { email: string }; items: SyncSnapshot["items"] }> {
  return request("/private/export");
}

export function deleteRemoteAccount(): Promise<{ deleted: true }> {
  return request("/private/account", { method: "DELETE" });
}

export function openSyncSignIn(): void {
  const width = 520;
  const height = 720;
  const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
  const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);
  window.open(
    `${SYNC_API_BASE}/private/auth/start?returnOrigin=${encodeURIComponent(window.location.origin)}`,
    "unreached-private-sync-auth",
    `popup=yes,width=${width},height=${height},left=${Math.round(left)},top=${Math.round(top)}`,
  );
}

export function openSyncLogout(): void {
  window.open("/cdn-cgi/access/logout", "_blank", "noopener,noreferrer");
}
