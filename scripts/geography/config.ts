export const NATURAL_EARTH_VERSION = "5.1.1";
export const NATURAL_EARTH_DATASET = "ne_110m_admin_0_countries";
export const NATURAL_EARTH_URL = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v${NATURAL_EARTH_VERSION}/geojson/${NATURAL_EARTH_DATASET}.geojson`;
export const WORLD_MAP_OUTPUT = new URL("../../public/maps/world-countries.geojson", import.meta.url);
export const SOURCE_REGISTRY = new URL("../../data/source-registry.json", import.meta.url);
