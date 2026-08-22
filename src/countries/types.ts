import { z } from "zod";

import { countMetricSchema } from "../domain";
import { countryMissionSummarySchema, missionAttributionSchema, scriptureMapStatusSchema } from "../visualization/types";

const nullablePercentSchema = z.number().finite().min(0).max(100).nullable();
const nullableCountSchema = z.number().finite().nonnegative().nullable();

export const countryPeopleRowSchema = z.object({
  id: z.string().regex(/^people-country:[0-9]+:[A-Z]{3}$/),
  peopleGroupId: z.string().regex(/^people:[0-9]+$/),
  name: z.string().trim().min(1),
  population: nullableCountSchema,
  populationQuality: z.enum(["exact", "estimated", "rounded", "unknown"]),
  classification: z.enum(["unreached", "reached", "unknown"]),
  frontier: z.boolean().nullable(),
  christianPercent: nullablePercentSchema,
  evangelicalPercent: nullablePercentSchema,
  primaryLanguageId: z.string().regex(/^language:[a-z]{3}$/).nullable(),
  primaryLanguageName: z.string().trim().min(1).nullable(),
  primaryReligionId: z.string().regex(/^religion:[1245689]$/).nullable(),
  primaryReligionName: z.string().trim().min(1).nullable(),
  scriptureStatus: scriptureMapStatusSchema,
});

export const countryLanguageSummarySchema = z.object({
  languageId: z.string().regex(/^language:[a-z]{3}$/),
  name: z.string().trim().min(1),
  peopleGroupCount: z.number().int().nonnegative(),
  knownPopulation: nullableCountSchema,
});

export const countryReligionSummarySchema = z.object({
  religionId: z.string().regex(/^religion:[1245689]$/),
  name: z.string().trim().min(1),
  peopleGroupCount: z.number().int().nonnegative(),
  knownPopulation: nullableCountSchema,
  representedShare: nullablePercentSchema,
});

export const countryScriptureSummarySchema = z.object({
  status: scriptureMapStatusSchema,
  peopleGroupCount: z.number().int().nonnegative(),
  knownPopulation: nullableCountSchema,
});

export const countryExplorerRecordSchema = z.object({
  countryId: z.string().regex(/^country:[A-Z]{3}$/),
  iso3: z.string().regex(/^[A-Z]{3}$/),
  name: z.string().trim().min(1),
  regionName: z.string().trim().min(1).nullable(),
  population: countMetricSchema,
  mission: countryMissionSummarySchema,
  peopleGroups: z.array(countryPeopleRowSchema),
  languages: z.array(countryLanguageSummarySchema),
  religions: z.array(countryReligionSummarySchema),
  scripture: z.array(countryScriptureSummarySchema),
  sourceIds: z.array(z.string().min(1)),
});

export const countryExplorerDatasetSchema = z.object({
  schemaVersion: z.literal(1),
  methodologyVersion: z.literal(1),
  fixture: z.boolean(),
  generatedAt: z.string().min(1).refine((value) => !Number.isNaN(Date.parse(value)), "Invalid generatedAt timestamp"),
  sourceIds: z.array(z.string().min(1)),
  countries: z.array(countryExplorerRecordSchema),
});

export const countryExplorerAvailabilitySchema = z.object({
  schemaVersion: z.literal(1),
  available: z.boolean(),
  fixture: z.boolean(),
  datasetUrl: z.string().min(1).nullable(),
  reason: z.string().min(1).nullable(),
  sourceIds: z.array(z.string().min(1)),
  attributions: z.array(missionAttributionSchema),
});

export type CountryPeopleRow = z.infer<typeof countryPeopleRowSchema>;
export type CountryLanguageSummary = z.infer<typeof countryLanguageSummarySchema>;
export type CountryReligionSummary = z.infer<typeof countryReligionSummarySchema>;
export type CountryScriptureSummary = z.infer<typeof countryScriptureSummarySchema>;
export type CountryExplorerRecord = z.infer<typeof countryExplorerRecordSchema>;
export type CountryExplorerDataset = z.infer<typeof countryExplorerDatasetSchema>;
export type CountryExplorerAvailability = z.infer<typeof countryExplorerAvailabilitySchema>;
