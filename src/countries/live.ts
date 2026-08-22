import { useMemo } from "preact/hooks";

import { buildVisibleCountryRecords, usePeopleGroupsRuntimeStore } from "../providers/peoplegroups";

export function useLiveCountryExplorer(enabled = true) {
  const runtime = usePeopleGroupsRuntimeStore(enabled);
  const countries = useMemo(
    () => buildVisibleCountryRecords(runtime.contexts, runtime.countrySummaries),
    [runtime.contexts, runtime.countrySummaries],
  );
  const countriesByIso3 = useMemo(() => new Map(countries.map((country) => [country.iso3, country])), [countries]);
  return { ...runtime, countries, countriesByIso3 };
}
