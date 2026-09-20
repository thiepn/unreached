import { z } from "zod";

import { localeSchema, type Locale } from "../i18n";
import type { PrayerListEntry } from "../personalization/types";
import type { RuntimePeopleEntity } from "../providers/peoplegroups";

export const MAX_SHARED_PRAYER_PEOPLE = 12;
export const MAX_SHARED_PRAYER_TITLE_LENGTH = 80;

const safeTitleSchema = z.string()
  .trim()
  .min(1)
  .max(MAX_SHARED_PRAYER_TITLE_LENGTH)
  .refine((value) => !/[\u0000-\u001f\u007f]/.test(value), "Collection title contains control characters.");

export const sharedPrayerCollectionSchema = z.object({
  version: z.literal(1),
  title: safeTitleSchema,
  locale: localeSchema,
  peopleIds: z.array(z.number().int().positive()).min(1).max(MAX_SHARED_PRAYER_PEOPLE),
}).superRefine((value, ctx) => {
  if (new Set(value.peopleIds).size !== value.peopleIds.length) {
    ctx.addIssue({ code: "custom", path: ["peopleIds"], message: "Shared prayer people IDs must be unique." });
  }
});

export type SharedPrayerCollection = z.infer<typeof sharedPrayerCollectionSchema>;

export interface ResolvedSharedPrayerPerson {
  sourcePeopleId: number;
  entity: RuntimePeopleEntity;
}

export interface UnavailableSharedPrayerPerson {
  sourcePeopleId: number;
  reason: "missing" | "not-prayer-eligible";
}

export interface ResolvedSharedPrayerCollection {
  collection: SharedPrayerCollection;
  available: ResolvedSharedPrayerPerson[];
  unavailable: UnavailableSharedPrayerPerson[];
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid base64url payload.");
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function createSharedPrayerCollection(input: {
  prayerList: readonly PrayerListEntry[];
  selectedPeopleIds: readonly number[];
  title: string;
  locale: Locale;
}): SharedPrayerCollection {
  const allowed = new Set(input.prayerList.map((entry) => entry.sourcePeopleId));
  const peopleIds = [...new Set(input.selectedPeopleIds)]
    .filter((id) => allowed.has(id))
    .slice(0, MAX_SHARED_PRAYER_PEOPLE);
  return sharedPrayerCollectionSchema.parse({
    version: 1,
    title: input.title,
    locale: input.locale,
    peopleIds,
  });
}

export function encodeSharedPrayerCollection(collection: SharedPrayerCollection): string {
  const verified = sharedPrayerCollectionSchema.parse(collection);
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(verified)));
}

export function decodeSharedPrayerCollection(encoded: string | null | undefined): SharedPrayerCollection | null {
  if (!encoded || encoded.length > 4096) return null;
  try {
    const json = new TextDecoder().decode(base64UrlToBytes(encoded));
    return sharedPrayerCollectionSchema.parse(JSON.parse(json) as unknown);
  } catch {
    return null;
  }
}

export function sharedPrayerCollectionHash(collection: SharedPrayerCollection): string {
  return `#/share/prayer?c=${encodeURIComponent(encodeSharedPrayerCollection(collection))}`;
}

export function absoluteSharedPrayerCollectionUrl(collection: SharedPrayerCollection, location: Pick<Location, "origin" | "pathname">): string {
  return `${location.origin}${location.pathname}${sharedPrayerCollectionHash(collection)}`;
}

export function resolveSharedPrayerCollection(
  collection: SharedPrayerCollection,
  entitiesByPeid: ReadonlyMap<number, RuntimePeopleEntity>,
): ResolvedSharedPrayerCollection {
  const available: ResolvedSharedPrayerPerson[] = [];
  const unavailable: UnavailableSharedPrayerPerson[] = [];

  for (const sourcePeopleId of collection.peopleIds) {
    const entity = entitiesByPeid.get(sourcePeopleId);
    if (!entity) {
      unavailable.push({ sourcePeopleId, reason: "missing" });
      continue;
    }
    if (entity.reach.unreachedContexts !== 1) {
      unavailable.push({ sourcePeopleId, reason: "not-prayer-eligible" });
      continue;
    }
    available.push({ sourcePeopleId, entity });
  }

  return { collection, available, unavailable };
}
