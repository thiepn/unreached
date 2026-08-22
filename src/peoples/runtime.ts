import { useEffect, useMemo, useState } from "preact/hooks";

import {
  peopleExplorerAvailabilitySchema,
  peopleExplorerDatasetSchema,
  type PeopleExplorerAvailability,
  type PeopleExplorerDataset,
  type PeopleGroupProfile,
} from "./types";

interface PeopleExplorerState {
  status: PeopleExplorerAvailability | null;
  dataset: PeopleExplorerDataset | null;
  loading: boolean;
  error: string | null;
}

export function usePeopleExplorer(): PeopleExplorerState & {
  peopleBySourceId: Map<number, PeopleGroupProfile>;
  peopleById: Map<string, PeopleGroupProfile>;
} {
  const [state, setState] = useState<PeopleExplorerState>({ status: null, dataset: null, loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
    const statusUrl = `${import.meta.env.BASE_URL}data/peoples/status.json`;

    void fetch(statusUrl, { signal: controller.signal, cache: "no-cache" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`People-data status request failed (${response.status}).`);
        return peopleExplorerAvailabilitySchema.parse(await response.json() as unknown);
      })
      .then(async (status) => {
        if (!status.available) {
          setState({ status, dataset: null, loading: false, error: null });
          return;
        }
        if (!status.datasetUrl) throw new Error("People-data status is available but has no dataset URL.");
        if (status.fixture && !import.meta.env.DEV) throw new Error("A fixture people dataset was blocked from the production application.");
        const datasetUrl = status.datasetUrl.startsWith("http") ? status.datasetUrl : `${import.meta.env.BASE_URL}${status.datasetUrl.replace(/^\//, "")}`;
        const response = await fetch(datasetUrl, { signal: controller.signal, cache: "force-cache" });
        if (!response.ok) throw new Error(`People dataset request failed (${response.status}).`);
        const dataset = peopleExplorerDatasetSchema.parse(await response.json() as unknown);
        if (dataset.fixture && !import.meta.env.DEV) throw new Error("A fixture people dataset was blocked from the production application.");
        setState({ status, dataset, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: null, dataset: null, loading: false, error: error instanceof Error ? error.message : "People-group data could not be loaded." });
      });

    return () => controller.abort();
  }, []);

  const peopleBySourceId = useMemo(() => new Map((state.dataset?.peoples ?? []).map((people) => [people.sourcePeopleId, people])), [state.dataset]);
  const peopleById = useMemo(() => new Map((state.dataset?.peoples ?? []).map((people) => [people.peopleGroupId, people])), [state.dataset]);
  return { ...state, peopleBySourceId, peopleById };
}
