import { useMemo } from "preact/hooks";

import { useEditorialProfiles } from "../editorial/runtime";
import { usePeopleGroupsRuntimeStore } from "../providers/peoplegroups";

export function useGuidedAtlasRuntime(enabled = true) {
  const people = usePeopleGroupsRuntimeStore(enabled);
  const editorial = useEditorialProfiles(enabled);
  const reviewedPeids = useMemo(
    () => new Set(
      editorial.profiles
        .filter((profile) => profile.tier === "reviewed")
        .map((profile) => profile.legacyContextProfile?.peid)
        .filter((peid): peid is number => peid !== null && peid !== undefined),
    ),
    [editorial.profiles],
  );

  return {
    ready: people.ready,
    loading: people.loading || editorial.loading,
    error: people.error,
    peoples: people.entities,
    reviewedPeids,
  };
}
