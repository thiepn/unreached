import { useWorldGeography } from "../map/geography";
import { usePeopleGroupsRuntimeStore, entityTaxonomy } from "../providers/peoplegroups";
import { getSharedLiveLanguageData } from "../languages/live";
import { buildSearchDocuments, type SearchDocument } from "./search";

interface SharedSearchCache {
  peopleGeneration: number;
  geographyGeneration: number;
  documents: SearchDocument[];
}

let cache: SharedSearchCache = { peopleGeneration: -1, geographyGeneration: -1, documents: [] };

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
        peoples: runtime.entities.map((people) => {
          const taxonomy = entityTaxonomy(people);
          return {
            sourcePeopleId: people.routeKey,
            name: people.displayName,
            primaryLanguageName: people.primaryLanguage?.name ?? null,
            primaryReligionName: people.primaryReligion?.name ?? null,
            largestCountryName: people.contexts[0]?.country.name ?? null,
            cluster: taxonomy.peopleCluster,
            affinityBloc: taxonomy.affinityBloc,
          };
        }),
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
