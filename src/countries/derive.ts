import { RELIGION_NAMES, type NormalizedDataset, type PeopleGroupInCountry, type ScriptureResources } from "../domain";
import { buildCountryMissionSummaries } from "../visualization/aggregate";
import { countryExplorerDatasetSchema, type CountryExplorerDataset, type CountryExplorerRecord } from "./types";

function knownPopulation(record: PeopleGroupInCountry): number | null {
  const value = record.population.value;
  return value !== null && value >= 0 ? value : null;
}

function sumKnown(records: PeopleGroupInCountry[]): number | null {
  const values = records.map(knownPopulation).filter((value): value is number => value !== null);
  return values.length ? values.reduce((sum, value) => sum + value, 0) : null;
}

function ratio(numerator: number | null, denominator: number | null): number | null {
  if (numerator === null || denominator === null || denominator <= 0) return null;
  return Math.max(0, Math.min(100, (numerator / denominator) * 100));
}

function uniqueSources(records: PeopleGroupInCountry[], countrySources: string[]): string[] {
  return [...new Set([...countrySources, ...records.flatMap((record) => record.provenance.map((item) => item.sourceId))])].sort();
}

function languageSummaries(records: PeopleGroupInCountry[], dataset: NormalizedDataset) {
  const grouped = new Map<string, PeopleGroupInCountry[]>();
  for (const record of records) {
    if (!record.primaryLanguageId) continue;
    grouped.set(record.primaryLanguageId, [...(grouped.get(record.primaryLanguageId) ?? []), record]);
  }
  return [...grouped.entries()].map(([languageId, rows]) => ({
    languageId,
    name: dataset.languages.find((language) => language.id === languageId)?.name ?? languageId.replace("language:", "").toUpperCase(),
    peopleGroupCount: rows.length,
    knownPopulation: sumKnown(rows),
  })).sort((a, b) => (b.knownPopulation ?? -1) - (a.knownPopulation ?? -1) || a.name.localeCompare(b.name, "en"));
}

function religionSummaries(records: PeopleGroupInCountry[], dataset: NormalizedDataset) {
  const grouped = new Map<string, PeopleGroupInCountry[]>();
  for (const record of records) {
    if (!record.primaryReligionId) continue;
    grouped.set(record.primaryReligionId, [...(grouped.get(record.primaryReligionId) ?? []), record]);
  }
  const representedPopulation = sumKnown(records);
  return [...grouped.entries()].map(([religionId, rows]) => {
    const known = sumKnown(rows);
    const code = Number(religionId.split(":")[1]);
    return {
      religionId,
      name: dataset.religions.find((religion) => religion.id === religionId)?.name ?? RELIGION_NAMES[code] ?? "Unknown",
      peopleGroupCount: rows.length,
      knownPopulation: known,
      representedShare: ratio(known, representedPopulation),
    };
  }).sort((a, b) => (b.knownPopulation ?? -1) - (a.knownPopulation ?? -1) || a.name.localeCompare(b.name, "en"));
}

const SCRIPTURE_ORDER: ScriptureResources["bibleStatus"][] = [
  "translation-needed",
  "translation-started",
  "portions",
  "new-testament",
  "complete-bible",
  "unknown",
];

function scriptureSummaries(records: PeopleGroupInCountry[]) {
  return SCRIPTURE_ORDER.map((status) => {
    const rows = records.filter((record) => record.scripture.bibleStatus === status);
    return {
      status,
      peopleGroupCount: rows.length,
      knownPopulation: sumKnown(rows),
    };
  }).filter((item) => item.peopleGroupCount > 0);
}

export function buildCountryExplorerDataset(dataset: NormalizedDataset, generatedAt = new Date().toISOString()): CountryExplorerDataset {
  const missionByCountry = new Map(buildCountryMissionSummaries(dataset).map((summary) => [summary.countryId, summary]));

  const countries: CountryExplorerRecord[] = dataset.countries.map((country) => {
    const records = dataset.peopleGroupsInCountries.filter((record) => record.countryId === country.id);
    const mission = missionByCountry.get(country.id);
    if (!mission) throw new Error(`No mission summary generated for ${country.id}.`);
    const regionName = country.regionId ? dataset.regions.find((region) => region.id === country.regionId)?.name ?? null : null;

    const peopleGroups = records.map((record) => {
      const language = record.primaryLanguageId ? dataset.languages.find((item) => item.id === record.primaryLanguageId) : undefined;
      const religion = record.primaryReligionId ? dataset.religions.find((item) => item.id === record.primaryReligionId) : undefined;
      const religionCode = record.primaryReligionId ? Number(record.primaryReligionId.split(":")[1]) : null;
      return {
        id: record.id,
        peopleGroupId: record.peopleGroupId,
        name: record.name,
        population: record.population.value,
        populationQuality: record.population.quality,
        classification: record.mission.classification,
        frontier: record.mission.frontier,
        christianPercent: record.mission.percentChristian.value,
        evangelicalPercent: record.mission.percentEvangelical.value,
        primaryLanguageId: record.primaryLanguageId,
        primaryLanguageName: language?.name ?? null,
        primaryReligionId: record.primaryReligionId,
        primaryReligionName: religion?.name ?? (religionCode !== null ? RELIGION_NAMES[religionCode] ?? null : null),
        scriptureStatus: record.scripture.bibleStatus,
      };
    }).sort((a, b) => (b.population ?? -1) - (a.population ?? -1) || a.name.localeCompare(b.name, "en"));

    const countrySources = country.provenance.map((item) => item.sourceId);
    return {
      countryId: country.id,
      iso3: country.iso3,
      name: country.name,
      regionName,
      population: country.population,
      mission,
      peopleGroups,
      languages: languageSummaries(records, dataset),
      religions: religionSummaries(records, dataset),
      scripture: scriptureSummaries(records),
      sourceIds: uniqueSources(records, countrySources),
    };
  }).sort((a, b) => a.name.localeCompare(b.name, "en"));

  return countryExplorerDatasetSchema.parse({
    schemaVersion: 1,
    methodologyVersion: 1,
    fixture: dataset.fixture,
    generatedAt,
    sourceIds: [...new Set(countries.flatMap((country) => country.sourceIds))].sort(),
    countries,
  });
}
