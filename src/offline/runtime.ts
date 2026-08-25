import { installPeopleGroupsReconnectRefresh } from "../providers/peoplegroups/store";

export function initializeOfflineRuntime(): void {
  installPeopleGroupsReconnectRefresh();

  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !import.meta.env.PROD) return;

  const register = () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch(() => {
      // Offline support is an enhancement. Registration failure must not break the app.
    });
  };

  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
}
