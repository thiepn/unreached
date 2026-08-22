import { AppShell } from "../components/AppShell";
import { RecentRouteTracker } from "../components/RecentRouteTracker";
import { AboutPage } from "../pages/AboutPage";
import { CountriesPage } from "../pages/CountriesPage";
import { CountryPage } from "../pages/CountryPage";
import { ExplorePage } from "../pages/ExplorePage";
import { LanguagePage } from "../pages/LanguagePage";
import { LanguagesPage } from "../pages/LanguagesPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PeopleContextualPage } from "../pages/PeopleContextualPage";
import { PeoplesPage } from "../pages/PeoplesPage";
import { PrayPage } from "../pages/PrayPage";
import { PrayerFocusPage } from "../pages/PrayerFocusPage";
import { SavedPage } from "../pages/SavedPage";
import { useHashRoute } from "./router";

export function App() {
  const route = useHashRoute();
  let page;

  switch (route.id) {
    case "explore": page = <ExplorePage />; break;
    case "peoples": page = route.peopleSourceId ? <PeopleContextualPage sourcePeopleId={route.peopleSourceId} /> : <PeoplesPage />; break;
    case "countries": page = route.countryIso3 ? <CountryPage iso3={route.countryIso3} /> : <CountriesPage />; break;
    case "languages": page = route.languageIso6393 ? <LanguagePage iso6393={route.languageIso6393} /> : <LanguagesPage />; break;
    case "pray": page = route.prayerSourceId ? <PrayerFocusPage sourcePeopleId={route.prayerSourceId} /> : <PrayPage />; break;
    case "saved": page = <SavedPage />; break;
    case "about": page = <AboutPage />; break;
    default: page = <NotFoundPage />;
  }

  return <AppShell activeRoute={route.id}><RecentRouteTracker route={route} />{page}</AppShell>;
}
