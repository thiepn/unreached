import { z } from "zod";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timestampSchema = z.string().min(1).refine((value) => !Number.isNaN(Date.parse(value)), "Invalid timestamp");

export const prayerCategorySchema = z.enum([
  "gospel",
  "believers",
  "church",
  "scripture",
  "workers",
  "community",
  "authorities",
  "specific-need",
]);

export const scriptureReferenceSchema = z.object({
  reference: z.string().trim().min(3),
  purpose: z.string().trim().min(3),
}).strict();

export const prayerPromptSchema = z.object({
  id: z.string().regex(/^prayer-prompt:[a-z0-9-]+$/),
  category: prayerCategorySchema,
  text: z.string().trim().min(20).max(700),
  grounding: z.enum(["biblical", "contextual", "mixed"]),
  contextClaimIds: z.array(z.string().regex(/^claim:[a-z0-9-]+$/)),
  scriptureReferences: z.array(scriptureReferenceSchema).max(3),
  temporalClass: z.enum(["stable", "current"]),
  asOf: dateSchema.nullable(),
  reviewAfter: dateSchema.nullable(),
  sensitivity: z.enum(["public", "generalized", "restricted"]),
}).strict();

export const whyPraySchema = z.object({
  summary: z.string().trim().min(40).max(1200),
  contextClaimIds: z.array(z.string().regex(/^claim:[a-z0-9-]+$/)),
  scriptureReferences: z.array(scriptureReferenceSchema).min(1).max(4),
}).strict();

export const prayerReviewSchema = z.object({
  status: z.enum(["draft", "reviewed", "published"]),
  reviewedAt: timestampSchema.nullable(),
  reviewerRole: z.string().trim().min(2).nullable(),
  aiAssisted: z.boolean(),
  checklist: z.object({
    factualAssumptionsGrounded: z.boolean(),
    scriptureAppliedAppropriately: z.boolean(),
    sensitiveDataChecked: z.boolean(),
    toneReviewed: z.boolean(),
    noCompetitiveGamification: z.boolean(),
    currentClaimsFresh: z.boolean(),
  }).strict(),
}).strict();

export const prayerProfileSchema = z.object({
  peopleGroupId: z.string().regex(/^people:[0-9]+$/),
  sourcePeopleId: z.number().int().positive(),
  peopleName: z.string().trim().min(1),
  countryIso3s: z.array(z.string().regex(/^[A-Z]{3}$/)).min(1),
  featuredDaily: z.boolean(),
  whyPray: whyPraySchema,
  prompts: z.array(prayerPromptSchema).min(4).max(7),
  review: prayerReviewSchema,
}).strict();

export const prayerDatasetSchema = z.object({
  schemaVersion: z.literal(1),
  methodologyVersion: z.literal(1),
  fixture: z.boolean(),
  generatedAt: timestampSchema,
  profiles: z.array(prayerProfileSchema),
}).strict();

export const prayerAvailabilitySchema = z.object({
  schemaVersion: z.literal(1),
  available: z.boolean(),
  fixture: z.boolean(),
  datasetUrl: z.string().min(1).nullable(),
  reason: z.string().min(1).nullable(),
}).strict();

export type PrayerCategory = z.infer<typeof prayerCategorySchema>;
export type ScriptureReference = z.infer<typeof scriptureReferenceSchema>;
export type PrayerPrompt = z.infer<typeof prayerPromptSchema>;
export type PrayerProfile = z.infer<typeof prayerProfileSchema>;
export type PrayerDataset = z.infer<typeof prayerDatasetSchema>;
export type PrayerAvailability = z.infer<typeof prayerAvailabilitySchema>;
