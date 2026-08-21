import { z } from "zod";
import {
  BIBLE_STATUS,
  LANGUAGE_STATUS,
  RELIGION_NAMES,
  countrySchema,
  languageSchema,
  peopleGroupInCountrySchema,
  peopleGroupSchema,
  regionSchema,
  religionSchema,
  type Country,
  type FieldProvenance,
  type Language,
  type MissionMetrics,
  type PeopleGroup,
  type PeopleGroupInCountry,
  type Region,
  type Religion,
  type ScriptureResources,
} from "../../../src/domain/index.js";

const SOURCE_ID = "joshua-project-api";
const requiredInteger = z.preprocess((value) => typeof value === "number" ? value : Number(value), z.number().int().positive());
const nullableInteger = z.preprocess((value) => value === null || value === undefined || value === "" ? null : Number(value), z.number().int().nullable());
const nullableNumber = z.preprocess((value) => value === null || value === undefined || value === "" ? null : Number(value), z.number().finite().nullable());
const nullableString = z.preprocess((value) => value === null || value === undefined || value === "" ? null : String(value).trim(), z.string().min(1).nullable());
const yesNo = z.preprocess((value) => {
  if (value === true || value === 1 || value === "1" || value === "Y") return true;
  if (value === false || value === 0 || value === "0" || value === "N") return false;
  if (value === null || value === undefined || value === "") return null;
  return value;
}, z.boolean().nullable());

const rawPgicSchema = z.object({
  PeopleID3: requiredInteger,
  PeopleID3ROG3: nullableString,
  PeopNameInCountry: z.string().min(1),
  PeopNameAcrossCountries: nullableString,
  ISO3: z.string().regex(/^[A-Z]{3}$/),
  Ctry: z.string().min(1),
  RegionCode: nullableInteger,
  RegionName: nullableString,
  Population: nullableNumber,
  ROL3: nullableString,
  PrimaryLanguageName: nullableString,
  RLG3: nullableInteger,
  PrimaryReligion: nullableString,
  PercentAdherents: nullableNumber,
  PercentEvangelical: nullableNumber,
  JPScale: nullableNumber,
  LeastReached: yesNo,
  Frontier: yesNo,
  BibleStatus: nullableInteger,
  PortionsYear: nullableString,
  NTYear: nullableString,
  BibleYear: nullableString,
  HasAudioRecordings: yesNo,
  HasJesusFilm: yesNo,
  LocationInCountry: nullableString,
  Latitude: nullableNumber,
  Longitude: nullableNumber,
}).passthrough();

const rawPgacSchema = z.object({
  PeopleID3: requiredInteger,
  PeopleName: z.string().min(1),
  AffinityBloc: nullableString,
  PeopleCluster: nullableString,
  PopulationPGAC: nullableNumber,
  ROL3PGAC: nullableString,
  RLG3PGAC: nullableInteger,
  PrimaryReligionPGAC: nullableString,
  PercentChristianPGAC: nullableNumber,
  PercentEvangelicalPGAC: nullableNumber,
  JPScalePGAC: nullableNumber,
  LeastReachedPGAC: yesNo,
  FrontierPGAC: yesNo,
}).passthrough();

const rawLanguageSchema = z.object({
  ROL3: z.string().regex(/^[a-z]{3}$/),
  Language: z.string().min(1),
  Status: nullableString,
  NbrCountries: nullableNumber,
  NbrPGICs: nullableNumber,
  RLG3: nullableInteger,
  PrimaryReligion: nullableString,
  PercentAdherents: nullableNumber,
  PercentEvangelical: nullableNumber,
  JPScale: nullableNumber,
  LeastReached: yesNo,
  BibleStatus: nullableInteger,
  PortionsYear: nullableString,
  NTYear: nullableString,
  Bible: nullableString,
  HasAudioRecordings: yesNo,
  HasJesusFilm: yesNo,
}).passthrough();

type Context = { retrievedAt: string };
type ProvenanceField = [field: string, sourceField: string, transformation?: string | null];

function provenance(recordId: string, retrievedAt: string, fields: ProvenanceField[]): FieldProvenance[] {
  return fields.map(([field, sourceField, transformation = null]) => ({
    field,
    sourceId: SOURCE_ID,
    sourceRecordId: recordId,
    sourceField,
    retrievedAt,
    sourceDate: null,
    transformation,
  }));
}

function count(value: number | null) {
  return { value, quality: value === null ? "unknown" as const : "estimated" as const, asOf: null };
}

function percent(value: number | null) {
  return { value, quality: value === null ? "unknown" as const : "estimated" as const, asOf: null };
}

function classification(value: boolean | null): MissionMetrics["classification"] {
  return value === true ? "unreached" : value === false ? "reached" : "unknown";
}

function religionId(code: number | null): Religion["id"] | null {
  return code !== null && RELIGION_NAMES[code] ? `religion:${code}` as Religion["id"] : null;
}

function bibleStatus(code: number | null): ScriptureResources["bibleStatus"] {
  return code !== null && BIBLE_STATUS[code] ? BIBLE_STATUS[code] : "unknown";
}

function mission(percentChristian: number | null, percentEvangelical: number | null, leastReached: boolean | null, frontier: boolean | null, jpScale: number | null): MissionMetrics {
  return {
    classification: classification(leastReached),
    frontier,
    jpScale,
    percentChristian: percent(percentChristian),
    percentEvangelical: percent(percentEvangelical),
  };
}

export function adaptPgicRecord(raw: unknown, context: Context): { country: Country; region: Region | null; religion: Religion | null; peopleGroupInCountry: PeopleGroupInCountry } {
  const row = rawPgicSchema.parse(raw);
  const recordId = row.PeopleID3ROG3 ?? `${row.PeopleID3}:${row.ISO3}`;
  const regionId = row.RegionCode === null ? null : `region:${row.RegionCode}` as Region["id"];
  const primaryReligionId = religionId(row.RLG3);
  const primaryLanguageId = row.ROL3 && /^[a-z]{3}$/.test(row.ROL3) ? `language:${row.ROL3}` as Language["id"] : null;
  const countryId = `country:${row.ISO3}` as Country["id"];
  const peopleGroupId = `people:${row.PeopleID3}` as PeopleGroup["id"];

  const unknownMission = mission(null, null, null, null, null);
  const country = countrySchema.parse({
    id: countryId,
    iso3: row.ISO3,
    name: row.Ctry,
    regionId,
    population: count(null),
    mission: unknownMission,
    provenance: provenance(recordId, context.retrievedAt, [["iso3", "ISO3"], ["name", "Ctry"], ["regionId", "RegionCode", "normalized to region:<code>"]]),
  });

  const region = row.RegionCode !== null && row.RegionName
    ? regionSchema.parse({
        id: regionId,
        code: row.RegionCode,
        name: row.RegionName,
        provenance: provenance(recordId, context.retrievedAt, [["code", "RegionCode"], ["name", "RegionName"]]),
      })
    : null;

  const religion = primaryReligionId && row.RLG3 !== null
    ? religionSchema.parse({
        id: primaryReligionId,
        code: row.RLG3,
        name: RELIGION_NAMES[row.RLG3] ?? row.PrimaryReligion ?? "Unknown",
        provenance: provenance(recordId, context.retrievedAt, [["code", "RLG3"], ["name", "PrimaryReligion", "normalized with Joshua Project religion code table"]]),
      })
    : null;

  const coordinates = row.Latitude !== null && row.Longitude !== null ? { latitude: row.Latitude, longitude: row.Longitude } : null;
  const peopleGroupInCountry = peopleGroupInCountrySchema.parse({
    id: `people-country:${row.PeopleID3}:${row.ISO3}`,
    peopleGroupId,
    countryId,
    name: row.PeopNameInCountry,
    population: count(row.Population),
    primaryLanguageId,
    primaryReligionId,
    regionId,
    locationText: row.LocationInCountry,
    coordinates,
    mission: mission(row.PercentAdherents, row.PercentEvangelical, row.LeastReached, row.Frontier, row.JPScale),
    scripture: {
      bibleStatus: bibleStatus(row.BibleStatus),
      portionsYear: row.PortionsYear,
      newTestamentYear: row.NTYear,
      bibleYear: row.BibleYear,
      hasAudioRecordings: row.HasAudioRecordings,
      hasJesusFilm: row.HasJesusFilm,
    },
    provenance: provenance(recordId, context.retrievedAt, [
      ["name", "PeopNameInCountry"], ["population", "Population"], ["primaryLanguageId", "ROL3", "normalized to language:<ISO639-3>"],
      ["primaryReligionId", "RLG3", "normalized to religion:<code>"], ["mission.percentChristian", "PercentAdherents"],
      ["mission.percentEvangelical", "PercentEvangelical"], ["mission.classification", "LeastReached", "source classification retained; not recomputed"],
      ["mission.frontier", "Frontier"], ["mission.jpScale", "JPScale"], ["scripture.bibleStatus", "BibleStatus", "normalized to stable enum"],
      ["scripture.hasAudioRecordings", "HasAudioRecordings"], ["scripture.hasJesusFilm", "HasJesusFilm"], ["coordinates", "Latitude/Longitude"],
    ]),
  });

  return { country, region, religion, peopleGroupInCountry };
}

export function adaptPgacRecord(raw: unknown, context: Context): PeopleGroup {
  const row = rawPgacSchema.parse(raw);
  const recordId = String(row.PeopleID3);
  const primaryLanguageId = row.ROL3PGAC && /^[a-z]{3}$/.test(row.ROL3PGAC) ? `language:${row.ROL3PGAC}` as Language["id"] : null;
  const primaryReligionId = religionId(row.RLG3PGAC);

  return peopleGroupSchema.parse({
    id: `people:${row.PeopleID3}`,
    sourcePeopleId: row.PeopleID3,
    name: row.PeopleName,
    affinityBloc: row.AffinityBloc,
    cluster: row.PeopleCluster,
    globalPopulation: count(row.PopulationPGAC),
    primaryLanguageId,
    primaryReligionId,
    largestCountryId: null,
    mission: mission(row.PercentChristianPGAC, row.PercentEvangelicalPGAC, row.LeastReachedPGAC, row.FrontierPGAC, row.JPScalePGAC),
    provenance: provenance(recordId, context.retrievedAt, [
      ["name", "PeopleName"], ["affinityBloc", "AffinityBloc"], ["cluster", "PeopleCluster"], ["globalPopulation", "PopulationPGAC"],
      ["primaryLanguageId", "ROL3PGAC", "normalized to language:<ISO639-3>"], ["primaryReligionId", "RLG3PGAC", "normalized to religion:<code>"],
      ["mission.percentChristian", "PercentChristianPGAC"], ["mission.percentEvangelical", "PercentEvangelicalPGAC"],
      ["mission.classification", "LeastReachedPGAC", "source classification retained; not recomputed"], ["mission.frontier", "FrontierPGAC"], ["mission.jpScale", "JPScalePGAC"],
    ]),
  });
}

export function adaptLanguageRecord(raw: unknown, context: Context): Language {
  const row = rawLanguageSchema.parse(raw);
  const recordId = row.ROL3;
  const primaryReligionId = religionId(row.RLG3);
  const status = row.Status && row.Status in LANGUAGE_STATUS ? LANGUAGE_STATUS[row.Status as keyof typeof LANGUAGE_STATUS] : "unknown";

  return languageSchema.parse({
    id: `language:${row.ROL3}`,
    iso6393: row.ROL3,
    name: row.Language,
    status,
    hubCountryId: null,
    countryCount: count(row.NbrCountries),
    peopleGroupInCountryCount: count(row.NbrPGICs),
    primaryReligionId,
    mission: mission(row.PercentAdherents, row.PercentEvangelical, row.LeastReached, null, row.JPScale),
    scripture: {
      bibleStatus: bibleStatus(row.BibleStatus),
      portionsYear: row.PortionsYear,
      newTestamentYear: row.NTYear,
      bibleYear: row.Bible,
      hasAudioRecordings: row.HasAudioRecordings,
      hasJesusFilm: row.HasJesusFilm,
    },
    provenance: provenance(recordId, context.retrievedAt, [
      ["name", "Language"], ["status", "Status", "normalized to stable enum"], ["countryCount", "NbrCountries"], ["peopleGroupInCountryCount", "NbrPGICs"],
      ["primaryReligionId", "RLG3", "normalized to religion:<code>"], ["mission.percentChristian", "PercentAdherents"],
      ["mission.percentEvangelical", "PercentEvangelical"], ["mission.classification", "LeastReached", "source classification retained; not recomputed"],
      ["mission.jpScale", "JPScale"], ["scripture.bibleStatus", "BibleStatus", "normalized to stable enum"], ["scripture.hasAudioRecordings", "HasAudioRecordings"], ["scripture.hasJesusFilm", "HasJesusFilm"],
    ]),
  });
}
