import type { Country, DatasetManifest, Language, NormalizedDataset, PeopleGroup, PeopleGroupInCountry } from "../domain";

export interface DataRepository {
  readonly manifest: DatasetManifest | null;
  getCountry(id: string): Country | undefined;
  getPeopleGroup(id: string): PeopleGroup | undefined;
  getPeopleGroupInCountry(id: string): PeopleGroupInCountry | undefined;
  getLanguage(id: string): Language | undefined;
  listPeopleGroupsForCountry(countryId: string): PeopleGroupInCountry[];
}

export function createInMemoryRepository(dataset: NormalizedDataset, manifest: DatasetManifest | null = null): DataRepository {
  const countries = new Map(dataset.countries.map((item) => [item.id, item]));
  const peopleGroups = new Map(dataset.peopleGroups.map((item) => [item.id, item]));
  const peopleInCountries = new Map(dataset.peopleGroupsInCountries.map((item) => [item.id, item]));
  const languages = new Map(dataset.languages.map((item) => [item.id, item]));

  return {
    manifest,
    getCountry: (id) => countries.get(id),
    getPeopleGroup: (id) => peopleGroups.get(id),
    getPeopleGroupInCountry: (id) => peopleInCountries.get(id),
    getLanguage: (id) => languages.get(id),
    listPeopleGroupsForCountry: (countryId) => dataset.peopleGroupsInCountries.filter((item) => item.countryId === countryId),
  };
}
