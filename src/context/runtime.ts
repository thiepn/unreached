import { useEffect, useMemo, useState } from "preact/hooks";

import { assertContextDatasetIntegrity } from "./policy";
import {
  editorialContextAvailabilitySchema,
  editorialContextDatasetSchema,
  type EditorialContextAvailability,
  type EditorialContextDataset,
  type PeopleContextProfile,
} from "./types";

interface EditorialContextState {
  status: EditorialContextAvailability | null;
  dataset: EditorialContextDataset | null;
  loading: boolean;
  error: string | null;
}

export function useEditorialContext(): EditorialContextState & { profilesBySourceId: Map<number, PeopleContextProfile> } {
  const [state, setState] = useState<EditorialContextState>({ status: null, dataset: null, loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
    const statusUrl = `${import.meta.env.BASE_URL}data/context/status.json`;

    void fetch(statusUrl, { signal: controller.signal, cache: "no-cache" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Editorial-context status request failed (${response.status}).`);
        return editorialContextAvailabilitySchema.parse(await response.json() as unknown);
      })
      .then(async (status) => {
        if (!status.available) {
          setState({ status, dataset: null, loading: false, error: null });
          return;
        }
        if (!status.datasetUrl) throw new Error("Editorial-context status is available but has no dataset URL.");
        if (status.fixture && !import.meta.env.DEV) throw new Error("A fixture editorial dataset was blocked from production.");
        const datasetUrl = status.datasetUrl.startsWith("http") ? status.datasetUrl : `${import.meta.env.BASE_URL}${status.datasetUrl.replace(/^\//, "")}`;
        const response = await fetch(datasetUrl, { signal: controller.signal, cache: "force-cache" });
        if (!response.ok) throw new Error(`Editorial-context dataset request failed (${response.status}).`);
        const dataset = editorialContextDatasetSchema.parse(await response.json() as unknown);
        if (dataset.fixture && !import.meta.env.DEV) throw new Error("A fixture editorial dataset was blocked from production.");
        assertContextDatasetIntegrity(dataset);
        setState({ status, dataset, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: null, dataset: null, loading: false, error: error instanceof Error ? error.message : "Editorial context could not be loaded." });
      });

    return () => controller.abort();
  }, []);

  const profilesBySourceId = useMemo(() => new Map((state.dataset?.profiles ?? []).map((profile) => [profile.sourcePeopleId, profile])), [state.dataset]);
  return { ...state, profilesBySourceId };
}
