import { ArrowRight, Database, Globe2, Search } from "lucide-preact";
import { useMemo, useState } from "preact/hooks";

import { hrefFor } from "../app/router";
import { formatCount, formatPercent, useCountryExplorer } from "../countries";
import { useWorldGeography } from "../map/geography";
import type { MapCountryFeature } from "../map/types";

function routeCode(country: MapCountryFeature): string | null {
  const code = country.properties.iso3 ?? country.properties.adminA3;
  return code && /^[A-Z]{3}$/.test(code) ? code : null;
}

export function CountriesPage() {
  const geography = useWorldGeography();
  const intelligence = useCountryExplorer();
  const [query, setQuery] = useState("");

  const countries = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("en");
    return geography.countries
      .filter((country) => routeCode(country) !== null)
      .filter((country) => !normalized || [country.properties.name, country.properties.iso3, country.properties.adminA3, country.properties.continent]
        .some((value) => value?.toLocaleLowerCase("en").includes(normalized)));
  }, [geography.countries, query]);

  return (
    <section class="countries-page" aria-labelledby="countries-title">
      <header class="countries-hero">
        <div>
          <div class="eyebrow">Country Explorer</div>
          <h1 id="countries-title" class="display-title">From nations to peoples.</h1>
          <p class="lead">Browse countries geographically now, then inspect mission context, unreached peoples, languages and Scripture access wherever publishable data is available.</p>
        </div>
        <div class="countries-hero__mark" aria-hidden="true"><Globe2 size={34} /></div>
      </header>

      {!intelligence.loading && !intelligence.dataset ? (
        <div class="country-data-notice" role="note">
          <Database size={19} aria-hidden="true" />
          <div>
            <strong>Country mission data is release-gated</strong>
            <p>{intelligence.error ?? intelligence.status?.reason ?? "Geographic browsing remains available while source-derived country records are not yet published."}</p>
          </div>
        </div>
      ) : null}

      <label class="countries-search" for="countries-search">
        <Search size={19} aria-hidden="true" />
        <span class="sr-only">Search countries</span>
        <input
          id="countries-search"
          type="search"
          value={query}
          onInput={(event) => setQuery(event.currentTarget.value)}
          placeholder="Search country, code or continent"
          autoComplete="off"
        />
      </label>

      {geography.loading ? <div class="country-index-state" role="status">Loading country geography…</div> : null}
      {geography.error ? <div class="country-index-state country-index-state--error" role="alert">{geography.error}</div> : null}

      {!geography.loading && !geography.error ? (
        <>
          <div class="countries-result-count" aria-live="polite">{countries.length} {countries.length === 1 ? "country" : "countries"}</div>
          <div class="country-card-grid">
            {countries.map((country) => {
              const code = routeCode(country)!;
              const record = intelligence.countriesByIso3.get(code);
              return (
                <a class="country-card" href={hrefFor(`/countries/${code}`)} key={`${country.properties.mapKey}-${code}`}>
                  <div class="country-card__top">
                    <div>
                      <span class="country-card__code">{code}</span>
                      <h2>{country.properties.name}</h2>
                    </div>
                    <ArrowRight size={18} aria-hidden="true" />
                  </div>
                  <p>{country.properties.continent ?? "World"}</p>
                  {record ? (
                    <dl class="country-card__metrics">
                      <div><dt>People groups</dt><dd>{record.mission.peopleGroupCount}</dd></div>
                      <div><dt>Unreached</dt><dd>{formatPercent(record.mission.unreachedShare)}</dd></div>
                      <div><dt>Represented</dt><dd>{formatCount(record.mission.knownPopulation)}</dd></div>
                    </dl>
                  ) : <span class="country-card__pending">Mission data unavailable</span>}
                </a>
              );
            })}
          </div>
        </>
      ) : null}
    </section>
  );
}
