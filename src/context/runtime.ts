import { useEffect, useMemo, useState } from "preact/hooks";

import { assertContextDatasetIntegrity } from "./policy";
import {
  editorialContextAvailabilitySchema,
  editorialContextDatasetSchema,
  editorialContextManifestSchema,
  editorialContextProfilePackageSchema,
  type EditorialContextAvailability,
  type EditorialContextDataset,
  type EditorialContextManifest,
  type PeopleContextProfile,
} from "./types";

interface EditorialContextState {
  status: EditorialContextAvailability | null;
  dataset: EditorialContextDataset | null;
  loading: boolean;
  error: string | null;
}

function publicationUrl(path: string): string {
  return path.startsWith("http") ? path : `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}

async function fetchJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal, cache: "force-cache" });
  if (!response.ok) throw new Error(`Editorial-context publication request failed (${response.status}).`);
  return await response.json() as unknown;
}

async function materializeManifest(manifest: EditorialContextManifest, signal: AbortSignal): Promise<EditorialContextDataset> {
  if (manifest.fixture && !import.meta.env.DEV) throw new Error("A fixture editorial manifest was blocked from production.");
  if (manifest.profileUrls.length !== manifest.profileCount) throw new Error("Editorial manifest profile count does not match its shard list.");
  if (new Set(manifest.profileUrls).size !== manifest.profileUrls.length) throw new Error("Editorial manifest contains duplicate profile shard URLs.");

  const packages = await Promise.all(manifest.profileUrls.map(async (path) => {
    const raw = await fetchJson(publicationUrl(path), signal);
    const parsed = editorialContextProfilePackageSchema.parse(raw);
    if (parsed.fixture && !import.meta.env.DEV) throw new Error(`Fixture editorial shard was blocked from production: ${path}`);
    return parsed;
  }));

  return editorialContextDatasetSchema.parse({
    schemaVersion: 2,
    fixture: packages.some((item) => item.fixture),
    generatedAt: manifest.generatedAt,
    sources: packages.flatMap((item) => item.sources),
    profiles: packages.map((item) => item.profile),
  });
}

async function loadEditorialPublication(url: string, signal: AbortSignal): Promise<EditorialContextDataset> {
  const raw = await fetchJson(url, signal);
  const legacy = editorialContextDatasetSchema.safeParse(raw);
  if (legacy.success) return legacy.data;
  const manifest = editorialContextManifestSchema.parse(raw);
  return await materializeManifest(manifest, signal);
}

export function useEditorialContext(): EditorialContextState & { profilesByPeid: Map<number, PeopleContextProfile> } {
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
        if (status.mode !== "reviewed-editorial") throw new Error("Editorial context is available with an uncertified publication mode.");
        if (!status.datasetUrl) throw new Error("Editorial-context status is available but has no dataset URL.");
        if (status.fixture && !import.meta.env.DEV) throw new Error("A fixture editorial dataset was blocked from production.");
        const dataset = await loadEditorialPublication(publicationUrl(status.datasetUrl), controller.signal);
        if (dataset.fixture && !import.meta.env.DEV) throw new Error("A fixture editorial dataset was blocked from production.");
        assertContextDatasetIntegrity(dataset);
        if (dataset.profiles.length !== status.profileCount) throw new Error("Editorial-context status profile count does not match the published dataset.");
        setState({ status, dataset, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: null, dataset: null, loading: false, error: error instanceof Error ? error.message : "Editorial context could not be loaded." });
      });

    return () => controller.abort();
  }, []);

  const profilesByPeid = useMemo(() => new Map((state.dataset?.profiles ?? []).map((profile) => [profile.peid, profile])), [state.dataset]);
  return { ...state, profilesByPeid };
}
