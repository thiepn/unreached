import { orderPrayerRotation } from "./rotation";
import type { PrayerListEntry } from "./types";

export type PrayerSessionSize = 3 | 5 | "all";

export interface PrayerSessionPlanOptions {
  eligibleSourcePeopleIds?: ReadonlySet<number>;
  size?: PrayerSessionSize;
}

/**
 * Builds a frozen prayer-session plan from the current derived prayer rotation.
 *
 * The returned array is a detached snapshot. Recording prayer later may change
 * the underlying rotation for future visits, but it must not reorder the people
 * already selected for the current session.
 *
 * Session order is a continuity aid only. It is not urgency, mission priority,
 * spiritual performance, or a claim that prayer has been completed.
 */
export function buildPrayerSessionPlan(
  entries: readonly PrayerListEntry[],
  options: PrayerSessionPlanOptions = {},
): PrayerListEntry[] {
  const { eligibleSourcePeopleIds, size = 3 } = options;
  const eligible = orderPrayerRotation(entries).filter((entry) => !eligibleSourcePeopleIds || eligibleSourcePeopleIds.has(entry.sourcePeopleId));
  return size === "all" ? eligible : eligible.slice(0, size);
}

export function prayerSessionSizeFromValue(value: string | null | undefined): PrayerSessionSize {
  if (value === "5") return 5;
  if (value === "all") return "all";
  return 3;
}

export function prayerSessionSizeLabel(size: PrayerSessionSize): string {
  return size === "all" ? "Full eligible prayer list" : `${size}-person session`;
}
