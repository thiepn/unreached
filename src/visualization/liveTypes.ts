import { z } from "zod";

export const liveMissionLayerIdSchema = z.enum([
  "unreached-population",
  "unreached-contexts",
  "gsec-coverage",
  "population-coverage",
  "people-contexts",
]);

export type LiveMissionLayerId = z.infer<typeof liveMissionLayerIdSchema>;

const percentSchema = z.number().finite().min(0).max(100).nullable();

export const liveMissionCountrySummarySchema = z.object({
  iso3: z.string().regex(/^[A-Z]{3}$/),
  name: z.string().min(1),
  peopleContextCount: z.number().int().nonnegative(),
  unreachedContextCount: z.number().int().nonnegative(),
  otherContextCount: z.number().int().nonnegative(),
  unknownContextCount: z.number().int().nonnegative(),
  gsecKnownContextCount: z.number().int().nonnegative(),
  populationKnownContextCount: z.number().int().nonnegative(),
  knownPopulation: z.number().int().nonnegative(),
  gsecKnownPopulation: z.number().int().nonnegative(),
  unreachedKnownPopulation: z.number().int().nonnegative(),
  unreachedPopulationShare: percentSchema,
  unreachedContextShare: percentSchema,
  gsecCoverage: percentSchema,
  gsecPopulationCoverage: percentSchema,
  populationCoverage: percentSchema,
  sourceUpdatedAt: z.string().nullable(),
  denominator: z.literal("people-group-in-country records returned by PeopleGroups.org"),
  methodologyVersion: z.literal("u12d-imb-gsec-map-v1"),
});

export type LiveMissionCountrySummary = z.infer<typeof liveMissionCountrySummarySchema>;

export const liveMissionAvailabilitySchema = z.object({
  schemaVersion: z.literal(1),
  available: z.literal(true),
  fixture: z.literal(false),
  mode: z.literal("runtime-api"),
  datasetUrl: z.null(),
  reason: z.null(),
  sourceIds: z.array(z.literal("peoplegroups-org-api")).min(1),
  attributions: z.array(z.object({
    sourceId: z.literal("peoplegroups-org-api"),
    label: z.string().min(1),
    url: z.string().url(),
  })).min(1),
});

export type LiveMissionAvailability = z.infer<typeof liveMissionAvailabilitySchema>;
