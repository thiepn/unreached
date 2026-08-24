import type { RuntimePeopleContext, RuntimePeopleEntity } from "../providers/peoplegroups";

export interface GuidedPeopleStart {
  entity: RuntimePeopleEntity;
  selectionNote: string;
}

export const GUIDED_DISCOVERY_METHOD = "GSEC 0–3 records with a known population estimate, ordered by the reported source estimate and diversified by country where possible. This is a discovery heuristic, not a ranking of mission importance.";

function firstContext(entity: RuntimePeopleEntity): RuntimePeopleContext | null {
  return entity.contexts[0] ?? null;
}

function eligible(entity: RuntimePeopleEntity): boolean {
  const context = firstContext(entity);
  return Boolean(
    context
    && entity.reach.unreachedContexts > 0
    && entity.population.complete
    && entity.population.knownValue > 0,
  );
}

export function buildGuidedPeopleStarts(peoples: RuntimePeopleEntity[], limit = 3): GuidedPeopleStart[] {
  if (limit <= 0) return [];

  const ranked = peoples
    .filter(eligible)
    .slice()
    .sort((a, b) => b.population.knownValue - a.population.knownValue || a.displayName.localeCompare(b.displayName, "en"));

  const selected: RuntimePeopleEntity[] = [];
  const selectedIds = new Set<string>();
  const selectedCountries = new Set<string>();

  for (const entity of ranked) {
    const country = firstContext(entity)?.country.iso3;
    if (!country || selectedCountries.has(country)) continue;
    selected.push(entity);
    selectedIds.add(entity.id);
    selectedCountries.add(country);
    if (selected.length >= limit) break;
  }

  if (selected.length < limit) {
    for (const entity of ranked) {
      if (selectedIds.has(entity.id)) continue;
      selected.push(entity);
      selectedIds.add(entity.id);
      if (selected.length >= limit) break;
    }
  }

  return selected.map((entity, index) => ({
    entity,
    selectionNote: index === 0
      ? "Large known-population GSEC 0–3 source record"
      : "Additional country-context starting point",
  }));
}

export function selectCountryStartingContext(contexts: RuntimePeopleContext[]): RuntimePeopleContext | null {
  return contexts
    .filter((context) => context.reach.classification === "unreached" && context.population.value !== null && context.population.value > 0)
    .slice()
    .sort((a, b) => (b.population.value ?? 0) - (a.population.value ?? 0) || a.displayName.localeCompare(b.displayName, "en"))[0] ?? null;
}
