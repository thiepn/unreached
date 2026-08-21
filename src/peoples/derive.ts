import { RELIGION_NAMES, type NormalizedDataset, type PeopleGroup, type PeopleGroupInCountry, type ScriptureResources } from "../domain";
import { peopleExplorerDatasetSchema, type PeopleCountryContext, type PeopleExplorerDataset, type PeopleGroupProfile, type PeopleScriptureSummary, type RelatedPeople } from "./types";

function populationValue(value: number | null): number {
  return value ?? -1;
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort();
}

function contextFor(record: PeopleGroupInCountry, dataset: NormalizedDataset): PeopleCountryContext {
  const country = dataset.countries.find((item) => item.id === record.countryId);
  if (!country) throw new Error(`People context ${record.id} references missing country ${record.countryId}.`);
  const language = record.primaryLanguageId ? dataset.languages.find((item) => item.id === record.primaryLanguageId) : undefined;
  const religion = record.primaryReligionId ? dataset.religions.find((item) => item.id === record.primaryReligionId) : undefined;
  const religionCode = record.primaryReligionId ? Number(record.primaryReligionId.split(":")[1]) : null;
  const region = record.regionId ? dataset.regions.find((item) => item.id === record.regionId) : undefined;

  return {
    id: record.id,
    countryId: record.countryId,
    iso3: country.iso3,
    countryName: country.name,
    regionName: region?.name ?? null,
    nameInCountry: record.name,
    population: record.population,
    mission: record.mission,
    primaryLanguageId: record.primaryLanguageId,
    primaryLanguageName: language?.name ?? null,
    primaryReligionId: record.primaryReligionId,
    primaryReligionName: religion?.name ?? (religionCode !== null ? RELIGION_NAMES[religionCode] ?? null : null),
    locationText: record.locationText,
    hasCoordinates: record.coordinates !== null,
    scripture: record.scripture,
    sourceIds: uniqueStrings(record.provenance.map((item) => item.sourceId)),
  };
}

function scriptureFor(group: PeopleGroup, contexts: PeopleCountryContext[], dataset: NormalizedDataset): PeopleScriptureSummary {
  if (group.primaryLanguageId) {
    const language = dataset.languages.find((item) => item.id === group.primaryLanguageId);
    if (language) return { ...language.scripture, basis: "primary-language" };
  }

  const context = contexts.find((item) =>
    item.scripture.bibleStatus !== "unknown"
    || item.scripture.hasAudioRecordings !== null
    || item.scripture.hasJesusFilm !== null,
  );
  if (context) return { ...context.scripture, basis: "country-record" };

  return {
    basis: "unknown",
    bibleStatus: "unknown",
    portionsYear: null,
    newTestamentYear: null,
    bibleYear: null,
    hasAudioRecordings: null,
    hasJesusFilm: null,
  };
}

function relatedFor(group: PeopleGroup, dataset: NormalizedDataset): RelatedPeople[] {
  const cluster = group.cluster?.trim().toLocaleLowerCase("en") ?? null;
  const affinity = group.affinityBloc?.trim().toLocaleLowerCase("en") ?? null;

  return dataset.peopleGroups
    .filter((candidate) => candidate.id !== group.id)
    .flatMap((candidate): RelatedPeople[] => {
      const candidateCluster = candidate.cluster?.trim().toLocaleLowerCase("en") ?? null;
      const candidateAffinity = candidate.affinityBloc?.trim().toLocaleLowerCase("en") ?? null;
      const relationship = cluster && candidateCluster === cluster
        ? "same-cluster"
        : affinity && candidateAffinity === affinity
          ? "same-affinity-bloc"
          : null;
      if (!relationship) return [];
      return [{
        peopleGroupId: candidate.id,
        sourcePeopleId: candidate.sourcePeopleId,
        name: candidate.name,
        relationship,
        globalPopulation: candidate.globalPopulation,
        classification: candidate.mission.classification,
        frontier: candidate.mission.frontier,
      }];
    })
    .sort((a, b) => {
      const relationshipOrder = (value: RelatedPeople["relationship"]) => value === "same-cluster" ? 0 : 1;
      return relationshipOrder(a.relationship) - relationshipOrder(b.relationship)
        || populationValue(b.globalPopulation.value) - populationValue(a.globalPopulation.value)
        || a.name.localeCompare(b.name, "en");
    })
    .slice(0, 12);
}

function largestCountryFor(group: PeopleGroup, contexts: PeopleCountryContext[], dataset: NormalizedDataset) {
  const preferred = group.largestCountryId ? dataset.countries.find((country) => country.id === group.largestCountryId) : undefined;
  if (preferred) return { countryId: preferred.id, iso3: preferred.iso3, name: preferred.name };
  const fallback = contexts[0];
  return fallback ? { countryId: fallback.countryId, iso3: fallback.iso3, name: fallback.countryName } : null;
}

function profileFor(group: PeopleGroup, dataset: NormalizedDataset): PeopleGroupProfile {
  const contexts = dataset.peopleGroupsInCountries
    .filter((record) => record.peopleGroupId === group.id)
    .map((record) => contextFor(record, dataset))
    .sort((a, b) => populationValue(b.population.value) - populationValue(a.population.value) || a.countryName.localeCompare(b.countryName, "en"));

  const language = group.primaryLanguageId ? dataset.languages.find((item) => item.id === group.primaryLanguageId) : undefined;
  const religion = group.primaryReligionId ? dataset.religions.find((item) => item.id === group.primaryReligionId) : undefined;
  const religionCode = group.primaryReligionId ? Number(group.primaryReligionId.split(":")[1]) : null;

  return {
    peopleGroupId: group.id,
    sourcePeopleId: group.sourcePeopleId,
    name: group.name,
    affinityBloc: group.affinityBloc,
    cluster: group.cluster,
    globalPopulation: group.globalPopulation,
    mission: group.mission,
    primaryLanguage: language ? {
      languageId: language.id,
      iso6393: language.iso6393,
      name: language.name,
      status: language.status,
      scripture: language.scripture,
    } : null,
    primaryReligion: group.primaryReligionId ? {
      religionId: group.primaryReligionId,
      name: religion?.name ?? (religionCode !== null ? RELIGION_NAMES[religionCode] ?? "Unknown" : "Unknown"),
    } : null,
    largestCountry: largestCountryFor(group, contexts, dataset),
    countryCount: contexts.length,
    countries: contexts,
    scripture: scriptureFor(group, contexts, dataset),
    relatedPeople: relatedFor(group, dataset),
    provenance: group.provenance,
    sourceIds: uniqueStrings([
      ...group.provenance.map((item) => item.sourceId),
      ...contexts.flatMap((item) => item.sourceIds),
      ...(language?.provenance.map((item) => item.sourceId) ?? []),
    ]),
  };
}

export function buildPeopleExplorerDataset(dataset: NormalizedDataset, generatedAt = new Date().toISOString()): PeopleExplorerDataset {
  const peoples = dataset.peopleGroups
    .map((group) => profileFor(group, dataset))
    .sort((a, b) => populationValue(b.globalPopulation.value) - populationValue(a.globalPopulation.value) || a.name.localeCompare(b.name, "en"));

  return peopleExplorerDatasetSchema.parse({
    schemaVersion: 1,
    methodologyVersion: 1,
    fixture: dataset.fixture,
    generatedAt,
    sourceIds: uniqueStrings(peoples.flatMap((people) => people.sourceIds)),
    peoples,
  });
}
