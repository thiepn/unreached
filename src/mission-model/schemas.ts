import { z } from "zod";
import { missionClassificationAssertionSchema } from "../mission/classification";

const nonEmptyString = z.string().trim().min(1);
const timestampSchema = nonEmptyString.refine(
  (value) => !Number.isNaN(Date.parse(value)),
  "Invalid timestamp",
);

export const sourceReferenceSchema = z.object({
  sourceId: nonEmptyString,
  recordId: nonEmptyString,
  retrievedAt: timestampSchema,
  sourceUpdatedAt: timestampSchema.nullable(),
});

export const fieldProvenanceSchema = z.object({
  source: sourceReferenceSchema,
  sourceFields: z.array(nonEmptyString).min(1),
  transformation: nonEmptyString.nullable(),
  geographicScopeId: nonEmptyString.nullable(),
});

export const externalIdentifierSchema = z.object({
  sourceId: nonEmptyString,
  namespace: nonEmptyString,
  value: nonEmptyString,
});

export const textObservationSchema = z.object({
  value: nonEmptyString.nullable(),
  quality: z.enum(["reported", "unknown"]),
  provenance: fieldProvenanceSchema,
}).superRefine((observation, ctx) => {
  const expected = observation.value === null ? "unknown" : "reported";
  if (observation.quality !== expected) {
    ctx.addIssue({ code: "custom", message: `Text observation quality must be ${expected} for its value.` });
  }
});

export const numberObservationSchema = z.object({
  value: z.number().finite().nonnegative().nullable(),
  quality: z.enum(["reported", "unknown"]),
  provenance: fieldProvenanceSchema,
}).superRefine((observation, ctx) => {
  const expected = observation.value === null ? "unknown" : "reported";
  if (observation.quality !== expected) {
    ctx.addIssue({ code: "custom", message: `Number observation quality must be ${expected} for its value.` });
  }
});

export const populationEstimateSchema = z.object({
  value: z.number().int().nonnegative().nullable(),
  quality: z.enum(["estimated", "unknown"]),
  unit: z.literal("persons"),
  provenance: fieldProvenanceSchema,
}).superRefine((population, ctx) => {
  const expected = population.value === null ? "unknown" : "estimated";
  if (population.quality !== expected) {
    ctx.addIssue({ code: "custom", message: `Population quality must be ${expected} for its value.` });
  }
});

export const coordinatesSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
});

export const coordinatesObservationSchema = z.object({
  value: coordinatesSchema.nullable(),
  precision: z.enum(["provider-coordinate", "unknown"]),
  provenance: fieldProvenanceSchema,
}).superRefine((coordinates, ctx) => {
  const expected = coordinates.value === null ? "unknown" : "provider-coordinate";
  if (coordinates.precision !== expected) {
    ctx.addIssue({ code: "custom", message: `Coordinate precision must be ${expected} for its value.` });
  }
});

export const classificationObservationSchema = z.object({
  assertion: missionClassificationAssertionSchema,
  provenance: fieldProvenanceSchema,
}).superRefine((classification, ctx) => {
  if (classification.assertion.sourceId !== classification.provenance.source.sourceId) {
    ctx.addIssue({ code: "custom", message: "Classification assertion and provenance must name the same source." });
  }
  if (classification.assertion.sourceUpdatedAt !== classification.provenance.source.sourceUpdatedAt) {
    ctx.addIssue({ code: "custom", message: "Classification assertion and provenance must retain the same source timestamp." });
  }
});

export const sourceIndicatorSchema = z.object({
  key: nonEmptyString,
  code: z.union([nonEmptyString, z.number().finite()]).nullable(),
  label: nonEmptyString.nullable(),
  description: nonEmptyString.nullable(),
  provenance: fieldProvenanceSchema,
});

export const peopleIdSchema = z.string().regex(/^people:[a-z0-9-]+:[a-z0-9._-]+$/);
export const peopleContextIdSchema = z.string().regex(/^people-context:[a-z0-9-]+:[a-z0-9._-]+$/);
export const countryIdSchema = z.string().regex(/^country:[A-Z]{3}$/);
export const regionIdSchema = z.string().regex(/^region:[a-z0-9-]+:[a-z0-9._-]+$/);
export const languageIdSchema = z.string().regex(/^language:[a-z]{3}$/);
export const religionIdSchema = z.string().regex(/^religion:[a-z0-9-]+:[a-z0-9._-]+$/);

export const peopleEntitySchema = z.object({
  kind: z.literal("people"),
  id: peopleIdSchema,
  name: nonEmptyString,
  alternateNames: z.array(nonEmptyString),
  externalIds: z.array(externalIdentifierSchema).min(1),
  taxonomy: z.object({
    sourcePeopleName: textObservationSchema,
    affinityBloc: textObservationSchema,
    peopleCluster: textObservationSchema,
    ethnographicGroup: textObservationSchema,
  }),
  provenance: z.array(fieldProvenanceSchema).min(1),
});

export const countryEntitySchema = z.object({
  kind: z.literal("country"),
  id: countryIdSchema,
  iso3: z.string().regex(/^[A-Z]{3}$/),
  name: nonEmptyString,
  alternateNames: z.array(nonEmptyString),
  externalIds: z.array(externalIdentifierSchema).min(1),
  provenance: z.array(fieldProvenanceSchema).min(1),
});

export const regionEntitySchema = z.object({
  kind: z.literal("region"),
  id: regionIdSchema,
  name: nonEmptyString,
  parentRegionId: regionIdSchema.nullable(),
  externalIds: z.array(externalIdentifierSchema).min(1),
  provenance: z.array(fieldProvenanceSchema).min(1),
});

export const languageEntitySchema = z.object({
  kind: z.literal("language"),
  id: languageIdSchema,
  iso6393: z.string().regex(/^[a-z]{3}$/),
  name: nonEmptyString.nullable(),
  alternateNames: z.array(nonEmptyString),
  familyNames: z.array(nonEmptyString),
  externalIds: z.array(externalIdentifierSchema).min(1),
  provenance: z.array(fieldProvenanceSchema).min(1),
});

export const religionEntitySchema = z.object({
  kind: z.literal("religion"),
  id: religionIdSchema,
  code: nonEmptyString,
  name: nonEmptyString.nullable(),
  alternateNames: z.array(nonEmptyString),
  externalIds: z.array(externalIdentifierSchema).min(1),
  provenance: z.array(fieldProvenanceSchema).min(1),
});

export const peopleContextSchema = z.object({
  kind: z.literal("people-context"),
  id: peopleContextIdSchema,
  peopleId: peopleIdSchema,
  countryId: countryIdSchema,
  regionId: regionIdSchema.nullable(),
  displayName: nonEmptyString,
  externalIds: z.array(externalIdentifierSchema).min(1),
  sourceRecord: sourceReferenceSchema,
  population: populationEstimateSchema,
  coordinates: coordinatesObservationSchema,
  geography: z.object({
    regionLabel: textObservationSchema,
    subregionLabel: textObservationSchema,
    locationDescription: textObservationSchema,
  }),
  language: z.object({
    languageId: languageIdSchema.nullable(),
    name: textObservationSchema,
    family: textObservationSchema,
  }),
  religion: z.object({
    religionId: religionIdSchema.nullable(),
    code: textObservationSchema,
    name: textObservationSchema,
    displayName: textObservationSchema,
  }),
  mission: z.object({
    classification: classificationObservationSchema,
    evangelicalPresence: textObservationSchema,
    engagementStatus: textObservationSchema,
    churchPlanting: textObservationSchema,
    congregationExists: textObservationSchema,
    sourceIndicators: z.array(sourceIndicatorSchema),
  }),
  resources: z.object({
    bibleAvailability: textObservationSchema,
    jesusFilmAvailability: textObservationSchema,
    totalReported: numberObservationSchema,
  }),
  sourceDescriptions: z.object({
    people: textObservationSchema,
    location: textObservationSchema,
  }),
  provenance: z.array(fieldProvenanceSchema).min(1),
});

export const sourceSnapshotSchema = z.object({
  sourceId: nonEmptyString,
  retrievedAt: timestampSchema,
  recordCount: z.number().int().nonnegative(),
});

export const normalizedMissionModelSchema = z.object({
  schemaVersion: z.literal(1),
  modelId: z.literal("unreached-v3-mission-model"),
  generatedAt: timestampSchema,
  sourceSnapshots: z.array(sourceSnapshotSchema).min(1),
  people: z.array(peopleEntitySchema),
  peopleContexts: z.array(peopleContextSchema),
  countries: z.array(countryEntitySchema),
  regions: z.array(regionEntitySchema),
  languages: z.array(languageEntitySchema),
  religions: z.array(religionEntitySchema),
});

export type SourceReference = z.infer<typeof sourceReferenceSchema>;
export type FieldProvenance = z.infer<typeof fieldProvenanceSchema>;
export type ExternalIdentifier = z.infer<typeof externalIdentifierSchema>;
export type TextObservation = z.infer<typeof textObservationSchema>;
export type NumberObservation = z.infer<typeof numberObservationSchema>;
export type PopulationEstimate = z.infer<typeof populationEstimateSchema>;
export type CoordinatesObservation = z.infer<typeof coordinatesObservationSchema>;
export type ClassificationObservation = z.infer<typeof classificationObservationSchema>;
export type SourceIndicator = z.infer<typeof sourceIndicatorSchema>;
export type PeopleEntity = z.infer<typeof peopleEntitySchema>;
export type PeopleContext = z.infer<typeof peopleContextSchema>;
export type CountryEntity = z.infer<typeof countryEntitySchema>;
export type RegionEntity = z.infer<typeof regionEntitySchema>;
export type LanguageEntity = z.infer<typeof languageEntitySchema>;
export type ReligionEntity = z.infer<typeof religionEntitySchema>;
export type SourceSnapshot = z.infer<typeof sourceSnapshotSchema>;
export type NormalizedMissionModel = z.infer<typeof normalizedMissionModelSchema>;
