import { useEffect, useMemo, useState } from "preact/hooks";

import {
  countryExplorerAvailabilitySchema,
  countryExplorerDatasetSchema,
  type CountryExplorerAvailability,
  type CountryExplorerDataset,
  type CountryExplorerRecord,
} from "./types";

interface CountryExplorerState {
  status: CountryExplorerAvailability | null;
  dataset: CountryExplorerDataset | null;
  loading: boolean;
  error: string | null;
}

export function useCountryExplorer(): CountryExplorerState & { countriesByIso3: Map<string, CountryExplorerRecord> } {
  const [state, setState] = useState<CountryExplorerState>({ status: null, dataset: null, loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
    const statusUrl = `${import.meta.env.BASE_URL}data/countries/status.json`;

    void fetch(statusUrl, { signal: controller.signal, cache: "no-cache" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Country-data status request failed (${response.status}).`);
        return countryExplorerAvailabilitySchema.parse(await response.json() as unknown);
      })
      .then(async (status) => {
        if (!status.available) {
          setState({ status, dataset: null, loading: false, error: null });
          return;
        }
        if (!status.datasetUrl) throw new Error("Country-data status is available but has no dataset URL.");
        if (status.fixture && !import.meta.env.DEV) throw new Error("A fixture country dataset was blocked from the production application.");
        const datasetUrl = status.datasetUrl.startsWith("http") ? status.datasetUrl : `${import.meta.env.BASE_URL}${status.datasetUrl.replace(/^\//, "")}`;
        const response = await fetch(datasetUrl, { signal: controller.signal, cache: "force-cache" });
        if (!response.ok) throw new Error(`Country dataset request failed (${response.status}).`);
        const dataset = countryExplorerDatasetSchema.parse(await response.json() as unknown);
        if (dataset.fixture && !import.meta.env.DEV) throw new Error("A fixture country dataset was blocked from the production application.");
        setState({ status, dataset, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: null, dataset: null, loading: false, error: error instanceof Error ? error.message : "Country data could not be loaded." });
      });

    return () => controller.abort();
  }, []);

  const countriesByIso3 = useMemo(() => new Map((state.dataset?.countries ?? []).map((country) => [country.iso3, country])), [state.dataset]);
  return { ...state, countriesByIso3 };
}
