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

function reachClassification(gsec: number | null): RuntimePeopleContext["reach"]["classification"] {
  if (gsec === null) return "unknown";
  return gsec <= 3 ? "unreached" : "other";
}

function coordinatesFor(record: PeopleGroupsApiRecord) {
  const latitude = nullable(record.Latitude);
  const longitude = nullable(record.Longitude);
  if (latitude === null || longitude === null) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

export function toRuntimePeopleContext(record: PeopleGroupsApiRecord): RuntimePeopleContext {
  const gsec = nullable(record.GSEC);
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
      classification: reachClassification(gsec),
      methodology: "imb-gsec-v1",
      sourceValue: gsec,
      rule: "GSEC 0-3 => unreached; GSEC 4-6 => other; missing => unknown",
      evangelicalLevel: nullable(record.EvngLvl),
      gsec: { code: gsec, label: nullable(record.GSECbrf), description: nullable(record.GSEClng) },
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

function singleRecordReach(context: RuntimePeopleContext): RuntimePeopleEntity["reach"] {
  if (context.reach.classification === "unreached") {
    return { classification: "unreached-only", methodology: "imb-gsec-single-record-v1", unreachedContexts: 1, otherContexts: 0, unknownContexts: 0 };
  }
  if (context.reach.classification === "other") {
    return { classification: "other-only", methodology: "imb-gsec-single-record-v1", unreachedContexts: 0, otherContexts: 1, unknownContexts: 0 };
  }
  return { classification: "unknown", methodology: "imb-gsec-single-record-v1", unreachedContexts: 0, otherContexts: 0, unknownContexts: 1 };
}

/**
 * Build one compatibility entity per PeopleGroups API record.
 *
 * Do not group records by PEID. Complete live-corpus certification on
 * 2026-08-23 found PEID and PGID to be 1:1 across all 12,370 records, with no
 * PEID spanning countries. Cross-country associations are source-taxonomy
 * relationships (for example PplNm / ROP3 people name), not PEID rollups.
 */
export function buildRuntimePeopleEntities(records: PeopleGroupsApiRecord[]): RuntimePeopleEntity[] {
  const seenPeids = new Set<number>();
  const seenPgids = new Set<string>();

  return records.map((record) => {
    if (seenPeids.has(record.PEID)) throw new Error(`PeopleGroups runtime received duplicate PEID ${record.PEID}; current certified semantics require one PEID per PGID record.`);
    if (seenPgids.has(record.PGID)) throw new Error(`PeopleGroups runtime received duplicate PGID ${record.PGID}.`);
    seenPeids.add(record.PEID);
    seenPgids.add(record.PGID);

    const context = toRuntimePeopleContext(record);
    const populationKnown = context.population.value !== null;
    return runtimePeopleEntitySchema.parse({
      id: `people-entity:peoplegroups:${context.peid}`,
      provider: "peoplegroups-org",
      peid: context.peid,
      routeKey: context.peid,
      displayName: context.displayName,
      contexts: [context],
      countries: [{ iso3: context.country.iso3, name: context.country.name }],
      population: {
        knownValue: context.population.value ?? 0,
        knownContextCount: populationKnown ? 1 : 0,
        totalContextCount: 1,
        complete: populationKnown,
        aggregation: "single-pgid-population-estimate",
      },
      reach: singleRecordReach(context),
      primaryLanguage: context.language.iso6393 !== null || context.language.name !== null
        ? { iso6393: context.language.iso6393, name: context.language.name }
        : null,
      primaryReligion: context.religion.code !== null || context.religion.name !== null
        ? { code: context.religion.code, name: context.religion.name }
        : null,
      sourceUpdatedAt: context.sourceUpdatedAt,
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
