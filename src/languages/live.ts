import { useMemo } from "preact/hooks";

import { usePeopleGroupsRuntimeStore, type RuntimePeopleContext } from "../providers/peoplegroups";

export interface LiveLanguageBreakdownItem {
  label: string;
  contextCount: number;
}

export interface LiveLanguageCountrySummary {
  iso3: string;
  name: string;
  contextCount: number;
  unreachedContextCount: number;
  knownPopulation: number;
}

export interface LiveLanguagePeopleSummary {
  peid: number;
  name: string;
  contextCount: number;
  unreachedContextCount: number;
  otherContextCount: number;
  unknownContextCount: number;
  knownPopulation: number;
  countryNames: string[];
}

export interface LiveLanguageRecord {
  id: string;
  iso6393: string;
  name: string;
  familyName: string | null;
  contextCount: number;
  peopleEntityCount: number;
  countryCount: number;
  knownPopulation: number;
  populationKnownContextCount: number;
  populationCoverageComplete: boolean;
  unreachedContextCount: number;
  otherContextCount: number;
  unknownContextCount: number;
  bible: {
    knownContextCount: number;
    breakdown: LiveLanguageBreakdownItem[];
  };
  jesusFilm: {
    knownContextCount: number;
    breakdown: LiveLanguageBreakdownItem[];
  };
  resources: {
    knownContextCount: number;
    values: LiveLanguageBreakdownItem[];
  };
  countries: LiveLanguageCountrySummary[];
  peoples: LiveLanguagePeopleSummary[];
  sourceUpdatedAt: string | null;
  denominator: "PeopleGroups.org PGID country-context records reporting this ISO 639-3 language";
}

export type LiveLanguageReachFilter = "all" | "has-unreached" | "no-unreached" | "unknown-only";
export type LiveLanguageSort = "name" | "people-count-desc" | "represented-population-desc" | "unreached-contexts-desc";

export interface LiveLanguageFilterState {
  query: string;
  reach: LiveLanguageReachFilter;
  bible: string;
  sort: LiveLanguageSort;
}

function mode(values: Array<string | null>): string | null {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null;
}

function latestTimestamp(values: Array<string | null>): string | null {
  const valid = values.filter((value): value is string => Boolean(value) && !Number.isNaN(Date.parse(value!)));
  return valid.sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;
}

function breakdown(values: Array<string | null>): LiveLanguageBreakdownItem[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, contextCount]) => ({ label, contextCount }))
    .sort((a, b) => b.contextCount - a.contextCount || a.label.localeCompare(b.label));
}

function resourceBreakdown(contexts: RuntimePeopleContext[]): LiveLanguageBreakdownItem[] {
  const counts = new Map<number, number>();
  for (const context of contexts) {
    const value = context.resources.totalReported;
    if (value === null) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, contextCount]) => ({ label: String(value), contextCount }))
    .sort((a, b) => Number(a.label) - Number(b.label));
}

function countrySummaries(contexts: RuntimePeopleContext[]): LiveLanguageCountrySummary[] {
  const groups = new Map<string, RuntimePeopleContext[]>();
  for (const context of contexts) {
    const existing = groups.get(context.country.iso3) ?? [];
    existing.push(context);
    groups.set(context.country.iso3, existing);
  }
  return [...groups.entries()].map(([iso3, items]) => ({
    iso3,
    name: mode(items.map((item) => item.country.name)) ?? iso3,
    contextCount: items.length,
    unreachedContextCount: items.filter((item) => item.reach.classification === "unreached").length,
    knownPopulation: items.reduce((sum, item) => sum + (item.population.value ?? 0), 0),
  })).sort((a, b) => b.contextCount - a.contextCount || a.name.localeCompare(b.name));
}

function peopleSummaries(contexts: RuntimePeopleContext[]): LiveLanguagePeopleSummary[] {
  const groups = new Map<number, RuntimePeopleContext[]>();
  for (const context of contexts) {
    const existing = groups.get(context.peid) ?? [];
    existing.push(context);
    groups.set(context.peid, existing);
  }
  return [...groups.entries()].map(([peid, items]) => ({
    peid,
    name: mode(items.map((item) => item.displayName)) ?? `PEID ${peid}`,
    contextCount: items.length,
    unreachedContextCount: items.filter((item) => item.reach.classification === "unreached").length,
    otherContextCount: items.filter((item) => item.reach.classification === "other").length,
    unknownContextCount: items.filter((item) => item.reach.classification === "unknown").length,
    knownPopulation: items.reduce((sum, item) => sum + (item.population.value ?? 0), 0),
    countryNames: [...new Set(items.map((item) => item.country.name))].sort(),
  })).sort((a, b) => b.knownPopulation - a.knownPopulation || a.name.localeCompare(b.name));
}

export function buildLiveLanguageRecords(contexts: RuntimePeopleContext[]): LiveLanguageRecord[] {
  const groups = new Map<string, RuntimePeopleContext[]>();
  for (const context of contexts) {
    const iso = context.language.iso6393;
    if (!iso) continue;
    const existing = groups.get(iso) ?? [];
    existing.push(context);
    groups.set(iso, existing);
  }

  return [...groups.entries()].map(([iso6393, items]) => {
    const populationKnownContextCount = items.filter((item) => item.population.value !== null).length;
    const bibleValues = items.map((item) => item.resources.bibleAvailability);
    const jesusValues = items.map((item) => item.resources.jesusFilmAvailability);
    const familyName = mode(items.map((item) => item.language.family));
    const peoples = peopleSummaries(items);
    return {
      id: `language:peoplegroups:${iso6393}`,
      iso6393,
      name: mode(items.map((item) => item.language.name)) ?? iso6393,
      familyName,
      contextCount: items.length,
      peopleEntityCount: peoples.length,
      countryCount: new Set(items.map((item) => item.country.iso3)).size,
      knownPopulation: items.reduce((sum, item) => sum + (item.population.value ?? 0), 0),
      populationKnownContextCount,
      populationCoverageComplete: populationKnownContextCount === items.length,
      unreachedContextCount: items.filter((item) => item.reach.classification === "unreached").length,
      otherContextCount: items.filter((item) => item.reach.classification === "other").length,
      unknownContextCount: items.filter((item) => item.reach.classification === "unknown").length,
      bible: { knownContextCount: bibleValues.filter(Boolean).length, breakdown: breakdown(bibleValues) },
      jesusFilm: { knownContextCount: jesusValues.filter(Boolean).length, breakdown: breakdown(jesusValues) },
      resources: {
        knownContextCount: items.filter((item) => item.resources.totalReported !== null).length,
        values: resourceBreakdown(items),
      },
      countries: countrySummaries(items),
      peoples,
      sourceUpdatedAt: latestTimestamp(items.map((item) => item.sourceUpdatedAt)),
      denominator: "PeopleGroups.org PGID country-context records reporting this ISO 639-3 language" as const,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

export function filterLiveLanguages(records: LiveLanguageRecord[], state: LiveLanguageFilterState): LiveLanguageRecord[] {
  const query = state.query.trim().toLocaleLowerCase("en");
  return records.filter((record) => {
    if (state.reach === "has-unreached" && record.unreachedContextCount === 0) return false;
    if (state.reach === "no-unreached" && record.unreachedContextCount > 0) return false;
    if (state.reach === "unknown-only" && record.unknownContextCount !== record.contextCount) return false;
    if (state.bible !== "all" && !record.bible.breakdown.some((item) => item.label === state.bible)) return false;
    if (!query) return true;
    const haystack = [
      record.name,
      record.iso6393,
      record.familyName,
      ...record.countries.map((country) => country.name),
      ...record.peoples.map((people) => people.name),
      ...record.bible.breakdown.map((item) => item.label),
      ...record.jesusFilm.breakdown.map((item) => item.label),
    ].filter(Boolean).join(" ").toLocaleLowerCase("en");
    return haystack.includes(query);
  }).sort((a, b) => {
    if (state.sort === "people-count-desc") return b.peopleEntityCount - a.peopleEntityCount || a.name.localeCompare(b.name);
    if (state.sort === "represented-population-desc") return b.knownPopulation - a.knownPopulation || a.name.localeCompare(b.name);
    if (state.sort === "unreached-contexts-desc") return b.unreachedContextCount - a.unreachedContextCount || a.name.localeCompare(b.name);
    return a.name.localeCompare(b.name);
  });
}

export function rawResourceSummary(items: LiveLanguageBreakdownItem[], knownContextCount: number, totalContextCount: number): string {
  if (!knownContextCount) return "Unknown";
  const primary = items[0];
  if (!primary) return "Unknown";
  if (items.length === 1 && knownContextCount === totalContextCount) return primary.label;
  return `${primary.label} · ${knownContextCount}/${totalContextCount} contexts reported`;
}

export function useLiveLanguageExplorer(enabled = true) {
  const runtime = usePeopleGroupsRuntimeStore(enabled);
  const languages = useMemo(() => buildLiveLanguageRecords(runtime.contexts), [runtime.contexts]);
  const languagesByIso = useMemo(() => new Map(languages.map((language) => [language.iso6393, language])), [languages]);
  const bibleLabels = useMemo(() => [...new Set(languages.flatMap((language) => language.bible.breakdown.map((item) => item.label)))].sort(), [languages]);
  return { ...runtime, languages, languagesByIso, bibleLabels };
}
