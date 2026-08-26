import type { SyncMutation, SyncSnapshot } from "./types";

export const SYNC_BACKEND_ORIGIN = "https://unreached-private-continuity.thiepn.workers.dev";
export const SYNC_API_BASE = `${SYNC_BACKEND_ORIGIN}/unreached-sync`;
export const SYNC_ACCESS_TOKEN_KEY = "unreached.sync.access.v1";
export const SYNC_MAX_MUTATIONS = 200;
export const SYNC_MAX_BODY_BYTES = 64 * 1024;

export class SyncApiError extends Error {
  status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "SyncApiError";
    this.status = status;
  }
}

function validAccessToken(value: unknown): value is string {
  if (typeof value !== "string" || value.length < 20 || value.length > 16_384) return false;
  return value.split(".").length === 3;
}

export function readSyncAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.sessionStorage.getItem(SYNC_ACCESS_TOKEN_KEY);
    return validAccessToken(value) ? value : null;
  } catch {
    return null;
  }
}

export function storeSyncAccessToken(token: unknown): void {
  if (!validAccessToken(token)) throw new SyncApiError("Cloudflare Access returned an invalid identity token.", 401);
  try {
    window.sessionStorage.setItem(SYNC_ACCESS_TOKEN_KEY, token);
  } catch {
    throw new SyncApiError("This browser could not keep the private sign-in session.");
  }
}

export function clearSyncAccessToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SYNC_ACCESS_TOKEN_KEY);
  } catch {
    // The token is session-only. A failed removal does not affect browser-local personalization.
  }
}

export function syncMutationRequestBytes(mutations: SyncMutation[]): number {
  return new TextEncoder().encode(JSON.stringify({ mutations })).byteLength;
}

export function takeSyncMutationBatch(mutations: SyncMutation[]): SyncMutation[] {
  const batch: SyncMutation[] = [];
  for (const mutation of mutations) {
    if (batch.length >= SYNC_MAX_MUTATIONS) break;
    const candidate = [...batch, mutation];
    if (syncMutationRequestBytes(candidate) > SYNC_MAX_BODY_BYTES) {
      if (batch.length === 0) {
        throw new SyncApiError("One private-sync change is too large to send safely. Local data was kept and the change remains pending.", 413);
      }
      break;
    }
    batch.push(mutation);
  }
  return batch;
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!response.ok) {
    let message = `Private sync request failed (${response.status})`;
    try {
      const parsed = JSON.parse(text) as { error?: string };
      if (parsed.error) message = parsed.error;
    } catch {
      // Cloudflare or the network may return a non-JSON error surface.
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
  const isPrivate = path.startsWith("/private/");
  const accessToken = isPrivate ? readSyncAccessToken() : null;
  if (isPrivate && !accessToken) throw new SyncApiError("Sign in is required for private sync.", 401);

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`${SYNC_API_BASE}${path}`, {
      ...init,
      credentials: "omit",
      mode: "cors",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
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
  if (mutations.length < 1) throw new SyncApiError("Private sync requires at least one pending change.");
  if (mutations.length > SYNC_MAX_MUTATIONS || syncMutationRequestBytes(mutations) > SYNC_MAX_BODY_BYTES) {
    throw new SyncApiError("Private sync attempted to send an oversized change batch. Local data was kept and the changes remain pending.", 413);
  }
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
  clearSyncAccessToken();
  window.open(`${SYNC_BACKEND_ORIGIN}/cdn-cgi/access/logout`, "_blank", "noopener,noreferrer");
}
