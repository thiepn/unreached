import { ArrowRight, Compass, Info } from "lucide-preact";

import { hrefFor } from "../app/router";
import { GUIDED_DISCOVERY_METHOD, buildGuidedPeopleStarts } from "../discovery/guided";
import { formatPeopleCount } from "../peoples";
import { entityGsecRange, type RuntimePeopleEntity } from "../providers/peoplegroups";

export function GuidedPeopleStarts({ peoples }: { peoples: RuntimePeopleEntity[] }) {
  const starts = buildGuidedPeopleStarts(peoples, 3);
  if (!starts.length) return null;

  return (
    <section class="guided-start" aria-labelledby="guided-start-heading">
      <div class="guided-start__heading">
        <div>
          <span class="eyebrow">Not sure where to begin?</span>
          <h2 id="guided-start-heading">Start with one source-backed profile.</h2>
          <p>These are stable entry points chosen from the current live dataset so you can move through the core journey without first knowing a people-group name.</p>
        </div>
        <Compass size={24} aria-hidden="true" />
      </div>

      <div class="guided-start__grid">
        {starts.map(({ entity, selectionNote }) => {
          const context = entity.contexts[0]!;
          const gsec = entityGsecRange(entity);
          return (
            <a class="guided-start-card" href={hrefFor(`/peoples/${entity.routeKey}`)} key={entity.id}>
              <span class="guided-start-card__reason">{selectionNote}</span>
              <h3>{entity.displayName}</h3>
              <p>{context.country.name} · {entity.primaryLanguage?.name ?? "Language unknown"} · {entity.primaryReligion?.name ?? "Religion unknown"}</p>
              <dl>
                <div><dt>Population</dt><dd>{formatPeopleCount(entity.population.knownValue)}</dd></div>
                <div><dt>GSEC</dt><dd>{gsec ? gsec.min : "Unknown"}</dd></div>
              </dl>
              <span class="guided-start-card__cta">Understand this profile <ArrowRight size={16} aria-hidden="true" /></span>
            </a>
          );
        })}
      </div>

      <details class="guided-start__method">
        <summary><Info size={15} aria-hidden="true" /> Why these starting points?</summary>
        <p>{GUIDED_DISCOVERY_METHOD}</p>
      </details>
    </section>
  );
}
