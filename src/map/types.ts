import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";

export type CountryGeometry = Polygon | MultiPolygon;

export interface MapCountryProperties {
  mapKey: string;
  iso3: string | null;
  adminA3: string | null;
  name: string;
  type: string;
  boundaryNote: string | null;
  sovereignty: string | null;
  continent: string | null;
}

export type MapCountryFeature = Feature<CountryGeometry, MapCountryProperties>;

export type WorldGeography = FeatureCollection<CountryGeometry, MapCountryProperties> & {
  unreachedMetadata: {
    sourceId: "natural-earth";
    sourceDataset: string;
    sourceVersion: string;
    sourceUrl: string;
    boundaryPresentation: "de-facto";
  };
};

export interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}
