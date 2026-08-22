import { liveMissionLayerIdSchema, type LiveMissionLayerId } from "../visualization/liveTypes";
import type { MapViewState } from "./types";

export interface MapUrlState {
  country: string | null;
  view: MapViewState | null;
  layer: LiveMissionLayerId;
}

function hashParts(): { path: string; params: URLSearchParams } {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const question = raw.indexOf("?");
  const path = question >= 0 ? raw.slice(0, question) || "/" : raw;
  const query = question >= 0 ? raw.slice(question + 1) : "";
  return { path, params: new URLSearchParams(query) };
}

function parseView(raw: string | null): MapViewState | null {
  if (!raw) return null;
  const values = raw.split(",").map(Number);
  if (values.length !== 3) return null;
  const [longitude, latitude, zoom] = values;
  if (longitude === undefined || latitude === undefined || zoom === undefined) return null;
  if (![longitude, latitude, zoom].every(Number.isFinite)) return null;
  if (longitude < -180 || longitude > 180 || latitude < -85 || latitude > 85 || zoom < 0 || zoom > 12) return null;
  return { longitude, latitude, zoom };
}

function parseLayer(raw: string | null): LiveMissionLayerId {
  if (raw === "unreached") return "unreached-population";
  const parsed = liveMissionLayerIdSchema.safeParse(raw);
  return parsed.success ? parsed.data : "unreached-population";
}

export function readMapUrlState(): MapUrlState {
  const { params } = hashParts();
  const country = params.get("country");
  return {
    country: country && /^[A-Za-z0-9-]+$/.test(country) ? country : null,
    view: parseView(params.get("view")),
    layer: parseLayer(params.get("layer")),
  };
}

export function replaceMapUrlState(state: MapUrlState): void {
  const { path, params } = hashParts();
  if (state.country) params.set("country", state.country);
  else params.delete("country");

  if (state.view) {
    params.set("view", [state.view.longitude.toFixed(3), state.view.latitude.toFixed(3), state.view.zoom.toFixed(2)].join(","));
  } else {
    params.delete("view");
  }

  if (state.layer !== "unreached-population") params.set("layer", state.layer);
  else params.delete("layer");

  const query = params.toString();
  const nextHash = `#${path}${query ? `?${query}` : ""}`;
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${nextHash}`);
}
