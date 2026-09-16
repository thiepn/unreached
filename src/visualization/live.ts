import { useMemo } from "preact/hooks";

import {
  PEOPLE_GROUPS_ATTRIBUTION,
  usePeopleGroupsRuntimeStore,
  type VisibleCountryRecord,
} from "../providers/peoplegroups";
import {
  liveMissionAvailabilitySchema,
  liveMissionCountrySummarySchema,
  type LiveMissionAvailability,
  type LiveMissionCountrySummary,
} from "./liveTypes";

export interface LiveMissionPeoplePreview {
  peid: number;
  name: string;
  population: number | null;
  language: string | null;
  religion: string | null;
}

export interface LiveMissionCountryBrief {
  iso3: string;
  name: string;
  regionName: string | null;
  subregionName: string | null;
  representedPopulation: number;
  peopleContextCount: number;
  unreachedContextCount: number;
  topUnreachedPeople: LiveMissionPeoplePreview[];
}

function ratio(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.min(100, Math.max(0, numerator / denominator * 100));
}

function sumKnownPopulation(record: VisibleCountryRecord, predicate: (context: VisibleCountryRecord["contexts"][number]) => boolean): number {
  return record.contexts.reduce((sum, context) => {
    const population = context.population.value;
    return population !== null && predicate(context) ? sum + population : sum;
  }, 0);
}

export function buildLiveMissionCountrySummary(record: VisibleCountryRecord): LiveMissionCountrySummary {
  const gsecKnownContextCount = record.contexts.filter((context) => context.reach.gsec.code !== null).length;
  const gsecKnownPopulation = sumKnownPopulation(record, (context) => context.reach.gsec.code !== null);
  const unreachedKnownPopulation = sumKnownPopulation(record, (context) => context.reach.classification === "unreached");

  return liveMissionCountrySummarySchema.parse({
    iso3: record.iso3,
    name: record.name,
    peopleContextCount: record.summary.peopleContextCount,
    unreachedContextCount: record.summary.unreachedContextCount,
    otherContextCount: record.summary.otherContextCount,
    unknownContextCount: record.summary.unknownContextCount,
    gsecKnownContextCount,
    populationKnownContextCount: record.summary.populationKnownContextCount,
    knownPopulation: record.summary.knownPopulation,
    gsecKnownPopulation,
    unreachedKnownPopulation,
    unreachedPopulationShare: ratio(unreachedKnownPopulation, gsecKnownPopulation),
    unreachedContextShare: ratio(record.summary.unreachedContextCount, gsecKnownContextCount),
    gsecCoverage: ratio(gsecKnownContextCount, record.summary.peopleContextCount),
    gsecPopulationCoverage: ratio(gsecKnownPopulation, record.summary.knownPopulation),
    populationCoverage: ratio(record.summary.populationKnownContextCount, record.summary.peopleContextCount),
    sourceUpdatedAt: record.sourceUpdatedAt,
    denominator: record.summary.denominator,
    methodologyVersion: "u12d-imb-gsec-map-v1",
  });
}

export function buildLiveMissionCountrySummaries(records: VisibleCountryRecord[]): LiveMissionCountrySummary[] {
  return records.map(buildLiveMissionCountrySummary).sort((a, b) => a.iso3.localeCompare(b.iso3));
}

export function buildLiveMissionCountryBrief(record: VisibleCountryRecord): LiveMissionCountryBrief {
  return {
    iso3: record.iso3,
    name: record.name,
    regionName: record.regionName,
    subregionName: record.subregionName,
    representedPopulation: record.summary.knownPopulation,
    peopleContextCount: record.summary.peopleContextCount,
    unreachedContextCount: record.summary.unreachedContextCount,
    topUnreachedPeople: record.contexts
      .filter((context) => context.reach.classification === "unreached")
      .sort((a, b) => (b.population.value ?? -1) - (a.population.value ?? -1) || a.displayName.localeCompare(b.displayName, "en"))
      .slice(0, 5)
      .map((context) => ({
        peid: context.peid,
        name: context.displayName,
        population: context.population.value,
        language: context.language.name,
        religion: context.religion.name ?? context.religion.displayName,
      })),
  };
}

export function buildLiveMissionCountryBriefs(records: VisibleCountryRecord[]): LiveMissionCountryBrief[] {
  return records.map(buildLiveMissionCountryBrief).sort((a, b) => a.name.localeCompare(b.name, "en"));
}

export const LIVE_MISSION_AVAILABILITY: LiveMissionAvailability = liveMissionAvailabilitySchema.parse({
  schemaVersion: 1,
  available: true,
  fixture: false,
  mode: "runtime-api",
  datasetUrl: null,
  reason: null,
  sourceIds: [PEOPLE_GROUPS_ATTRIBUTION.sourceId],
  attributions: [PEOPLE_GROUPS_ATTRIBUTION],
});

const missionSummaryCache = new WeakMap<VisibleCountryRecord[], LiveMissionCountrySummary[]>();
const missionBriefCache = new WeakMap<VisibleCountryRecord[], LiveMissionCountryBrief[]>();

function sharedMissionSummaries(records: VisibleCountryRecord[]): LiveMissionCountrySummary[] {
  const cached = missionSummaryCache.get(records);
  if (cached) return cached;
  const summaries = buildLiveMissionCountrySummaries(records);
  missionSummaryCache.set(records, summaries);
  return summaries;
}

function sharedMissionBriefs(records: VisibleCountryRecord[]): LiveMissionCountryBrief[] {
  const cached = missionBriefCache.get(records);
  if (cached) return cached;
  const briefs = buildLiveMissionCountryBriefs(records);
  missionBriefCache.set(records, briefs);
  return briefs;
}

export function useLiveMissionVisualization(enabled = true) {
  const runtime = usePeopleGroupsRuntimeStore(enabled);
  const countries = useMemo(() => runtime.ready ? sharedMissionSummaries(runtime.countries) : [], [runtime.ready, runtime.countries]);
  const countryBriefs = useMemo(() => runtime.ready ? sharedMissionBriefs(runtime.countries) : [], [runtime.ready, runtime.countries]);
  const countriesByIso3 = useMemo(() => new Map(countries.map((summary) => [summary.iso3, summary])), [countries]);
  const countryBriefsByIso3 = useMemo(() => new Map(countryBriefs.map((brief) => [brief.iso3, brief])), [countryBriefs]);

  return {
    status: LIVE_MISSION_AVAILABILITY,
    countries,
    countryBriefs,
    countriesByIso3,
    countryBriefsByIso3,
    loading: runtime.loading,
    ready: runtime.ready,
    error: runtime.error,
    warning: runtime.warning,
    stale: runtime.stale,
    source: runtime.source,
    loadedAt: runtime.loadedAt,
    progress: runtime.progress,
    retry: runtime.retry,
  };
}
