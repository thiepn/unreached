import { z } from "zod";

import type { PeopleProfileRecord } from "../peoples/profile";

const isoTimestampSchema = z.string().refine((value) => Number.isFinite(Date.parse(value)), "Invalid timestamp");

export const missionHistoryMetricsSchema = z.object({
  classification: z.enum(["unreached", "not-unreached", "unknown"]),
  gsec: z.number().int().min(0).max(6).nullable(),
  evangelicalLevel: z.string().nullable(),
  engagementStatus: z.string().nullable(),
  congregationExists: z.string().nullable(),
  churchPlanting: z.string().nullable(),
  population: z.number().int().nonnegative().nullable(),
  bibleAvailability: z.string().nullable(),
  jesusFilmAvailability: z.string().nullable(),
});

export const missionHistoryObservationSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  provider: z.literal("peoplegroups-org"),
  peid: z.number().int().positive(),
  pgid: z.string().regex(/^PG[0-9]+$/),
  countryIso3: z.string().regex(/^[A-Z]{3}$/),
  peopleName: z.string().min(1),
  sourceUpdatedAt: isoTimestampSchema.nullable(),
  latestSourceUpdatedAt: isoTimestampSchema.nullable(),
  firstObservedAt: isoTimestampSchema,
  lastObservedAt: isoTimestampSchema,
  signature: z.string().regex(/^[0-9a-f]{8}$/),
  metrics: missionHistoryMetricsSchema,
});

export type MissionHistoryMetrics = z.infer<typeof missionHistoryMetricsSchema>;
export type MissionHistoryObservation = z.infer<typeof missionHistoryObservationSchema>;

export type MissionHistoryChangeField =
  | "classification"
  | "gsec"
  | "evangelicalLevel"
  | "engagementStatus"
  | "congregationExists"
  | "churchPlanting"
  | "population"
  | "bibleAvailability"
  | "jesusFilmAvailability";

export interface MissionHistoryChange {
  field: MissionHistoryChangeField;
  before: MissionHistoryMetrics[MissionHistoryChangeField];
  after: MissionHistoryMetrics[MissionHistoryChangeField];
}

const TRACKED_FIELDS: readonly MissionHistoryChangeField[] = [
  "classification",
  "gsec",
  "evangelicalLevel",
  "engagementStatus",
  "congregationExists",
  "churchPlanting",
  "population",
  "bibleAvailability",
  "jesusFilmAvailability",
];

function laterTimestamp(left: string | null, right: string | null): string | null {
  if (!left) return right;
  if (!right) return left;
  return Date.parse(right) > Date.parse(left) ? right : left;
}

function historySignature(metrics: MissionHistoryMetrics): string {
  const value = JSON.stringify(metrics);
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function createPeopleGroupsHistoryObservation(
  record: PeopleProfileRecord,
  observedAt = new Date().toISOString(),
): MissionHistoryObservation {
  const context = record.contexts[0]!;
  const timestamp = isoTimestampSchema.parse(observedAt);
  const metrics = missionHistoryMetricsSchema.parse({
    classification: context.reach.assertion.classification,
    gsec: context.reach.gsec.code,
    evangelicalLevel: context.reach.evangelicalLevel,
    engagementStatus: context.reach.engagementStatus,
    congregationExists: context.reach.congregationExists,
    churchPlanting: context.reach.churchPlanting,
    population: context.population.value,
    bibleAvailability: context.resources.bibleAvailability,
    jesusFilmAvailability: context.resources.jesusFilmAvailability,
  });
  const signature = historySignature(metrics);

  return missionHistoryObservationSchema.parse({
    schemaVersion: 1,
    id: `${context.pgid}:${timestamp}:${signature}`,
    provider: "peoplegroups-org",
    peid: record.peid,
    pgid: context.pgid,
    countryIso3: context.country.iso3,
    peopleName: record.displayName,
    sourceUpdatedAt: context.sourceUpdatedAt,
    latestSourceUpdatedAt: context.sourceUpdatedAt,
    firstObservedAt: timestamp,
    lastObservedAt: timestamp,
    signature,
    metrics,
  });
}

function sortTimeline(a: MissionHistoryObservation, b: MissionHistoryObservation): number {
  const observedDifference = Date.parse(b.firstObservedAt) - Date.parse(a.firstObservedAt);
  if (observedDifference !== 0) return observedDifference;
  const aSource = a.sourceUpdatedAt ? Date.parse(a.sourceUpdatedAt) : 0;
  const bSource = b.sourceUpdatedAt ? Date.parse(b.sourceUpdatedAt) : 0;
  return bSource - aSource;
}

/**
 * Store only transitions between tracked source states. Consecutive repeated
 * visits update last-seen metadata instead of manufacturing extra timeline
 * points, while a later return to an earlier signature remains a real event.
 */
export function mergeMissionHistoryObservations(
  existing: readonly MissionHistoryObservation[],
  incoming: MissionHistoryObservation,
  limit = 24,
): MissionHistoryObservation[] {
  const nextIncoming = missionHistoryObservationSchema.parse(incoming);
  if (!Number.isInteger(limit) || limit < 1) throw new Error("Mission history limit must be a positive integer.");

  const compatible = existing
    .map((item) => missionHistoryObservationSchema.parse(item))
    .filter((item) => item.provider === nextIncoming.provider && item.pgid === nextIncoming.pgid)
    .sort(sortTimeline);

  const latest = compatible[0] ?? null;
  if (latest?.signature === nextIncoming.signature) {
    const mergedLatest = missionHistoryObservationSchema.parse({
      ...latest,
      sourceUpdatedAt: latest.sourceUpdatedAt ?? nextIncoming.sourceUpdatedAt,
      latestSourceUpdatedAt: laterTimestamp(latest.latestSourceUpdatedAt, nextIncoming.latestSourceUpdatedAt),
      firstObservedAt: Date.parse(latest.firstObservedAt) <= Date.parse(nextIncoming.firstObservedAt)
        ? latest.firstObservedAt
        : nextIncoming.firstObservedAt,
      lastObservedAt: Date.parse(latest.lastObservedAt) >= Date.parse(nextIncoming.lastObservedAt)
        ? latest.lastObservedAt
        : nextIncoming.lastObservedAt,
    });

    return [
      mergedLatest,
      ...compatible.slice(1),
    ].sort(sortTimeline).slice(0, limit);
  }

  return [
    nextIncoming,
    ...compatible,
  ].sort(sortTimeline).slice(0, limit);
}

export function compareMissionHistoryObservations(
  previous: MissionHistoryObservation,
  current: MissionHistoryObservation,
): MissionHistoryChange[] {
  const before = missionHistoryObservationSchema.parse(previous);
  const after = missionHistoryObservationSchema.parse(current);
  if (before.provider !== after.provider || before.pgid !== after.pgid) {
    throw new Error("Mission history comparisons require the same provider record identity.");
  }

  return TRACKED_FIELDS.flatMap((field) =>
    Object.is(before.metrics[field], after.metrics[field])
      ? []
      : [{ field, before: before.metrics[field], after: after.metrics[field] }],
  );
}

export function missionHistoryTimelineDate(observation: MissionHistoryObservation): string {
  const value = missionHistoryObservationSchema.parse(observation);
  return value.sourceUpdatedAt ?? value.firstObservedAt;
}
