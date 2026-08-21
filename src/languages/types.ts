import { z } from "zod";

import {
  countMetricSchema,
  fieldProvenanceSchema,
  languageIdSchema,
  missionMetricsSchema,
  scriptureResourcesSchema,
} from "../domain";
import { missionAttributionSchema } from "../visualization/types";

const timestampSchema = z.string().min(1).refine((value) => !Number.isNaN(Date.parse(value)), "Invalid timestamp");
const iso3Schema = z.string().regex(/^[A-Z]{3}$/);
const iso6393Schema = z.string().regex(/^[a-z]{3}$/);

export const languageCountrySummarySchema = z.object({
  countryId: z.string().regex(/^country:[A-Z]{3}$/),
  iso3: iso3Schema,
  name: z.string().trim().min(1),
  peopleGroupCount: z.number().int().nonnegative(),
  knownPopulation: z.number().finite().nonnegative(),
});

export const languagePeopleSummarySchema = z.object({
  peopleGroupId: z.string().regex(/^people:[0-9]+$/),
  sourcePeopleId: z.number().int().positive(),
  name: z.string().trim().min(1),
  globalPopulation: countMetricSchema,
  classification: z.enum(["unreached", "reached", "unknown"]),
  frontier: z.boolean().nullable(),
  largestCountryIso3: iso3Schema.nullable(),
  largestCountryName: z.string().trim().min(1).nullable(),
});

export const languageExplorerRecordSchema = z.object({
  languageId: languageIdSchema,
  iso6393: iso6393Schema,
  name: z.string().trim().min(1),
  status: z.enum(["living", "extinct", "nearly-extinct", "historical", "ancient", "constructed", "unknown"]),
  familyName: z.string().trim().min(1).nullable(),
  branchName: z.string().trim().min(1).nullable(),
  taxonomySourceId: z.string().min(1).nullable(),
  hubCountry: z.object({
    countryId: z.string().regex(/^country:[A-Z]{3}$/),
    iso3: iso3Schema,
    name: z.string().trim().min(1),
  }).nullable(),
  primaryReligion: z.object({
    religionId: z.string().regex(/^religion:[12456789]$/),
    name: z.string().trim().min(1),
  }).nullable(),
  mission: missionMetricsSchema,
  scripture: scriptureResourcesSchema,
  peopleGroupCount: z.number().int().nonnegative(),
  unreachedPeopleGroupCount: z.number().int().nonnegative(),
  frontierPeopleGroupCount: z.number().int().nonnegative(),
  countryCount: z.number().int().nonnegative(),
  knownRepresentedPopulation: z.number().finite().nonnegative(),
  countries: z.array(languageCountrySummarySchema),
  peoples: z.array(languagePeopleSummarySchema),
  provenance: z.array(fieldProvenanceSchema).min(1),
  sourceIds: z.array(z.string().min(1)),
});

export const languageExplorerDatasetSchema = z.object({
  schemaVersion: z.literal(1),
  methodologyVersion: z.literal(1),
  fixture: z.boolean(),
  generatedAt: timestampSchema,
  sourceIds: z.array(z.string().min(1)),
  languages: z.array(languageExplorerRecordSchema),
});

export const languageExplorerAvailabilitySchema = z.object({
  schemaVersion: z.literal(1),
  available: z.boolean(),
  fixture: z.boolean(),
  datasetUrl: z.string().min(1).nullable(),
  reason: z.string().min(1).nullable(),
  sourceIds: z.array(z.string().min(1)),
  attributions: z.array(missionAttributionSchema),
});

export type LanguageCountrySummary = z.infer<typeof languageCountrySummarySchema>;
export type LanguagePeopleSummary = z.infer<typeof languagePeopleSummarySchema>;
export type LanguageExplorerRecord = z.infer<typeof languageExplorerRecordSchema>;
export type LanguageExplorerDataset = z.infer<typeof languageExplorerDatasetSchema>;
export type LanguageExplorerAvailability = z.infer<typeof languageExplorerAvailabilitySchema>;
