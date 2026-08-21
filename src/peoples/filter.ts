import type { PeopleGroupProfile } from "./types";

export type PeopleStatusFilter = "all" | "unreached" | "frontier" | "reached" | "unknown";
export type PeopleSort = "population-desc" | "name" | "evangelical-asc" | "least-reached";

export interface PeopleFilterState {
  query: string;
  status: PeopleStatusFilter;
  countryIso3: string;
  languageId: string;
  religionId: string;
  scriptureStatus: string;
  minimumPopulation: number;
  sort: PeopleSort;
}

function text(value: string | null | undefined): string {
  return value?.toLocaleLowerCase("en") ?? "";
}

function matchesQuery(profile: PeopleGroupProfile, query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase("en");
  if (!normalized) return true;
  const haystack = [
    profile.name,
    profile.affinityBloc,
    profile.cluster,
    profile.primaryLanguage?.name,
    profile.primaryLanguage?.iso6393,
    profile.primaryReligion?.name,
    ...profile.countries.flatMap((country) => [country.countryName, country.iso3, country.nameInCountry]),
  ];
  return haystack.some((value) => text(value).includes(normalized));
}

function matchesStatus(profile: PeopleGroupProfile, status: PeopleStatusFilter): boolean {
  if (status === "all") return true;
  if (status === "frontier") return profile.mission.frontier === true;
  return profile.mission.classification === status;
}

function leastReachedRank(profile: PeopleGroupProfile): number {
  if (profile.mission.frontier === true) return 0;
  if (profile.mission.classification === "unreached") return 1;
  if (profile.mission.classification === "unknown") return 2;
  return 3;
}

function population(profile: PeopleGroupProfile): number | null {
  return profile.globalPopulation.value;
}

function compareNullable(a: number | null, b: number | null, direction: "asc" | "desc"): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return direction === "asc" ? a - b : b - a;
}

export function filterPeopleProfiles(profiles: PeopleGroupProfile[], state: PeopleFilterState): PeopleGroupProfile[] {
  return profiles
    .filter((profile) => matchesQuery(profile, state.query))
    .filter((profile) => matchesStatus(profile, state.status))
    .filter((profile) => !state.countryIso3 || profile.countries.some((country) => country.iso3 === state.countryIso3))
    .filter((profile) => !state.languageId || profile.primaryLanguage?.languageId === state.languageId || profile.countries.some((country) => country.primaryLanguageId === state.languageId))
    .filter((profile) => !state.religionId || profile.primaryReligion?.religionId === state.religionId || profile.countries.some((country) => country.primaryReligionId === state.religionId))
    .filter((profile) => !state.scriptureStatus || profile.scripture.bibleStatus === state.scriptureStatus)
    .filter((profile) => state.minimumPopulation <= 0 || (profile.globalPopulation.value ?? -1) >= state.minimumPopulation)
    .sort((a, b) => {
      if (state.sort === "name") return a.name.localeCompare(b.name, "en");
      if (state.sort === "evangelical-asc") {
        return compareNullable(a.mission.percentEvangelical.value, b.mission.percentEvangelical.value, "asc") || a.name.localeCompare(b.name, "en");
      }
      if (state.sort === "least-reached") {
        return leastReachedRank(a) - leastReachedRank(b)
          || compareNullable(population(a), population(b), "desc")
          || a.name.localeCompare(b.name, "en");
      }
      return compareNullable(population(a), population(b), "desc") || a.name.localeCompare(b.name, "en");
    });
}
