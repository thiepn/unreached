import { Database, RefreshCw, Wifi, WifiOff } from "lucide-preact";
import { useEffect, useState } from "preact/hooks";

import { usePeopleGroupsRuntimeStore } from "../providers/peoplegroups/store";

function formatLoadedAt(value: string | null): string {
  if (!value) return "No validated snapshot loaded yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Validated snapshot time unavailable";
  return `Snapshot ${date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`;
}

export function DataStatus() {
  const data = usePeopleGroupsRuntimeStore(false);
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine !== false);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine !== false);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  let state = "idle";
  let label = "Mission data not loaded";
  let detail = "Open a live-data section to load a validated PeopleGroups snapshot";
  let Icon = Database;

  if (!online && !data.ready) {
    state = "offline-empty";
    label = "Offline · no mission cache";
    detail = "Reconnect once to prepare validated PeopleGroups data for offline return";
    Icon = WifiOff;
  } else if (data.loading) {
    state = "refreshing";
    label = online ? "Refreshing mission data" : "Opening cached mission data";
    detail = data.progress ? `Loading page ${data.progress.loadedPages} of ${data.progress.totalPages}` : "Checking the validated local snapshot";
    Icon = RefreshCw;
  } else if (data.ready && data.refreshing) {
    state = data.stale ? "stale" : "refreshing";
    label = data.stale ? "Cached mission data · updating" : "Mission data · updating";
    detail = `${formatLoadedAt(data.loadedAt)} · live revalidation is running in the background`;
    Icon = RefreshCw;
  } else if (data.source === "network" && online) {
    state = "live";
    label = "Live mission data";
    detail = formatLoadedAt(data.loadedAt);
    Icon = Wifi;
  } else if (data.source === "cache-fresh") {
    state = "cached";
    label = online ? "Cached mission data" : "Cached mission data · offline";
    detail = formatLoadedAt(data.loadedAt);
    Icon = Database;
  } else if (data.source === "cache-stale" || data.stale) {
    state = "stale";
    label = online ? "Stale cached mission data" : "Stale cached mission data · offline";
    detail = `${formatLoadedAt(data.loadedAt)} · awaiting live revalidation`;
    Icon = WifiOff;
  } else if (!online && data.ready) {
    state = "offline-loaded";
    label = "Offline · last loaded mission data";
    detail = formatLoadedAt(data.loadedAt);
    Icon = WifiOff;
  } else if (data.error) {
    state = "unavailable";
    label = "Mission data unavailable";
    detail = data.error;
    Icon = WifiOff;
  }

  return (
    <div class={`data-state data-state--${state}`} data-data-state={state} title={`${label}. ${detail}`} aria-label={`${label}. ${detail}`}>
      <Icon size={15} aria-hidden="true" />
      <span class="data-state__label">{label}</span>
    </div>
  );
}
