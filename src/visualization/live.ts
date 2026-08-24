import { useMemo } from "preact/hooks";

import {
  PEOPLE_GROUPS_ATTRIBUTION,
  buildVisibleCountryRecords,
  usePeopleGroupsRuntimeStore,
  type VisibleCountryRecord,
} from "../providers/peoplegroups";
import {
  liveMissionAvailabilitySchema,
  liveMissionCountrySummarySchema,
  type LiveMissionAvailability,
  type LiveMissionCountrySummary,
} from "./liveTypes";

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

export function useLiveMissionVisualization(enabled = true) {
  const runtime = usePeopleGroupsRuntimeStore(enabled);
  const countries = useMemo(() => {
    if (!runtime.ready) return [];
    return buildLiveMissionCountrySummaries(buildVisibleCountryRecords(runtime.contexts, runtime.countrySummaries));
  }, [runtime.ready, runtime.contexts, runtime.countrySummaries]);
  const countriesByIso3 = useMemo(() => new Map(countries.map((summary) => [summary.iso3, summary])), [countries]);

  return {
    status: LIVE_MISSION_AVAILABILITY,
    countries,
    countriesByIso3,
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
