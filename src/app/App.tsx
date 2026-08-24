import { lazy, Suspense } from "preact/compat";

import { AppShell } from "../components/AppShell";
import { RecentRouteTracker } from "../components/RecentRouteTracker";
import { useHashRoute } from "./router";

const AboutPage = lazy(() => import("../pages/AboutPage").then((module) => ({ default: module.AboutPage })));
const CountriesPage = lazy(() => import("../pages/CountriesPage").then((module) => ({ default: module.CountriesPage })));
const CountryPage = lazy(() => import("../pages/CountryPage").then((module) => ({ default: module.CountryPage })));
const EditorialCoveragePage = lazy(() => import("../pages/EditorialCoveragePage").then((module) => ({ default: module.EditorialCoveragePage })));
const ExplorePage = lazy(() => import("../pages/ExplorePage").then((module) => ({ default: module.ExplorePage })));
const LanguagePage = lazy(() => import("../pages/LanguagePage").then((module) => ({ default: module.LanguagePage })));
const LanguagesPage = lazy(() => import("../pages/LanguagesPage").then((module) => ({ default: module.LanguagesPage })));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage").then((module) => ({ default: module.NotFoundPage })));
const PeopleContextualPage = lazy(() => import("../pages/PeopleContextualPage").then((module) => ({ default: module.PeopleContextualPage })));
const PeoplesPage = lazy(() => import("../pages/PeoplesPage").then((module) => ({ default: module.PeoplesPage })));
const PrayPage = lazy(() => import("../pages/PrayPage").then((module) => ({ default: module.PrayPage })));
const PrayerFocusPage = lazy(() => import("../pages/PrayerFocusPage").then((module) => ({ default: module.PrayerFocusPage })));
const SavedPage = lazy(() => import("../pages/SavedPage").then((module) => ({ default: module.SavedPage })));

function RouteFallback() {
  return (
    <div class="route-loading" role="status">
      <span class="loading-pulse" aria-hidden="true" />
      <strong>Opening this section…</strong>
    </div>
  );
}

export function App() {
  const route = useHashRoute();
  let page;

  switch (route.id) {
    case "explore": page = <ExplorePage />; break;
    case "peoples": page = route.peopleSourceId ? <PeopleContextualPage sourcePeopleId={route.peopleSourceId} /> : <PeoplesPage />; break;
    case "countries": page = route.countryIso3 ? <CountryPage iso3={route.countryIso3} /> : <CountriesPage />; break;
    case "languages": page = route.languageIso6393 ? <LanguagePage iso6393={route.languageIso6393} /> : <LanguagesPage />; break;
    case "coverage": page = <EditorialCoveragePage />; break;
    case "pray": page = route.prayerSourceId ? <PrayerFocusPage sourcePeopleId={route.prayerSourceId} /> : <PrayPage />; break;
    case "saved": page = <SavedPage />; break;
    case "about": page = <AboutPage />; break;
    default: page = <NotFoundPage />;
  }

  return (
    <AppShell activeRoute={route.id}>
      <RecentRouteTracker route={route} />
      <Suspense fallback={<RouteFallback />}>{page}</Suspense>
    </AppShell>
  );
}
