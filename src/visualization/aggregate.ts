import { RELIGION_NAMES, type NormalizedDataset, type PeopleGroupInCountry, type ScriptureResources } from "../domain";
import { missionVisualizationDatasetSchema, type CountryMissionSummary, type MissionVisualizationDataset } from "./types";

const SCRIPTURE_RANK: Record<ScriptureResources["bibleStatus"], number> = {
  unknown: 0,
  "translation-needed": 1,
  "translation-started": 2,
  portions: 3,
  "new-testament": 4,
  "complete-bible": 5,
};

function population(record: PeopleGroupInCountry): number | null {
  const value = record.population.value;
  return value !== null && value > 0 ? value : null;
}

function ratio(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.min(100, Math.max(0, (numerator / denominator) * 100));
}

function sumPopulation(records: PeopleGroupInCountry[], predicate: (record: PeopleGroupInCountry) => boolean): number {
  return records.reduce((sum, record) => {
    const value = population(record);
    return value !== null && predicate(record) ? sum + value : sum;
  }, 0);
}

function weightedEvangelical(records: PeopleGroupInCountry[]): { value: number | null; coveredPopulation: number } {
  let weighted = 0;
  let coveredPopulation = 0;
  for (const record of records) {
    const weight = population(record);
    const percent = record.mission.percentEvangelical.value;
    if (weight === null || percent === null) continue;
    weighted += percent * weight;
    coveredPopulation += weight;
  }
  return { value: coveredPopulation > 0 ? weighted / coveredPopulation : null, coveredPopulation };
}

function dominantReligion(records: PeopleGroupInCountry[], dataset: NormalizedDataset): { id: string | null; name: string | null; coveredPopulation: number } {
  const totals = new Map<string, number>();
  let coveredPopulation = 0;
  for (const record of records) {
    const weight = population(record);
    if (weight === null || record.primaryReligionId === null) continue;
    totals.set(record.primaryReligionId, (totals.get(record.primaryReligionId) ?? 0) + weight);
    coveredPopulation += weight;
  }
  const winner = [...totals.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  if (!winner) return { id: null, name: null, coveredPopulation };
  const id = winner[0];
  const entity = dataset.religions.find((religion) => religion.id === id);
  const code = Number(id.split(":")[1]);
  return { id, name: entity?.name ?? RELIGION_NAMES[code] ?? "Other / unknown", coveredPopulation };
}

function weightedMedianScripture(records: PeopleGroupInCountry[]): { status: ScriptureResources["bibleStatus"]; coveredPopulation: number } {
  const entries = records.flatMap((record) => {
    const weight = population(record);
    const status = record.scripture.bibleStatus;
    return weight !== null && status !== "unknown" ? [{ status, weight, rank: SCRIPTURE_RANK[status] }] : [];
  });
  const coveredPopulation = entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (coveredPopulation <= 0) return { status: "unknown", coveredPopulation: 0 };
  entries.sort((a, b) => a.rank - b.rank);
  const midpoint = coveredPopulation / 2;
  let cumulative = 0;
  for (const entry of entries) {
    cumulative += entry.weight;
    if (cumulative >= midpoint) return { status: entry.status, coveredPopulation };
  }
  return { status: entries.at(-1)?.status ?? "unknown", coveredPopulation };
}

function sourceIds(records: PeopleGroupInCountry[]): string[] {
  return [...new Set(records.flatMap((record) => record.provenance.map((item) => item.sourceId)))].sort();
}

export function buildCountryMissionSummaries(dataset: NormalizedDataset): CountryMissionSummary[] {
  return dataset.countries.map((country) => {
    const records = dataset.peopleGroupsInCountries.filter((record) => record.countryId === country.id);
    const totalKnownPopulation = sumPopulation(records, () => true);
    const classifiedPopulation = sumPopulation(records, (record) => record.mission.classification !== "unknown");
    const unreachedPopulation = sumPopulation(records, (record) => record.mission.classification === "unreached");
    const frontierKnownPopulation = sumPopulation(records, (record) => record.mission.frontier !== null);
    const frontierPopulation = sumPopulation(records, (record) => record.mission.frontier === true);
    const evangelical = weightedEvangelical(records);
    const religion = dominantReligion(records, dataset);
    const scripture = weightedMedianScripture(records);
    const countrySources = sourceIds(records);

    return {
      countryId: country.id,
      iso3: country.iso3,
      peopleGroupCount: records.length,
      unreachedGroupCount: records.filter((record) => record.mission.classification === "unreached").length,
      frontierGroupCount: records.filter((record) => record.mission.frontier === true).length,
      knownPopulation: totalKnownPopulation > 0 ? totalKnownPopulation : null,
      classifiedPopulation: classifiedPopulation > 0 ? classifiedPopulation : null,
      unreachedPopulation: classifiedPopulation > 0 ? unreachedPopulation : null,
      unreachedShare: ratio(unreachedPopulation, classifiedPopulation),
      frontierKnownPopulation: frontierKnownPopulation > 0 ? frontierKnownPopulation : null,
      frontierPopulation: frontierKnownPopulation > 0 ? frontierPopulation : null,
      frontierShare: ratio(frontierPopulation, frontierKnownPopulation),
      evangelicalPercent: evangelical.value,
      primaryReligionId: religion.id,
      primaryReligionName: religion.name,
      scriptureStatus: scripture.status,
      coverage: {
        classification: ratio(classifiedPopulation, totalKnownPopulation),
        frontier: ratio(frontierKnownPopulation, totalKnownPopulation),
        evangelical: ratio(evangelical.coveredPopulation, totalKnownPopulation),
        religion: ratio(religion.coveredPopulation, totalKnownPopulation),
        scripture: ratio(scripture.coveredPopulation, totalKnownPopulation),
      },
      sourceIds: countrySources,
      methodologyVersion: 1,
    };
  });
}

export function buildMissionVisualizationDataset(dataset: NormalizedDataset, generatedAt = new Date().toISOString()): MissionVisualizationDataset {
  const countries = buildCountryMissionSummaries(dataset).sort((a, b) => a.iso3.localeCompare(b.iso3));
  const sourceIds = [...new Set(countries.flatMap((country) => country.sourceIds))].sort();
  return missionVisualizationDatasetSchema.parse({
    schemaVersion: 1,
    methodologyVersion: 1,
    fixture: dataset.fixture,
    generatedAt,
    sourceIds,
    countries,
  });
}
