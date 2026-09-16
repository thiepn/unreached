import {
  PEOPLE_GROUPS_ATTRIBUTION,
  entityEditorialContext,
  entityResourceBreakdown,
  entityTaxonomy,
  relatedRuntimePeople,
  usePeopleGroupsRouteRecord,
  usePeopleGroupsRuntimeStore,
  type RuntimePeopleContext,
  type RuntimePeopleEntity,
} from "../providers/peoplegroups";

/**
 * Transitional Phase 8 boundary for the definitive people profile.
 * Route components consume this atlas-facing module instead of provider
 * modules directly. The launch runtime is still PeopleGroups/IMB-first; a
 * later multi-source implementation can replace this adapter without changing
 * the profile page contract.
 */
export type PeopleProfileRecord = RuntimePeopleEntity;
export type PeopleProfileContext = RuntimePeopleContext;
export type PeopleProfileRouteState = ReturnType<typeof usePeopleGroupsRouteRecord>;
export type PeopleProfileCorpusState = ReturnType<typeof usePeopleGroupsRuntimeStore>;

export const PEOPLE_PROFILE_SOURCE = PEOPLE_GROUPS_ATTRIBUTION;

export function useLivePeopleProfile(sourcePeopleId: number): PeopleProfileRouteState {
  return usePeopleGroupsRouteRecord(sourcePeopleId);
}

export function usePeopleProfileCorpus(enabled = false): PeopleProfileCorpusState {
  return usePeopleGroupsRuntimeStore(enabled);
}

export const peopleProfileTaxonomy = entityTaxonomy;
export const peopleProfileResourceBreakdown = entityResourceBreakdown;
export const peopleProfileProviderContext = entityEditorialContext;
export const relatedPeopleProfileRecords = relatedRuntimePeople;
