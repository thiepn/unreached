import type {
  RuntimeCountrySummary,
  RuntimePeopleContext,
  RuntimePeopleEntity,
} from "./types";

export const PEOPLE_GROUPS_ATTRIBUTION = {
  sourceId: "peoplegroups-org-api",
  label: "PeopleGroups.org — IMB Global Research",
  url: "https://peoplegroups.org/",
} as const;

export interface VisibleCountryBreakdown {
  key: string;
  code: string | null;
  name: string;
  contextCount: number;
  knownPopulation: number;
  representedShare: number | null;
}

export interface VisibleResourceBreakdown {
  status: string;
  contextCount: number;
  knownPopulation: number;
}

export interface VisibleCountryRecord {
  iso3: string;
  name: string;
  regionName: string | null;
  subregionName: string | null;
  summary: RuntimeCountrySummary;
  contexts: RuntimePeopleContext[];
  languages: VisibleCountryBreakdown[];
  religions: VisibleCountryBreakdown[];
  bibleAvailability: VisibleResourceBreakdown[];
  jesusFilmAvailability: VisibleResourceBreakdown[];
  sourceUpdatedAt: string | null;
}

export interface RelatedRuntimePeople {
  entity: RuntimePeopleEntity;
  relationship: "same-rop3-name" | "same-cluster" | "same-affinity-bloc";
}

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase("en").replace(/\s+/g, " ");
}

function mostCommonString(values: Array<string | null>): string | null {
  const counts = new Map<string, { value: string; count: number }>();
  for (const value of values) {
    if (!value?.trim()) continue;
    const key = normalized(value);
    const current = counts.get(key);
    counts.set(key, { value: current?.value ?? value.trim(), count: (current?.count ?? 0) + 1 });
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, "en"))[0]?.value ?? null;
}

function newestTimestamp(values: Array<string | null>): string | null {
  return values
    .filter((value): value is string => value !== null && !Number.isNaN(Date.parse(value)))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;
}

function knownPopulation(contexts: RuntimePeopleContext[]): number {
  return contexts.reduce((sum, context) => sum + (context.population.value ?? 0), 0);
}

function buildCategoricalBreakdown(
  contexts: RuntimePeopleContext[],
  select: (context: RuntimePeopleContext) => { code: string | null; name: string | null },
): VisibleCountryBreakdown[] {
  const groups = new Map<string, { code: string | null; name: string; contexts: RuntimePeopleContext[] }>();

  for (const context of contexts) {
    const value = select(context);
    if (!value.name?.trim() && !value.code?.trim()) continue;
    const name = value.name?.trim() || value.code!.trim();
    const key = value.code?.trim().toLocaleLowerCase("en") || `name:${normalized(name)}`;
    const group = groups.get(key) ?? { code: value.code?.trim() || null, name, contexts: [] };
    group.contexts.push(context);
    groups.set(key, group);
  }

  const denominator = knownPopulation(contexts);
  return [...groups.entries()].map(([key, group]) => {
    const population = knownPopulation(group.contexts);
    return {
      key,
      code: group.code,
      name: group.name,
      contextCount: group.contexts.length,
      knownPopulation: population,
      representedShare: denominator > 0 ? population / denominator * 100 : null,
    };
  }).sort((a, b) => b.knownPopulation - a.knownPopulation || b.contextCount - a.contextCount || a.name.localeCompare(b.name, "en"));
}

function buildResourceBreakdown(
  contexts: RuntimePeopleContext[],
  select: (context: RuntimePeopleContext) => string | null,
): VisibleResourceBreakdown[] {
  const groups = new Map<string, RuntimePeopleContext[]>();
  for (const context of contexts) {
    const status = select(context)?.trim() || "Unknown";
    const group = groups.get(status) ?? [];
    group.push(context);
    groups.set(status, group);
  }
  return [...groups.entries()].map(([status, group]) => ({
    status,
    contextCount: group.length,
    knownPopulation: knownPopulation(group),
  })).sort((a, b) => b.contextCount - a.contextCount || b.knownPopulation - a.knownPopulation || a.status.localeCompare(b.status, "en"));
}

export function buildVisibleCountryRecords(
  contexts: RuntimePeopleContext[],
  summaries: RuntimeCountrySummary[],
): VisibleCountryRecord[] {
  const summaryByIso3 = new Map(summaries.map((summary) => [summary.iso3, summary]));
  const byCountry = new Map<string, RuntimePeopleContext[]>();

  for (const context of contexts) {
    const group = byCountry.get(context.country.iso3) ?? [];
    group.push(context);
    byCountry.set(context.country.iso3, group);
  }

  return [...byCountry.entries()].flatMap(([iso3, group]): VisibleCountryRecord[] => {
    const summary = summaryByIso3.get(iso3);
    if (!summary) return [];
    const ordered = [...group].sort((a, b) =>
      (b.population.value ?? -1) - (a.population.value ?? -1)
      || a.displayName.localeCompare(b.displayName, "en"),
    );
    return [{
      iso3,
      name: summary.name,
      regionName: mostCommonString(ordered.map((context) => context.country.region)),
      subregionName: mostCommonString(ordered.map((context) => context.country.subregion)),
      summary,
      contexts: ordered,
      languages: buildCategoricalBreakdown(ordered, (context) => ({ code: context.language.iso6393, name: context.language.name })),
      religions: buildCategoricalBreakdown(ordered, (context) => ({ code: context.religion.code, name: context.religion.name ?? context.religion.displayName })),
      bibleAvailability: buildResourceBreakdown(ordered, (context) => context.resources.bibleAvailability),
      jesusFilmAvailability: buildResourceBreakdown(ordered, (context) => context.resources.jesusFilmAvailability),
      sourceUpdatedAt: newestTimestamp(ordered.map((context) => context.sourceUpdatedAt)),
    }];
  }).sort((a, b) => a.name.localeCompare(b.name, "en"));
}

export function entityGsecRange(entity: RuntimePeopleEntity): { min: number; max: number; knownContexts: number } | null {
  const values = entity.contexts
    .map((context) => context.reach.gsec.code)
    .filter((value): value is number => value !== null);
  if (!values.length) return null;
  return { min: Math.min(...values), max: Math.max(...values), knownContexts: values.length };
}

export function entityTaxonomy(entity: RuntimePeopleEntity): {
  affinityBloc: string | null;
  peopleCluster: string | null;
  peopleName: string | null;
  ethnographicGroup: string | null;
} {
  const context = entity.contexts[0];
  return {
    affinityBloc: context?.taxonomy.affinityBloc ?? null,
    peopleCluster: context?.taxonomy.peopleCluster ?? null,
    peopleName: context?.taxonomy.peopleName ?? null,
    ethnographicGroup: context?.taxonomy.ethnographicGroup ?? null,
  };
}

export function entityResourceBreakdown(entity: RuntimePeopleEntity): {
  bible: VisibleResourceBreakdown[];
  jesusFilm: VisibleResourceBreakdown[];
} {
  return {
    bible: buildResourceBreakdown(entity.contexts, (context) => context.resources.bibleAvailability),
    jesusFilm: buildResourceBreakdown(entity.contexts, (context) => context.resources.jesusFilmAvailability),
  };
}

export function entityEditorialContext(entity: RuntimePeopleEntity): Array<{
  pgid: string;
  countryName: string;
  peopleDescription: string | null;
  locationDescription: string | null;
}> {
  return entity.contexts
    .filter((context) => context.editorial.peopleDescription || context.editorial.locationDescription)
    .map((context) => ({
      pgid: context.pgid,
      countryName: context.country.name,
      peopleDescription: context.editorial.peopleDescription,
      locationDescription: context.editorial.locationDescription,
    }));
}

export function relatedRuntimePeople(
  entity: RuntimePeopleEntity,
  entities: RuntimePeopleEntity[],
  limit = 12,
): RelatedRuntimePeople[] {
  const taxonomy = entityTaxonomy(entity);
  const rop3Name = taxonomy.peopleName ? normalized(taxonomy.peopleName) : null;
  const cluster = taxonomy.peopleCluster ? normalized(taxonomy.peopleCluster) : null;
  const affinity = taxonomy.affinityBloc ? normalized(taxonomy.affinityBloc) : null;
  if (!rop3Name && !cluster && !affinity) return [];

  return entities
    .filter((candidate) => candidate.peid !== entity.peid)
    .flatMap((candidate): RelatedRuntimePeople[] => {
      const candidateTaxonomy = entityTaxonomy(candidate);
      const candidateRop3Name = candidateTaxonomy.peopleName ? normalized(candidateTaxonomy.peopleName) : null;
      const candidateCluster = candidateTaxonomy.peopleCluster ? normalized(candidateTaxonomy.peopleCluster) : null;
      const candidateAffinity = candidateTaxonomy.affinityBloc ? normalized(candidateTaxonomy.affinityBloc) : null;
      if (rop3Name && candidateRop3Name === rop3Name) return [{ entity: candidate, relationship: "same-rop3-name" }];
      if (cluster && candidateCluster === cluster) return [{ entity: candidate, relationship: "same-cluster" }];
      if (affinity && candidateAffinity === affinity) return [{ entity: candidate, relationship: "same-affinity-bloc" }];
      return [];
    })
    .sort((a, b) => {
      const relationRank = (value: RelatedRuntimePeople["relationship"]) => value === "same-rop3-name" ? 0 : value === "same-cluster" ? 1 : 2;
      return relationRank(a.relationship) - relationRank(b.relationship)
        || b.entity.population.knownValue - a.entity.population.knownValue
        || a.entity.displayName.localeCompare(b.entity.displayName, "en");
    })
    .slice(0, limit);
}
