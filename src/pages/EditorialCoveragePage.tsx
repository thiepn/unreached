import { ArrowRight, BookOpenText, Database, Search, ShieldCheck } from "lucide-preact";
import { useMemo, useState } from "preact/hooks";

import { hrefFor } from "../app/router";
import { useEditorialContext } from "../context";
import { useWorldGeography } from "../map/geography";

function countryNameFor(iso3: string, countries: ReturnType<typeof useWorldGeography>["countries"]): string {
  const match = countries.find((country) => country.properties.iso3 === iso3 || country.properties.adminA3 === iso3);
  return match?.properties.name ?? iso3;
}

export function EditorialCoveragePage() {
  const editorial = useEditorialContext();
  const geography = useWorldGeography();
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");

  const profiles = useMemo(() => [...(editorial.dataset?.profiles ?? [])].sort((a, b) => a.identity.verifiedPeopleName.localeCompare(b.identity.verifiedPeopleName, "en")), [editorial.dataset]);
  const countries = useMemo(() => {
    const values = new Map<string, string>();
    for (const profile of profiles) {
      for (const iso3 of profile.identity.countryIso3Anchors) values.set(iso3, countryNameFor(iso3, geography.countries));
    }
    return [...values.entries()].sort((a, b) => a[1].localeCompare(b[1], "en"));
  }, [profiles, geography.countries]);

  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("en");
    return profiles.filter((profile) => {
      if (country && !profile.identity.countryIso3Anchors.includes(country)) return false;
      if (!needle) return true;
      const haystack = [
        profile.identity.verifiedPeopleName,
        String(profile.peid),
        ...profile.identity.pgidAnchors,
        ...profile.identity.countryIso3Anchors,
        ...profile.identity.languageIso6393Anchors,
        ...profile.identity.countryIso3Anchors.map((iso3) => countryNameFor(iso3, geography.countries)),
      ].join(" ").toLocaleLowerCase("en");
      return haystack.includes(needle);
    });
  }, [profiles, query, country, geography.countries]);

  if (editorial.loading || geography.loading) {
    return <section class="editorial-coverage-page editorial-coverage-page--state" role="status">Loading reviewed editorial coverage…</section>;
  }

  if (editorial.error) {
    return (
      <section class="editorial-coverage-page editorial-coverage-page--state" role="alert">
        <Database size={24} aria-hidden="true" />
        <div class="eyebrow">Reviewed coverage</div>
        <h1 class="display-title">Editorial coverage is unavailable.</h1>
        <p>{editorial.error}</p>
      </section>
    );
  }

  const tierThreeCount = profiles.filter((profile) => profile.review.qualityTier === 3 && profile.review.status === "published").length;

  return (
    <section class="editorial-coverage-page" aria-labelledby="editorial-coverage-title">
      <header class="editorial-coverage-hero">
        <div>
          <div class="eyebrow">Reviewed editorial coverage</div>
          <h1 id="editorial-coverage-title" class="display-title">Browse the profiles with deeper context.</h1>
          <p class="lead">These are the people-group source records for which Unreached has published a separately reviewed contextual article. Open one to move from source facts to cited identity, history, community context and documented access conditions.</p>
        </div>
        <div class="editorial-coverage-hero__mark" aria-hidden="true"><BookOpenText size={36} /></div>
      </header>

      <div class="editorial-coverage-guardrail" role="note">
        <ShieldCheck size={20} aria-hidden="true" />
        <div><strong>Coverage is an editorial-publication measure.</strong><p>{profiles.length} reviewed profiles does not mean these groups are more important, more urgent, or more unreached than groups without an article. It only describes which source records currently have a reviewed contextual publication in Unreached.</p></div>
      </div>

      <div class="editorial-coverage-metrics" aria-label="Editorial coverage summary">
        <div><span>Reviewed profiles</span><strong>{profiles.length}</strong><small>Published contextual articles</small></div>
        <div><span>Countries represented</span><strong>{countries.length}</strong><small>Across current reviewed profiles</small></div>
        <div><span>Tier 3 published</span><strong>{tierThreeCount}</strong><small>Passed the highest current editorial gate</small></div>
      </div>

      <div class="editorial-coverage-controls">
        <label class="editorial-coverage-search" for="editorial-coverage-search">
          <Search size={18} aria-hidden="true" />
          <span class="sr-only">Search reviewed profiles</span>
          <input id="editorial-coverage-search" type="search" value={query} onInput={(event) => setQuery(event.currentTarget.value)} placeholder="Search name, country, language, PEID or PGID" autoComplete="off" />
        </label>
        <label>Country<select value={country} onChange={(event) => setCountry(event.currentTarget.value)}><option value="">All represented countries</option>{countries.map(([iso3, name]) => <option value={iso3} key={iso3}>{name}</option>)}</select></label>
      </div>

      <div class="editorial-coverage-result-count" aria-live="polite">Showing {results.length} of {profiles.length} reviewed profiles</div>

      {results.length ? (
        <div class="editorial-coverage-grid" data-editorial-coverage-grid>
          {results.map((profile) => {
            const iso3 = profile.identity.countryIso3Anchors[0] ?? "";
            const countryName = iso3 ? countryNameFor(iso3, geography.countries) : "Country not recorded";
            return (
              <a class="editorial-coverage-card" href={hrefFor(`/peoples/${profile.peid}`)} key={profile.peopleEntityId} data-editorial-peid={profile.peid}>
                <div class="editorial-coverage-card__top"><span>Tier {profile.review.qualityTier} · {profile.review.status}</span><ArrowRight size={18} aria-hidden="true" /></div>
                <h2>{profile.identity.verifiedPeopleName}</h2>
                <p>{countryName} · {profile.identity.languageIso6393Anchors.join(", ")}</p>
                <small>PEID {profile.peid} · {profile.identity.pgidAnchors.join(", ")}</small>
                <strong>Read reviewed context</strong>
              </a>
            );
          })}
        </div>
      ) : (
        <div class="editorial-coverage-empty"><strong>No reviewed profiles match.</strong><p>Clear the search or country filter to return to all currently published editorial coverage.</p><button type="button" onClick={() => { setQuery(""); setCountry(""); }}>Clear filters</button></div>
      )}
    </section>
  );
}
