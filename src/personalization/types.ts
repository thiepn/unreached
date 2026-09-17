import { z } from "zod";

const timestampSchema = z.string().min(1).refine((value) => !Number.isNaN(Date.parse(value)), "Invalid timestamp");
const peopleGroupIdSchema = z.string().regex(/^(?:people:[0-9]+|people-entity:peoplegroups:[0-9]+)$/);

export const savedPersonSnapshotSchema = z.object({
  sourcePeopleId: z.number().int().positive(),
  peopleGroupId: peopleGroupIdSchema,
  name: z.string().trim().min(1),
  largestCountryName: z.string().trim().min(1).nullable(),
  primaryLanguageName: z.string().trim().min(1).nullable(),
  classification: z.enum(["unreached", "reached", "unknown", "unreached-only", "other-only", "mixed"]),
  frontier: z.boolean().nullable(),
  savedAt: timestampSchema,
});

export const recentVisitSchema = z.object({
  kind: z.enum(["people", "country", "language"]),
  key: z.string().min(1),
  label: z.string().trim().min(1),
  secondary: z.string().trim().min(1).nullable(),
  href: z.string().regex(/^#\//),
  visitedAt: timestampSchema,
});

export const prayerListEntrySchema = z.object({
  sourcePeopleId: z.number().int().positive(),
  peopleGroupId: peopleGroupIdSchema,
  name: z.string().trim().min(1),
  countryName: z.string().trim().min(1).nullable(),
  languageName: z.string().trim().min(1).nullable(),
  addedAt: timestampSchema,
  lastPrayedAt: timestampSchema.nullable(),
});

export const personalNoteSchema = z.object({
  sourcePeopleId: z.number().int().positive(),
  text: z.string().trim().min(1).max(2000),
  updatedAt: timestampSchema,
});

export const prayerMemoryEntrySchema = z.object({
  sourcePeopleId: z.number().int().positive(),
  peopleGroupId: peopleGroupIdSchema,
  name: z.string().trim().min(1),
  countryName: z.string().trim().min(1).nullable(),
  languageName: z.string().trim().min(1).nullable(),
  prayedAt: timestampSchema,
});

export const legacyPersonalizationStateV1Schema = z.object({
  version: z.literal(1),
  savedPeoples: z.array(savedPersonSnapshotSchema),
  recent: z.array(recentVisitSchema).max(12),
});

export const legacyPersonalizationStateV2Schema = z.object({
  version: z.literal(2),
  savedPeoples: z.array(savedPersonSnapshotSchema),
  prayerList: z.array(prayerListEntrySchema).max(100),
  recent: z.array(recentVisitSchema).max(12),
});

export const personalizationStateSchema = z.object({
  version: z.literal(3),
  savedPeoples: z.array(savedPersonSnapshotSchema),
  prayerList: z.array(prayerListEntrySchema).max(100),
  recent: z.array(recentVisitSchema).max(12),
  personalNotes: z.array(personalNoteSchema).max(200),
  prayerMemory: z.array(prayerMemoryEntrySchema).max(30),
});

export type SavedPersonSnapshot = z.infer<typeof savedPersonSnapshotSchema>;
export type PrayerListEntry = z.infer<typeof prayerListEntrySchema>;
export type PersonalNote = z.infer<typeof personalNoteSchema>;
export type PrayerMemoryEntry = z.infer<typeof prayerMemoryEntrySchema>;
export type RecentVisit = z.infer<typeof recentVisitSchema>;
export type RecentVisitKind = RecentVisit["kind"];
export type PersonalizationState = z.infer<typeof personalizationStateSchema>;
export type LegacyPersonalizationStateV1 = z.infer<typeof legacyPersonalizationStateV1Schema>;
export type LegacyPersonalizationStateV2 = z.infer<typeof legacyPersonalizationStateV2Schema>;
