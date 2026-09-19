import type {
  LiveLanguageBreakdownItem,
  LiveLanguageContextEvidence,
  LiveLanguageRecord,
} from "./live";

export type LanguageEvidenceCoverage = "none" | "partial" | "complete";
export type LanguageEvidenceConsistency = "unknown" | "uniform" | "mixed";

export interface LanguageEvidenceSummary {
  knownContextCount: number;
  totalContextCount: number;
  coverage: LanguageEvidenceCoverage;
  consistency: LanguageEvidenceConsistency;
  labels: LiveLanguageBreakdownItem[];
}

export interface LanguageResourceCombination {
  bibleAvailability: string | null;
  jesusFilmAvailability: string | null;
  totalResources: number | null;
  contextCount: number;
  countries: string[];
  peopleNames: string[];
}

export interface RelatedFamilyLanguage {
  iso6393: string;
  name: string;
  sharedFamilyLabels: string[];
  contextCount: number;
  countryCount: number;
  knownPopulation: number;
}

export interface CoRepresentedLanguage {
  iso6393: string;
  name: string;
  sharedCountries: Array<{ iso3: string; name: string }>;
  contextCountInSharedCountries: number;
  knownPopulationInSharedCountries: number;
}

function normalizedLabel(value: string): string {
  return value.trim().toLocaleLowerCase("en");
}

function coverage(known: number, total: number): LanguageEvidenceCoverage {
  if (known <= 0 || total <= 0) return "none";
  return known >= total ? "complete" : "partial";
}

function consistency(items: readonly LiveLanguageBreakdownItem[]): LanguageEvidenceConsistency {
  if (!items.length) return "unknown";
  return items.length === 1 ? "uniform" : "mixed";
}

export function summarizeLanguageEvidence(
  items: readonly LiveLanguageBreakdownItem[],
  knownContextCount: number,
  totalContextCount: number,
): LanguageEvidenceSummary {
  return {
    knownContextCount,
    totalContextCount,
    coverage: coverage(knownContextCount, totalContextCount),
    consistency: consistency(items),
    labels: [...items],
  };
}

export function languageResourceEvidence(record: LiveLanguageRecord) {
  return {
    bible: summarizeLanguageEvidence(record.bible.breakdown, record.bible.knownContextCount, record.contextCount),
    jesusFilm: summarizeLanguageEvidence(record.jesusFilm.breakdown, record.jesusFilm.knownContextCount, record.contextCount),
    totalResources: summarizeLanguageEvidence(record.resources.values, record.resources.knownContextCount, record.contextCount),
    family: summarizeLanguageEvidence(record.family.breakdown, record.family.knownContextCount, record.contextCount),
  };
}

function combinationKey(context: LiveLanguageContextEvidence): string {
  return JSON.stringify([
    context.bibleAvailability,
    context.jesusFilmAvailability,
    context.totalResources,
  ]);
}

export function languageResourceCombinations(record: LiveLanguageRecord): LanguageResourceCombination[] {
  const grouped = new Map<string, {
    bibleAvailability: string | null;
    jesusFilmAvailability: string | null;
    totalResources: number | null;
    contexts: LiveLanguageContextEvidence[];
  }>();

  for (const context of record.contexts) {
    const key = combinationKey(context);
    const current = grouped.get(key);
    if (current) {
      current.contexts.push(context);
      continue;
    }
    grouped.set(key, {
      bibleAvailability: context.bibleAvailability,
      jesusFilmAvailability: context.jesusFilmAvailability,
      totalResources: context.totalResources,
      contexts: [context],
    });
  }

  return [...grouped.values()].map((group) => ({
    bibleAvailability: group.bibleAvailability,
    jesusFilmAvailability: group.jesusFilmAvailability,
    totalResources: group.totalResources,
    contextCount: group.contexts.length,
    countries: [...new Set(group.contexts.map((item) => item.countryName))].sort(),
    peopleNames: [...new Set(group.contexts.map((item) => item.peopleName))].sort(),
  })).sort((a, b) =>
    b.contextCount - a.contextCount
    || (a.bibleAvailability ?? "").localeCompare(b.bibleAvailability ?? "")
    || (a.jesusFilmAvailability ?? "").localeCompare(b.jesusFilmAvailability ?? "")
  );
}

export function relatedFamilyLanguages(
  record: LiveLanguageRecord,
  languages: readonly LiveLanguageRecord[],
): RelatedFamilyLanguage[] {
  const familyLabels = new Map(record.family.breakdown.map((item) => [normalizedLabel(item.label), item.label]));
  if (!familyLabels.size) return [];

  return languages.flatMap((candidate) => {
    if (candidate.iso6393 === record.iso6393) return [];
    const shared = candidate.family.breakdown
      .map((item) => item.label)
      .filter((label) => familyLabels.has(normalizedLabel(label)));
    if (!shared.length) return [];

    return [{
      iso6393: candidate.iso6393,
      name: candidate.name,
      sharedFamilyLabels: [...new Set(shared)].sort(),
      contextCount: candidate.contextCount,
      countryCount: candidate.countryCount,
      knownPopulation: candidate.knownPopulation,
    }];
  }).sort((a, b) =>
    b.contextCount - a.contextCount
    || b.knownPopulation - a.knownPopulation
    || a.name.localeCompare(b.name)
  );
}

export function coRepresentedLanguages(
  record: LiveLanguageRecord,
  languages: readonly LiveLanguageRecord[],
): CoRepresentedLanguage[] {
  const currentCountries = new Map(record.countries.map((country) => [country.iso3, country.name]));
  if (!currentCountries.size) return [];

  return languages.flatMap((candidate) => {
    if (candidate.iso6393 === record.iso6393) return [];
    const sharedCountries = candidate.countries
      .filter((country) => currentCountries.has(country.iso3))
      .map((country) => ({ iso3: country.iso3, name: country.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    if (!sharedCountries.length) return [];

    const sharedIso = new Set(sharedCountries.map((country) => country.iso3));
    const candidateContexts = candidate.contexts.filter((context) => sharedIso.has(context.countryIso3));
    return [{
      iso6393: candidate.iso6393,
      name: candidate.name,
      sharedCountries,
      contextCountInSharedCountries: candidateContexts.length,
      knownPopulationInSharedCountries: candidateContexts.reduce((sum, item) => sum + (item.population ?? 0), 0),
    }];
  }).sort((a, b) =>
    b.sharedCountries.length - a.sharedCountries.length
    || b.contextCountInSharedCountries - a.contextCountInSharedCountries
    || a.name.localeCompare(b.name)
  );
}

export function languageEvidenceStateLabel(summary: LanguageEvidenceSummary): string {
  if (summary.coverage === "none") return "No reported source value";
  const coverageLabel = summary.coverage === "complete"
    ? `All ${summary.totalContextCount} contexts report a value`
    : `${summary.knownContextCount}/${summary.totalContextCount} contexts report a value`;
  if (summary.consistency === "uniform") return `${coverageLabel} · uniform reported label`;
  if (summary.consistency === "mixed") return `${coverageLabel} · mixed reported labels`;
  return coverageLabel;
}
