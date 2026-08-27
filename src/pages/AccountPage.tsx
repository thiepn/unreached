import { Cloud, CloudOff, Download, LogIn, LogOut, RefreshCw, ShieldAlert, ShieldCheck, Trash2 } from "lucide-preact";
import { useCallback, useEffect, useState } from "preact/hooks";

import {
  checkSyncHealth,
  clearSyncAccessToken,
  exportRemoteAccount,
  getRemoteSyncState,
  openSyncLogout,
  openSyncSignIn,
  storeSyncAccessToken,
  SYNC_BACKEND_ORIGIN,
  SyncApiError,
} from "../sync/client";
import {
  deletePrivateAccountAndDisconnect,
  disconnectPrivateSync,
  enablePrivateSyncWithMerge,
  getSyncRuntimeStatus,
  readLocalSyncState,
  SYNC_CHANGE_EVENT,
  syncNow,
} from "../sync/runtime";
import type { SyncRuntimeStatus } from "../sync/types";

function formatTime(value: string | null): string {
  if (!value) return "Not synced yet";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Sync time unavailable" : date.toLocaleString();
}

function normalizedEmail(value: string | null): string | null {
  return value?.trim().toLowerCase() || null;
}

function downloadJson(value: unknown): void {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `unreached-private-sync-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AccountPage() {
  const [runtime, setRuntime] = useState<SyncRuntimeStatus>(() => getSyncRuntimeStatus());
  const [backend, setBackend] = useState<"checking" | "ready" | "unavailable">("checking");
  const [accountEmail, setAccountEmail] = useState<string | null>(() => readLocalSyncState().accountEmail);
  const [authenticated, setAuthenticated] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const probe = useCallback(async () => {
    setBackend("checking");
    const healthy = await checkSyncHealth();
    if (!healthy) {
      setBackend("unavailable");
      setAuthenticated(false);
      return;
    }
    setBackend("ready");
    try {
      const snapshot = await getRemoteSyncState();
      setAuthenticated(true);
      setAccountEmail(snapshot.account.email);
    } catch (error) {
      if (error instanceof SyncApiError && error.status === 401) clearSyncAccessToken();
      setAuthenticated(false);
      setAccountEmail(readLocalSyncState().accountEmail);
    }
  }, []);

  useEffect(() => {
    void probe();
    const refresh = () => setRuntime(getSyncRuntimeStatus());
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== SYNC_BACKEND_ORIGIN) return;
      const data = event.data as { type?: string; token?: unknown } | null;
      if (data?.type !== "unreached-private-sync-authenticated") return;
      try {
        storeSyncAccessToken(data.token);
        setNotice(null);
        void probe().then(() => {
          if (readLocalSyncState().enabled) void syncNow();
        });
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "The private sign-in session could not be accepted.");
      }
    };
    window.addEventListener(SYNC_CHANGE_EVENT, refresh);
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener(SYNC_CHANGE_EVENT, refresh);
      window.removeEventListener("message", onMessage);
    };
  }, [probe]);

  const run = async (label: string, action: () => Promise<void>) => {
    setBusy(label);
    setNotice(null);
    try {
      await action();
      setRuntime(getSyncRuntimeStatus());
      await probe();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The private-sync action failed.");
    } finally {
      setBusy(null);
    }
  };

  const signOut = () => {
    clearSyncAccessToken();
    setAuthenticated(false);
    setAccountEmail(readLocalSyncState().accountEmail);
    setRuntime(getSyncRuntimeStatus());
    setNotice("Signed out in this tab. Local data was kept.");
    openSyncLogout();
  };

  const disconnectDevice = () => {
    disconnectPrivateSync();
    setRuntime(getSyncRuntimeStatus());
    setNotice("Private sync disconnected from this device. Local Saved and prayer data was kept.");
  };

  const deleteAccount = async () => {
    if (!window.confirm("Delete the private synced account data? Saved and prayer data on this device will remain local.")) return;
    setBusy("delete");
    setNotice(null);
    try {
      await deletePrivateAccountAndDisconnect();
      setRuntime(getSyncRuntimeStatus());
      setAuthenticated(false);
      setAccountEmail(null);
      setBackend("ready");
      setNotice("Private account data deleted. This device kept its local data. Sign in again only if you want to create a new private sync account.");
      // Do not probe /private/state here: an active Access session would recreate an empty
      // account row immediately after deletion. End the Access session instead.
      openSyncLogout();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The private account could not be deleted.");
    } finally {
      setBusy(null);
    }
  };

  const signedInEmail = normalizedEmail(accountEmail);
  const boundEmail = normalizedEmail(runtime.accountEmail);
  const mismatchEmail = normalizedEmail(runtime.accountMismatchEmail);
  const accountMismatch = runtime.enabled && authenticated && Boolean(mismatchEmail || (boundEmail && signedInEmail && boundEmail !== signedInEmail));
  const needsAuthentication = runtime.enabled && !authenticated;
  const canSyncNow = runtime.enabled && authenticated && !accountMismatch;
  const canManageRemoteAccount = authenticated && !accountMismatch;

  const accountState = backend === "unavailable"
    ? "unavailable"
    : accountMismatch
      ? "mismatch"
      : needsAuthentication
        ? "reauth"
        : runtime.enabled
          ? "enabled"
          : authenticated
            ? "ready-to-enable"
            : backend === "checking"
              ? "checking"
              : "local";

  const statusTitle = backend === "unavailable"
    ? "Local-only mode"
    : accountMismatch
      ? "Sync paused · different account"
      : needsAuthentication
        ? "Sync paused · sign in again"
        : runtime.enabled
          ? "Private sync enabled"
          : authenticated
            ? "Signed in · sync not enabled"
            : "Local-only by default";

  const statusDescription = backend === "unavailable"
    ? "The private sync service is unavailable. Your browser-local data continues to work normally."
    : accountMismatch
      ? `This device is bound to ${runtime.accountEmail ?? "another private account"}, while the current sign-in is ${mismatchEmail ?? accountEmail ?? "different"}. Nothing uploads until the account mismatch is resolved.`
      : needsAuthentication
        ? `${runtime.accountEmail ?? "This private account"} remains linked to this device. Local changes stay queued until you sign in again.`
        : runtime.enabled
          ? `${accountEmail ?? runtime.accountEmail ?? "Private account"} · last sync ${formatTime(runtime.lastSyncedAt)}`
          : authenticated
            ? `${accountEmail ?? "Authenticated account"}. Nothing is uploaded until you explicitly merge this device and enable sync.`
            : "Nothing is uploaded while you remain signed out.";

  return (
    <div class="account-page page-stack" data-account-state={accountState}>
      <header class="page-hero account-hero">
        <p class="eyebrow">Account</p>
        <h1>Private sync is optional.</h1>
        <p class="lede">Unreached works locally without an account. Sign in only if you want your limited Saved and prayer-list data available across devices.</p>
      </header>

      <section class="account-status-card" aria-live="polite">
        <div class="account-status-card__icon" aria-hidden="true">
          {backend === "unavailable"
            ? <CloudOff size={24} />
            : accountMismatch || needsAuthentication
              ? <ShieldAlert size={24} />
              : runtime.enabled
                ? <ShieldCheck size={24} />
                : <Cloud size={24} />}
        </div>
        <div>
          <p class="eyebrow">Private sync status</p>
          <h2>{statusTitle}</h2>
          <p>{statusDescription}</p>
          {runtime.pending > 0 ? <p class="account-tech-note">Changes waiting to sync: {runtime.pending}. They remain stored locally until a correctly authenticated connection succeeds.</p> : null}
          {runtime.lastError ? <p class="account-warning">{runtime.lastError}</p> : null}
          {notice ? <p class="account-notice">{notice}</p> : null}
        </div>
      </section>

      <section class="account-next-step" aria-labelledby="account-next-step-heading">
        <div>
          <p class="eyebrow">Next step</p>
          <h2 id="account-next-step-heading">
            {backend === "checking"
              ? "Checking private sync."
              : backend === "unavailable"
                ? "Keep using Unreached locally."
                : accountMismatch
                  ? "Resolve the account mismatch before syncing."
                  : needsAuthentication
                    ? "Restore this tab’s private sign-in."
                    : runtime.enabled
                      ? "No action needed."
                      : authenticated
                        ? "Choose whether to enable cross-device sync."
                        : "Stay local, or sign in for cross-device continuity."}
          </h2>
          <p>
            {runtime.enabled && authenticated && !accountMismatch
              ? "Sync runs automatically after local changes, reconnects, and when this page becomes active."
              : accountMismatch
                ? "Pending changes remain on this device. Sign out of the different account or disconnect this device before using another account."
                : "Your local Saved and prayer data remains usable regardless of account status."}
          </p>
        </div>
        <div class="account-primary-actions">
          {backend === "checking" ? <button class="button button--secondary" type="button" disabled><RefreshCw size={16} aria-hidden="true" /> Checking service…</button> : null}
          {backend === "unavailable" ? <button class="button button--primary" type="button" onClick={() => void probe()}><RefreshCw size={16} aria-hidden="true" /> Recheck service</button> : null}
          {backend === "ready" && accountMismatch ? <button class="button button--primary" type="button" onClick={signOut}><LogOut size={16} aria-hidden="true" /> Sign out & switch account</button> : null}
          {backend === "ready" && accountMismatch ? <button class="button button--secondary" type="button" onClick={disconnectDevice}><CloudOff size={16} aria-hidden="true" /> Disconnect this device</button> : null}
          {backend === "ready" && !accountMismatch && !authenticated ? <button class="button button--primary" type="button" onClick={openSyncSignIn}><LogIn size={16} aria-hidden="true" /> {runtime.enabled ? "Sign in again" : "Sign in privately"}</button> : null}
          {backend === "ready" && authenticated && !runtime.enabled ? (
            <button class="button button--primary" type="button" disabled={busy !== null} onClick={() => void run("merge", enablePrivateSyncWithMerge)}>
              <ShieldCheck size={16} aria-hidden="true" /> Merge this device & enable sync
            </button>
          ) : null}
          {backend === "ready" && runtime.enabled && authenticated && !accountMismatch ? <span class="account-ok"><ShieldCheck size={17} aria-hidden="true" /> Automatic sync is active</span> : null}
        </div>
      </section>

      <details class="account-disclosure account-privacy-disclosure">
        <summary>What private sync includes</summary>
        <div class="account-boundary-grid">
          <section>
            <h2>What can sync</h2>
            <ul class="account-plain-list">
              <li>Saved people membership and its existing source-backed snapshot.</li>
              <li>Private prayer-list membership.</li>
              <li>Only the latest <code>lastPrayedAt</code> timestamp for a listed person.</li>
            </ul>
          </section>
          <section>
            <h2>What never syncs</h2>
            <ul class="account-plain-list">
              <li>Recent browsing history stays on this device.</li>
              <li>No prayer history, prayer counts, streaks, scores or completion metrics exist.</li>
              <li>The PeopleGroups.org corpus and offline provider cache are never uploaded.</li>
            </ul>
          </section>
        </div>
      </details>

      <details class="account-disclosure account-controls-disclosure">
        <summary>Account & device controls</summary>
        <div class="account-disclosure-body">
          <p>Signing out pauses private sync on this tab but keeps the device bound to the same account. Disconnecting removes that binding. Neither action erases this browser’s local Saved or prayer data. The Cloudflare Access identity token is kept only for this browser-tab session.</p>
          <div class="account-secondary-actions">
            {backend === "ready" && !authenticated ? <button class="button button--secondary" type="button" onClick={() => void probe()}><RefreshCw size={16} aria-hidden="true" /> Check sign-in status</button> : null}
            {canSyncNow ? <button class="button button--secondary" type="button" disabled={busy !== null} onClick={() => void run("sync", syncNow)}><RefreshCw size={16} aria-hidden="true" /> Sync now</button> : null}
            {canManageRemoteAccount ? <button class="button button--secondary" type="button" disabled={busy !== null} onClick={() => void run("export", async () => downloadJson(await exportRemoteAccount()))}><Download size={16} aria-hidden="true" /> Export private data</button> : null}
            {runtime.enabled && !accountMismatch ? <button class="button button--secondary" type="button" onClick={disconnectDevice}><CloudOff size={16} aria-hidden="true" /> Disconnect this device</button> : null}
            {authenticated && !accountMismatch ? <button class="button button--secondary" type="button" onClick={signOut}><LogOut size={16} aria-hidden="true" /> Sign out</button> : null}
          </div>
        </div>
      </details>

      <details class="account-disclosure account-merge-disclosure">
        <summary>How first merge and conflicts work</summary>
        <div class="account-disclosure-body">
          <p><strong>Merge behavior:</strong> first activation combines this device with the private account instead of silently replacing local data. If the two prayer lists would exceed the 100-person local limit, activation stops before changing either side. Server-side conflict records prevent older offline changes from overriding newer opposing changes; intentionally acting again after receiving the newer state creates a current change.</p>
        </div>
      </details>

      {canManageRemoteAccount ? (
        <details class="account-disclosure account-danger-disclosure">
          <summary>Delete private account data</summary>
          <div class="account-disclosure-body">
            <p>This deletes the synced account copy and disconnects this device. Saved and prayer data already stored in this browser remains local.</p>
            <button class="button button--danger" type="button" disabled={busy !== null} onClick={() => void deleteAccount()}><Trash2 size={16} aria-hidden="true" /> Delete private account data</button>
          </div>
        </details>
      ) : null}
    </div>
  );
}
