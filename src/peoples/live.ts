import {
  entityGsecRange,
  entityTaxonomy,
  usePeopleGroupsRuntimeStore,
  type RuntimePeopleEntity,
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

function text(value: string | null | undefined): string {
  return value?.toLocaleLowerCase("en") ?? "";
}

function queryMatches(entity: RuntimePeopleEntity, query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase("en");
  if (!normalized) return true;
  const taxonomy = entityTaxonomy(entity);
  const haystack = [
    entity.displayName,
    String(entity.peid),
    entity.primaryLanguage?.name,
    entity.primaryLanguage?.iso6393,
    entity.primaryReligion?.name,
    entity.primaryReligion?.code,
    taxonomy.affinityBloc,
    taxonomy.peopleCluster,
    taxonomy.peopleName,
    taxonomy.ethnographicGroup,
    ...entity.contexts.flatMap((context) => [
      context.pgid,
      context.displayName,
      context.alternateNames,
      context.country.name,
      context.country.iso3,
      context.language.name,
      context.language.iso6393,
      context.religion.name,
      context.religion.displayName,
    ]),
  ];
  return haystack.some((value) => text(value).includes(normalized));
}

function gsecSortValue(entity: RuntimePeopleEntity): number {
  return entityGsecRange(entity)?.min ?? Number.POSITIVE_INFINITY;
}

export function filterLivePeople(entities: RuntimePeopleEntity[], state: LivePeopleFilterState): RuntimePeopleEntity[] {
  return entities
    .filter((entity) => queryMatches(entity, state.query))
    .filter((entity) => state.status === "all" || entity.reach.classification === state.status)
    .filter((entity) => !state.countryIso3 || entity.contexts.some((context) => context.country.iso3 === state.countryIso3))
    .filter((entity) => !state.language || entity.contexts.some((context) =>
      context.language.iso6393 === state.language || context.language.name === state.language,
    ))
    .filter((entity) => !state.religion || entity.contexts.some((context) =>
      context.religion.code === state.religion || context.religion.name === state.religion,
    ))
    .filter((entity) => !state.bibleAvailability || entity.contexts.some((context) => context.resources.bibleAvailability === state.bibleAvailability))
    .filter((entity) => state.minimumPopulation <= 0 || entity.population.knownValue >= state.minimumPopulation)
    .sort((a, b) => {
      if (state.sort === "name") return a.displayName.localeCompare(b.displayName, "en");
      if (state.sort === "gsec-asc") {
        return gsecSortValue(a) - gsecSortValue(b)
          || b.population.knownValue - a.population.knownValue
          || a.displayName.localeCompare(b.displayName, "en");
      }
      return b.population.knownValue - a.population.knownValue || a.displayName.localeCompare(b.displayName, "en");
    });
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
