export type SearchDomain = "people" | "country" | "language";

export interface SearchPeopleInput {
  sourcePeopleId: number;
  name: string;
  primaryLanguageName?: string | null;
  primaryReligionName?: string | null;
  largestCountryName?: string | null;
  cluster?: string | null;
  affinityBloc?: string | null;
}

export interface SearchCountryInput {
  iso3: string;
  name: string;
  regionName?: string | null;
}

export interface SearchLanguageInput {
  iso6393: string;
  name: string;
  familyName?: string | null;
  branchName?: string | null;
  countryNames?: string[];
  peopleNames?: string[];
}

export interface SearchDocument {
  id: string;
  domain: SearchDomain;
  label: string;
  secondary: string | null;
  href: string;
  searchText: string;
  normalizedLabel: string;
  compactLabel: string;
}

export interface SearchResult extends SearchDocument {
  score: number;
}

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function compact(values: Array<string | null | undefined>): string[] {
  return values.filter((value): value is string => Boolean(value?.trim()));
}

function document(domain: SearchDomain, id: string, label: string, secondary: string | null, href: string, aliases: string[]): SearchDocument {
  const normalizedLabel = normalize(label);
  return {
    id,
    domain,
    label,
    secondary,
    href,
    searchText: normalize([label, secondary ?? "", ...aliases].join(" ")),
    normalizedLabel,
    compactLabel: normalizedLabel.replaceAll(" ", ""),
  };
}

export function buildSearchDocuments(input: {
  peoples: SearchPeopleInput[];
  countries: SearchCountryInput[];
  languages: SearchLanguageInput[];
}): SearchDocument[] {
  const peopleDocs = input.peoples.map((people) => document(
    "people",
    `people:${people.sourcePeopleId}`,
    people.name,
    compact([people.largestCountryName, people.primaryLanguageName]).join(" · ") || null,
    `#/peoples/${people.sourcePeopleId}`,
    compact([String(people.sourcePeopleId), people.primaryLanguageName, people.primaryReligionName, people.largestCountryName, people.cluster, people.affinityBloc]),
  ));

  const countryDocs = input.countries
    .filter((country) => /^[A-Z]{3}$/.test(country.iso3))
    .map((country) => document("country", `country:${country.iso3}`, country.name, country.regionName ?? null, `#/countries/${country.iso3}`, [country.iso3]));

  const languageDocs = input.languages.map((language) => document(
    "language",
    `language:${language.iso6393}`,
    language.name,
    `${language.iso6393} · ISO 639-3`,
    `#/languages/${language.iso6393}`,
    compact([language.iso6393, language.familyName, language.branchName, ...(language.countryNames ?? []), ...(language.peopleNames ?? [])]),
  ));

  return [...peopleDocs, ...countryDocs, ...languageDocs];
}

function isSubsequence(query: string, value: string): boolean {
  if (!query || query.length > value.length) return false;
  let cursor = 0;
  for (const character of value) {
    if (character === query[cursor]) cursor += 1;
    if (cursor === query.length) return true;
  }
  return false;
}

function scoreDocument(doc: SearchDocument, normalizedQuery: string, compactQuery: string): number {
  const label = doc.normalizedLabel;
  if (label === normalizedQuery) return 1000;
  if (label.startsWith(normalizedQuery)) return 900 - Math.min(80, label.length - normalizedQuery.length);
  if (label.includes(normalizedQuery)) return 800 - Math.min(100, label.indexOf(normalizedQuery));

  const queryTokens = normalizedQuery.split(" ").filter(Boolean);
  if (queryTokens.length > 1 && queryTokens.every((token) => doc.searchText.includes(token))) return 720;
  if (doc.searchText.includes(normalizedQuery)) return 650;

  if (normalizedQuery.length >= 3 && isSubsequence(compactQuery, doc.compactLabel)) {
    return 560 - Math.min(120, Math.abs(label.length - normalizedQuery.length) * 4);
  }

  return -1;
}

function insertBest(best: SearchResult[], candidate: SearchResult, limit: number): void {
  const index = best.findIndex((existing) => candidate.score > existing.score
    || (candidate.score === existing.score && candidate.label.localeCompare(existing.label) < 0));
  if (index >= 0) best.splice(index, 0, candidate);
  else if (best.length < limit) best.push(candidate);
  if (best.length > limit) best.pop();
}

export function searchDocuments(documents: SearchDocument[], query: string, limit = 18): SearchResult[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery || limit <= 0) return [];
  const compactQuery = normalizedQuery.replaceAll(" ", "");
  const best: SearchResult[] = [];

  for (const doc of documents) {
    const score = scoreDocument(doc, normalizedQuery, compactQuery);
    if (score < 0) continue;
    insertBest(best, { ...doc, score }, limit);
  }

  return best;
}
