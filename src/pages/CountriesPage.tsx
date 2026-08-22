import { ArrowRight, Database, Globe2, RefreshCw, Search } from "lucide-preact";
import { useMemo, useState } from "preact/hooks";

import { hrefFor } from "../app/router";
import { formatCount, useLiveCountryExplorer } from "../countries";
import { useWorldGeography } from "../map/geography";
import type { MapCountryFeature } from "../map/types";

function routeCode(country: MapCountryFeature): string | null {
  const code = country.properties.iso3 ?? country.properties.adminA3;
  return code && /^[A-Z]{3}$/.test(code) ? code : null;
}

function contextCoverage(known: number, total: number): string {
  if (!total) return "No contexts";
  if (known === total) return "Population known for all contexts";
  return `Population known for ${known}/${total} contexts`;
}

export function CountriesPage() {
  const geography = useWorldGeography();
  const intelligence = useLiveCountryExplorer();
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
          <p class="lead">Browse Natural Earth geography with live PeopleGroups.org country-context records. Counts describe source people-group records, not national census totals.</p>
        </div>
        <div class="countries-hero__mark" aria-hidden="true"><Globe2 size={34} /></div>
      </header>

      {intelligence.warning ? (
        <div class="country-data-notice" role="status"><Database size={19} aria-hidden="true" /><div><strong>Showing cached mission data</strong><p>{intelligence.warning}</p></div></div>
      ) : null}
      {!intelligence.loading && intelligence.error ? (
        <div class="country-data-notice" role="alert"><Database size={19} aria-hidden="true" /><div><strong>Live mission data is temporarily unavailable</strong><p>{intelligence.error}</p><button type="button" class="people-reset-filters" onClick={intelligence.retry}><RefreshCw size={15} aria-hidden="true" /> Retry</button></div></div>
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
      {intelligence.loading ? <div class="country-index-state" role="status">Loading PeopleGroups.org data{intelligence.progress ? `… ${intelligence.progress.loadedPages}/${intelligence.progress.totalPages}` : "…"}</div> : null}
      {geography.error ? <div class="country-index-state country-index-state--error" role="alert">{geography.error}</div> : null}

      {!geography.loading && !geography.error ? (
        <>
          <div class="countries-result-count" aria-live="polite">{countries.length} {countries.length === 1 ? "country" : "countries"}{intelligence.ready ? ` · ${intelligence.totalRecords} live people-country records loaded` : ""}</div>
          <div class="country-card-grid">
            {countries.map((country) => {
              const code = routeCode(country)!;
              const record = intelligence.countriesByIso3.get(code);
              return (
                <a class="country-card" href={hrefFor(`/countries/${code}`)} key={`${country.properties.mapKey}-${code}`}>
                  <div class="country-card__top">
                    <div>
                      <span class="country-card__code">{code}</span>
                      <h2>{record?.name ?? country.properties.name}</h2>
                    </div>
                    <ArrowRight size={18} aria-hidden="true" />
                  </div>
                  <p>{record?.regionName ?? country.properties.continent ?? "World"}</p>
                  {record ? (
                    <dl class="country-card__metrics">
                      <div><dt>People contexts</dt><dd>{record.summary.peopleContextCount}</dd></div>
                      <div><dt>Unreached contexts</dt><dd>{record.summary.unreachedContextCount}</dd></div>
                      <div><dt>Known represented population</dt><dd>{formatCount(record.summary.knownPopulation)}</dd></div>
                      <div><dt>Coverage</dt><dd>{contextCoverage(record.summary.populationKnownContextCount, record.summary.peopleContextCount)}</dd></div>
                    </dl>
                  ) : <span class="country-card__pending">No PeopleGroups.org country-context records</span>}
                </a>
              );
            })}
          </div>
        </>
      ) : null}
    </section>
  );
}
