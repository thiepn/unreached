import { installPeopleGroupsReconnectRefresh } from "../providers/peoplegroups/store";

export const OFFLINE_UPDATE_EVENT = "unreached:offline-update-ready";

function announceWaitingUpdate(registration: ServiceWorkerRegistration): void {
  if (!registration.waiting || !navigator.serviceWorker.controller) return;
  window.dispatchEvent(new CustomEvent(OFFLINE_UPDATE_EVENT, {
    detail: { registration },
  }));
}

export function initializeOfflineRuntime(): void {
  installPeopleGroupsReconnectRefresh();

  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !import.meta.env.PROD) return;

  const register = async () => {
    try {
      const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
        scope: import.meta.env.BASE_URL,
        updateViaCache: "none",
      });

      announceWaitingUpdate(registration);
      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed") announceWaitingUpdate(registration);
        });
      });
    } catch {
      // Offline support is an enhancement. Registration failure must not break the app.
    }
  };

  if (document.readyState === "complete") void register();
  else window.addEventListener("load", () => void register(), { once: true });
}
