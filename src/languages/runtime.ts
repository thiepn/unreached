import { useEffect, useMemo, useState } from "preact/hooks";

import { languageExplorerAvailabilitySchema, languageExplorerDatasetSchema, type LanguageExplorerAvailability, type LanguageExplorerDataset } from "./types";

interface LanguageExplorerState {
  loading: boolean;
  dataset: LanguageExplorerDataset | null;
  status: LanguageExplorerAvailability | null;
  error: string | null;
}

function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}

export function useLanguageExplorer() {
  const [state, setState] = useState<LanguageExplorerState>({ loading: true, dataset: null, status: null, error: null });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const statusResponse = await fetch(asset("data/languages/status.json"));
        if (!statusResponse.ok) throw new Error(`Language status request failed (${statusResponse.status}).`);
        const status = languageExplorerAvailabilitySchema.parse(await statusResponse.json());
        if (cancelled) return;
        if (!status.available || !status.datasetUrl) {
          setState({ loading: false, dataset: null, status, error: null });
          return;
        }
        const dataResponse = await fetch(asset(status.datasetUrl));
        if (!dataResponse.ok) throw new Error(`Language dataset request failed (${dataResponse.status}).`);
        const dataset = languageExplorerDatasetSchema.parse(await dataResponse.json());
        if (dataset.fixture) throw new Error("Fixture language datasets are blocked from the production runtime.");
        if (!cancelled) setState({ loading: false, dataset, status, error: null });
      } catch (error) {
        if (!cancelled) setState({ loading: false, dataset: null, status: null, error: error instanceof Error ? error.message : "Language data could not be loaded." });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return useMemo(() => ({
    ...state,
    languagesByIso: new Map(state.dataset?.languages.map((language) => [language.iso6393, language]) ?? []),
  }), [state]);
}
