import {
  PEOPLE_GROUPS_ATTRIBUTION,
  usePeopleGroupsRuntimeStore,
  type VisibleCountryRecord,
} from "../providers/peoplegroups";

/**
 * Transitional product-facing country boundary.
 *
 * V3 route components import country records through this module instead of
 * depending on PeopleGroups provider modules directly. The source remains
 * PeopleGroups/IMB through the 3.0 launch; later source reconciliation can
 * replace this adapter without changing geographic route components.
 */
export type AtlasCountryRuntimeRecord = VisibleCountryRecord;
export const ATLAS_COUNTRY_SOURCE = PEOPLE_GROUPS_ATTRIBUTION;

export function useAtlasCountryExplorer(enabled = true) {
  return usePeopleGroupsRuntimeStore(enabled);
}

// Kept for compatibility with unmigrated callers until their owning V3 phase.
export const useLiveCountryExplorer = useAtlasCountryExplorer;
