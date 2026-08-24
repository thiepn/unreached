import type { RuntimePeopleEntity } from "../providers/peoplegroups";
import type { PrayerPersonSnapshot } from "./model";

export function prayerSnapshotFromEntity(entity: RuntimePeopleEntity): PrayerPersonSnapshot {
  const context = entity.contexts[0];
  return {
    sourcePeopleId: entity.routeKey,
    peopleGroupId: entity.id,
    name: entity.displayName,
    countryName: context?.country.name ?? entity.countries[0]?.name ?? null,
    languageName: entity.primaryLanguage?.name ?? context?.language.name ?? null,
  };
}

export function isSameLocalDate(timestamp: string | null, now = new Date()): boolean {
  if (!timestamp) return false;
  const value = new Date(timestamp);
  if (Number.isNaN(value.getTime())) return false;
  return value.getFullYear() === now.getFullYear()
    && value.getMonth() === now.getMonth()
    && value.getDate() === now.getDate();
}
