import { z } from "zod";

const timestampSchema = z.string().min(1).refine((value) => !Number.isNaN(Date.parse(value)), "Invalid timestamp");
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const evidenceLevelSchema = z.enum(["A", "B", "C"]);
export const claimKindSchema = z.enum(["fact", "synthesis", "interpretation"]);
export const certaintySchema = z.enum(["high", "medium", "low"]);
export const temporalClassSchema = z.enum(["stable", "current"]);
export const sensitivitySchema = z.enum(["public", "generalized", "restricted"]);

export const contextDimensionSchema = z.enum([
  "identity",
  "geography",
  "culture",
  "history",
  "religion-community",
  "church-presence",
  "language-media",
  "social-identity",
  "legal-political",
  "conflict-displacement",
  "access-gap",
]);

export const whyUnreachedDimensionSchema = z.enum([
  "church-presence",
  "language-media",
  "social-identity",
  "geography",
  "legal-political",
  "conflict-displacement",
  "history",
  "access-gap",
]);

export const editorialSourceSchema = z.object({
  id: z.string().regex(/^ctx-source:[a-z0-9][a-z0-9._-]*$/),
  sourceId: z.string().trim().min(1),
  title: z.string().trim().min(1),
  publisher: z.string().trim().min(1).nullable(),
  url: z.string().url(),
  sourceType: z.enum([
    "academic",
    "reference",
    "official",
    "mission-research",
    "international-organization",
    "human-rights",
    "news",
    "other",
  ]),
  publicationDate: dateSchema.nullable(),
  accessedAt: timestampSchema,
  locator: z.string().trim().min(1).nullable(),
});

export const contextClaimSchema = z.object({
  id: z.string().regex(/^claim:[a-z0-9][a-z0-9._-]*$/),
  dimension: contextDimensionSchema,
  kind: claimKindSchema,
  evidenceLevel: evidenceLevelSchema,
  certainty: certaintySchema,
  temporalClass: temporalClassSchema,
  text: z.string().trim().min(1),
  citationIds: z.array(z.string().regex(/^ctx-source:[a-z0-9][a-z0-9._-]*$/)).min(1),
  asOf: dateSchema.nullable(),
  reviewAfter: dateSchema.nullable(),
  sensitivity: sensitivitySchema,
  interpretationNote: z.string().trim().min(1).nullable(),
});

export const editorialSectionSchema = z.object({
  summary: z.string().trim().min(1),
  claimIds: z.array(z.string().regex(/^claim:[a-z0-9][a-z0-9._-]*$/)).min(1),
});

export const whyUnreachedSectionSchema = z.object({
  dimension: whyUnreachedDimensionSchema,
  heading: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  claimIds: z.array(z.string().regex(/^claim:[a-z0-9][a-z0-9._-]*$/)).min(1),
});

export const editorialReviewSchema = z.object({
  status: z.enum(["draft", "reviewed", "published"]),
  qualityTier: z.union([z.literal(2), z.literal(3)]),
  aiAssisted: z.boolean(),
  reviewedAt: timestampSchema.nullable(),
  reviewerRole: z.string().trim().min(1).nullable(),
  checklist: z.object({
    namingChecked: z.boolean(),
    materialClaimsCited: z.boolean(),
    currentClaimsFresh: z.boolean(),
    noStereotypeShortcuts: z.boolean(),
    religionNuanced: z.boolean(),
    sensitiveDataChecked: z.boolean(),
    sourceLicensingChecked: z.boolean(),
  }),
});

export const peopleContextProfileSchema = z.object({
  peopleGroupId: z.string().regex(/^people:[0-9]+$/),
  sourcePeopleId: z.number().int().positive(),
  whoTheyAre: editorialSectionSchema,
  religionAndCommunity: editorialSectionSchema.nullable(),
  whyUnreachedIntro: z.string().trim().min(1),
  whyUnreached: z.array(whyUnreachedSectionSchema).min(1),
  claims: z.array(contextClaimSchema).min(1),
  sourceIds: z.array(z.string().regex(/^ctx-source:[a-z0-9][a-z0-9._-]*$/)).min(1),
  review: editorialReviewSchema,
});

export const editorialContextDatasetSchema = z.object({
  schemaVersion: z.literal(1),
  fixture: z.boolean(),
  generatedAt: timestampSchema,
  sources: z.array(editorialSourceSchema).min(1),
  profiles: z.array(peopleContextProfileSchema),
});

export const editorialContextAvailabilitySchema = z.object({
  schemaVersion: z.literal(1),
  available: z.boolean(),
  fixture: z.boolean(),
  datasetUrl: z.string().min(1).nullable(),
  reason: z.string().min(1).nullable(),
});

export type EditorialSource = z.infer<typeof editorialSourceSchema>;
export type ContextClaim = z.infer<typeof contextClaimSchema>;
export type PeopleContextProfile = z.infer<typeof peopleContextProfileSchema>;
export type EditorialContextDataset = z.infer<typeof editorialContextDatasetSchema>;
export type EditorialContextAvailability = z.infer<typeof editorialContextAvailabilitySchema>;
export type WhyUnreachedDimension = z.infer<typeof whyUnreachedDimensionSchema>;
