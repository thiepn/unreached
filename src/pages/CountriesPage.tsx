import { ArrowRight, Database, Globe2, RefreshCw, Search } from "lucide-preact";
import { useEffect, useMemo, useState } from "preact/hooks";

import { hrefFor } from "../app/router";
import { formatCount, useLiveCountryExplorer } from "../countries";
import { useAfterFirstPaint } from "../hooks/useResponsiveWork";
import { useWorldGeography } from "../map/geography";
import type { MapCountryFeature } from "../map/types";

const COUNTRY_PAGE_SIZE = 48;

function routeCode(country: MapCountryFeature): string | null {
  const code = country.properties.iso3 ?? country.properties.adminA3;
  return code && /^[A-Z]{3}$/.test(code) ? code : null;
}

export function CountriesPage() {
  const geography = useWorldGeography();
  const dataStart = useAfterFirstPaint();
  const intelligence = useLiveCountryExplorer(dataStart);
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(COUNTRY_PAGE_SIZE);

  const countries = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("en");
    return geography.countries
      .filter((country) => routeCode(country) !== null)
      .filter((country) => !normalized || [country.properties.name, country.properties.iso3, country.properties.adminA3, country.properties.continent]
        .some((value) => value?.toLocaleLowerCase("en").includes(normalized)));
  }, [geography.countries, query]);
  const visibleCountries = useMemo(() => countries.slice(0, visibleCount), [countries, visibleCount]);

  useEffect(() => setVisibleCount(COUNTRY_PAGE_SIZE), [query]);

  return (
    <section class="countries-page" aria-labelledby="countries-title">
      <header class="countries-hero">
        <div>
          <div class="eyebrow">Countries</div>
          <h1 id="countries-title" class="display-title">Find a country.</h1>
          <p class="lead">Country geography appears first. Live people-group context fills in after the page becomes responsive.</p>
        </div>
        <div class="countries-hero__mark" aria-hidden="true"><Globe2 size={34} /></div>
      </header>

      {intelligence.warning ? <div class="country-data-notice" role="status"><Database size={19} aria-hidden="true" /><div><strong>Showing cached mission data</strong><p>{intelligence.warning}</p></div></div> : null}
      {dataStart && !intelligence.loading && intelligence.error ? <div class="country-data-notice" role="alert"><Database size={19} aria-hidden="true" /><div><strong>Live mission data is temporarily unavailable</strong><p>{intelligence.error}</p><button type="button" class="people-reset-filters" onClick={intelligence.retry}><RefreshCw size={15} aria-hidden="true" /> Retry</button></div></div> : null}

      <label class="countries-search" for="countries-search">
        <Search size={19} aria-hidden="true" />
        <span class="sr-only">Search countries</span>
        <input id="countries-search" type="search" value={query} onInput={(event) => setQuery(event.currentTarget.value)} placeholder="Search country, code or continent" autoComplete="off" />
      </label>

      {geography.loading ? <div class="country-index-state" role="status">Loading country geography…</div> : null}
      {dataStart && intelligence.loading ? <div class="country-index-state country-index-state--quiet" role="status">Adding live mission context{intelligence.progress ? `… ${intelligence.progress.loadedPages}/${intelligence.progress.totalPages}` : "…"}</div> : null}
      {geography.error ? <div class="country-index-state country-index-state--error" role="alert">{geography.error}</div> : null}

      {!geography.loading && !geography.error ? (
        <>
          <div class="countries-result-count" aria-live="polite">Showing {visibleCountries.length} of {countries.length} {countries.length === 1 ? "country" : "countries"}{intelligence.ready ? ` · ${intelligence.totalRecords} people-country records available` : ""}</div>
          <div class="country-card-grid country-card-grid--concise">
            {visibleCountries.map((country) => {
              const code = routeCode(country)!;
              const record = intelligence.countriesByIso3.get(code);
              return (
                <a class="country-card country-card--concise" href={hrefFor(`/countries/${code}`)} key={`${country.properties.mapKey}-${code}`}>
                  <div class="country-card__top"><div><span class="country-card__code">{code}</span><h2>{record?.name ?? country.properties.name}</h2></div><ArrowRight size={18} aria-hidden="true" /></div>
                  <p>{record?.regionName ?? country.properties.continent ?? "World"}</p>
                  {record ? (
                    <dl class="country-card__metrics country-card__metrics--concise">
                      <div><dt>People contexts</dt><dd>{record.summary.peopleContextCount}</dd></div>
                      <div><dt>GSEC 0–3</dt><dd>{record.summary.unreachedContextCount}</dd></div>
                      <div><dt>Known population</dt><dd>{formatCount(record.summary.knownPopulation)}</dd></div>
                    </dl>
                  ) : <span class="country-card__pending">{intelligence.ready ? "No PeopleGroups.org country-context records" : "Mission context loading…"}</span>}
                </a>
              );
            })}
          </div>
          {visibleCountries.length < countries.length ? <div class="result-load-more"><button type="button" onClick={() => setVisibleCount((count) => Math.min(count + COUNTRY_PAGE_SIZE, countries.length))}>Show {Math.min(COUNTRY_PAGE_SIZE, countries.length - visibleCountries.length)} more</button><span>{countries.length - visibleCountries.length} remaining</span></div> : null}
        </>
      ) : null}
    </section>
  );
}
