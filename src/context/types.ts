import { z } from "zod";

const timestampSchema = z.string().min(1).refine((value) => !Number.isNaN(Date.parse(value)), "Invalid timestamp");
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const pgidSchema = z.string().regex(/^PG[0-9]+$/);
const iso3Schema = z.string().regex(/^[A-Z]{3}$/);
const iso6393Schema = z.string().regex(/^[a-z]{3}$/);

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
    "humanitarian",
    "cultural-heritage",
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
    identityMatchChecked: z.boolean(),
  }),
});

export const contextIdentitySchema = z.object({
  provider: z.literal("peoplegroups-org"),
  origin: z.enum(["legacy-migrated", "peid-native"]),
  targetPeid: z.number().int().positive(),
  verifiedPeopleName: z.string().trim().min(1),
  pgidAnchors: z.array(pgidSchema).min(1),
  countryIso3Anchors: z.array(iso3Schema).min(1),
  languageIso6393Anchors: z.array(iso6393Schema).min(1),
  matchEvidence: z.array(z.enum(["provider-peid", "provider-pgid", "name", "country", "language"])).min(2),
  legacyPeopleGroupId: z.string().regex(/^people:[0-9]+$/).nullable(),
  legacySourcePeopleId: z.number().int().positive().nullable(),
  numericCoincidenceUsed: z.literal(false),
  verifiedAt: timestampSchema,
});

export const peopleContextProfileSchema = z.object({
  peopleEntityId: z.string().regex(/^people-entity:peoplegroups:[0-9]+$/),
  peid: z.number().int().positive(),
  identity: contextIdentitySchema,
  whoTheyAre: editorialSectionSchema,
  religionAndCommunity: editorialSectionSchema.nullable(),
  whyUnreachedIntro: z.string().trim().min(1),
  whyUnreached: z.array(whyUnreachedSectionSchema).min(1),
  claims: z.array(contextClaimSchema).min(1),
  sourceIds: z.array(z.string().regex(/^ctx-source:[a-z0-9][a-z0-9._-]*$/)).min(1),
  review: editorialReviewSchema,
});

export const editorialContextDatasetSchema = z.object({
  schemaVersion: z.literal(2),
  fixture: z.boolean(),
  generatedAt: timestampSchema,
  sources: z.array(editorialSourceSchema).min(1),
  profiles: z.array(peopleContextProfileSchema),
});

export const editorialContextProfilePackageSchema = z.object({
  schemaVersion: z.literal(1),
  fixture: z.boolean(),
  sources: z.array(editorialSourceSchema).min(1),
  profile: peopleContextProfileSchema,
});

export const editorialContextManifestSchema = z.object({
  schemaVersion: z.literal(1),
  fixture: z.boolean(),
  generatedAt: timestampSchema,
  profileCount: z.number().int().positive(),
  profileUrls: z.array(z.string().regex(/^data\/context\/profiles\/[a-z0-9][a-z0-9._-]*\.json$/)).min(1),
});

export const editorialContextAvailabilitySchema = z.object({
  schemaVersion: z.literal(2),
  available: z.boolean(),
  fixture: z.boolean(),
  mode: z.enum(["reviewed-editorial", "unavailable"]),
  datasetUrl: z.string().min(1).nullable(),
  reason: z.string().min(1).nullable(),
  profileCount: z.number().int().nonnegative(),
  identityProvider: z.literal("peoplegroups-org"),
});

export type EditorialSource = z.infer<typeof editorialSourceSchema>;
export type ContextClaim = z.infer<typeof contextClaimSchema>;
export type PeopleContextProfile = z.infer<typeof peopleContextProfileSchema>;
export type EditorialContextDataset = z.infer<typeof editorialContextDatasetSchema>;
export type EditorialContextProfilePackage = z.infer<typeof editorialContextProfilePackageSchema>;
export type EditorialContextManifest = z.infer<typeof editorialContextManifestSchema>;
export type EditorialContextAvailability = z.infer<typeof editorialContextAvailabilitySchema>;
export type WhyUnreachedDimension = z.infer<typeof whyUnreachedDimensionSchema>;
export type ContextIdentity = z.infer<typeof contextIdentitySchema>;
