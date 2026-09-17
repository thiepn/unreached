import type { RuntimePeopleEntity } from "../providers/peoplegroups";

export interface DiscoveryCollection {
  id: "reviewed-context" | "across-regions" | "language-pathways";
  title: string;
  description: string;
  methodNote: string;
  people: RuntimePeopleEntity[];
}

function firstCountryIso3(entity: RuntimePeopleEntity): string | null {
  return entity.contexts[0]?.country.iso3 ?? null;
}

function byName(a: RuntimePeopleEntity, b: RuntimePeopleEntity): number {
  return a.displayName.localeCompare(b.displayName, "en") || a.routeKey - b.routeKey;
}

function classifiedUnreached(entity: RuntimePeopleEntity): boolean {
  return entity.reach.classification === "unreached-only";
}

function takeUnique(
  candidates: RuntimePeopleEntity[],
  key: (entity: RuntimePeopleEntity) => string | null,
  limit: number,
): RuntimePeopleEntity[] {
  const selected: RuntimePeopleEntity[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    const value = key(candidate);
    if (!value || seen.has(value)) continue;
    seen.add(value);
    selected.push(candidate);
    if (selected.length >= limit) break;
  }
  return selected;
}

export function buildDiscoveryCollections(input: {
  peoples: RuntimePeopleEntity[];
  reviewedPeids: ReadonlySet<number>;
  regionByCountryIso3: ReadonlyMap<string, string>;
  limitPerCollection?: number;
}): DiscoveryCollection[] {
  const limit = Math.max(1, Math.min(8, input.limitPerCollection ?? 6));
  const unreached = input.peoples.filter(classifiedUnreached).slice().sort(byName);

  const reviewed = input.peoples
    .filter((entity) => input.reviewedPeids.has(entity.peid))
    .slice()
    .sort(byName)
    .slice(0, limit);

  const regionCandidates = unreached
    .filter((entity) => {
      const iso3 = firstCountryIso3(entity);
      return Boolean(iso3 && input.regionByCountryIso3.has(iso3));
    })
    .slice()
    .sort((a, b) => {
      const aRegion = input.regionByCountryIso3.get(firstCountryIso3(a) ?? "") ?? "";
      const bRegion = input.regionByCountryIso3.get(firstCountryIso3(b) ?? "") ?? "";
      return aRegion.localeCompare(bRegion, "en") || byName(a, b);
    });
  const acrossRegions = takeUnique(
    regionCandidates,
    (entity) => input.regionByCountryIso3.get(firstCountryIso3(entity) ?? "") ?? null,
    limit,
  );

  if (acrossRegions.length < limit) {
    const chosen = new Set(acrossRegions.map((entity) => entity.id));
    const chosenCountries = new Set(acrossRegions.map(firstCountryIso3).filter((value): value is string => Boolean(value)));
    for (const entity of unreached) {
      const country = firstCountryIso3(entity);
      if (!country || chosen.has(entity.id) || chosenCountries.has(country)) continue;
      acrossRegions.push(entity);
      chosen.add(entity.id);
      chosenCountries.add(country);
      if (acrossRegions.length >= limit) break;
    }
  }

  const languagePathways = takeUnique(
    unreached
      .filter((entity) => Boolean(entity.primaryLanguage?.name?.trim()))
      .slice()
      .sort((a, b) => (a.primaryLanguage?.name ?? "").localeCompare(b.primaryLanguage?.name ?? "", "en") || byName(a, b)),
    (entity) => entity.primaryLanguage?.name?.toLocaleLowerCase("en") ?? null,
    limit,
  );

  return [
    {
      id: "reviewed-context",
      title: "Reviewed context",
      description: "Open profiles with published editorial context, citations and explicit research gaps.",
      methodNote: "Editorial coverage describes research depth only. It is not a ranking of mission importance or urgency.",
      people: reviewed,
    },
    {
      id: "across-regions",
      title: "Across regions",
      description: "Start with source records from different atlas regions, then follow the geographic trail into country and people context.",
      methodNote: "Entries are selected deterministically for geographic variety from current GSEC 0–3 records. They are not scored or ranked.",
      people: acrossRegions.slice(0, limit),
    },
    {
      id: "language-pathways",
      title: "Language pathways",
      description: "Meet people groups through different reported primary languages and continue into language context where available.",
      methodNote: "Entries are selected for distinct reported language labels, not because one language or people is more important than another.",
      people: languagePathways,
    },
  ];
}
