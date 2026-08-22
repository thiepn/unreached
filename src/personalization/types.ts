import { z } from "zod";

export const savedPersonSnapshotSchema = z.object({
  sourcePeopleId: z.number().int().positive(),
  peopleGroupId: z.string().regex(/^(?:people:[0-9]+|people-entity:peoplegroups:[0-9]+)$/),
  name: z.string().trim().min(1),
  largestCountryName: z.string().trim().min(1).nullable(),
  primaryLanguageName: z.string().trim().min(1).nullable(),
  classification: z.enum(["unreached", "reached", "unknown", "unreached-only", "other-only", "mixed"]),
  frontier: z.boolean().nullable(),
  savedAt: z.string().min(1).refine((value) => !Number.isNaN(Date.parse(value)), "Invalid savedAt timestamp"),
});

export const recentVisitSchema = z.object({
  kind: z.enum(["people", "country", "language"]),
  key: z.string().min(1),
  label: z.string().trim().min(1),
  secondary: z.string().trim().min(1).nullable(),
  href: z.string().regex(/^#\//),
  visitedAt: z.string().min(1).refine((value) => !Number.isNaN(Date.parse(value)), "Invalid visitedAt timestamp"),
});

export const personalizationStateSchema = z.object({
  version: z.literal(1),
  savedPeoples: z.array(savedPersonSnapshotSchema),
  recent: z.array(recentVisitSchema).max(12),
});

export type SavedPersonSnapshot = z.infer<typeof savedPersonSnapshotSchema>;
export type RecentVisit = z.infer<typeof recentVisitSchema>;
export type RecentVisitKind = RecentVisit["kind"];
export type PersonalizationState = z.infer<typeof personalizationStateSchema>;
