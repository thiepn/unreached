import {
  getRuntimePeopleSearchIndex,
  usePeopleGroupsRuntimeStore,
  type RuntimePeopleEntity,
  type RuntimePeopleSearchIndex,
} from "../providers/peoplegroups";

export type LivePeopleStatusFilter = "all" | "unreached-only" | "other-only" | "unknown";
export type LivePeopleSort = "population-desc" | "name" | "gsec-asc";

export interface LivePeopleFilterState {
  query: string;
  status: LivePeopleStatusFilter;
  countryIso3: string;
  language: string;
  religion: string;
  bibleAvailability: string;
  minimumPopulation: number;
  sort: LivePeopleSort;
}

export function filterLivePeople(
  entities: RuntimePeopleEntity[],
  state: LivePeopleFilterState,
  preparedIndex: RuntimePeopleSearchIndex = getRuntimePeopleSearchIndex(entities),
): RuntimePeopleEntity[] {
  const query = state.query.trim().toLocaleLowerCase("en");
  const filtered = preparedIndex.records.filter((record) => {
    const entity = record.entity;
    if (query && !record.searchText.includes(query)) return false;
    if (state.status !== "all" && entity.reach.classification !== state.status) return false;
    if (state.countryIso3 && !record.countryIso3s.has(state.countryIso3)) return false;
    if (state.language && !record.languageKeys.has(state.language)) return false;
    if (state.religion && !record.religionKeys.has(state.religion)) return false;
    if (state.bibleAvailability && !record.bibleAvailability.has(state.bibleAvailability)) return false;
    if (state.minimumPopulation > 0 && record.population < state.minimumPopulation) return false;
    return true;
  });

  filtered.sort((a, b) => {
    if (state.sort === "name") return a.entity.displayName.localeCompare(b.entity.displayName, "en");
    if (state.sort === "gsec-asc") {
      return a.gsecMin - b.gsecMin
        || b.population - a.population
        || a.entity.displayName.localeCompare(b.entity.displayName, "en");
    }
    return b.population - a.population || a.entity.displayName.localeCompare(b.entity.displayName, "en");
  });

  return filtered.map((record) => record.entity);
}

export function useLivePeopleExplorer(enabled = true) {
  const runtime = usePeopleGroupsRuntimeStore(enabled);
  return { ...runtime, peoples: runtime.entities };
}

export function livePeopleStatusLabel(entity: RuntimePeopleEntity): string {
  if (entity.reach.classification === "unreached-only") return "Unreached";
  if (entity.reach.classification === "other-only") return "Other GSEC status";
  return "Status unknown";
}

export function livePeopleStatusClass(entity: RuntimePeopleEntity): string {
  if (entity.reach.classification === "unreached-only") return "unreached";
  if (entity.reach.classification === "other-only") return "reached";
  return "unknown";
}
