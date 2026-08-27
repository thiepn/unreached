import { entityGsecRange, entityTaxonomy } from "./model";
import type { RuntimePeopleEntity } from "./types";

const FIELD_SEPARATOR = "\u0000";

export interface RuntimePeopleSearchRecord {
  entity: RuntimePeopleEntity;
  searchText: string;
  prayerSearchText: string;
  countryIso3s: ReadonlySet<string>;
  unreachedCountryIso3s: ReadonlySet<string>;
  languageKeys: ReadonlySet<string>;
  religionKeys: ReadonlySet<string>;
  bibleAvailability: ReadonlySet<string>;
  gsecMin: number;
  population: number;
  affinityBloc: string | null;
  peopleCluster: string | null;
}

export interface RuntimePeopleFilterOptions {
  countries: Array<[iso3: string, name: string]>;
  languages: Array<[key: string, label: string]>;
  religions: Array<[key: string, label: string]>;
  bibleStatuses: string[];
}

export interface RuntimePeopleSearchIndex {
  records: RuntimePeopleSearchRecord[];
  byRouteKey: Map<number, RuntimePeopleSearchRecord>;
  options: RuntimePeopleFilterOptions;
}

function normalizedFields(values: Array<string | number | null | undefined>): string {
  return values
    .filter((value): value is string | number => value !== null && value !== undefined && String(value).trim().length > 0)
    .map((value) => String(value).toLocaleLowerCase("en"))
    .join(FIELD_SEPARATOR);
}

function sortedEntries(values: Map<string, string>): Array<[string, string]> {
  return [...values.entries()].sort((a, b) => a[1].localeCompare(b[1], "en") || a[0].localeCompare(b[0], "en"));
}

const searchIndexCache = new WeakMap<RuntimePeopleEntity[], RuntimePeopleSearchIndex>();

export function createEmptyRuntimePeopleSearchIndex(): RuntimePeopleSearchIndex {
  return {
    records: [],
    byRouteKey: new Map(),
    options: { countries: [], languages: [], religions: [], bibleStatuses: [] },
  };
}

export function getRuntimePeopleSearchIndex(entities: RuntimePeopleEntity[]): RuntimePeopleSearchIndex {
  const cached = searchIndexCache.get(entities);
  if (cached) return cached;

  const countries = new Map<string, string>();
  const languages = new Map<string, string>();
  const religions = new Map<string, string>();
  const bibleStatuses = new Set<string>();

  const records = entities.map((entity): RuntimePeopleSearchRecord => {
    const taxonomy = entityTaxonomy(entity);
    const countryIso3s = new Set<string>();
    const unreachedCountryIso3s = new Set<string>();
    const languageKeys = new Set<string>();
    const religionKeys = new Set<string>();
    const bibleAvailability = new Set<string>();
    const searchFields: Array<string | number | null | undefined> = [
      entity.displayName,
      entity.peid,
      entity.primaryLanguage?.name,
      entity.primaryLanguage?.iso6393,
      entity.primaryReligion?.name,
      entity.primaryReligion?.code,
      taxonomy.affinityBloc,
      taxonomy.peopleCluster,
      taxonomy.peopleName,
      taxonomy.ethnographicGroup,
    ];
    const prayerSearchFields: Array<string | number | null | undefined> = [
      entity.displayName,
      entity.peid,
      entity.primaryLanguage?.name,
      entity.primaryReligion?.name,
    ];

    for (const context of entity.contexts) {
      countryIso3s.add(context.country.iso3);
      countries.set(context.country.iso3, context.country.name);
      if (context.reach.classification === "unreached") unreachedCountryIso3s.add(context.country.iso3);

      if (context.language.iso6393) {
        languageKeys.add(context.language.iso6393);
        languages.set(
          context.language.iso6393,
          `${context.language.name ?? context.language.iso6393} (${context.language.iso6393})`,
        );
      }
      if (context.language.name) {
        languageKeys.add(context.language.name);
        if (!context.language.iso6393) languages.set(context.language.name, context.language.name);
      }

      if (context.religion.code) {
        religionKeys.add(context.religion.code);
        religions.set(context.religion.code, context.religion.name ?? context.religion.displayName ?? context.religion.code);
      }
      if (context.religion.name) {
        religionKeys.add(context.religion.name);
        if (!context.religion.code) religions.set(context.religion.name, context.religion.name);
      }

      if (context.resources.bibleAvailability) {
        bibleAvailability.add(context.resources.bibleAvailability);
        bibleStatuses.add(context.resources.bibleAvailability);
      }

      searchFields.push(
        context.pgid,
        context.displayName,
        context.alternateNames,
        context.country.name,
        context.country.iso3,
        context.language.name,
        context.language.iso6393,
        context.religion.name,
        context.religion.displayName,
      );
      prayerSearchFields.push(context.country.name, context.country.iso3, context.pgid);
    }

    return {
      entity,
      searchText: normalizedFields(searchFields),
      prayerSearchText: normalizedFields(prayerSearchFields),
      countryIso3s,
      unreachedCountryIso3s,
      languageKeys,
      religionKeys,
      bibleAvailability,
      gsecMin: entityGsecRange(entity)?.min ?? Number.POSITIVE_INFINITY,
      population: entity.population.knownValue,
      affinityBloc: taxonomy.affinityBloc,
      peopleCluster: taxonomy.peopleCluster,
    };
  });

  const index: RuntimePeopleSearchIndex = {
    records,
    byRouteKey: new Map(records.map((record) => [record.entity.routeKey, record])),
    options: {
      countries: sortedEntries(countries),
      languages: sortedEntries(languages),
      religions: sortedEntries(religions),
      bibleStatuses: [...bibleStatuses].sort((a, b) => a.localeCompare(b, "en")),
    },
  };
  searchIndexCache.set(entities, index);
  return index;
}
