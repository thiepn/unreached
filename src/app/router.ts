import { useEffect, useMemo, useState } from "preact/hooks";

export type RouteId =
  | "explore"
  | "peoples"
  | "countries"
  | "pray"
  | "saved"
  | "about"
  | "not-found";

export interface RouteState {
  id: RouteId;
  path: string;
  countryIso3: string | null;
  peopleSourceId: number | null;
  prayerSourceId: number | null;
}

const ROUTES: Readonly<Record<string, RouteId>> = {
  "/": "explore",
  "/explore": "explore",
  "/peoples": "peoples",
  "/countries": "countries",
  "/pray": "pray",
  "/saved": "saved",
  "/about": "about"
};

function routePart(hash: string): string {
  return hash.replace(/^#/, "").split("?", 1)[0] ?? "";
}

function normalizeHash(hash: string): string {
  const raw = routePart(hash).trim();
  if (!raw || raw === "/") return "/";
  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withSlash.replace(/\/+$/, "") || "/";
}

function positiveSourceId(value: string | undefined): number | null {
  if (!value) return null;
  const sourceId = Number(value);
  return Number.isSafeInteger(sourceId) && sourceId > 0 ? sourceId : null;
}

function readRoute(): RouteState {
  const path = normalizeHash(window.location.hash);
  const countryMatch = path.match(/^\/countries\/([A-Za-z]{3})$/);
  if (countryMatch?.[1]) {
    return { id: "countries", path, countryIso3: countryMatch[1].toUpperCase(), peopleSourceId: null, prayerSourceId: null };
  }
  const peopleMatch = path.match(/^\/peoples\/([0-9]+)$/);
  if (peopleMatch?.[1]) {
    return { id: "peoples", path, countryIso3: null, peopleSourceId: positiveSourceId(peopleMatch[1]), prayerSourceId: null };
  }
  const prayerMatch = path.match(/^\/pray\/([0-9]+)$/);
  if (prayerMatch?.[1]) {
    return { id: "pray", path, countryIso3: null, peopleSourceId: null, prayerSourceId: positiveSourceId(prayerMatch[1]) };
  }
  return {
    id: ROUTES[path] ?? "not-found",
    path,
    countryIso3: null,
    peopleSourceId: null,
    prayerSourceId: null,
  };
}

export function hrefFor(path: string): string {
  const normalized = path === "/" ? "/" : normalizeHash(path);
  return `#${normalized}`;
}

export function useHashRoute(): RouteState {
  const [route, setRoute] = useState<RouteState>(() => readRoute());

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute());
    window.addEventListener("hashchange", onHashChange);

    if (!window.location.hash) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#/`);
    }

    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const main = document.getElementById("main-content");
    main?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [route.path]);

  return useMemo(() => route, [route]);
}
