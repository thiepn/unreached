import { z } from "zod";

const nullableString = z.preprocess(
  (value) => value === null || value === undefined || value === "" ? null : String(value).trim(),
  z.string().min(1).nullable(),
);
const nullableNumber = z.preprocess(
  (value) => value === null || value === undefined || value === "" ? null : Number(value),
  z.number().finite().nullable(),
);
const nullableInteger = z.preprocess(
  (value) => value === null || value === undefined || value === "" ? null : Number(value),
  z.number().int().nonnegative().nullable(),
);
const nullableGsec = z.preprocess(
  (value) => value === null || value === undefined || value === "" ? null : Number(value),
  z.number().int().min(0).max(6).nullable(),
);
const nullableIso6393 = z.preprocess(
  (value) => value === null || value === undefined || value === "" ? null : String(value).trim().toLowerCase(),
  z.string().regex(/^[a-z]{3}$/).nullable(),
);
const nullableTimestamp = z.preprocess(
  (value) => value === null || value === undefined || value === "" ? null : String(value).trim(),
  z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid source timestamp").nullable(),
);

export const peopleGroupsApiRecordSchema = z.object({
  PEID: z.coerce.number().int().positive(),
  PGID: z.string().trim().toUpperCase().regex(/^PG[0-9]+$/),
  NmDisp: z.string().trim().min(1),
  NmAlt: nullableString.optional(),
  ISOalpha3: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/),
  Ctry: z.string().trim().min(1),
  Regn: nullableString.optional(),
  RegnSub: nullableString.optional(),
  Pop: nullableInteger.optional(),
  Latitude: nullableNumber.optional(),
  Longitude: nullableNumber.optional(),
  ROL: nullableIso6393.optional(),
  Lang: nullableString.optional(),
  LangFamily: nullableString.optional(),
  ROR: nullableString.optional(),
  Rlgn: nullableString.optional(),
  RlgnDiv: nullableString.optional(),
  EvngLvl: nullableString.optional(),
  CongExst: nullableString.optional(),
  Plnting: nullableString.optional(),
  EngStat: nullableString.optional(),
  GSEC: nullableGsec.optional(),
  GSECbrf: nullableString.optional(),
  GSEClng: nullableString.optional(),
  SPI: nullableInteger.optional(),
  SPIdesc: nullableString.optional(),
  LPI: nullableInteger.optional(),
  LPIname: nullableString.optional(),
  LPIdesc: nullableString.optional(),
  Affbloc: nullableString.optional(),
  PplClstr: nullableString.optional(),
  PplNm: nullableString.optional(),
  Ethne: nullableString.optional(),
  Bible: nullableString.optional(),
  Jesus: nullableString.optional(),
  ResTot: nullableInteger.optional(),
  PeopleDesc: nullableString.optional(),
  LocationDesc: nullableString.optional(),
  UpdatedDate: nullableTimestamp.optional(),
}).passthrough();

export const peopleGroupsApiPageSchema = z.array(peopleGroupsApiRecordSchema);
export type PeopleGroupsApiRecord = z.infer<typeof peopleGroupsApiRecordSchema>;

export const runtimeReachAssessmentSchema = z.object({
  classification: z.enum(["unreached", "other", "unknown"]),
  methodology: z.literal("imb-gsec-v1"),
  sourceValue: z.number().int().min(0).max(6).nullable(),
  rule: z.literal("GSEC 0-3 => unreached; GSEC 4-6 => other; missing => unknown"),
  evangelicalLevel: z.string().nullable(),
  gsec: z.object({ code: z.number().int().min(0).max(6).nullable(), label: z.string().nullable(), description: z.string().nullable() }),
  spi: z.object({ code: z.number().int().nonnegative().nullable(), description: z.string().nullable() }),
  lpi: z.object({ code: z.number().int().nonnegative().nullable(), name: z.string().nullable(), description: z.string().nullable() }),
  engagementStatus: z.string().nullable(),
  churchPlanting: z.string().nullable(),
  congregationExists: z.string().nullable(),
});

export const runtimePeopleContextSchema = z.object({
  provider: z.literal("peoplegroups-org"),
  pgid: z.string().regex(/^PG[0-9]+$/),
  peid: z.number().int().positive(),
  displayName: z.string().min(1),
  alternateNames: z.string().nullable(),
  country: z.object({ iso3: z.string().regex(/^[A-Z]{3}$/), name: z.string().min(1), region: z.string().nullable(), subregion: z.string().nullable() }),
  population: z.object({ value: z.number().int().nonnegative().nullable(), quality: z.literal("estimated") }),
  coordinates: z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) }).nullable(),
  language: z.object({ iso6393: z.string().regex(/^[a-z]{3}$/).nullable(), name: z.string().nullable(), family: z.string().nullable() }),
  religion: z.object({ code: z.string().nullable(), name: z.string().nullable(), displayName: z.string().nullable() }),
  reach: runtimeReachAssessmentSchema,
  resources: z.object({ bibleAvailability: z.string().nullable(), jesusFilmAvailability: z.string().nullable(), totalReported: z.number().int().nonnegative().nullable() }),
  taxonomy: z.object({ affinityBloc: z.string().nullable(), peopleCluster: z.string().nullable(), peopleName: z.string().nullable(), ethnographicGroup: z.string().nullable() }),
  editorial: z.object({ peopleDescription: z.string().nullable(), locationDescription: z.string().nullable(), treatment: z.literal("source-attributed-only") }),
  sourceUpdatedAt: z.string().nullable(),
});

export const runtimePeopleEntitySchema = z.object({
  id: z.string().regex(/^people-entity:peoplegroups:[0-9]+$/),
  provider: z.literal("peoplegroups-org"),
  peid: z.number().int().positive(),
  routeKey: z.number().int().positive(),
  displayName: z.string().min(1),
  contexts: z.array(runtimePeopleContextSchema).min(1),
  countries: z.array(z.object({ iso3: z.string().regex(/^[A-Z]{3}$/), name: z.string().min(1) })).min(1),
  population: z.object({
    knownValue: z.number().int().nonnegative(),
    knownContextCount: z.number().int().nonnegative(),
    totalContextCount: z.number().int().positive(),
    complete: z.boolean(),
    aggregation: z.literal("sum-known-country-context-populations"),
  }),
  reach: z.object({
    classification: z.enum(["unreached-only", "other-only", "mixed", "unknown"]),
    methodology: z.literal("imb-gsec-context-rollup-v1"),
    unreachedContexts: z.number().int().nonnegative(),
    otherContexts: z.number().int().nonnegative(),
    unknownContexts: z.number().int().nonnegative(),
  }),
  primaryLanguage: z.object({ iso6393: z.string().regex(/^[a-z]{3}$/).nullable(), name: z.string().nullable() }).nullable(),
  primaryReligion: z.object({ code: z.string().nullable(), name: z.string().nullable() }).nullable(),
  sourceUpdatedAt: z.string().nullable(),
});

export const runtimeCountrySummarySchema = z.object({
  iso3: z.string().regex(/^[A-Z]{3}$/),
  name: z.string().min(1),
  peopleContextCount: z.number().int().nonnegative(),
  unreachedContextCount: z.number().int().nonnegative(),
  otherContextCount: z.number().int().nonnegative(),
  unknownContextCount: z.number().int().nonnegative(),
  knownPopulation: z.number().int().nonnegative(),
  populationKnownContextCount: z.number().int().nonnegative(),
  populationCoverageComplete: z.boolean(),
  denominator: z.literal("people-group-in-country records returned by PeopleGroups.org"),
});

export type RuntimePeopleContext = z.infer<typeof runtimePeopleContextSchema>;
export type RuntimePeopleEntity = z.infer<typeof runtimePeopleEntitySchema>;
export type RuntimeCountrySummary = z.infer<typeof runtimeCountrySummarySchema>;
