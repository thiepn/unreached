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

function readRoute(): RouteState {
  const path = normalizeHash(window.location.hash);
  return {
    id: ROUTES[path] ?? "not-found",
    path
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
