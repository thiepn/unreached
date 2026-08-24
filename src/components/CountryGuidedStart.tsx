import { ArrowRight, BookOpenText, Compass, HeartHandshake, Info } from "lucide-preact";

import { hrefFor } from "../app/router";
import { useEditorialContext } from "../context";
import { formatCount } from "../countries";
import { selectCountryStartingContext } from "../discovery/guided";
import type { RuntimePeopleContext } from "../providers/peoplegroups";

export function CountryGuidedStart({ countryName, contexts }: { countryName: string; contexts: RuntimePeopleContext[] }) {
  const editorial = useEditorialContext();
  const start = selectCountryStartingContext(contexts);
  const countryIso3 = contexts[0]?.country.iso3 ?? null;
  const reviewedProfiles = countryIso3
    ? (editorial.dataset?.profiles ?? []).filter((profile) => profile.identity.countryIso3Anchors.includes(countryIso3)).sort((a, b) => a.identity.verifiedPeopleName.localeCompare(b.identity.verifiedPeopleName, "en"))
    : [];

  if (!start && !reviewedProfiles.length) return null;

  return (
    <div class="country-discovery-stack">
      {start ? (
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
      ) : null}

      {reviewedProfiles.length ? (
        <section class="country-editorial-coverage" aria-labelledby="country-editorial-coverage-heading">
          <div class="country-editorial-coverage__heading">
            <div><span class="eyebrow">Reviewed editorial coverage</span><h2 id="country-editorial-coverage-heading">Deeper context published for {countryName}</h2></div>
            <BookOpenText size={21} aria-hidden="true" />
          </div>
          <p>{reviewedProfiles.length} {reviewedProfiles.length === 1 ? "source record has" : "source records have"} a separately reviewed contextual article. This is publication coverage, not a ranking of mission importance.</p>
          <div class="country-editorial-coverage__links">
            {reviewedProfiles.map((profile) => <a href={hrefFor(`/peoples/${profile.peid}`)} key={profile.peopleEntityId}><span>{profile.identity.verifiedPeopleName}</span><small>PEID {profile.peid} · Tier {profile.review.qualityTier}</small><ArrowRight size={15} aria-hidden="true" /></a>)}
          </div>
          <a class="country-editorial-coverage__all" href={hrefFor("/coverage")}>Browse all reviewed coverage <ArrowRight size={15} aria-hidden="true" /></a>
        </section>
      ) : null}
    </div>
  );
}
