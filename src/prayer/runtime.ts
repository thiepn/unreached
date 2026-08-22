import { useEffect, useMemo, useState } from "preact/hooks";

import { prayerAvailabilitySchema, prayerDatasetSchema, type PrayerAvailability, type PrayerDataset, type PrayerProfile } from "./types";

interface PrayerState {
  status: PrayerAvailability | null;
  dataset: PrayerDataset | null;
  loading: boolean;
  error: string | null;
}

export function usePrayerExperience(): PrayerState & { profilesBySourceId: Map<number, PrayerProfile> } {
  const [state, setState] = useState<PrayerState>({ status: null, dataset: null, loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
    const statusUrl = `${import.meta.env.BASE_URL}data/prayer/status.json`;
    void fetch(statusUrl, { signal: controller.signal, cache: "no-cache" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Prayer status request failed (${response.status}).`);
        return prayerAvailabilitySchema.parse(await response.json() as unknown);
      })
      .then(async (status) => {
        if (!status.available) {
          setState({ status, dataset: null, loading: false, error: null });
          return;
        }
        if (!status.datasetUrl) throw new Error("Prayer status is available but has no dataset URL.");
        if (status.fixture && !import.meta.env.DEV) throw new Error("A fixture prayer dataset was blocked from production.");
        const datasetUrl = status.datasetUrl.startsWith("http") ? status.datasetUrl : `${import.meta.env.BASE_URL}${status.datasetUrl.replace(/^\//, "")}`;
        const response = await fetch(datasetUrl, { signal: controller.signal, cache: "force-cache" });
        if (!response.ok) throw new Error(`Prayer dataset request failed (${response.status}).`);
        const dataset = prayerDatasetSchema.parse(await response.json() as unknown);
        if (dataset.fixture && !import.meta.env.DEV) throw new Error("A fixture prayer dataset was blocked from production.");
        setState({ status, dataset, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: null, dataset: null, loading: false, error: error instanceof Error ? error.message : "Prayer content could not be loaded." });
      });
    return () => controller.abort();
  }, []);

  const profilesBySourceId = useMemo(() => new Map((state.dataset?.profiles ?? []).filter((profile) => profile.review.status === "published").map((profile) => [profile.sourcePeopleId, profile])), [state.dataset]);
  return { ...state, profilesBySourceId };
}
