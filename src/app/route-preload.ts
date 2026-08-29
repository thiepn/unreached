import type { RouteId } from "./router";

type RoutePreloader = () => Promise<unknown>;

const routePreloaders: Partial<Record<RouteId, RoutePreloader>> = {
  explore: () => Promise.all([
    import("maplibre-gl/dist/maplibre-gl.css"),
    import("../pages/ExplorePage"),
  ]),
  peoples: () => import("../pages/PeoplesPage"),
  countries: () => import("../pages/CountriesPage"),
  languages: () => import("../pages/LanguagesPage"),
  coverage: () => import("../pages/EditorialCoveragePage"),
  pray: () => import("../pages/PrayPage"),
  saved: () => import("../pages/SavedPage"),
  account: () => import("../pages/AccountPage"),
  about: () => import("../pages/AboutPage"),
};

const loadedRoutes = new Set<RouteId>();
const pendingRoutes = new Map<RouteId, Promise<void>>();

export function preloadRoute(routeId: RouteId): void {
  if (loadedRoutes.has(routeId) || pendingRoutes.has(routeId)) return;
  const preload = routePreloaders[routeId];
  if (!preload) return;

  const pending = preload()
    .then(() => {
      loadedRoutes.add(routeId);
    })
    .catch(() => {
      // Preloading is opportunistic. Normal lazy navigation remains the retry path.
    })
    .finally(() => {
      pendingRoutes.delete(routeId);
    });
  pendingRoutes.set(routeId, pending);
}
