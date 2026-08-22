import {
  runtimeCountrySummarySchema,
  runtimePeopleContextSchema,
  runtimePeopleEntitySchema,
  type PeopleGroupsApiRecord,
  type RuntimeCountrySummary,
  type RuntimePeopleContext,
  type RuntimePeopleEntity,
} from "./types";

function nullable<T>(value: T | null | undefined): T | null {
  return value ?? null;
}

function reachClassification(value: string | null): RuntimePeopleContext["reach"]["classification"] {
  if (value === null) return "unknown";
  return value.trim().toLowerCase() === "less than 2%" ? "unreached" : "other";
}

function coordinatesFor(record: PeopleGroupsApiRecord) {
  const latitude = nullable(record.Latitude);
  const longitude = nullable(record.Longitude);
  if (latitude === null || longitude === null) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

export function toRuntimePeopleContext(record: PeopleGroupsApiRecord): RuntimePeopleContext {
  const sourceValue = nullable(record.EvngLvl);
  return runtimePeopleContextSchema.parse({
    provider: "peoplegroups-org",
    pgid: record.PGID,
    peid: record.PEID,
    displayName: record.NmDisp,
    alternateNames: nullable(record.NmAlt),
    country: {
      iso3: record.ISOalpha3,
      name: record.Ctry,
      region: nullable(record.Regn),
      subregion: nullable(record.RegnSub),
    },
    population: { value: nullable(record.Pop), quality: "estimated" },
    coordinates: coordinatesFor(record),
    language: {
      iso6393: nullable(record.ROL),
      name: nullable(record.Lang),
      family: nullable(record.LangFamily),
    },
    religion: {
      code: nullable(record.ROR),
      name: nullable(record.Rlgn),
      displayName: nullable(record.RlgnDiv),
    },
    reach: {
      classification: reachClassification(sourceValue),
      methodology: "imb-evangelical-level-v1",
      sourceValue,
      rule: "EvngLvl 'Less than 2%' => unreached; other non-empty values => other; missing => unknown",
      gsec: { code: nullable(record.GSEC), label: nullable(record.GSECbrf), description: nullable(record.GSEClng) },
      spi: { code: nullable(record.SPI), description: nullable(record.SPIdesc) },
      lpi: { code: nullable(record.LPI), name: nullable(record.LPIname), description: nullable(record.LPIdesc) },
      engagementStatus: nullable(record.EngStat),
      churchPlanting: nullable(record.Plnting),
      congregationExists: nullable(record.CongExst),
    },
    resources: {
      bibleAvailability: nullable(record.Bible),
      jesusFilmAvailability: nullable(record.Jesus),
      totalReported: nullable(record.ResTot),
    },
    taxonomy: {
      affinityBloc: nullable(record.Affbloc),
      peopleCluster: nullable(record.PplClstr),
      peopleName: nullable(record.PplNm),
      ethnographicGroup: nullable(record.Ethne),
    },
    editorial: {
      peopleDescription: nullable(record.PeopleDesc),
      locationDescription: nullable(record.LocationDesc),
      treatment: "source-attributed-only",
    },
    sourceUpdatedAt: nullable(record.UpdatedDate),
  });
}

function mostCommon<T>(values: T[], key: (value: T) => string): T | null {
  if (!values.length) return null;
  const counts = new Map<string, { count: number; value: T }>();
  for (const value of values) {
    const itemKey = key(value);
    const current = counts.get(itemKey);
    counts.set(itemKey, { count: (current?.count ?? 0) + 1, value });
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || key(a.value).localeCompare(key(b.value), "en"))[0]?.value ?? null;
}

function newestTimestamp(values: Array<string | null>): string | null {
  return values
    .filter((value): value is string => value !== null)
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;
}

function entityReach(contexts: RuntimePeopleContext[]): RuntimePeopleEntity["reach"] {
  const unreachedContexts = contexts.filter((item) => item.reach.classification === "unreached").length;
  const otherContexts = contexts.filter((item) => item.reach.classification === "other").length;
  const unknownContexts = contexts.length - unreachedContexts - otherContexts;
  const classification = unreachedContexts > 0 && otherContexts > 0
    ? "mixed"
    : unreachedContexts > 0
      ? "unreached-only"
      : otherContexts > 0
        ? "other-only"
        : "unknown";
  return { classification, methodology: "imb-context-rollup-v1", unreachedContexts, otherContexts, unknownContexts };
}

export function buildRuntimePeopleEntities(records: PeopleGroupsApiRecord[]): RuntimePeopleEntity[] {
  const contexts = records.map(toRuntimePeopleContext);
  const byPeid = new Map<number, RuntimePeopleContext[]>();
  for (const context of contexts) {
    const group = byPeid.get(context.peid) ?? [];
    group.push(context);
    byPeid.set(context.peid, group);
  }

  return [...byPeid.entries()].map(([peid, group]) => {
    const ordered = [...group].sort((a, b) => (b.population.value ?? -1) - (a.population.value ?? -1) || a.country.name.localeCompare(b.country.name, "en"));
    const known = ordered.filter((context) => context.population.value !== null);
    const languageCandidates = ordered
      .filter((context) => context.language.iso6393 !== null || context.language.name !== null)
      .map((context) => ({ iso6393: context.language.iso6393, name: context.language.name }));
    const religionCandidates = ordered
      .filter((context) => context.religion.code !== null || context.religion.name !== null)
      .map((context) => ({ code: context.religion.code, name: context.religion.name }));

    return runtimePeopleEntitySchema.parse({
      id: `people-entity:peoplegroups:${peid}`,
      provider: "peoplegroups-org",
      peid,
      routeKey: peid,
      displayName: ordered[0]!.displayName,
      contexts: ordered,
      countries: [...new Map(ordered.map((context) => [context.country.iso3, { iso3: context.country.iso3, name: context.country.name }])).values()]
        .sort((a, b) => a.name.localeCompare(b.name, "en")),
      population: {
        knownValue: known.reduce((sum, context) => sum + (context.population.value ?? 0), 0),
        knownContextCount: known.length,
        totalContextCount: ordered.length,
        complete: known.length === ordered.length,
        aggregation: "sum-known-country-context-populations",
      },
      reach: entityReach(ordered),
      primaryLanguage: mostCommon(languageCandidates, (item) => `${item.iso6393 ?? ""}|${item.name ?? ""}`),
      primaryReligion: mostCommon(religionCandidates, (item) => `${item.code ?? ""}|${item.name ?? ""}`),
      sourceUpdatedAt: newestTimestamp(ordered.map((context) => context.sourceUpdatedAt)),
    });
  }).sort((a, b) => b.population.knownValue - a.population.knownValue || a.displayName.localeCompare(b.displayName, "en"));
}

export function buildRuntimeCountrySummaries(records: PeopleGroupsApiRecord[]): RuntimeCountrySummary[] {
  const contexts = records.map(toRuntimePeopleContext);
  const byCountry = new Map<string, RuntimePeopleContext[]>();
  for (const context of contexts) {
    const group = byCountry.get(context.country.iso3) ?? [];
    group.push(context);
    byCountry.set(context.country.iso3, group);
  }

  return [...byCountry.entries()].map(([iso3, group]) => {
    const populationKnown = group.filter((context) => context.population.value !== null);
    return runtimeCountrySummarySchema.parse({
      iso3,
      name: group[0]!.country.name,
      peopleContextCount: group.length,
      unreachedContextCount: group.filter((context) => context.reach.classification === "unreached").length,
      otherContextCount: group.filter((context) => context.reach.classification === "other").length,
      unknownContextCount: group.filter((context) => context.reach.classification === "unknown").length,
      knownPopulation: populationKnown.reduce((sum, context) => sum + (context.population.value ?? 0), 0),
      populationKnownContextCount: populationKnown.length,
      populationCoverageComplete: populationKnown.length === group.length,
      denominator: "people-group-in-country records returned by PeopleGroups.org",
    });
  }).sort((a, b) => a.name.localeCompare(b.name, "en"));
}
