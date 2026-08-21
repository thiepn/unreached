import type { NormalizedDataset } from "./schemas";

export interface DataInvariantIssue {
  code: string;
  message: string;
}

function duplicateIds<T extends { id: string }>(records: readonly T[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const record of records) {
    if (seen.has(record.id)) duplicates.add(record.id);
    seen.add(record.id);
  }
  return [...duplicates];
}

export function validateDatasetInvariants(dataset: NormalizedDataset): DataInvariantIssue[] {
  const issues: DataInvariantIssue[] = [];
  const collections = [
    ["regions", dataset.regions],
    ["religions", dataset.religions],
    ["countries", dataset.countries],
    ["peopleGroups", dataset.peopleGroups],
    ["peopleGroupsInCountries", dataset.peopleGroupsInCountries],
    ["languages", dataset.languages],
  ] as const;

  for (const [name, records] of collections) {
    for (const id of duplicateIds(records)) {
      issues.push({ code: "duplicate-id", message: `${name} contains duplicate id ${id}` });
    }
  }

  const regionIds = new Set(dataset.regions.map((item) => item.id));
  const religionIds = new Set(dataset.religions.map((item) => item.id));
  const countryIds = new Set(dataset.countries.map((item) => item.id));
  const peopleIds = new Set(dataset.peopleGroups.map((item) => item.id));
  const languageIds = new Set(dataset.languages.map((item) => item.id));

  for (const country of dataset.countries) {
    if (country.regionId && !regionIds.has(country.regionId)) {
      issues.push({ code: "missing-region", message: `${country.id} references ${country.regionId}` });
    }
  }

  for (const people of dataset.peopleGroups) {
    if (people.primaryLanguageId && !languageIds.has(people.primaryLanguageId)) {
      issues.push({ code: "missing-language", message: `${people.id} references ${people.primaryLanguageId}` });
    }
    if (people.primaryReligionId && !religionIds.has(people.primaryReligionId)) {
      issues.push({ code: "missing-religion", message: `${people.id} references ${people.primaryReligionId}` });
    }
    if (people.largestCountryId && !countryIds.has(people.largestCountryId)) {
      issues.push({ code: "missing-country", message: `${people.id} references ${people.largestCountryId}` });
    }
  }

  for (const record of dataset.peopleGroupsInCountries) {
    if (!peopleIds.has(record.peopleGroupId)) issues.push({ code: "missing-people", message: `${record.id} references ${record.peopleGroupId}` });
    if (!countryIds.has(record.countryId)) issues.push({ code: "missing-country", message: `${record.id} references ${record.countryId}` });
    if (record.primaryLanguageId && !languageIds.has(record.primaryLanguageId)) issues.push({ code: "missing-language", message: `${record.id} references ${record.primaryLanguageId}` });
    if (record.primaryReligionId && !religionIds.has(record.primaryReligionId)) issues.push({ code: "missing-religion", message: `${record.id} references ${record.primaryReligionId}` });
  }

  for (const language of dataset.languages) {
    if (language.hubCountryId && !countryIds.has(language.hubCountryId)) issues.push({ code: "missing-country", message: `${language.id} references ${language.hubCountryId}` });
    if (language.primaryReligionId && !religionIds.has(language.primaryReligionId)) issues.push({ code: "missing-religion", message: `${language.id} references ${language.primaryReligionId}` });
  }

  return issues;
}
