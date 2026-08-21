import { z } from "zod";

export const dataQualitySchema = z.enum(["exact", "estimated", "rounded", "unknown"]);
export type DataQuality = z.infer<typeof dataQualitySchema>;

const timestampSchema = z.string().min(1).refine((value) => !Number.isNaN(Date.parse(value)), "Invalid timestamp");
const nullableYearTextSchema = z.string().trim().min(1).nullable();

export const countMetricSchema = z.object({
  value: z.number().finite().nonnegative().nullable(),
  quality: dataQualitySchema,
  asOf: z.string().trim().min(1).nullable(),
});

export const percentMetricSchema = z.object({
  value: z.number().finite().min(0).max(100).nullable(),
  quality: dataQualitySchema,
  asOf: z.string().trim().min(1).nullable(),
});

export const fieldProvenanceSchema = z.object({
  field: z.string().min(1),
  sourceId: z.string().min(1),
  sourceRecordId: z.string().min(1),
  sourceField: z.string().min(1),
  retrievedAt: timestampSchema,
  sourceDate: z.string().trim().min(1).nullable(),
  transformation: z.string().trim().min(1).nullable(),
});

export type FieldProvenance = z.infer<typeof fieldProvenanceSchema>;

export const missionMetricsSchema = z.object({
  classification: z.enum(["unreached", "reached", "unknown"]),
  frontier: z.boolean().nullable(),
  jpScale: z.number().finite().min(0).max(5).nullable(),
  percentChristian: percentMetricSchema,
  percentEvangelical: percentMetricSchema,
});

export const scriptureResourcesSchema = z.object({
  bibleStatus: z.enum([
    "unknown",
    "translation-needed",
    "translation-started",
    "portions",
    "new-testament",
    "complete-bible",
  ]),
  portionsYear: nullableYearTextSchema,
  newTestamentYear: nullableYearTextSchema,
  bibleYear: nullableYearTextSchema,
  hasAudioRecordings: z.boolean().nullable(),
  hasJesusFilm: z.boolean().nullable(),
});

export const coordinatesSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
});

export const regionIdSchema = z.string().regex(/^region:[0-9]+$/);
export const countryIdSchema = z.string().regex(/^country:[A-Z]{3}$/);
export const peopleGroupIdSchema = z.string().regex(/^people:[0-9]+$/);
export const peopleGroupInCountryIdSchema = z.string().regex(/^people-country:[0-9]+:[A-Z]{3}$/);
export const languageIdSchema = z.string().regex(/^language:[a-z]{3}$/);
export const religionIdSchema = z.string().regex(/^religion:[1245689]$/);

const importedEntitySchema = z.object({
  provenance: z.array(fieldProvenanceSchema).min(1),
});

export const regionSchema = importedEntitySchema.extend({
  id: regionIdSchema,
  code: z.number().int().positive(),
  name: z.string().trim().min(1),
});

export const religionSchema = importedEntitySchema.extend({
  id: religionIdSchema,
  code: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(4),
    z.literal(5),
    z.literal(6),
    z.literal(8),
    z.literal(9),
  ]),
  name: z.string().trim().min(1),
});

export const countrySchema = importedEntitySchema.extend({
  id: countryIdSchema,
  iso3: z.string().regex(/^[A-Z]{3}$/),
  name: z.string().trim().min(1),
  regionId: regionIdSchema.nullable(),
  population: countMetricSchema,
  mission: missionMetricsSchema,
});

export const peopleGroupSchema = importedEntitySchema.extend({
  id: peopleGroupIdSchema,
  sourcePeopleId: z.number().int().positive(),
  name: z.string().trim().min(1),
  affinityBloc: z.string().trim().min(1).nullable(),
  cluster: z.string().trim().min(1).nullable(),
  globalPopulation: countMetricSchema,
  primaryLanguageId: languageIdSchema.nullable(),
  primaryReligionId: religionIdSchema.nullable(),
  largestCountryId: countryIdSchema.nullable(),
  mission: missionMetricsSchema,
});

export const peopleGroupInCountrySchema = importedEntitySchema.extend({
  id: peopleGroupInCountryIdSchema,
  peopleGroupId: peopleGroupIdSchema,
  countryId: countryIdSchema,
  name: z.string().trim().min(1),
  population: countMetricSchema,
  primaryLanguageId: languageIdSchema.nullable(),
  primaryReligionId: religionIdSchema.nullable(),
  regionId: regionIdSchema.nullable(),
  locationText: z.string().trim().min(1).nullable(),
  coordinates: coordinatesSchema.nullable(),
  mission: missionMetricsSchema,
  scripture: scriptureResourcesSchema,
});

export const languageSchema = importedEntitySchema.extend({
  id: languageIdSchema,
  iso6393: z.string().regex(/^[a-z]{3}$/),
  name: z.string().trim().min(1),
  status: z.enum(["living", "extinct", "nearly-extinct", "historical", "ancient", "constructed", "unknown"]),
  hubCountryId: countryIdSchema.nullable(),
  countryCount: countMetricSchema,
  peopleGroupInCountryCount: countMetricSchema,
  primaryReligionId: religionIdSchema.nullable(),
  mission: missionMetricsSchema,
  scripture: scriptureResourcesSchema,
});

export const normalizedDatasetSchema = z.object({
  schemaVersion: z.literal(1),
  fixture: z.boolean(),
  regions: z.array(regionSchema),
  religions: z.array(religionSchema),
  countries: z.array(countrySchema),
  peopleGroups: z.array(peopleGroupSchema),
  peopleGroupsInCountries: z.array(peopleGroupInCountrySchema),
  languages: z.array(languageSchema),
});

export const sourceSnapshotSchema = z.object({
  sourceId: z.string().min(1),
  retrievedAt: timestampSchema,
  recordCount: z.number().int().nonnegative(),
  fixture: z.boolean(),
});

export const dataChunkSchema = z.object({
  entity: z.enum(["regions", "religions", "countries", "peopleGroups", "peopleGroupsInCountries", "languages"]),
  path: z.string().min(1),
  recordCount: z.number().int().nonnegative(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
});

export const datasetManifestSchema = z.object({
  schemaVersion: z.literal(1),
  datasetVersion: z.string().min(1),
  generatedAt: timestampSchema,
  fixture: z.boolean(),
  sources: z.array(sourceSnapshotSchema).min(1),
  counts: z.object({
    regions: z.number().int().nonnegative(),
    religions: z.number().int().nonnegative(),
    countries: z.number().int().nonnegative(),
    peopleGroups: z.number().int().nonnegative(),
    peopleGroupsInCountries: z.number().int().nonnegative(),
    languages: z.number().int().nonnegative(),
  }),
  chunks: z.array(dataChunkSchema),
});

export type CountMetric = z.infer<typeof countMetricSchema>;
export type PercentMetric = z.infer<typeof percentMetricSchema>;
export type MissionMetrics = z.infer<typeof missionMetricsSchema>;
export type ScriptureResources = z.infer<typeof scriptureResourcesSchema>;
export type Region = z.infer<typeof regionSchema>;
export type Religion = z.infer<typeof religionSchema>;
export type Country = z.infer<typeof countrySchema>;
export type PeopleGroup = z.infer<typeof peopleGroupSchema>;
export type PeopleGroupInCountry = z.infer<typeof peopleGroupInCountrySchema>;
export type Language = z.infer<typeof languageSchema>;
export type NormalizedDataset = z.infer<typeof normalizedDatasetSchema>;
export type DatasetManifest = z.infer<typeof datasetManifestSchema>;
