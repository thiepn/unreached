import type { PrayerListEntry } from "./types";

export interface PrayerRotationOptions {
  eligibleSourcePeopleIds?: ReadonlySet<number>;
  excludeSourcePeopleId?: number;
}

function compareStableIdentity(a: PrayerListEntry, b: PrayerListEntry): number {
  return a.name.localeCompare(b.name, "en") || a.sourcePeopleId - b.sourcePeopleId;
}

/**
 * Returns a non-mutating, non-competitive prayer return order.
 *
 * Entries without any recorded prayer date come first, oldest-added first.
 * Entries with a recorded prayer date then follow, least-recently recorded first.
 * The order is only a continuity aid. It is not a mission-priority, urgency,
 * importance, faithfulness, or spiritual-performance ranking.
 */
export function orderPrayerRotation(entries: readonly PrayerListEntry[]): PrayerListEntry[] {
  return [...entries].sort((a, b) => {
    const aNever = a.lastPrayedAt === null;
    const bNever = b.lastPrayedAt === null;
    if (aNever !== bNever) return aNever ? -1 : 1;

    if (aNever && bNever) {
      const addedDifference = Date.parse(a.addedAt) - Date.parse(b.addedAt);
      return addedDifference || compareStableIdentity(a, b);
    }

    const prayedDifference = Date.parse(a.lastPrayedAt!) - Date.parse(b.lastPrayedAt!);
    if (prayedDifference) return prayedDifference;

    const addedDifference = Date.parse(a.addedAt) - Date.parse(b.addedAt);
    return addedDifference || compareStableIdentity(a, b);
  });
}

export function selectNextPrayerRotationEntry(
  entries: readonly PrayerListEntry[],
  options: PrayerRotationOptions = {},
): PrayerListEntry | null {
  const { eligibleSourcePeopleIds, excludeSourcePeopleId } = options;
  return orderPrayerRotation(entries).find((entry) => {
    if (excludeSourcePeopleId !== undefined && entry.sourcePeopleId === excludeSourcePeopleId) return false;
    if (eligibleSourcePeopleIds && !eligibleSourcePeopleIds.has(entry.sourcePeopleId)) return false;
    return true;
  }) ?? null;
}

export function prayerRotationReturnLabel(entry: PrayerListEntry): string {
  if (!entry.lastPrayedAt) return "No prayer date recorded yet";
  return `Last recorded ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(entry.lastPrayedAt))}`;
}
