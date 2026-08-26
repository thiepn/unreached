import { usePeopleGroupsRuntimeStore } from "../providers/peoplegroups";

export function useLiveCountryExplorer(enabled = true) {
  return usePeopleGroupsRuntimeStore(enabled);
}
