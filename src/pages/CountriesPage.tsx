import { ArrowRight, Database, Globe2, MapPinned, Search } from "lucide-preact";
import { useEffect, useMemo, useState } from "preact/hooks";

import { positiveHashPage, readHashSearchParams, replaceHashSearchParams, setOptionalHashParam } from "../app/hash-state";
import { hrefFor } from "../app/router";
import { formatCount } from "../countries";
import { atlasRegionForCountry, buildAtlasRegions, routeCodeForCountry } from "../geography/regions";
import { useAfterFirstPaint } from "../hooks/useResponsiveWork";
import { useWorldGeography } from "../map/geography";
import { formatLiveMissionLayerValue, useLiveMissionVisualization } from "../visualization";

const COUNTRY_PAGE_SIZE = 48;

function initialCountryState(): { query: string; page: number } {
  const params = readHashSearchParams();
  return { query: params.get("q") ?? "", page: positiveHashPage(params) };
}

export function CountriesPage() {
  const geography = useWorldGeography();
  const missionStart = useAfterFirstPaint();
  const mission = useLiveMissionVisualization(missionStart);
  const initial = useMemo(initialCountryState, []);
  const [query, setQueryState] = useState(initial.query);
  const [page, setPage] = useState(initial.page);
  const visibleCount = page * COUNTRY_PAGE_SIZE;

  const regions = useMemo(
    () => buildAtlasRegions(geography.countries, mission.countriesByIso3),
    [geography.countries, mission.countriesByIso3],
  );

  const countries = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("en");
    return geography.countries
      .filter((country) => routeCodeForCountry(country) !== null)
      .filter((country) => {
        if (!normalized) return true;
        const region = atlasRegionForCountry(country);
        return [country.properties.name, country.properties.iso3, country.properties.adminA3, region?.name]
          .some((value) => value?.toLocaleLowerCase("en").includes(normalized));
      });
  }, [geography.countries, query]);
  const visibleCountries = useMemo(() => countries.slice(0, visibleCount), [countries, visibleCount]);

  useEffect(() => {
    const params = new URLSearchParams();
    setOptionalHashParam(params, "q", query);
    setOptionalHashParam(params, "page", page, 1);
    replaceHashSearchParams(params);
  }, [query, page]);

  const setQuery = (value: string) => { setQueryState(value); setPage(1); };

  return (
    <section class="countries-page v3-geography-page v3-countries-page" aria-labelledby="countries-title">
      <header class="countries-hero v3-geography-hero">
        <div>
          <span class="v3-type-label">World → Region → Country</span>
          <h1 id="countries-title" class="v3-type-display-xl">Explore countries.</h1>
          <p class="v3-type-body-lg v3-reading">Start with a broad world region or search directly for a country. Every country remains a geographic place first; mission context is a source-scoped layer over that geography.</p>
        </div>
        <Globe2 size={40} aria-hidden="true" />
      </header>

      {geography.loading ? <div class="country-index-state v3-geography-state" role="status">Loading country geography…</div> : null}
      {geography.error ? <div class="country-index-state country-index-state--error v3-geography-state v3-geography-state--error" role="alert">{geography.error}</div> : null}
      {missionStart && mission.loading && !mission.ready ? <div class="country-index-state country-index-state--quiet v3-geography-state v3-geography-state--quiet" role="status"><Database size={17} aria-hidden="true" /> Adding live mission context…</div> : null}

      {!geography.loading && !geography.error ? (
        <>
          <section class="v3-country-regions" aria-labelledby="country-regions-heading">
            <div class="v3-geography-section-heading">
              <div><span class="v3-type-label">Regions</span><h2 id="country-regions-heading" class="v3-type-heading-xl">Choose a part of the world</h2></div>
              <a href={hrefFor("/regions")}>All regions <ArrowRight size={15} aria-hidden="true" /></a>
            </div>
            <div class="v3-country-region-strip">
              {regions.map((region) => (
                <a href={hrefFor(`/regions/${region.id}`)} key={region.id}>
                  <span><MapPinned size={15} aria-hidden="true" /> {region.name}</span>
                  <strong>{region.countryCount}</strong>
                  <small>countries and areas</small>
                </a>
              ))}
            </div>
          </section>

          <section class="v3-country-directory" aria-labelledby="country-directory-heading">
            <div class="v3-geography-section-heading">
              <div><span class="v3-type-label">Country directory</span><h2 id="country-directory-heading" class="v3-type-heading-xl">Find a country</h2></div>
            </div>

            <label class="countries-search v3-country-search" for="countries-search">
              <Search size={19} aria-hidden="true" />
              <span class="sr-only">Search countries</span>
              <input id="countries-search" type="search" value={query} onInput={(event) => setQuery(event.currentTarget.value)} placeholder="Search country, code or region" autoComplete="off" />
            </label>

            <div class="countries-result-count" aria-live="polite">Showing {visibleCountries.length} of {countries.length} {countries.length === 1 ? "country" : "countries"}{mission.ready ? ` · ${mission.countries.length} countries with current mission summaries` : ""}</div>

            <div class="country-card-grid country-card-grid--concise v3-country-grid">
              {visibleCountries.map((country) => {
                const code = routeCodeForCountry(country)!;
                const summary = mission.countriesByIso3.get(code) ?? null;
                const region = atlasRegionForCountry(country);
                return (
                  <a class="country-card country-card--concise v3-country-card" href={hrefFor(`/countries/${code}`)} key={`${country.properties.mapKey}-${code}`}>
                    <div class="country-card__top v3-country-card__heading"><div><span class="country-card__code">{code}</span><h3>{summary?.name ?? country.properties.name}</h3></div><ArrowRight size={18} aria-hidden="true" /></div>
                    <p>{region?.name ?? "World"}</p>
                    {summary ? (
                      <>
                        <strong class="v3-country-card__mission-value">{formatLiveMissionLayerValue(summary, "unreached-population")}</strong>
                        <span class="v3-country-card__mission-label">represented population in source records classified as unreached</span>
                        <dl class="country-card__metrics country-card__metrics--concise">
                          <div><dt>People groups</dt><dd>{summary.peopleContextCount}</dd></div>
                          <div><dt>Unreached</dt><dd>{summary.unreachedContextCount}</dd></div>
                          <div><dt>Represented population</dt><dd>{formatCount(summary.knownPopulation)}</dd></div>
                        </dl>
                      </>
                    ) : <span class="country-card__pending">{mission.ready ? "No current PeopleGroups.org country-context summary" : "Mission context loading…"}</span>}
                  </a>
                );
              })}
            </div>
            {visibleCountries.length < countries.length ? <div class="result-load-more"><button type="button" onClick={() => setPage((current) => current + 1)}>Show {Math.min(COUNTRY_PAGE_SIZE, countries.length - visibleCountries.length)} more</button><span>{countries.length - visibleCountries.length} remaining</span></div> : null}
          </section>

          <div class="v3-geography-note">
            <strong>Geographic hierarchy</strong>
            <p>Regions use Natural Earth continent membership. Mission figures summarize PeopleGroups.org / IMB people-group-in-country records and are not national census statistics.</p>
          </div>
        </>
      ) : null}
    </section>
  );
}
