import { useEffect, useState } from "preact/hooks";

import {
  editorialContextAvailabilitySchema,
  editorialContextManifestSchema,
  editorialContextProfilePackageSchema,
} from "../context/types";
import { adaptLegacyContextPackageToV3Editorial } from "./legacy-context-adapter";
import type { EditorialProfile } from "./schemas";

export interface EditorialProfileRuntimeState {
  profiles: EditorialProfile[];
  profilesByPeid: Map<number, EditorialProfile>;
  loading: boolean;
  error: string | null;
  generation: number;
}

function publicationUrl(path: string): string {
  return path.startsWith("http") ? path : `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}

async function fetchJson(path: string): Promise<unknown> {
  const response = await fetch(publicationUrl(path), { cache: "no-cache" });
  if (!response.ok) throw new Error(`Editorial profile request failed (${response.status}).`);
  return await response.json() as unknown;
}

const listeners = new Set<(value: EditorialProfileRuntimeState) => void>();
let snapshot: EditorialProfileRuntimeState = {
  profiles: [],
  profilesByPeid: new Map(),
  loading: false,
  error: null,
  generation: 0,
};
let pending: Promise<void> | null = null;

function publish(next: EditorialProfileRuntimeState): void {
  snapshot = next;
  for (const listener of listeners) listener(snapshot);
}

export function getEditorialProfileRuntimeSnapshot(): EditorialProfileRuntimeState {
  return snapshot;
}

export function ensureEditorialProfiles(): Promise<void> {
  if (snapshot.profiles.length || snapshot.error) return Promise.resolve();
  if (pending) return pending;

  publish({ ...snapshot, loading: true, error: null });
  pending = fetchJson("data/context/status.json")
    .then((raw) => editorialContextAvailabilitySchema.parse(raw))
    .then(async (status) => {
      if (!status.available || !status.datasetUrl) {
        publish({ profiles: [], profilesByPeid: new Map(), loading: false, error: status.reason ?? null, generation: snapshot.generation + 1 });
        return;
      }
      if (status.mode !== "reviewed-editorial") throw new Error("Editorial publication mode is not certified for V3 people profiles.");
      if (status.fixture && !import.meta.env.DEV) throw new Error("Fixture editorial publication was blocked from production.");

      const manifest = editorialContextManifestSchema.parse(await fetchJson(status.datasetUrl));
      if (manifest.fixture && !import.meta.env.DEV) throw new Error("Fixture editorial manifest was blocked from production.");
      if (manifest.profileUrls.length !== manifest.profileCount) throw new Error("Editorial manifest profile count does not match its shard list.");

      const profiles = await Promise.all(manifest.profileUrls.map(async (path) => {
        const pkg = editorialContextProfilePackageSchema.parse(await fetchJson(path));
        if (pkg.fixture && !import.meta.env.DEV) throw new Error(`Fixture editorial profile was blocked from production: ${path}`);
        return adaptLegacyContextPackageToV3Editorial(pkg, `public/${path.replace(/^\//, "")}`);
      }));

      const profilesByPeid = new Map<number, EditorialProfile>();
      for (const profile of profiles) {
        const peid = profile.legacyContextProfile?.peid ?? null;
        if (peid === null) continue;
        if (profilesByPeid.has(peid)) throw new Error(`Duplicate V3 editorial profile for PEID ${peid}.`);
        profilesByPeid.set(peid, profile);
      }

      publish({ profiles, profilesByPeid, loading: false, error: null, generation: snapshot.generation + 1 });
    })
    .catch((error: unknown) => {
      publish({ profiles: [], profilesByPeid: new Map(), loading: false, error: error instanceof Error ? error.message : "Editorial profiles could not be loaded.", generation: snapshot.generation + 1 });
    })
    .finally(() => {
      pending = null;
    });

  return pending;
}

export function useEditorialProfiles(enabled = true): EditorialProfileRuntimeState {
  const [state, setState] = useState<EditorialProfileRuntimeState>(() => snapshot);
  useEffect(() => {
    listeners.add(setState);
    setState(snapshot);
    if (enabled) void ensureEditorialProfiles();
    return () => {
      listeners.delete(setState);
    };
  }, [enabled]);
  return state;
}
