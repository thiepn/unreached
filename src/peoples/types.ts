import { z } from "zod";

import {
  countMetricSchema,
  countryIdSchema,
  fieldProvenanceSchema,
  languageIdSchema,
  missionMetricsSchema,
  peopleGroupIdSchema,
  peopleGroupInCountryIdSchema,
  religionIdSchema,
  scriptureResourcesSchema,
} from "../domain";
import { missionAttributionSchema } from "../visualization/types";

const timestampSchema = z.string().min(1).refine((value) => !Number.isNaN(Date.parse(value)), "Invalid timestamp");

export const peopleScriptureSummarySchema = scriptureResourcesSchema.extend({
  basis: z.enum(["primary-language", "country-record", "unknown"]),
});

export const peopleCountryContextSchema = z.object({
  id: peopleGroupInCountryIdSchema,
  countryId: countryIdSchema,
  iso3: z.string().regex(/^[A-Z]{3}$/),
  countryName: z.string().trim().min(1),
  regionName: z.string().trim().min(1).nullable(),
  nameInCountry: z.string().trim().min(1),
  population: countMetricSchema,
  mission: missionMetricsSchema,
  primaryLanguageId: languageIdSchema.nullable(),
  primaryLanguageName: z.string().trim().min(1).nullable(),
  primaryReligionId: religionIdSchema.nullable(),
  primaryReligionName: z.string().trim().min(1).nullable(),
  locationText: z.string().trim().min(1).nullable(),
  hasCoordinates: z.boolean(),
  scripture: scriptureResourcesSchema,
  sourceIds: z.array(z.string().min(1)),
});

export const relatedPeopleSchema = z.object({
  peopleGroupId: peopleGroupIdSchema,
  sourcePeopleId: z.number().int().positive(),
  name: z.string().trim().min(1),
  relationship: z.enum(["same-cluster", "same-affinity-bloc"]),
  globalPopulation: countMetricSchema,
  classification: z.enum(["unreached", "reached", "unknown"]),
  frontier: z.boolean().nullable(),
});

export const peopleGroupProfileSchema = z.object({
  peopleGroupId: peopleGroupIdSchema,
  sourcePeopleId: z.number().int().positive(),
  name: z.string().trim().min(1),
  affinityBloc: z.string().trim().min(1).nullable(),
  cluster: z.string().trim().min(1).nullable(),
  globalPopulation: countMetricSchema,
  mission: missionMetricsSchema,
  primaryLanguage: z.object({
    languageId: languageIdSchema,
    iso6393: z.string().regex(/^[a-z]{3}$/),
    name: z.string().trim().min(1),
    status: z.enum(["living", "extinct", "nearly-extinct", "historical", "ancient", "constructed", "unknown"]),
    scripture: scriptureResourcesSchema,
  }).nullable(),
  primaryReligion: z.object({
    religionId: religionIdSchema,
    name: z.string().trim().min(1),
  }).nullable(),
  largestCountry: z.object({
    countryId: countryIdSchema,
    iso3: z.string().regex(/^[A-Z]{3}$/),
    name: z.string().trim().min(1),
  }).nullable(),
  countryCount: z.number().int().nonnegative(),
  countries: z.array(peopleCountryContextSchema),
  scripture: peopleScriptureSummarySchema,
  relatedPeople: z.array(relatedPeopleSchema).max(12),
  provenance: z.array(fieldProvenanceSchema).min(1),
  sourceIds: z.array(z.string().min(1)),
});

export const peopleExplorerDatasetSchema = z.object({
  schemaVersion: z.literal(1),
  methodologyVersion: z.literal(1),
  fixture: z.boolean(),
  generatedAt: timestampSchema,
  sourceIds: z.array(z.string().min(1)),
  peoples: z.array(peopleGroupProfileSchema),
});

export const peopleExplorerAvailabilitySchema = z.object({
  schemaVersion: z.literal(1),
  available: z.boolean(),
  fixture: z.boolean(),
  datasetUrl: z.string().min(1).nullable(),
  reason: z.string().min(1).nullable(),
  sourceIds: z.array(z.string().min(1)),
  attributions: z.array(missionAttributionSchema),
});

export type PeopleScriptureSummary = z.infer<typeof peopleScriptureSummarySchema>;
export type PeopleCountryContext = z.infer<typeof peopleCountryContextSchema>;
export type RelatedPeople = z.infer<typeof relatedPeopleSchema>;
export type PeopleGroupProfile = z.infer<typeof peopleGroupProfileSchema>;
export type PeopleExplorerDataset = z.infer<typeof peopleExplorerDatasetSchema>;
export type PeopleExplorerAvailability = z.infer<typeof peopleExplorerAvailabilitySchema>;
