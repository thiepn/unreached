import { useEffect, useMemo, useRef, useState } from "preact/hooks";

export type RouteId =
  | "explore"
  | "peoples"
  | "countries"
  | "languages"
  | "coverage"
  | "pray"
  | "saved"
  | "account"
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
  "/pray/session": "pray",
  "/saved": "saved",
  "/account": "account",
  "/about": "about",
};

function routePart(hash: string): string {
  return hash.replace(/^#/, "").split("?", 1)[0] ?? "";
}

function normalizeRoutePath(value: string): string {
  const raw = routePart(value).trim();
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
  const path = normalizeRoutePath(window.location.hash);
  const countryMatch = path.match(/^\/countries\/([A-Za-z]{3})$/);
  if (countryMatch?.[1]) return { ...emptyState("countries", path), countryIso3: countryMatch[1].toUpperCase() };

  const peopleMatch = path.match(/^\/peoples\/([0-9]+)$/);
  if (peopleMatch?.[1]) {
    const peopleSourceId = positiveSourceId(peopleMatch[1]);
    return peopleSourceId === null ? emptyState("not-found", path) : { ...emptyState("peoples", path), peopleSourceId };
  }

  const languageMatch = path.match(/^\/languages\/([A-Za-z]{3})$/);
  if (languageMatch?.[1]) return { ...emptyState("languages", path), languageIso6393: languageMatch[1].toLowerCase() };

  const prayerMatch = path.match(/^\/pray\/([0-9]+)$/);
  if (prayerMatch?.[1]) {
    const prayerSourceId = positiveSourceId(prayerMatch[1]);
    return prayerSourceId === null ? emptyState("not-found", path) : { ...emptyState("pray", path), prayerSourceId };
  }

  return emptyState(ROUTES[path] ?? "not-found", path);
}

function titleForRoute(route: RouteState): string {
  if (route.id === "explore") return "Explore | Unreached";
  if (route.id === "peoples") return route.peopleSourceId ? `PEID ${route.peopleSourceId} | Unreached` : "People Groups | Unreached";
  if (route.id === "countries") return route.countryIso3 ? `${route.countryIso3} Country | Unreached` : "Countries | Unreached";
  if (route.id === "languages") return route.languageIso6393 ? `${route.languageIso6393.toUpperCase()} Language | Unreached` : "Languages | Unreached";
  if (route.id === "coverage") return "Reviewed Coverage | Unreached";
  if (route.id === "pray") return route.prayerSourceId ? `Prayer for PEID ${route.prayerSourceId} | Unreached` : "Prayer | Unreached";
  if (route.id === "saved") return "Saved & Prayer | Unreached";
  if (route.id === "account") return "Account & Sync | Unreached";
  if (route.id === "about") return "About & Sources | Unreached";
  return "Page Not Found | Unreached";
}

export function hrefFor(path: string): string {
  const [routeValue, query = ""] = path.replace(/^#/, "").split("?", 2);
  const normalized = routeValue === "/" ? "/" : normalizeRoutePath(routeValue ?? "/");
  return `#${normalized}${query ? `?${query}` : ""}`;
}

export function useHashRoute(): RouteState {
  const [route, setRoute] = useState<RouteState>(() => readRoute());
  const historyTraversalRef = useRef(false);
  // A fresh direct route load should establish the app's main landmark as the
  // keyboard focus target. Later browser-history traversals deliberately set
  // this false so native scroll/focus restoration is not overwritten.
  const resetViewportRef = useRef(true);

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "auto";

    const onPopState = () => {
      historyTraversalRef.current = true;
    };
    const onHashChange = () => {
      resetViewportRef.current = !historyTraversalRef.current;
      historyTraversalRef.current = false;
      setRoute(readRoute());
    };

    window.addEventListener("popstate", onPopState);
    window.addEventListener("hashchange", onHashChange);

    if (!window.location.hash) {
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}#/`);
    }

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  useEffect(() => {
    document.title = titleForRoute(route);
  }, [route]);

  useEffect(() => {
    if (!resetViewportRef.current) return;
    resetViewportRef.current = false;
    const frame = window.requestAnimationFrame(() => {
      const main = document.getElementById("main-content");
      main?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "auto" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [route.path]);

  return useMemo(() => route, [route]);
}
