import type { NormalizedDataset } from "../domain";
import { languageExplorerDatasetSchema, type LanguageCountrySummary, type LanguageExplorerDataset, type LanguagePeopleSummary } from "./types";

function known(value: number | null): number {
  return value ?? 0;
}

function unique(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort();
}

export function buildLanguageExplorerDataset(dataset: NormalizedDataset, generatedAt = new Date().toISOString()): LanguageExplorerDataset {
  const countries = new Map(dataset.countries.map((country) => [country.id, country]));
  const religions = new Map(dataset.religions.map((religion) => [religion.id, religion]));
  const peoples = new Map(dataset.peopleGroups.map((people) => [people.id, people]));

  const records = dataset.languages.map((language) => {
    const countryContexts = dataset.peopleGroupsInCountries.filter((context) => context.primaryLanguageId === language.id);
    const countryGroups = new Map<string, typeof countryContexts>();
    for (const context of countryContexts) {
      const current = countryGroups.get(context.countryId) ?? [];
      current.push(context);
      countryGroups.set(context.countryId, current);
    }

    const countrySummaries: LanguageCountrySummary[] = [...countryGroups.entries()].map(([countryId, contexts]) => {
      const country = countries.get(countryId);
      return {
        countryId,
        iso3: countryId.slice("country:".length),
        name: country?.name ?? countryId.slice("country:".length),
        peopleGroupCount: new Set(contexts.map((context) => context.peopleGroupId)).size,
        knownPopulation: contexts.reduce((sum, context) => sum + known(context.population.value), 0),
      };
    }).sort((a, b) => b.knownPopulation - a.knownPopulation || a.name.localeCompare(b.name));

    const canonicalPeople = dataset.peopleGroups
      .filter((people) => people.primaryLanguageId === language.id)
      .sort((a, b) => known(b.globalPopulation.value) - known(a.globalPopulation.value) || a.name.localeCompare(b.name));

    const peopleSummaries: LanguagePeopleSummary[] = canonicalPeople.map((people) => {
      const largestCountry = people.largestCountryId ? countries.get(people.largestCountryId) : null;
      return {
        peopleGroupId: people.id,
        sourcePeopleId: people.sourcePeopleId,
        name: people.name,
        globalPopulation: people.globalPopulation,
        classification: people.mission.classification,
        frontier: people.mission.frontier,
        largestCountryIso3: largestCountry?.iso3 ?? null,
        largestCountryName: largestCountry?.name ?? null,
      };
    });

    const hubCountry = language.hubCountryId ? countries.get(language.hubCountryId) : null;
    const primaryReligion = language.primaryReligionId ? religions.get(language.primaryReligionId) : null;
    const sourceIds = unique([
      ...language.provenance.map((item) => item.sourceId),
      ...countryContexts.flatMap((item) => item.provenance.map((entry) => entry.sourceId)),
      ...canonicalPeople.flatMap((item) => item.provenance.map((entry) => entry.sourceId)),
    ]);

    return {
      languageId: language.id,
      iso6393: language.iso6393,
      name: language.name,
      status: language.status,
      familyName: null,
      branchName: null,
      taxonomySourceId: null,
      hubCountry: hubCountry ? { countryId: hubCountry.id, iso3: hubCountry.iso3, name: hubCountry.name } : null,
      primaryReligion: primaryReligion ? { religionId: primaryReligion.id, name: primaryReligion.name } : null,
      mission: language.mission,
      scripture: language.scripture,
      peopleGroupCount: canonicalPeople.length,
      unreachedPeopleGroupCount: canonicalPeople.filter((people) => people.mission.classification === "unreached").length,
      frontierPeopleGroupCount: canonicalPeople.filter((people) => people.mission.frontier === true).length,
      countryCount: countrySummaries.length,
      knownRepresentedPopulation: countryContexts.reduce((sum, context) => sum + known(context.population.value), 0),
      countries: countrySummaries,
      peoples: peopleSummaries,
      provenance: language.provenance,
      sourceIds,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  return languageExplorerDatasetSchema.parse({
    schemaVersion: 1,
    methodologyVersion: 1,
    fixture: dataset.fixture,
    generatedAt,
    sourceIds: unique(records.flatMap((record) => record.sourceIds)),
    languages: records,
  });
}
