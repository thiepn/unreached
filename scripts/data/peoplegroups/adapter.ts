import { z } from "zod";
import { coordinatesSchema, type FieldProvenance } from "../../../src/domain/index.js";

export const PEOPLEGROUPS_SOURCE_ID = "peoplegroups-org-api" as const;

const nullableString = z.preprocess(
  (value) => value === null || value === undefined || value === "" ? null : String(value).trim(),
  z.string().min(1).nullable(),
);
const nullableNumber = z.preprocess(
  (value) => value === null || value === undefined || value === "" ? null : Number(value),
  z.number().finite().nullable(),
);
const nullableNonnegativeInteger = z.preprocess(
  (value) => value === null || value === undefined || value === "" ? null : Number(value),
  z.number().int().nonnegative().nullable(),
);
const nullableIso6393 = z.preprocess(
  (value) => value === null || value === undefined || value === "" ? null : String(value).trim().toLowerCase(),
  z.string().regex(/^[a-z]{3}$/).nullable(),
);
const nullableUrl = z.preprocess(
  (value) => value === null || value === undefined || value === "" ? null : String(value).trim(),
  z.string().url().nullable(),
);
const nullableTimestamp = z.preprocess(
  (value) => value === null || value === undefined || value === "" ? null : String(value).trim(),
  z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid source timestamp").nullable(),
);

export const rawPeopleGroupsRecordSchema = z.object({
  OBJECTID: nullableNonnegativeInteger.optional(),
  PEID: z.coerce.number().int().positive(),
  PGID: z.string().trim().toUpperCase().regex(/^PG[0-9]+$/),
  Name: nullableString.optional(),
  NmDisp: z.string().trim().min(1),
  NmAlt: nullableString.optional(),
  ISOalpha3: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/),
  Ctry: z.string().trim().min(1),
  Regn: nullableString.optional(),
  RegnSub: nullableString.optional(),
  Latitude: nullableNumber.optional(),
  Longitude: nullableNumber.optional(),
  Pop: nullableNonnegativeInteger.optional(),
  ROL: nullableIso6393.optional(),
  Lang: nullableString.optional(),
  LangFamily: nullableString.optional(),
  LangSpkrs: nullableNonnegativeInteger.optional(),
  ROR: nullableString.optional(),
  Rlgn: nullableString.optional(),
  RlgnDiv: nullableString.optional(),
  EvngLvl: nullableString.optional(),
  CongExst: nullableString.optional(),
  Plnting: nullableString.optional(),
  EngStat: nullableString.optional(),
  GSEC: nullableNonnegativeInteger.optional(),
  GSECbrf: nullableString.optional(),
  GSEClng: nullableString.optional(),
  SPI: nullableNonnegativeInteger.optional(),
  SPIdesc: nullableString.optional(),
  LPI: nullableNonnegativeInteger.optional(),
  LPIname: nullableString.optional(),
  LPIdesc: nullableString.optional(),
  Affbloc: nullableString.optional(),
  PplClstr: nullableString.optional(),
  PplNm: nullableString.optional(),
  Ethne: nullableString.optional(),
  Bible: nullableString.optional(),
  Jesus: nullableString.optional(),
  ResTot: nullableNonnegativeInteger.optional(),
  PeopleDesc: nullableString.optional(),
  LocationDesc: nullableString.optional(),
  PicURL: nullableUrl.optional(),
  PicCrdt: nullableString.optional(),
  UpdatedDate: nullableTimestamp.optional(),
}).passthrough();

const sourceMissionSchema = z.object({
  methodology: z.literal("imb-peoplegroups"),
  evangelicalLevel: z.string().nullable(),
  congregationExists: z.string().nullable(),
  churchPlanting: z.string().nullable(),
  engagementStatus: z.string().nullable(),
  gsec: z.object({
    code: z.number().int().nonnegative().nullable(),
    brief: z.string().nullable(),
    description: z.string().nullable(),
  }),
  spi: z.object({
    code: z.number().int().nonnegative().nullable(),
    description: z.string().nullable(),
  }),
  lpi: z.object({
    code: z.number().int().nonnegative().nullable(),
    name: z.string().nullable(),
    description: z.string().nullable(),
  }),
});

export const peopleGroupsStagingRecordSchema = z.object({
  sourceId: z.literal(PEOPLEGROUPS_SOURCE_ID),
  sourceRecordId: z.string().regex(/^PG[0-9]+$/),
  peopleEntityId: z.number().int().positive(),
  displayName: z.string().min(1),
  alternateNames: z.string().nullable(),
  country: z.object({
    iso3: z.string().regex(/^[A-Z]{3}$/),
    name: z.string().min(1),
    region: z.string().nullable(),
    subregion: z.string().nullable(),
  }),
  population: z.object({
    value: z.number().int().nonnegative().nullable(),
    quality: z.literal("estimated"),
  }),
  coordinates: coordinatesSchema.nullable(),
  language: z.object({
    iso6393: z.string().regex(/^[a-z]{3}$/).nullable(),
    name: z.string().nullable(),
    family: z.string().nullable(),
    globalSpeakers: z.number().int().nonnegative().nullable(),
  }),
  religion: z.object({
    code: z.string().nullable(),
    name: z.string().nullable(),
    displayName: z.string().nullable(),
  }),
  mission: sourceMissionSchema,
  resources: z.object({
    bibleAvailability: z.string().nullable(),
    jesusFilmAvailability: z.string().nullable(),
    totalReported: z.number().int().nonnegative().nullable(),
  }),
  taxonomy: z.object({
    affinityBloc: z.string().nullable(),
    peopleCluster: z.string().nullable(),
    peopleName: z.string().nullable(),
    ethnographicGroup: z.string().nullable(),
  }),
  editorial: z.object({
    peopleDescription: z.string().nullable(),
    locationDescription: z.string().nullable(),
  }),
  photoReference: z.object({
    url: z.string().url(),
    credit: z.string().nullable(),
    redistributionApproved: z.literal(false),
  }).nullable(),
  sourceUpdatedAt: z.string().nullable(),
  provenance: z.array(z.object({
    field: z.string().min(1),
    sourceId: z.literal(PEOPLEGROUPS_SOURCE_ID),
    sourceRecordId: z.string().min(1),
    sourceField: z.string().min(1),
    retrievedAt: z.string().min(1),
    sourceDate: z.string().nullable(),
    transformation: z.string().nullable(),
  })).min(1),
});

export type PeopleGroupsStagingRecord = z.infer<typeof peopleGroupsStagingRecordSchema>;

type Context = { retrievedAt: string };
type ProvenanceField = [field: string, sourceField: string, transformation?: string | null];

function provenance(
  recordId: string,
  retrievedAt: string,
  sourceDate: string | null,
  fields: ProvenanceField[],
): FieldProvenance[] {
  return fields.map(([field, sourceField, transformation = null]) => ({
    field,
    sourceId: PEOPLEGROUPS_SOURCE_ID,
    sourceRecordId: recordId,
    sourceField,
    retrievedAt,
    sourceDate,
    transformation,
  }));
}

function readNullable<T>(value: T | null | undefined): T | null {
  return value ?? null;
}

export function adaptPeopleGroupsRecord(raw: unknown, context: Context): PeopleGroupsStagingRecord {
  const row = rawPeopleGroupsRecordSchema.parse(raw);
  const sourceDate = readNullable(row.UpdatedDate);
  const latitude = readNullable(row.Latitude);
  const longitude = readNullable(row.Longitude);
  const coordinates = latitude !== null && longitude !== null
    ? coordinatesSchema.parse({ latitude, longitude })
    : null;

  const record = {
    sourceId: PEOPLEGROUPS_SOURCE_ID,
    sourceRecordId: row.PGID,
    peopleEntityId: row.PEID,
    displayName: row.NmDisp,
    alternateNames: readNullable(row.NmAlt),
    country: {
      iso3: row.ISOalpha3,
      name: row.Ctry,
      region: readNullable(row.Regn),
      subregion: readNullable(row.RegnSub),
    },
    population: {
      value: readNullable(row.Pop),
      quality: "estimated" as const,
    },
    coordinates,
    language: {
      iso6393: readNullable(row.ROL),
      name: readNullable(row.Lang),
      family: readNullable(row.LangFamily),
      globalSpeakers: readNullable(row.LangSpkrs),
    },
    religion: {
      code: readNullable(row.ROR),
      name: readNullable(row.Rlgn),
      displayName: readNullable(row.RlgnDiv),
    },
    mission: {
      methodology: "imb-peoplegroups" as const,
      evangelicalLevel: readNullable(row.EvngLvl),
      congregationExists: readNullable(row.CongExst),
      churchPlanting: readNullable(row.Plnting),
      engagementStatus: readNullable(row.EngStat),
      gsec: {
        code: readNullable(row.GSEC),
        brief: readNullable(row.GSECbrf),
        description: readNullable(row.GSEClng),
      },
      spi: {
        code: readNullable(row.SPI),
        description: readNullable(row.SPIdesc),
      },
      lpi: {
        code: readNullable(row.LPI),
        name: readNullable(row.LPIname),
        description: readNullable(row.LPIdesc),
      },
    },
    resources: {
      bibleAvailability: readNullable(row.Bible),
      jesusFilmAvailability: readNullable(row.Jesus),
      totalReported: readNullable(row.ResTot),
    },
    taxonomy: {
      affinityBloc: readNullable(row.Affbloc),
      peopleCluster: readNullable(row.PplClstr),
      peopleName: readNullable(row.PplNm),
      ethnographicGroup: readNullable(row.Ethne),
    },
    editorial: {
      peopleDescription: readNullable(row.PeopleDesc),
      locationDescription: readNullable(row.LocationDesc),
    },
    photoReference: row.PicURL
      ? {
          url: row.PicURL,
          credit: readNullable(row.PicCrdt),
          redistributionApproved: false as const,
        }
      : null,
    sourceUpdatedAt: sourceDate,
    provenance: provenance(row.PGID, context.retrievedAt, sourceDate, [
      ["peopleEntityId", "PEID"],
      ["displayName", "NmDisp"],
      ["alternateNames", "NmAlt"],
      ["country.iso3", "ISOalpha3"],
      ["country.name", "Ctry"],
      ["country.region", "Regn"],
      ["country.subregion", "RegnSub"],
      ["population", "Pop", "retained as an estimated source value"],
      ["coordinates", "Latitude/Longitude", "retained only when both coordinates are present and valid"],
      ["language.iso6393", "ROL", "normalized to lowercase ISO 639-3 syntax only"],
      ["language.name", "Lang"],
      ["language.family", "LangFamily"],
      ["religion.code", "ROR"],
      ["religion.name", "Rlgn"],
      ["mission.evangelicalLevel", "EvngLvl", "source descriptor retained verbatim; no percentage inferred"],
      ["mission.gsec", "GSEC/GSECbrf/GSEClng", "IMB GSEC semantics retained; not mapped to Joshua Project JPScale"],
      ["mission.spi", "SPI/SPIdesc", "IMB SPI semantics retained"],
      ["mission.lpi", "LPI/LPIname/LPIdesc", "IMB LPI semantics retained"],
      ["resources.bibleAvailability", "Bible", "source availability label retained; not converted to translation-completeness status"],
      ["resources.jesusFilmAvailability", "Jesus", "source availability label retained"],
      ["editorial.peopleDescription", "PeopleDesc"],
      ["editorial.locationDescription", "LocationDesc"],
      ["photoReference", "PicURL/PicCrdt", "reference only; redistribution remains unapproved until per-item rights review"],
    ]),
  };

  return peopleGroupsStagingRecordSchema.parse(record);
}
