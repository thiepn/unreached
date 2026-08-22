import { useEffect } from "preact/hooks";

import { hrefFor, type RouteState } from "../app/router";
import { useLiveCountryExplorer } from "../countries";
import { useLanguageExplorer } from "../languages";
import { useWorldGeography } from "../map/geography";
import { useLivePeopleExplorer } from "../peoples";
import { usePersonalization } from "../personalization";

function PeopleRecentTracker({ sourcePeopleId }: { sourcePeopleId: number }) {
  const peoples = useLivePeopleExplorer();
  const { recordRecent } = usePersonalization();
  const people = peoples.peopleByRouteKey.get(sourcePeopleId) ?? null;
  useEffect(() => {
    if (!people) return;
    recordRecent({
      kind: "people",
      key: String(people.routeKey),
      label: people.displayName,
      secondary: [people.contexts[0]?.country.name, people.primaryLanguage?.name].filter(Boolean).join(" · ") || null,
      href: hrefFor(`/peoples/${people.routeKey}`),
    });
  }, [people, recordRecent]);
  return null;
}

function CountryRecentTracker({ iso3 }: { iso3: string }) {
  const countries = useLiveCountryExplorer();
  const geography = useWorldGeography();
  const { recordRecent } = usePersonalization();
  const country = countries.countriesByIso3.get(iso3) ?? null;
  const feature = geography.countries.find((item) => item.properties.iso3 === iso3 || item.properties.adminA3 === iso3) ?? null;
  const label = country?.name ?? feature?.properties.name ?? null;
  const secondary = country?.subregionName ?? country?.regionName ?? feature?.properties.continent ?? null;
  useEffect(() => {
    if (!label) return;
    recordRecent({ kind: "country", key: iso3, label, secondary, href: hrefFor(`/countries/${iso3}`) });
  }, [iso3, label, secondary, recordRecent]);
  return null;
}

function LanguageRecentTracker({ iso6393 }: { iso6393: string }) {
  const languages = useLanguageExplorer();
  const { recordRecent } = usePersonalization();
  const language = languages.languagesByIso.get(iso6393) ?? null;
  useEffect(() => {
    if (!language) return;
    recordRecent({
      kind: "language",
      key: language.iso6393,
      label: language.name,
      secondary: `${language.iso6393} · ${language.peopleGroupCount} people groups`,
      href: hrefFor(`/languages/${language.iso6393}`),
    });
  }, [language, recordRecent]);
  return null;
}

export function RecentRouteTracker({ route }: { route: RouteState }) {
  if (route.peopleSourceId) return <PeopleRecentTracker sourcePeopleId={route.peopleSourceId} />;
  if (route.countryIso3) return <CountryRecentTracker iso3={route.countryIso3} />;
  if (route.languageIso6393) return <LanguageRecentTracker iso6393={route.languageIso6393} />;
  return null;
}
