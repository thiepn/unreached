import { atlasRegionForCountry } from "../geography/regions";
import { useWorldGeography } from "../map/geography";
import { usePeopleGroupsRuntimeStore } from "../providers/peoplegroups";
import { getSharedLiveLanguageData } from "../languages/live";
import { buildSearchDocuments, type SearchDocument, type SearchRegionInput } from "./search";

interface SharedSearchCache {
  peopleGeneration: number;
  geographyGeneration: number;
  documents: SearchDocument[];
}

let cache: SharedSearchCache = { peopleGeneration: -1, geographyGeneration: -1, documents: [] };

function buildRegionInputs(geography: ReturnType<typeof useWorldGeography>): SearchRegionInput[] {
  const regions = new Map<string, SearchRegionInput>();
  for (const country of geography.countries) {
    const identity = atlasRegionForCountry(country);
    if (!identity) continue;
    const current = regions.get(identity.id) ?? { id: identity.id, name: identity.name, countryNames: [] };
    if (!current.countryNames?.includes(country.properties.name)) current.countryNames?.push(country.properties.name);
    regions.set(identity.id, current);
  }
  return [...regions.values()].map((region) => ({
    ...region,
    countryNames: [...(region.countryNames ?? [])].sort((a, b) => a.localeCompare(b, "en")),
  }));
}

export function useSharedSearchDocuments(enabled = true) {
  const runtime = usePeopleGroupsRuntimeStore(enabled);
  const geography = useWorldGeography(enabled);

  if (enabled && runtime.ready && geography.data && (
    cache.peopleGeneration !== runtime.generation || cache.geographyGeneration !== geography.generation
  )) {
    const languages = getSharedLiveLanguageData(runtime.contexts);
    const geographicCountries = geography.countries.flatMap((feature) => {
      const rawIso = feature.properties.iso3 || feature.properties.adminA3;
      const iso3 = typeof rawIso === "string" ? rawIso.toUpperCase() : "";
      if (!/^[A-Z]{3}$/.test(iso3)) return [];
      const record = runtime.countriesByIso3.get(iso3);
      return [{ iso3, name: record?.name ?? feature.properties.name, regionName: record?.regionName ?? feature.properties.continent ?? null }];
    });

    cache = {
      peopleGeneration: runtime.generation,
      geographyGeneration: geography.generation,
      documents: buildSearchDocuments({
        peoples: runtime.peopleSearchIndex.records.map((prepared) => ({
          sourcePeopleId: prepared.entity.routeKey,
          name: prepared.entity.displayName,
          primaryLanguageName: prepared.entity.primaryLanguage?.name ?? null,
          primaryReligionName: prepared.entity.primaryReligion?.name ?? null,
          largestCountryName: prepared.entity.contexts[0]?.country.name ?? null,
          cluster: prepared.peopleCluster,
          affinityBloc: prepared.affinityBloc,
        })),
        regions: buildRegionInputs(geography),
        countries: geographicCountries,
        languages: languages.languages.map((language) => ({
          iso6393: language.iso6393,
          name: language.name,
          familyName: language.familyName,
          branchName: null,
          countryNames: language.countries.map((country) => country.name),
          peopleNames: language.peoples.map((people) => people.name),
        })),
      }),
    };
  }

  return {
    documents: enabled ? cache.documents : [],
    loading: enabled && (runtime.loading || geography.loading),
    error: enabled ? runtime.error ?? geography.error : null,
    progress: runtime.progress,
  };
}
