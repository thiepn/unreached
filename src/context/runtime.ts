import { useEffect, useState } from "preact/hooks";

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

export interface EditorialContextState {
  status: EditorialContextAvailability | null;
  dataset: EditorialContextDataset | null;
  loading: boolean;
  error: string | null;
  generation: number;
  profilesByPeid: Map<number, PeopleContextProfile>;
}

function publicationUrl(path: string): string {
  return path.startsWith("http") ? path : `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Editorial-context publication request failed (${response.status}).`);
  return await response.json() as unknown;
}

async function materializeManifest(manifest: EditorialContextManifest): Promise<EditorialContextDataset> {
  if (manifest.fixture && !import.meta.env.DEV) throw new Error("A fixture editorial manifest was blocked from production.");
  if (manifest.profileUrls.length !== manifest.profileCount) throw new Error("Editorial manifest profile count does not match its shard list.");
  if (new Set(manifest.profileUrls).size !== manifest.profileUrls.length) throw new Error("Editorial manifest contains duplicate profile shard URLs.");

  const packages = await Promise.all(manifest.profileUrls.map(async (path) => {
    const raw = await fetchJson(publicationUrl(path));
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

async function loadEditorialPublication(url: string): Promise<EditorialContextDataset> {
  const raw = await fetchJson(url);
  const legacy = editorialContextDatasetSchema.safeParse(raw);
  if (legacy.success) return legacy.data;
  const manifest = editorialContextManifestSchema.parse(raw);
  return await materializeManifest(manifest);
}

const listeners = new Set<(value: EditorialContextState) => void>();
let snapshot: EditorialContextState = {
  status: null,
  dataset: null,
  loading: false,
  error: null,
  generation: 0,
  profilesByPeid: new Map(),
};
let pendingLoad: Promise<void> | null = null;

function publish(next: EditorialContextState): void {
  snapshot = next;
  for (const listener of listeners) listener(snapshot);
}

export function getEditorialContextSnapshot(): EditorialContextState {
  return snapshot;
}

export function ensureEditorialContext(): Promise<void> {
  if (snapshot.status || snapshot.dataset) return Promise.resolve();
  if (pendingLoad) return pendingLoad;

  publish({ ...snapshot, loading: true, error: null });
  const statusUrl = `${import.meta.env.BASE_URL}data/context/status.json`;
  pendingLoad = fetch(statusUrl, { cache: "no-cache" })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Editorial-context status request failed (${response.status}).`);
      return editorialContextAvailabilitySchema.parse(await response.json() as unknown);
    })
    .then(async (status) => {
      if (!status.available) {
        publish({ status, dataset: null, loading: false, error: null, generation: snapshot.generation + 1, profilesByPeid: new Map() });
        return;
      }
      if (status.mode !== "reviewed-editorial") throw new Error("Editorial context is available with an uncertified publication mode.");
      if (!status.datasetUrl) throw new Error("Editorial-context status is available but has no dataset URL.");
      if (status.fixture && !import.meta.env.DEV) throw new Error("A fixture editorial dataset was blocked from production.");
      const dataset = await loadEditorialPublication(publicationUrl(status.datasetUrl));
      if (dataset.fixture && !import.meta.env.DEV) throw new Error("A fixture editorial dataset was blocked from production.");
      assertContextDatasetIntegrity(dataset);
      if (dataset.profiles.length !== status.profileCount) throw new Error("Editorial-context status profile count does not match the published dataset.");
      publish({
        status,
        dataset,
        loading: false,
        error: null,
        generation: snapshot.generation + 1,
        profilesByPeid: new Map(dataset.profiles.map((profile) => [profile.peid, profile])),
      });
    })
    .catch((error: unknown) => {
      publish({ ...snapshot, status: null, dataset: null, loading: false, error: error instanceof Error ? error.message : "Editorial context could not be loaded.", profilesByPeid: new Map() });
    })
    .finally(() => {
      pendingLoad = null;
    });
  return pendingLoad;
}

export function useEditorialContext(enabled = true): EditorialContextState {
  const [state, setState] = useState<EditorialContextState>(() => snapshot);
  useEffect(() => {
    listeners.add(setState);
    setState(snapshot);
    if (enabled) void ensureEditorialContext();
    return () => {
      listeners.delete(setState);
    };
  }, [enabled]);
  return state;
}
