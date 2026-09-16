import {
  assertMissionModelInvariants,
  classificationObservationSchema,
  coordinatesObservationSchema,
  countryEntitySchema,
  fieldProvenanceSchema,
  languageEntitySchema,
  normalizedMissionModelSchema,
  numberObservationSchema,
  peopleContextSchema,
  peopleEntitySchema,
  populationEstimateSchema,
  religionEntitySchema,
  sourceReferenceSchema,
  textObservationSchema,
  type CountryEntity,
  type FieldProvenance,
  type LanguageEntity,
  type NormalizedMissionModel,
  type ReligionEntity,
  type SourceReference,
  type TextObservation,
} from "../../mission-model";
import { classifyPeopleGroupsGsec, PEOPLE_GROUPS_SOURCE_ID } from "./classification";
import type { PeopleGroupsApiRecord } from "./types";

const ID_NAMESPACE = "peoplegroups";

function nullable<T>(value: T | null | undefined): T | null {
  return value ?? null;
}

function sourceReference(record: PeopleGroupsApiRecord, retrievedAt: string): SourceReference {
  return sourceReferenceSchema.parse({
    sourceId: PEOPLE_GROUPS_SOURCE_ID,
    recordId: record.PGID,
    retrievedAt,
    sourceUpdatedAt: nullable(record.UpdatedDate),
  });
}

function provenance(
  record: PeopleGroupsApiRecord,
  retrievedAt: string,
  sourceFields: string[],
  transformation: string | null = null,
  geographicScopeId: string | null = `country:${record.ISOalpha3}`,
): FieldProvenance {
  return fieldProvenanceSchema.parse({
    source: sourceReference(record, retrievedAt),
    sourceFields,
    transformation,
    geographicScopeId,
  });
}

function textObservation(
  record: PeopleGroupsApiRecord,
  retrievedAt: string,
  sourceFields: string[],
  value: string | null | undefined,
  transformation: string | null = null,
): TextObservation {
  const normalized = nullable(value);
  return textObservationSchema.parse({
    value: normalized,
    quality: normalized === null ? "unknown" : "reported",
    provenance: provenance(record, retrievedAt, sourceFields, transformation),
  });
}

function peopleId(record: PeopleGroupsApiRecord): `people:${string}:${string}` {
  return `people:${ID_NAMESPACE}:${record.PEID}`;
}

function contextId(record: PeopleGroupsApiRecord): `people-context:${string}:${string}` {
  return `people-context:${ID_NAMESPACE}:${record.PGID.toLowerCase()}`;
}

function countryId(record: PeopleGroupsApiRecord): `country:${string}` {
  return `country:${record.ISOalpha3}`;
}

function languageId(record: PeopleGroupsApiRecord): `language:${string}` | null {
  return record.ROL ? `language:${record.ROL}` : null;
}

function encodeIdPart(value: string): string {
  return [...value].map((character) => character.codePointAt(0)!.toString(16)).join("-");
}

function religionId(record: PeopleGroupsApiRecord): `religion:${string}:${string}` | null {
  return record.ROR ? `religion:${ID_NAMESPACE}:${encodeIdPart(record.ROR)}` : null;
}

function coordinatesFor(record: PeopleGroupsApiRecord, retrievedAt: string) {
  const latitude = nullable(record.Latitude);
  const longitude = nullable(record.Longitude);
  const valid = latitude !== null
    && longitude !== null
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180;
  const hadInvalidCoordinate = (latitude !== null || longitude !== null) && !valid;

  return coordinatesObservationSchema.parse({
    value: valid ? { latitude, longitude } : null,
    precision: valid ? "provider-coordinate" : "unknown",
    provenance: provenance(
      record,
      retrievedAt,
      ["Latitude", "Longitude"],
      hadInvalidCoordinate ? "Invalid or incomplete provider coordinate omitted; no coordinate was inferred or clamped." : null,
    ),
  });
}

function addUnique(target: string[], value: string | null | undefined): void {
  if (value && !target.includes(value)) target.push(value);
}

function upsertCountry(
  countries: Map<string, CountryEntity>,
  record: PeopleGroupsApiRecord,
  retrievedAt: string,
): void {
  const id = countryId(record);
  const existing = countries.get(id);
  if (existing) {
    if (existing.name !== record.Ctry) addUnique(existing.alternateNames, record.Ctry);
    return;
  }
  countries.set(id, countryEntitySchema.parse({
    kind: "country",
    id,
    iso3: record.ISOalpha3,
    name: record.Ctry,
    alternateNames: [],
    externalIds: [{ sourceId: PEOPLE_GROUPS_SOURCE_ID, namespace: "ISOalpha3", value: record.ISOalpha3 }],
    provenance: [provenance(record, retrievedAt, ["ISOalpha3", "Ctry"])],
  }));
}

function upsertLanguage(
  languages: Map<string, LanguageEntity>,
  record: PeopleGroupsApiRecord,
  retrievedAt: string,
): void {
  const id = languageId(record);
  if (!id || !record.ROL) return;
  const currentName = nullable(record.Lang);
  const currentFamily = nullable(record.LangFamily);
  const existing = languages.get(id);
  if (existing) {
    if (existing.name === null && currentName !== null) {
      existing.name = currentName;
      existing.provenance.push(provenance(record, retrievedAt, ["ROL", "Lang"]));
    } else if (currentName !== null && existing.name !== currentName) {
      addUnique(existing.alternateNames, currentName);
    }
    addUnique(existing.familyNames, currentFamily);
    return;
  }
  languages.set(id, languageEntitySchema.parse({
    kind: "language",
    id,
    iso6393: record.ROL,
    name: currentName,
    alternateNames: [],
    familyNames: currentFamily ? [currentFamily] : [],
    externalIds: [{ sourceId: PEOPLE_GROUPS_SOURCE_ID, namespace: "ISO639-3", value: record.ROL }],
    provenance: [provenance(record, retrievedAt, ["ROL", "Lang", "LangFamily"])],
  }));
}

function upsertReligion(
  religions: Map<string, ReligionEntity>,
  record: PeopleGroupsApiRecord,
  retrievedAt: string,
): void {
  const id = religionId(record);
  if (!id || !record.ROR) return;
  const sourceName = nullable(record.Rlgn);
  const sourceDisplayName = nullable(record.RlgnDiv);
  const existing = religions.get(id);
  if (existing) {
    if (existing.name === null && sourceName !== null) {
      existing.name = sourceName;
      existing.provenance.push(provenance(record, retrievedAt, ["ROR", "Rlgn"]));
    } else if (sourceName !== null && existing.name !== sourceName) {
      addUnique(existing.alternateNames, sourceName);
    }
    if (sourceDisplayName !== null && sourceDisplayName !== existing.name) addUnique(existing.alternateNames, sourceDisplayName);
    return;
  }
  religions.set(id, religionEntitySchema.parse({
    kind: "religion",
    id,
    code: record.ROR,
    name: sourceName,
    alternateNames: sourceDisplayName && sourceDisplayName !== sourceName ? [sourceDisplayName] : [],
    externalIds: [{ sourceId: PEOPLE_GROUPS_SOURCE_ID, namespace: "ROR", value: record.ROR }],
    provenance: [provenance(record, retrievedAt, ["ROR", "Rlgn", "RlgnDiv"])],
  }));
}

function sourceIndicators(record: PeopleGroupsApiRecord, retrievedAt: string) {
  const indicators = [];
  if (record.GSEC !== null || record.GSECbrf || record.GSEClng) {
    indicators.push({
      key: "gsec",
      code: nullable(record.GSEC),
      label: nullable(record.GSECbrf),
      description: nullable(record.GSEClng),
      provenance: provenance(record, retrievedAt, ["GSEC", "GSECbrf", "GSEClng"]),
    });
  }
  if (record.SPI !== null || record.SPIdesc) {
    indicators.push({
      key: "spi",
      code: nullable(record.SPI),
      label: null,
      description: nullable(record.SPIdesc),
      provenance: provenance(record, retrievedAt, ["SPI", "SPIdesc"]),
    });
  }
  if (record.LPI !== null || record.LPIname || record.LPIdesc) {
    indicators.push({
      key: "lpi",
      code: nullable(record.LPI),
      label: nullable(record.LPIname),
      description: nullable(record.LPIdesc),
      provenance: provenance(record, retrievedAt, ["LPI", "LPIname", "LPIdesc"]),
    });
  }
  return indicators;
}

/**
 * Build the provider-independent V3 mission knowledge model from validated
 * PeopleGroups records. This is an in-memory normalization boundary, not a
 * public mirror of the provider corpus.
 */
export function buildPeopleGroupsMissionModel(
  records: PeopleGroupsApiRecord[],
  retrievedAt: string,
): NormalizedMissionModel {
  const seenPeids = new Set<number>();
  const seenPgids = new Set<string>();
  const people = [];
  const peopleContexts = [];
  const countries = new Map<string, CountryEntity>();
  const languages = new Map<string, LanguageEntity>();
  const religions = new Map<string, ReligionEntity>();

  for (const record of records) {
    if (seenPeids.has(record.PEID)) {
      throw new Error(`PeopleGroups V3 normalization received duplicate PEID ${record.PEID}; cross-context PEID merging is not certified.`);
    }
    if (seenPgids.has(record.PGID)) {
      throw new Error(`PeopleGroups V3 normalization received duplicate PGID ${record.PGID}.`);
    }
    seenPeids.add(record.PEID);
    seenPgids.add(record.PGID);

    upsertCountry(countries, record, retrievedAt);
    upsertLanguage(languages, record, retrievedAt);
    upsertReligion(religions, record, retrievedAt);

    const recordPeopleId = peopleId(record);
    const recordContextId = contextId(record);
    const recordCountryId = countryId(record);
    const recordLanguageId = languageId(record);
    const recordReligionId = religionId(record);
    const source = sourceReference(record, retrievedAt);
    const classificationAssertion = classifyPeopleGroupsGsec({
      gsec: nullable(record.GSEC),
      label: nullable(record.GSECbrf),
      sourceUpdatedAt: source.sourceUpdatedAt,
    });

    people.push(peopleEntitySchema.parse({
      kind: "people",
      id: recordPeopleId,
      name: record.NmDisp,
      alternateNames: record.NmAlt ? [record.NmAlt] : [],
      externalIds: [{ sourceId: PEOPLE_GROUPS_SOURCE_ID, namespace: "PEID", value: String(record.PEID) }],
      taxonomy: {
        sourcePeopleName: textObservation(record, retrievedAt, ["PplNm"], record.PplNm),
        affinityBloc: textObservation(record, retrievedAt, ["Affbloc"], record.Affbloc),
        peopleCluster: textObservation(record, retrievedAt, ["PplClstr"], record.PplClstr),
        ethnographicGroup: textObservation(record, retrievedAt, ["Ethne"], record.Ethne),
      },
      provenance: [provenance(record, retrievedAt, ["PEID", "NmDisp", "NmAlt"])],
    }));

    const populationValue = nullable(record.Pop);
    const reportedResourceTotal = nullable(record.ResTot);
    peopleContexts.push(peopleContextSchema.parse({
      kind: "people-context",
      id: recordContextId,
      peopleId: recordPeopleId,
      countryId: recordCountryId,
      regionId: null,
      displayName: record.NmDisp,
      externalIds: [
        { sourceId: PEOPLE_GROUPS_SOURCE_ID, namespace: "PGID", value: record.PGID },
        { sourceId: PEOPLE_GROUPS_SOURCE_ID, namespace: "PEID", value: String(record.PEID) },
      ],
      sourceRecord: source,
      population: populationEstimateSchema.parse({
        value: populationValue,
        quality: populationValue === null ? "unknown" : "estimated",
        unit: "persons",
        provenance: provenance(record, retrievedAt, ["Pop"]),
      }),
      coordinates: coordinatesFor(record, retrievedAt),
      geography: {
        regionLabel: textObservation(record, retrievedAt, ["Regn"], record.Regn),
        subregionLabel: textObservation(record, retrievedAt, ["RegnSub"], record.RegnSub),
        locationDescription: textObservation(record, retrievedAt, ["LocationDesc"], record.LocationDesc),
      },
      language: {
        languageId: recordLanguageId,
        name: textObservation(record, retrievedAt, ["Lang"], record.Lang),
        family: textObservation(record, retrievedAt, ["LangFamily"], record.LangFamily),
      },
      religion: {
        religionId: recordReligionId,
        code: textObservation(record, retrievedAt, ["ROR"], record.ROR),
        name: textObservation(record, retrievedAt, ["Rlgn"], record.Rlgn),
        displayName: textObservation(record, retrievedAt, ["RlgnDiv"], record.RlgnDiv),
      },
      mission: {
        classification: classificationObservationSchema.parse({
          assertion: classificationAssertion,
          provenance: provenance(record, retrievedAt, ["GSEC", "GSECbrf"]),
        }),
        evangelicalPresence: textObservation(record, retrievedAt, ["EvngLvl"], record.EvngLvl),
        engagementStatus: textObservation(record, retrievedAt, ["EngStat"], record.EngStat),
        churchPlanting: textObservation(record, retrievedAt, ["Plnting"], record.Plnting),
        congregationExists: textObservation(record, retrievedAt, ["CongExst"], record.CongExst),
        sourceIndicators: sourceIndicators(record, retrievedAt),
      },
      resources: {
        bibleAvailability: textObservation(record, retrievedAt, ["Bible"], record.Bible),
        jesusFilmAvailability: textObservation(record, retrievedAt, ["Jesus"], record.Jesus),
        totalReported: numberObservationSchema.parse({
          value: reportedResourceTotal,
          quality: reportedResourceTotal === null ? "unknown" : "reported",
          provenance: provenance(record, retrievedAt, ["ResTot"]),
        }),
      },
      sourceDescriptions: {
        people: textObservation(record, retrievedAt, ["PeopleDesc"], record.PeopleDesc),
        location: textObservation(record, retrievedAt, ["LocationDesc"], record.LocationDesc),
      },
      provenance: [provenance(record, retrievedAt, ["PGID", "PEID", "NmDisp", "ISOalpha3"])],
    }));
  }

  const parsed = normalizedMissionModelSchema.parse({
    schemaVersion: 1,
    modelId: "unreached-v3-mission-model",
    generatedAt: retrievedAt,
    sourceSnapshots: [{ sourceId: PEOPLE_GROUPS_SOURCE_ID, retrievedAt, recordCount: records.length }],
    people,
    peopleContexts,
    countries: [...countries.values()].sort((a, b) => a.name.localeCompare(b.name, "en")),
    regions: [],
    languages: [...languages.values()].sort((a, b) => (a.name ?? a.iso6393).localeCompare(b.name ?? b.iso6393, "en")),
    religions: [...religions.values()].sort((a, b) => (a.name ?? a.code).localeCompare(b.name ?? b.code, "en")),
  });

  return assertMissionModelInvariants(parsed);
}
