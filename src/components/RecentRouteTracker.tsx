import { useEffect } from "preact/hooks";

import { hrefFor, type RouteState } from "../app/router";
import { useCountryExplorer } from "../countries";
import { useLanguageExplorer } from "../languages";
import { useWorldGeography } from "../map/geography";
import { usePeopleExplorer } from "../peoples";
import { usePersonalization } from "../personalization";

export function RecentRouteTracker({ route }: { route: RouteState }) {
  const countries = useCountryExplorer();
  const geography = useWorldGeography();
  const peoples = usePeopleExplorer();
  const languages = useLanguageExplorer();
  const { recordRecent } = usePersonalization();

  useEffect(() => {
    if (route.id === "not-found") return;

    if (route.peopleSourceId) {
      const people = peoples.peopleBySourceId.get(route.peopleSourceId);
      if (people) recordRecent({
        kind: "people",
        key: String(people.sourcePeopleId),
        label: people.name,
        secondary: [people.largestCountry?.name, people.primaryLanguage?.name].filter(Boolean).join(" · ") || null,
        href: hrefFor(`/peoples/${people.sourcePeopleId}`),
      });
      return;
    }

    if (route.countryIso3) {
      const country = countries.countriesByIso3.get(route.countryIso3);
      const feature = geography.countries.find((item) => item.properties.iso3 === route.countryIso3 || item.properties.adminA3 === route.countryIso3);
      const label = country?.name ?? feature?.properties.name;
      if (label) recordRecent({
        kind: "country",
        key: route.countryIso3,
        label,
        secondary: country?.regionName ?? feature?.properties.continent ?? null,
        href: hrefFor(`/countries/${route.countryIso3}`),
      });
      return;
    }

    if (route.languageIso6393) {
      const language = languages.languagesByIso.get(route.languageIso6393);
      if (language) recordRecent({
        kind: "language",
        key: language.iso6393,
        label: language.name,
        secondary: `${language.iso6393} · ${language.peopleGroupCount} people groups`,
        href: hrefFor(`/languages/${language.iso6393}`),
      });
    }
  }, [route.path, route.peopleSourceId, route.countryIso3, route.languageIso6393, peoples.peopleBySourceId, countries.countriesByIso3, geography.countries, languages.languagesByIso, recordRecent]);

  return null;
}
