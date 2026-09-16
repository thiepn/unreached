import { z } from "zod";
import { peopleContextIdSchema, peopleIdSchema } from "../mission-model";

const nonEmptyString = z.string().trim().min(1);
const timestampSchema = nonEmptyString.refine(
  (value) => !Number.isNaN(Date.parse(value)),
  "Invalid timestamp",
);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const sourceIdSchema = z.string().regex(/^(?:ctx-source|editorial-source):[a-z0-9][a-z0-9._-]*$/);
const claimIdSchema = z.string().regex(/^claim:[a-z0-9][a-z0-9._-]*$/);
const promptIdSchema = z.string().regex(/^prayer:[a-z0-9][a-z0-9._-]*$/);

export const editorialTierSchema = z.enum(["reviewed", "enhanced", "source"]);
export const editorialStatusSchema = z.enum(["draft", "reviewed", "published", "source-only"]);
export const evidenceLevelSchema = z.enum(["A", "B", "C"]);
export const claimKindSchema = z.enum(["fact", "synthesis", "interpretation"]);
export const certaintySchema = z.enum(["high", "medium", "low"]);
export const temporalClassSchema = z.enum(["stable", "current"]);
export const sensitivitySchema = z.enum(["public", "generalized", "restricted"]);

export const editorialSectionKeySchema = z.enum([
  "overview",
  "identity-context",
  "geography-context",
  "culture-history",
  "language-context",
  "religion-community",
  "gospel-context",
  "scripture-access",
]);

export const editorialSourceSchema = z.object({
  id: sourceIdSchema,
  sourceId: nonEmptyString,
  title: nonEmptyString,
  publisher: nonEmptyString.nullable(),
  url: z.string().url().refine((value) => value.startsWith("https://"), "Editorial sources must use HTTPS."),
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
  locator: nonEmptyString.nullable(),
});

export const editorialClaimSchema = z.object({
  id: claimIdSchema,
  sectionKeys: z.array(editorialSectionKeySchema).min(1),
  kind: claimKindSchema,
  evidenceLevel: evidenceLevelSchema,
  certainty: certaintySchema,
  temporalClass: temporalClassSchema,
  text: nonEmptyString,
  citationIds: z.array(sourceIdSchema).min(1),
  asOf: dateSchema.nullable(),
  reviewAfter: dateSchema.nullable(),
  sensitivity: sensitivitySchema,
  interpretationNote: nonEmptyString.nullable(),
});

export const editorialSectionSchema = z.object({
  key: editorialSectionKeySchema,
  heading: nonEmptyString,
  body: nonEmptyString,
  claimIds: z.array(claimIdSchema).min(1),
});

export const prayerPromptSchema = z.object({
  id: promptIdSchema,
  category: z.enum([
    "church",
    "witness",
    "scripture-resources",
    "community-flourishing",
    "peace-justice",
    "workers",
    "wisdom",
  ]),
  text: nonEmptyString,
  basisClaimIds: z.array(claimIdSchema).min(1),
  origin: z.enum(["profile-reviewed", "reviewed-template"]),
  scriptureReference: nonEmptyString.nullable(),
});

export const researchGapSchema = z.object({
  sectionKey: editorialSectionKeySchema,
  note: nonEmptyString,
});

export const editorialReviewSchema = z.object({
  status: editorialStatusSchema,
  reviewedAt: timestampSchema.nullable(),
  reviewerRole: nonEmptyString.nullable(),
  aiAssisted: z.boolean(),
  checklist: z.object({
    identityChecked: z.boolean(),
    materialClaimsCited: z.boolean(),
    currentClaimsFresh: z.boolean(),
    sourceQualityChecked: z.boolean(),
    noStereotypeShortcuts: z.boolean(),
    religionNuanced: z.boolean(),
    sensitiveDataChecked: z.boolean(),
    licensingChecked: z.boolean(),
    sectionCoverageChecked: z.boolean(),
    prayerLanguageChecked: z.boolean(),
  }),
});

export const editorialProfileSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().regex(/^editorial-profile:[a-z0-9][a-z0-9._-]*$/),
  tier: editorialTierSchema,
  peopleId: peopleIdSchema,
  peopleContextIds: z.array(peopleContextIdSchema).min(1),
  title: nonEmptyString,
  deck: nonEmptyString,
  sections: z.array(editorialSectionSchema),
  claims: z.array(editorialClaimSchema),
  sources: z.array(editorialSourceSchema),
  prayerPrompts: z.array(prayerPromptSchema),
  researchGaps: z.array(researchGapSchema),
  legacyContextProfile: z.object({
    sourcePath: nonEmptyString,
    legacyPeopleEntityId: z.string().regex(/^people-entity:peoplegroups:[0-9]+$/),
    peid: z.number().int().positive(),
  }).nullable(),
  review: editorialReviewSchema,
});

export const editorialExemplarManifestSchema = z.object({
  schemaVersion: z.literal(1),
  minimumReviewedProfiles: z.number().int().min(10),
  profiles: z.array(z.object({
    slug: z.string().regex(/^[a-z0-9][a-z0-9._-]*$/),
    sourceProfilePath: z.string().regex(/^public\/data\/context\/profiles\/[a-z0-9][a-z0-9._-]*\.json$/),
  })).min(10),
});

export type EditorialTier = z.infer<typeof editorialTierSchema>;
export type EditorialSectionKey = z.infer<typeof editorialSectionKeySchema>;
export type EditorialSource = z.infer<typeof editorialSourceSchema>;
export type EditorialClaim = z.infer<typeof editorialClaimSchema>;
export type EditorialSection = z.infer<typeof editorialSectionSchema>;
export type PrayerPrompt = z.infer<typeof prayerPromptSchema>;
export type ResearchGap = z.infer<typeof researchGapSchema>;
export type EditorialReview = z.infer<typeof editorialReviewSchema>;
export type EditorialProfile = z.infer<typeof editorialProfileSchema>;
export type EditorialExemplarManifest = z.infer<typeof editorialExemplarManifestSchema>;
