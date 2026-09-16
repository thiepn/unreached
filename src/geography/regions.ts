import type { MapCountryFeature } from "../map/types";
import type { LiveMissionCountrySummary } from "../visualization";

export interface AtlasRegionIdentity {
  id: string;
  name: string;
}

export interface AtlasRegionSummary extends AtlasRegionIdentity {
  countries: MapCountryFeature[];
  countryCount: number;
  missionCountryCount: number;
  peopleContextCount: number;
  unreachedContextCount: number;
  knownRepresentedPopulation: number;
  unreachedKnownPopulation: number;
}

const REGION_ORDER = [
  "Africa",
  "Asia",
  "Europe",
  "North America",
  "South America",
  "Oceania",
  "Antarctica",
] as const;

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function routeCodeForCountry(country: MapCountryFeature): string | null {
  const value = country.properties.iso3 ?? country.properties.adminA3;
  return value && /^[A-Z]{3}$/.test(value) ? value : null;
}

/**
 * Phase 7 intentionally uses the Natural Earth continent field as the first
 * canonical atlas-region taxonomy. This keeps the geographic hierarchy owned
 * by the geography source instead of promoting PeopleGroups free-text Regn or
 * RegnSub labels into universal product identity.
 */
export function atlasRegionForCountry(country: MapCountryFeature): AtlasRegionIdentity | null {
  const name = country.properties.continent?.trim() ?? "";
  if (!name) return null;
  const id = slugify(name);
  return id ? { id, name } : null;
}

function regionRank(name: string): number {
  const index = REGION_ORDER.indexOf(name as (typeof REGION_ORDER)[number]);
  return index >= 0 ? index : REGION_ORDER.length;
}

export function buildAtlasRegions(
  countries: MapCountryFeature[],
  missionByIso3: Map<string, LiveMissionCountrySummary>,
): AtlasRegionSummary[] {
  const groups = new Map<string, AtlasRegionSummary>();

  for (const country of countries) {
    const code = routeCodeForCountry(country);
    const identity = atlasRegionForCountry(country);
    if (!code || !identity) continue;

    const current = groups.get(identity.id) ?? {
      ...identity,
      countries: [],
      countryCount: 0,
      missionCountryCount: 0,
      peopleContextCount: 0,
      unreachedContextCount: 0,
      knownRepresentedPopulation: 0,
      unreachedKnownPopulation: 0,
    };

    current.countries.push(country);
    current.countryCount += 1;

    const mission = missionByIso3.get(code);
    if (mission) {
      current.missionCountryCount += 1;
      current.peopleContextCount += mission.peopleContextCount;
      current.unreachedContextCount += mission.unreachedContextCount;
      current.knownRepresentedPopulation += mission.knownPopulation;
      current.unreachedKnownPopulation += mission.unreachedKnownPopulation;
    }

    groups.set(identity.id, current);
  }

  return [...groups.values()]
    .map((region) => ({
      ...region,
      countries: [...region.countries].sort((a, b) => a.properties.name.localeCompare(b.properties.name, "en")),
    }))
    .sort((a, b) => regionRank(a.name) - regionRank(b.name) || a.name.localeCompare(b.name, "en"));
}

export function findAtlasRegion(regions: AtlasRegionSummary[], id: string): AtlasRegionSummary | null {
  return regions.find((region) => region.id === id) ?? null;
}
