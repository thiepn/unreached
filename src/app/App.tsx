import { AppShell } from "../components/AppShell";
import { CountriesPage } from "../pages/CountriesPage";
import { CountryPage } from "../pages/CountryPage";
import { ExplorePage } from "../pages/ExplorePage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PeopleContextualPage } from "../pages/PeopleContextualPage";
import { PeoplesPage } from "../pages/PeoplesPage";
import { SectionPage } from "../pages/SectionPage";
import { useHashRoute } from "./router";

export function App() {
  const route = useHashRoute();

  let page;

  switch (route.id) {
    case "explore":
      page = <ExplorePage />;
      break;
    case "peoples":
      page = route.peopleSourceId ? <PeopleContextualPage sourcePeopleId={route.peopleSourceId} /> : <PeoplesPage />;
      break;
    case "countries":
      page = route.countryIso3 ? <CountryPage iso3={route.countryIso3} /> : <CountriesPage />;
      break;
    case "pray":
      page = <SectionPage kind="pray" />;
      break;
    case "saved":
      page = <SectionPage kind="saved" />;
      break;
    case "about":
      page = <SectionPage kind="about" />;
      break;
    default:
      page = <NotFoundPage />;
  }

  return <AppShell activeRoute={route.id}>{page}</AppShell>;
}
