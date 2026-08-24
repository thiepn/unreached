import { ArrowRight, Compass, HeartHandshake, Info } from "lucide-preact";

import { hrefFor } from "../app/router";
import { selectCountryStartingContext } from "../discovery/guided";
import { formatCount } from "../countries";
import type { RuntimePeopleContext } from "../providers/peoplegroups";

export function CountryGuidedStart({ countryName, contexts }: { countryName: string; contexts: RuntimePeopleContext[] }) {
  const start = selectCountryStartingContext(contexts);
  if (!start) return null;

  return (
    <section class="country-guided-start" aria-labelledby="country-guided-start-heading">
      <div class="country-guided-start__copy">
        <span class="eyebrow">Start here</span>
        <h2 id="country-guided-start-heading">Understand one people in {countryName}.</h2>
        <p>Rather than beginning with the full country table, open one GSEC 0–3 source record with a known population estimate, then continue into its focused prayer guide.</p>
        <div class="country-guided-start__facts">
          <span>{start.displayName}</span>
          <span>{formatCount(start.population.value)} reported population</span>
          <span>GSEC {start.reach.gsec.code ?? "unknown"}</span>
          <span>{start.language.name ?? start.language.iso6393 ?? "Language unknown"}</span>
        </div>
      </div>
      <div class="country-guided-start__actions">
        <a href={hrefFor(`/peoples/${start.peid}`)}>Understand this profile <ArrowRight size={16} aria-hidden="true" /></a>
        <a href={hrefFor(`/pray/${start.peid}`)}>Pray for this people <HeartHandshake size={16} aria-hidden="true" /></a>
      </div>
      <details class="country-guided-start__method">
        <summary><Info size={15} aria-hidden="true" /> Selection method</summary>
        <p><Compass size={14} aria-hidden="true" /> The starting point is the largest known-population GSEC 0–3 country-context record in the current PeopleGroups.org data. It is a navigation heuristic, not a statement that this people is more important than another.</p>
      </details>
    </section>
  );
}
