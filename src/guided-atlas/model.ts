import type { AtlasRegionSummary } from "../geography/regions";
import type { RuntimePeopleEntity } from "../providers/peoplegroups";
import type { LiveMissionCountrySummary } from "../visualization/liveTypes";

export interface GuidedRegionEssay {
  title: string;
  paragraphs: string[];
  facts: Array<{ label: string; value: string }>;
  methodNote: string;
}

export interface GuidedRegionPathway {
  id: string;
  regionId: string;
  regionName: string;
  countryIso3: string;
  countryName: string;
  sourcePeopleId: number;
  peopleName: string;
  editorialDepth: "reviewed" | "source";
  steps: Array<{
    id: "region" | "country" | "people" | "prayer";
    label: string;
    href: string;
  }>;
}

export interface GuidedRegionAtlas {
  schemaVersion: 1;
  regionId: string;
  regionName: string;
  essay: GuidedRegionEssay;
  pathways: GuidedRegionPathway[];
  selectionMethod: string;
  boundaries: string[];
}

export interface GuidedJourneyState {
  regionId: string;
  focusPeid: number;
}

function compactCount(value: number): string {
  return new Intl.NumberFormat("en", {
    notation: value >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

function byName(a: RuntimePeopleEntity, b: RuntimePeopleEntity): number {
  return a.displayName.localeCompare(b.displayName, "en") || a.peid - b.peid;
}

function peopleCountryIso3(entity: RuntimePeopleEntity): string | null {
  return entity.contexts[0]?.country.iso3 ?? null;
}

function peopleCountryName(entity: RuntimePeopleEntity): string | null {
  return entity.contexts[0]?.country.name ?? null;
}

function evenlySample<T>(values: T[], limit: number): T[] {
  if (values.length <= limit) return values;
  if (limit <= 1) return values.slice(0, 1);

  const selected: T[] = [];
  const used = new Set<number>();
  for (let index = 0; index < limit; index += 1) {
    const position = Math.round(index * (values.length - 1) / (limit - 1));
    if (used.has(position)) continue;
    used.add(position);
    selected.push(values[position]!);
  }
  return selected;
}

export function guidedJourneyPath(path: string, regionId: string, focusPeid: number): string {
  const query = new URLSearchParams({
    journey: regionId,
    focus: String(focusPeid),
  });
  return `${path}?${query.toString()}`;
}

export function parseGuidedJourney(params: URLSearchParams): GuidedJourneyState | null {
  const regionId = params.get("journey")?.trim().toLocaleLowerCase("en") ?? "";
  const focusRaw = params.get("focus") ?? "";
  const focusPeid = Number(focusRaw);
  if (!/^[a-z0-9-]+$/.test(regionId)) return null;
  if (!Number.isSafeInteger(focusPeid) || focusPeid <= 0) return null;
  return { regionId, focusPeid };
}

function regionalEssay(
  region: AtlasRegionSummary,
  missionByIso3: ReadonlyMap<string, LiveMissionCountrySummary>,
): GuidedRegionEssay {
  const missionCountries = region.countries.filter((country) => {
    const iso3 = country.properties.iso3 ?? country.properties.adminA3;
    return Boolean(iso3 && missionByIso3.has(iso3));
  });
  const knownMissionContexts = missionCountries.reduce((sum, country) => {
    const iso3 = country.properties.iso3 ?? country.properties.adminA3;
    return sum + (iso3 ? missionByIso3.get(iso3)?.peopleContextCount ?? 0 : 0);
  }, 0);
  const unreachedContexts = missionCountries.reduce((sum, country) => {
    const iso3 = country.properties.iso3 ?? country.properties.adminA3;
    return sum + (iso3 ? missionByIso3.get(iso3)?.unreachedContextCount ?? 0 : 0);
  }, 0);
  const representedPopulation = missionCountries.reduce((sum, country) => {
    const iso3 = country.properties.iso3 ?? country.properties.adminA3;
    return sum + (iso3 ? missionByIso3.get(iso3)?.knownPopulation ?? 0 : 0);
  }, 0);

  return {
    title: `Reading ${region.name} through the atlas`,
    paragraphs: [
      `${region.name} is used here as a Natural Earth continent grouping, not as a claim that every country or community inside it shares one culture, history, or mission situation. The atlas currently contains ${region.countryCount} navigable countries and areas in this grouping.`,
      `Current PeopleGroups.org data supplies country-context records in ${missionCountries.length} of those countries or areas. Across those records, the atlas represents ${knownMissionContexts} people-group country contexts, including ${unreachedContexts} source records in GSEC 0–3. Known population estimates across the represented source records sum to ${compactCount(representedPopulation)}; this is not a regional census population.`,
      "The guided path below moves from regional geography into one country, then one source-grounded people profile, then focused prayer. It is a learning sequence, not a ranking of countries, peoples, need, urgency, or missionary importance.",
    ],
    facts: [
      { label: "Natural Earth countries/areas", value: String(region.countryCount) },
      { label: "Countries with mission-source records", value: String(missionCountries.length) },
      { label: "People-group country contexts", value: String(knownMissionContexts) },
      { label: "GSEC 0–3 source contexts", value: String(unreachedContexts) },
    ],
    methodNote: "Regional prose is generated only from current Natural Earth structure and PeopleGroups.org source summaries. It contains no generated cultural, historical, political or spiritual narrative.",
  };
}

export function buildGuidedRegionAtlas(input: {
  region: AtlasRegionSummary;
  missionByIso3: ReadonlyMap<string, LiveMissionCountrySummary>;
  peoples: readonly RuntimePeopleEntity[];
  reviewedPeids: ReadonlySet<number>;
  pathwayLimit?: number;
}): GuidedRegionAtlas {
  const countryCodes = new Set(
    input.region.countries
      .map((country) => country.properties.iso3 ?? country.properties.adminA3)
      .filter((value): value is string => Boolean(value && /^[A-Z]{3}$/.test(value))),
  );

  const eligible = input.peoples
    .filter((entity) => entity.reach.classification === "unreached-only")
    .filter((entity) => {
      const iso3 = peopleCountryIso3(entity);
      return Boolean(iso3 && countryCodes.has(iso3));
    });

  const byCountry = new Map<string, RuntimePeopleEntity[]>();
  for (const entity of eligible) {
    const iso3 = peopleCountryIso3(entity);
    if (!iso3) continue;
    const group = byCountry.get(iso3) ?? [];
    group.push(entity);
    byCountry.set(iso3, group);
  }

  const countryCandidates = [...byCountry.entries()].flatMap(([iso3, people]) => {
    const ordered = [...people].sort(byName);
    const reviewed = ordered.filter((entity) => input.reviewedPeids.has(entity.peid));
    const selected = reviewed[0] ?? ordered[0] ?? null;
    if (!selected) return [];
    return [{
      iso3,
      countryName: peopleCountryName(selected) ?? iso3,
      selected,
      editorialDepth: input.reviewedPeids.has(selected.peid) ? "reviewed" as const : "source" as const,
    }];
  }).sort((a, b) => a.countryName.localeCompare(b.countryName, "en") || a.iso3.localeCompare(b.iso3));

  const limit = Math.max(1, Math.min(8, input.pathwayLimit ?? 6));
  const sampled = evenlySample(countryCandidates, limit);

  const pathways: GuidedRegionPathway[] = sampled.map((item) => {
    const regionPath = `/regions/${input.region.id}`;
    const countryPath = guidedJourneyPath(`/countries/${item.iso3}`, input.region.id, item.selected.peid);
    const peoplePath = guidedJourneyPath(`/peoples/${item.selected.peid}`, input.region.id, item.selected.peid);
    const prayerPath = guidedJourneyPath(`/pray/${item.selected.peid}`, input.region.id, item.selected.peid);
    return {
      id: `guided-atlas:${input.region.id}:${item.iso3}:${item.selected.peid}`,
      regionId: input.region.id,
      regionName: input.region.name,
      countryIso3: item.iso3,
      countryName: item.countryName,
      sourcePeopleId: item.selected.peid,
      peopleName: item.selected.displayName,
      editorialDepth: item.editorialDepth,
      steps: [
        { id: "region", label: `Read ${input.region.name}`, href: regionPath },
        { id: "country", label: `Explore ${item.countryName}`, href: countryPath },
        { id: "people", label: `Meet ${item.selected.displayName}`, href: peoplePath },
        { id: "prayer", label: `Pray for ${item.selected.displayName}`, href: prayerPath },
      ],
    };
  });

  return {
    schemaVersion: 1,
    regionId: input.region.id,
    regionName: input.region.name,
    essay: regionalEssay(input.region, input.missionByIso3),
    pathways,
    selectionMethod: "Eligible pathways use current GSEC 0–3 PeopleGroups.org records inside the Natural Earth region. Countries are ordered alphabetically and, when more than six are available, evenly sampled through that stable list. Within each selected country, a reviewed editorial profile is preferred for learning depth; otherwise the alphabetically first eligible source record is used. This is not mission-priority ranking.",
    boundaries: [
      "A guided pathway is a learning sequence, not a recommendation that one country or people matters more than another.",
      "Reviewed editorial coverage affects teaching depth only; it is not used as a mission-importance score.",
      "Regional prose is limited to current source-backed geography and mission-data summaries.",
      "Country and people links preserve their original source semantics and denominators.",
      "Prayer is offered only for the selected current GSEC 0–3 source record.",
      "Journey state is carried only in the URL query; no guided-atlas progress history is stored or synced.",
    ],
  };
}
