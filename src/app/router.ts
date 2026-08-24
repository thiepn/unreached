import { useEffect, useMemo, useState } from "preact/hooks";

export type RouteId =
  | "explore"
  | "peoples"
  | "countries"
  | "languages"
  | "coverage"
  | "pray"
  | "saved"
  | "about"
  | "not-found";

export interface RouteState {
  id: RouteId;
  path: string;
  countryIso3: string | null;
  peopleSourceId: number | null;
  languageIso6393: string | null;
  prayerSourceId: number | null;
}

const ROUTES: Readonly<Record<string, RouteId>> = {
  "/": "explore",
  "/explore": "explore",
  "/peoples": "peoples",
  "/countries": "countries",
  "/languages": "languages",
  "/coverage": "coverage",
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

function emptyState(id: RouteId, path: string): RouteState {
  return { id, path, countryIso3: null, peopleSourceId: null, languageIso6393: null, prayerSourceId: null };
}

function readRoute(): RouteState {
  const path = normalizeHash(window.location.hash);
  const countryMatch = path.match(/^\/countries\/([A-Za-z]{3})$/);
  if (countryMatch?.[1]) return { ...emptyState("countries", path), countryIso3: countryMatch[1].toUpperCase() };

  const peopleMatch = path.match(/^\/peoples\/([0-9]+)$/);
  if (peopleMatch?.[1]) return { ...emptyState("peoples", path), peopleSourceId: positiveSourceId(peopleMatch[1]) };

  const languageMatch = path.match(/^\/languages\/([A-Za-z]{3})$/);
  if (languageMatch?.[1]) return { ...emptyState("languages", path), languageIso6393: languageMatch[1].toLowerCase() };

  const prayerMatch = path.match(/^\/pray\/([0-9]+)$/);
  if (prayerMatch?.[1]) return { ...emptyState("pray", path), prayerSourceId: positiveSourceId(prayerMatch[1]) };

  return emptyState(ROUTES[path] ?? "not-found", path);
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
