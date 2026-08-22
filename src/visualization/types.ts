import { z } from "zod";

export const missionLayerIdSchema = z.enum([
  "unreached",
  "frontier",
  "evangelical",
  "religion",
  "scripture",
]);

export type MissionLayerId = z.infer<typeof missionLayerIdSchema>;

export const scriptureMapStatusSchema = z.enum([
  "unknown",
  "translation-needed",
  "translation-started",
  "portions",
  "new-testament",
  "complete-bible",
]);

const nullablePercentSchema = z.number().finite().min(0).max(100).nullable();
const nullableCountSchema = z.number().finite().nonnegative().nullable();

export const countryMissionSummarySchema = z.object({
  countryId: z.string().regex(/^country:[A-Z]{3}$/),
  iso3: z.string().regex(/^[A-Z]{3}$/),
  peopleGroupCount: z.number().int().nonnegative(),
  unreachedGroupCount: z.number().int().nonnegative(),
  frontierGroupCount: z.number().int().nonnegative(),
  knownPopulation: nullableCountSchema,
  classifiedPopulation: nullableCountSchema,
  unreachedPopulation: nullableCountSchema,
  unreachedShare: nullablePercentSchema,
  frontierKnownPopulation: nullableCountSchema,
  frontierPopulation: nullableCountSchema,
  frontierShare: nullablePercentSchema,
  evangelicalPercent: nullablePercentSchema,
  primaryReligionId: z.string().regex(/^religion:[1245689]$/).nullable(),
  primaryReligionName: z.string().trim().min(1).nullable(),
  scriptureStatus: scriptureMapStatusSchema,
  coverage: z.object({
    classification: nullablePercentSchema,
    frontier: nullablePercentSchema,
    evangelical: nullablePercentSchema,
    religion: nullablePercentSchema,
    scripture: nullablePercentSchema,
  }),
  sourceIds: z.array(z.string().min(1)),
  methodologyVersion: z.literal(1),
});

export type CountryMissionSummary = z.infer<typeof countryMissionSummarySchema>;

export const missionVisualizationDatasetSchema = z.object({
  schemaVersion: z.literal(1),
  methodologyVersion: z.literal(1),
  fixture: z.boolean(),
  generatedAt: z.string().min(1).refine((value) => !Number.isNaN(Date.parse(value)), "Invalid generatedAt timestamp"),
  sourceIds: z.array(z.string().min(1)),
  countries: z.array(countryMissionSummarySchema),
});

export type MissionVisualizationDataset = z.infer<typeof missionVisualizationDatasetSchema>;

export const missionAttributionSchema = z.object({
  sourceId: z.string().min(1),
  label: z.string().min(1),
  url: z.string().url(),
});

export const missionVisualizationAvailabilitySchema = z.object({
  schemaVersion: z.literal(1),
  available: z.boolean(),
  fixture: z.boolean(),
  mode: z.enum(["static-dataset", "runtime-api"]).optional(),
  datasetUrl: z.string().min(1).nullable(),
  reason: z.string().min(1).nullable(),
  sourceIds: z.array(z.string().min(1)),
  attributions: z.array(missionAttributionSchema),
});

export type MissionVisualizationAvailability = z.infer<typeof missionVisualizationAvailabilitySchema>;
