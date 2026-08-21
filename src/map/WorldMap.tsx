import {
  AttributionControl,
  GeoJSONSource,
  LngLatBounds,
  Map as MapLibreMap,
  NavigationControl,
  type StyleSpecification,
} from "maplibre-gl";
import { useEffect, useRef } from "preact/hooks";

import type { MissionMapGeography } from "../visualization";
import type { MapCountryFeature, MapViewState, WorldGeography } from "./types";

const HOME_VIEW: MapViewState = { longitude: 10, latitude: 18, zoom: 1.15 };
const NONE_FILTER_KEY = "__unreached-none__";

interface WorldMapProps {
  geography: WorldGeography;
  visualizedGeography: MissionMapGeography;
  selectedKey: string | null;
  initialView: MapViewState | null;
  resetToken: number;
  onSelect: (country: MapCountryFeature) => void;
  onHover: (country: MapCountryFeature | null) => void;
  onViewChange: (view: MapViewState) => void;
  onError: (message: string) => void;
}

function reducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function boundsFor(feature: MapCountryFeature): LngLatBounds {
  const bounds = new LngLatBounds();

  const visit = (value: unknown): void => {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
      bounds.extend([value[0], value[1]]);
      return;
    }
    for (const child of value) visit(child);
  };

  visit(feature.geometry.coordinates);
  return bounds;
}

function mapStyle(geography: MissionMapGeography): StyleSpecification {
  return {
    version: 8,
    sources: {
      countries: {
        type: "geojson",
        data: geography,
        attribution: '<a href="https://www.naturalearthdata.com/">Natural Earth</a>',
      },
    },
    layers: [
      {
        id: "background",
        type: "background",
        paint: { "background-color": "#e6ece8" },
      },
      {
        id: "countries-fill",
        type: "fill",
        source: "countries",
        paint: {
          "fill-color": ["coalesce", ["get", "missionFill"], "#d5ddd8"],
          "fill-opacity": 0.94,
        },
      },
      {
        id: "countries-line",
        type: "line",
        source: "countries",
        paint: {
          "line-color": "#75877d",
          "line-width": 0.7,
          "line-opacity": 0.82,
        },
      },
      {
        id: "countries-hover",
        type: "fill",
        source: "countries",
        filter: ["==", ["get", "mapKey"], NONE_FILTER_KEY],
        paint: {
          "fill-color": "#ffffff",
          "fill-opacity": 0.22,
        },
      },
      {
        id: "countries-selected",
        type: "fill",
        source: "countries",
        filter: ["==", ["get", "mapKey"], NONE_FILTER_KEY],
        paint: {
          "fill-color": "#ffffff",
          "fill-opacity": 0.15,
        },
      },
      {
        id: "countries-selected-line",
        type: "line",
        source: "countries",
        filter: ["==", ["get", "mapKey"], NONE_FILTER_KEY],
        paint: {
          "line-color": "#173f52",
          "line-width": 2.2,
        },
      },
    ],
  };
}

export function WorldMap({
  geography,
  visualizedGeography,
  selectedKey,
  initialView,
  resetToken,
  onSelect,
  onHover,
  onViewChange,
  onError,
}: WorldMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const selectedKeyRef = useRef(selectedKey);
  const visualizationRef = useRef(visualizedGeography);
  const onSelectRef = useRef(onSelect);
  const onHoverRef = useRef(onHover);
  const onViewChangeRef = useRef(onViewChange);
  const onErrorRef = useRef(onError);
  const previousResetToken = useRef(resetToken);
  const lastHoverKey = useRef<string | null>(null);

  selectedKeyRef.current = selectedKey;
  visualizationRef.current = visualizedGeography;
  onSelectRef.current = onSelect;
  onHoverRef.current = onHover;
  onViewChangeRef.current = onViewChange;
  onErrorRef.current = onError;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const start = initialView ?? HOME_VIEW;
    let map: MapLibreMap;

    try {
      map = new MapLibreMap({
        container,
        style: mapStyle(visualizationRef.current),
        center: [start.longitude, start.latitude],
        zoom: start.zoom,
        minZoom: 0.6,
        maxZoom: 7,
        maxBounds: [[-180, -84], [180, 84]],
        renderWorldCopies: false,
        attributionControl: false,
        fadeDuration: reducedMotion() ? 0 : 180,
      });
    } catch (error: unknown) {
      onErrorRef.current(error instanceof Error ? error.message : "The interactive map could not start.");
      return;
    }

    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false, showZoom: true }), "top-right");
    map.addControl(new AttributionControl({ compact: true }), "bottom-right");

    const findCountry = (key: string): MapCountryFeature | undefined => geography.features.find((feature) => feature.properties.mapKey === key);

    const fitCountry = (key: string): void => {
      const country = findCountry(key);
      if (!country) return;
      const bounds = boundsFor(country);
      if (bounds.isEmpty()) return;
      map.fitBounds(bounds, {
        padding: { top: 72, right: 72, bottom: 72, left: 72 },
        maxZoom: 4.9,
        duration: reducedMotion() ? 0 : 650,
      });
    };

    map.on("load", () => {
      const source = map.getSource("countries");
      if (source instanceof GeoJSONSource) source.setData(visualizationRef.current);
      const key = selectedKeyRef.current;
      if (key) {
        map.setFilter("countries-selected", ["==", ["get", "mapKey"], key]);
        map.setFilter("countries-selected-line", ["==", ["get", "mapKey"], key]);
        fitCountry(key);
      }
    });

    map.on("click", "countries-fill", (event) => {
      const key = event.features?.[0]?.properties?.mapKey;
      if (typeof key !== "string") return;
      const country = findCountry(key);
      if (country) onSelectRef.current(country);
    });

    map.on("mousemove", "countries-fill", (event) => {
      const key = event.features?.[0]?.properties?.mapKey;
      const nextKey = typeof key === "string" ? key : null;
      map.getCanvas().style.cursor = nextKey ? "pointer" : "";
      map.setFilter("countries-hover", ["==", ["get", "mapKey"], nextKey ?? NONE_FILTER_KEY]);
      if (nextKey !== lastHoverKey.current) {
        lastHoverKey.current = nextKey;
        onHoverRef.current(nextKey ? findCountry(nextKey) ?? null : null);
      }
    });

    map.on("mouseleave", "countries-fill", () => {
      map.getCanvas().style.cursor = "";
      map.setFilter("countries-hover", ["==", ["get", "mapKey"], NONE_FILTER_KEY]);
      lastHoverKey.current = null;
      onHoverRef.current(null);
    });

    map.on("moveend", () => {
      const center = map.getCenter();
      onViewChangeRef.current({ longitude: center.lng, latitude: center.lat, zoom: map.getZoom() });
    });

    map.on("error", (event) => {
      const message = event.error instanceof Error ? event.error.message : "The map reported a rendering error.";
      onErrorRef.current(message);
    });

    return () => {
      mapRef.current = null;
      onHoverRef.current(null);
      map.remove();
    };
  }, [geography, initialView]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const source = map.getSource("countries");
    if (source instanceof GeoJSONSource) source.setData(visualizedGeography);
  }, [visualizedGeography]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const key = selectedKey ?? NONE_FILTER_KEY;
    map.setFilter("countries-selected", ["==", ["get", "mapKey"], key]);
    map.setFilter("countries-selected-line", ["==", ["get", "mapKey"], key]);

    if (selectedKey) {
      const country = geography.features.find((feature) => feature.properties.mapKey === selectedKey);
      if (country) {
        const bounds = boundsFor(country);
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, {
            padding: { top: 72, right: 72, bottom: 72, left: 72 },
            maxZoom: 4.9,
            duration: reducedMotion() ? 0 : 650,
          });
        }
      }
    }
  }, [geography, selectedKey]);

  useEffect(() => {
    if (resetToken === previousResetToken.current) return;
    previousResetToken.current = resetToken;
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({
      center: [HOME_VIEW.longitude, HOME_VIEW.latitude],
      zoom: HOME_VIEW.zoom,
      duration: reducedMotion() ? 0 : 650,
    });
  }, [resetToken]);

  return (
    <div
      ref={containerRef}
      class="world-map"
      role="application"
      aria-label="Interactive mission world map. Use arrow keys to pan and plus or minus to zoom after focusing the map."
      tabIndex={0}
    />
  );
}
