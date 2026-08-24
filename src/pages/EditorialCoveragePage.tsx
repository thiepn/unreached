import { ArrowRight, BookOpenText, Database, Search, ShieldCheck } from "lucide-preact";
import { useMemo, useState } from "preact/hooks";

import { hrefFor } from "../app/router";
import { editorialCoverageRegionFor, useEditorialContext } from "../context";
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
  const [region, setRegion] = useState("");

  const profiles = useMemo(() => [...(editorial.dataset?.profiles ?? [])].sort((a, b) => a.identity.verifiedPeopleName.localeCompare(b.identity.verifiedPeopleName, "en")), [editorial.dataset]);
  const countries = useMemo(() => {
    const values = new Map<string, string>();
    for (const profile of profiles) {
      for (const iso3 of profile.identity.countryIso3Anchors) values.set(iso3, countryNameFor(iso3, geography.countries));
    }
    return [...values.entries()].sort((a, b) => a[1].localeCompare(b[1], "en"));
  }, [profiles, geography.countries]);

  const regions = useMemo(() => {
    const values = new Map<string, { profiles: number; countries: Set<string> }>();
    for (const profile of profiles) {
      const anchors = profile.identity.countryIso3Anchors.length ? profile.identity.countryIso3Anchors : [""];
      const seen = new Set<string>();
      for (const iso3 of anchors) {
        const label = editorialCoverageRegionFor(iso3);
        if (seen.has(label)) continue;
        seen.add(label);
        const current = values.get(label) ?? { profiles: 0, countries: new Set<string>() };
        current.profiles += 1;
        if (iso3) current.countries.add(iso3);
        values.set(label, current);
      }
    }
    return [...values.entries()].sort((a, b) => a[0].localeCompare(b[0], "en"));
  }, [profiles]);

  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("en");
    return profiles.filter((profile) => {
      if (country && !profile.identity.countryIso3Anchors.includes(country)) return false;
      if (region && !profile.identity.countryIso3Anchors.some((iso3) => editorialCoverageRegionFor(iso3) === region)) return false;
      if (!needle) return true;
      const haystack = [
        profile.identity.verifiedPeopleName,
        String(profile.peid),
        ...profile.identity.pgidAnchors,
        ...profile.identity.countryIso3Anchors,
        ...profile.identity.languageIso6393Anchors,
        ...profile.identity.countryIso3Anchors.map((iso3) => countryNameFor(iso3, geography.countries)),
        ...profile.identity.countryIso3Anchors.map((iso3) => editorialCoverageRegionFor(iso3)),
      ].join(" ").toLocaleLowerCase("en");
      return haystack.includes(needle);
    });
  }, [profiles, query, country, region, geography.countries]);

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
        <div><span>Editorial regions</span><strong>{regions.length}</strong><small>Broad navigation groupings, not mission regions</small></div>
        <div><span>Tier 3 published</span><strong>{tierThreeCount}</strong><small>Passed the highest current editorial gate</small></div>
      </div>

      <section class="editorial-region-distribution" aria-labelledby="editorial-region-distribution-title">
        <div class="editorial-region-distribution__heading">
          <div><span class="eyebrow">Coverage distribution</span><h2 id="editorial-region-distribution-title">Broader, still intentionally partial.</h2></div>
          <p>Regional spread is shown to expose editorial gaps. It is not a quota, a ranking, or evidence that these regions have greater mission priority.</p>
        </div>
        <div class="editorial-region-distribution__grid">
          {regions.map(([label, value]) => (
            <button type="button" class={region === label ? "is-active" : ""} onClick={() => setRegion((current) => current === label ? "" : label)} key={label} aria-pressed={region === label}>
              <span>{label}</span><strong>{value.profiles}</strong><small>{value.countries.size} {value.countries.size === 1 ? "country" : "countries"}</small>
            </button>
          ))}
        </div>
      </section>

      <div class="editorial-coverage-controls editorial-coverage-controls--three">
        <label class="editorial-coverage-search" for="editorial-coverage-search">
          <Search size={18} aria-hidden="true" />
          <span class="sr-only">Search reviewed profiles</span>
          <input id="editorial-coverage-search" type="search" value={query} onInput={(event) => setQuery(event.currentTarget.value)} placeholder="Search name, country, region, language, PEID or PGID" autoComplete="off" />
        </label>
        <label>Region<select value={region} onChange={(event) => setRegion(event.currentTarget.value)}><option value="">All editorial regions</option>{regions.map(([label]) => <option value={label} key={label}>{label}</option>)}</select></label>
        <label>Country<select value={country} onChange={(event) => setCountry(event.currentTarget.value)}><option value="">All represented countries</option>{countries.map(([iso3, name]) => <option value={iso3} key={iso3}>{name}</option>)}</select></label>
      </div>

      <div class="editorial-coverage-result-count" aria-live="polite">Showing {results.length} of {profiles.length} reviewed profiles{region ? ` · ${region}` : ""}</div>

      {results.length ? (
        <div class="editorial-coverage-grid" data-editorial-coverage-grid>
          {results.map((profile) => {
            const iso3 = profile.identity.countryIso3Anchors[0] ?? "";
            const countryName = iso3 ? countryNameFor(iso3, geography.countries) : "Country not recorded";
            const regionName = editorialCoverageRegionFor(iso3);
            return (
              <a class="editorial-coverage-card" href={hrefFor(`/peoples/${profile.peid}`)} key={profile.peopleEntityId} data-editorial-peid={profile.peid} data-editorial-region={regionName}>
                <div class="editorial-coverage-card__top"><span>Tier {profile.review.qualityTier} · {profile.review.status}</span><ArrowRight size={18} aria-hidden="true" /></div>
                <h2>{profile.identity.verifiedPeopleName}</h2>
                <p>{countryName} · {regionName}</p>
                <small>{profile.identity.languageIso6393Anchors.join(", ")} · PEID {profile.peid} · {profile.identity.pgidAnchors.join(", ")}</small>
                <strong>Read reviewed context</strong>
              </a>
            );
          })}
        </div>
      ) : (
        <div class="editorial-coverage-empty"><strong>No reviewed profiles match.</strong><p>Clear the search, region or country filter to return to all currently published editorial coverage.</p><button type="button" onClick={() => { setQuery(""); setCountry(""); setRegion(""); }}>Clear filters</button></div>
      )}
    </section>
  );
}
