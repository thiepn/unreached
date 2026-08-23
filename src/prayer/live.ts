import { useMemo } from "preact/hooks";

import { entityResourceBreakdown, type RuntimePeopleEntity } from "../providers/peoplegroups";
import { useLivePeopleExplorer } from "../peoples/live";
import type { PrayerCategory, ScriptureReference } from "./types";

export const LIVE_PRAYER_TEMPLATE_VERSION = "u12c-v1";

export const LIVE_PRAYER_TEMPLATE_REVIEW = {
  version: LIVE_PRAYER_TEMPLATE_VERSION,
  reviewedAt: "2026-08-22",
  status: "release-certified-template",
  scope: "Fixed biblical prayer wording with only source-backed people, country, GSEC, and resource fields interpolated at runtime.",
} as const;

export interface LivePrayerPrompt {
  id: string;
  category: PrayerCategory;
  text: string;
  scriptureReferences: ScriptureReference[];
  sourceGrounding: string | null;
}

export interface LivePrayerProfile {
  sourcePeopleId: number;
  peopleName: string;
  countryIso3s: string[];
  countryNames: string[];
  whyPray: string;
  prompts: LivePrayerPrompt[];
  sourceUpdatedAt: string | null;
  templateVersion: string;
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function scripture(reference: string, purpose: string): ScriptureReference {
  return { reference, purpose };
}

export function isLivePrayerEligible(entity: RuntimePeopleEntity): boolean {
  return entity.reach.unreachedContexts === 1;
}

export function buildLivePrayerProfile(entity: RuntimePeopleEntity): LivePrayerProfile {
  const context = entity.contexts[0]!;
  const countryNames = [context.country.name];
  const countryIso3s = [context.country.iso3];
  const resources = entityResourceBreakdown(entity);
  const bibleLabel = resources.bible[0]?.status ?? null;
  const gsecPhrase = context.reach.gsec.code === null ? "GSEC is not reported" : `GSEC ${context.reach.gsec.code}`;
  const biblePhrase = bibleLabel && bibleLabel !== "Unknown"
    ? `PeopleGroups.org reports the Bible availability label “${bibleLabel}” for ${context.pgid}.`
    : `PeopleGroups.org does not report a known Bible availability label for ${context.pgid}.`;

  const whyPray = `PeopleGroups.org currently records ${entity.displayName} of ${context.country.name} (${context.pgid}, PEID ${entity.peid}) at GSEC 0–3. ${gsecPhrase}. Use this one people-group-in-country source record as a starting point for informed prayer, not as a statement about every individual or about same-named communities in other countries.`;

  const prompts: LivePrayerPrompt[] = [
    {
      id: `live-prayer:${entity.peid}:gospel`,
      category: "gospel",
      text: `Pray that the good news of Jesus Christ would be communicated clearly and faithfully among ${entity.displayName} communities in ${context.country.name}, and that people would have meaningful opportunities to hear and respond to the gospel.`,
      scriptureReferences: [scripture("Romans 10:14–15", "Pray for people to hear the gospel through faithful messengers.")],
      sourceGrounding: `${context.pgid} is currently a GSEC 0–3 PeopleGroups.org record.`,
    },
    {
      id: `live-prayer:${entity.peid}:believers`,
      category: "believers",
      text: `Pray for followers of Jesus among ${entity.displayName} in ${context.country.name}, wherever they are present, to grow in faith, holiness, courage, love, and perseverance.`,
      scriptureReferences: [scripture("Colossians 1:9–12", "Pray for spiritual wisdom, fruitful lives, strength, and endurance.")],
      sourceGrounding: null,
    },
    {
      id: `live-prayer:${entity.peid}:church`,
      category: "church",
      text: `Pray for healthy local churches to be established and strengthened among ${entity.displayName} in ${context.country.name}, led by mature local believers and able to make disciples in culturally faithful ways.`,
      scriptureReferences: [scripture("Acts 14:21–23", "Pray for disciples, strengthened churches, and faithful local leadership.")],
      sourceGrounding: null,
    },
    {
      id: `live-prayer:${entity.peid}:scripture`,
      category: "scripture",
      text: `Pray that ${entity.displayName} communities would have understandable, usable access to Scripture and would encounter God’s word in the languages they understand best.`,
      scriptureReferences: [scripture("2 Timothy 3:15–17", "Pray for Scripture to lead people to Christ and equip believers for faithful living.")],
      sourceGrounding: biblePhrase,
    },
    {
      id: `live-prayer:${entity.peid}:workers`,
      category: "workers",
      text: `Ask the Lord to raise up and sustain faithful workers for ${entity.displayName} communities in ${context.country.name}, including local believers and cross-cultural servants who will make disciples with humility and endurance.`,
      scriptureReferences: [scripture("Matthew 9:37–38", "Pray for the Lord of the harvest to send workers.")],
      sourceGrounding: null,
    },
    {
      id: `live-prayer:${entity.peid}:community`,
      category: "community",
      text: `Pray for the families and communities represented by the ${entity.displayName} source record in ${context.country.name}: for peace, justice, human flourishing, and open relationships in which Christian witness can be heard without coercion.`,
      scriptureReferences: [scripture("Jeremiah 29:7", "Pray for the welfare and peace of the communities where people live.")],
      sourceGrounding: `${context.country.name} comes directly from PeopleGroups.org record ${context.pgid}; this prayer profile does not merge same-named records from other countries.`,
    },
    {
      id: `live-prayer:${entity.peid}:authorities`,
      category: "authorities",
      text: `Pray for authorities affecting ${entity.displayName} communities in ${context.country.name}, that people may live in peace and dignity and that Christians may practice and share their faith with wisdom and integrity.`,
      scriptureReferences: [scripture("1 Timothy 2:1–4", "Pray for rulers and authorities so people may live peaceful and godly lives.")],
      sourceGrounding: null,
    },
  ];

  return {
    sourcePeopleId: entity.routeKey,
    peopleName: entity.displayName,
    countryIso3s,
    countryNames,
    whyPray,
    prompts,
    sourceUpdatedAt: entity.sourceUpdatedAt,
    templateVersion: LIVE_PRAYER_TEMPLATE_VERSION,
  };
}

export function selectDailyLivePrayerEntity(entities: RuntimePeopleEntity[], dateKey: string, countryIso3?: string | null): RuntimePeopleEntity | null {
  const eligible = entities
    .filter(isLivePrayerEligible)
    .filter((entity) => !countryIso3 || entity.contexts[0]?.country.iso3 === countryIso3)
    .sort((a, b) => a.peid - b.peid);
  if (!eligible.length) return null;
  return eligible[stableHash(`${dateKey}:${countryIso3 ?? "WORLD"}`) % eligible.length] ?? null;
}

export function livePrayerFlow(profile: LivePrayerProfile, minutes: 2 | 5 | 10): LivePrayerPrompt[] {
  const limit = minutes === 2 ? 3 : minutes === 5 ? 5 : 7;
  return profile.prompts.slice(0, limit);
}

export function useLivePrayerExperience(enabled = true) {
  const people = useLivePeopleExplorer(enabled);
  const eligible = useMemo(() => people.peoples.filter(isLivePrayerEligible), [people.peoples]);
  return { ...people, eligible };
}
