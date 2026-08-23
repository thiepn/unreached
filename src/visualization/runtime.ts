import { useEffect, useMemo, useState } from "preact/hooks";

import {
  missionVisualizationAvailabilitySchema,
  missionVisualizationDatasetSchema,
  type CountryMissionSummary,
  type MissionVisualizationAvailability,
  type MissionVisualizationDataset,
} from "./types";

interface MissionVisualizationState {
  status: MissionVisualizationAvailability | null;
  dataset: MissionVisualizationDataset | null;
  loading: boolean;
  error: string | null;
}

export function useMissionVisualization(): MissionVisualizationState & { countriesByIso3: Map<string, CountryMissionSummary> } {
  const [state, setState] = useState<MissionVisualizationState>({ status: null, dataset: null, loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
    const statusUrl = `${import.meta.env.BASE_URL}data/mission/status.json`;

    void fetch(statusUrl, { signal: controller.signal, cache: "no-cache" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Mission-data status request failed (${response.status}).`);
        return missionVisualizationAvailabilitySchema.parse(await response.json() as unknown);
      })
      .then(async (status) => {
        if (!status.available || status.mode === "runtime-api") {
          setState({ status, dataset: null, loading: false, error: null });
          return;
        }
        if (!status.datasetUrl) throw new Error("Static mission-data status is available but has no dataset URL.");
        if (status.fixture && !import.meta.env.DEV) throw new Error("A fixture mission dataset was blocked from the production application.");
        const datasetUrl = status.datasetUrl.startsWith("http") ? status.datasetUrl : `${import.meta.env.BASE_URL}${status.datasetUrl.replace(/^\//, "")}`;
        const response = await fetch(datasetUrl, { signal: controller.signal, cache: "force-cache" });
        if (!response.ok) throw new Error(`Mission dataset request failed (${response.status}).`);
        const dataset = missionVisualizationDatasetSchema.parse(await response.json() as unknown);
        if (dataset.fixture && !import.meta.env.DEV) throw new Error("A fixture mission dataset was blocked from the production application.");
        setState({ status, dataset, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: null, dataset: null, loading: false, error: error instanceof Error ? error.message : "Mission visualization data could not be loaded." });
      });

    return () => controller.abort();
  }, []);

  const countriesByIso3 = useMemo(() => new Map((state.dataset?.countries ?? []).map((summary) => [summary.iso3, summary])), [state.dataset]);
  return { ...state, countriesByIso3 };
}
