import { ArrowRight, Database, Filter, RefreshCw, Search, UsersRound } from "lucide-preact";
import { useEffect, useMemo, useState } from "preact/hooks";

import { hrefFor } from "../app/router";
import { GuidedPeopleStarts } from "../components/GuidedPeopleStarts";
import { useDebouncedValue } from "../hooks/useResponsiveWork";
import {
  filterLivePeople,
  formatPeopleCount,
  livePeopleStatusClass,
  livePeopleStatusLabel,
  useLivePeopleExplorer,
  type LivePeopleFilterState,
} from "../peoples";
import { entityGsecRange } from "../providers/peoplegroups";

const PEOPLE_PAGE_SIZE = 48;

const DEFAULT_FILTERS: LivePeopleFilterState = {
  query: "",
  status: "all",
  countryIso3: "",
  language: "",
  religion: "",
  bibleAvailability: "",
  minimumPopulation: 0,
  sort: "population-desc",
};

function loadingLabel(loadedPages: number | undefined, totalPages: number | undefined): string {
  if (!loadedPages || !totalPages) return "Loading people-group records…";
  return `Loading people-group records… ${loadedPages} of ${totalPages} source pages`;
}

export function PeoplesPage() {
  const explorer = useLivePeopleExplorer();
  const [filters, setFilters] = useState<LivePeopleFilterState>(DEFAULT_FILTERS);
  const [visibleCount, setVisibleCount] = useState(PEOPLE_PAGE_SIZE);
  const debouncedQuery = useDebouncedValue(filters.query, 120);

  const options = useMemo(() => {
    const countries = new Map<string, string>();
    const languages = new Map<string, string>();
    const religions = new Map<string, string>();
    const bibleStatuses = new Set<string>();

    for (const people of explorer.peoples) {
      for (const context of people.contexts) {
        countries.set(context.country.iso3, context.country.name);
        if (context.language.iso6393 || context.language.name) {
          const key = context.language.iso6393 ?? context.language.name!;
          languages.set(key, context.language.iso6393 ? `${context.language.name ?? context.language.iso6393} (${context.language.iso6393})` : context.language.name!);
        }
        if (context.religion.code || context.religion.name) {
          const key = context.religion.code ?? context.religion.name!;
          religions.set(key, context.religion.name ?? context.religion.displayName ?? context.religion.code!);
        }
        if (context.resources.bibleAvailability) bibleStatuses.add(context.resources.bibleAvailability);
      }
    }

    return {
      countries: [...countries.entries()].sort((a, b) => a[1].localeCompare(b[1], "en")),
      languages: [...languages.entries()].sort((a, b) => a[1].localeCompare(b[1], "en")),
      religions: [...religions.entries()].sort((a, b) => a[1].localeCompare(b[1], "en")),
      bibleStatuses: [...bibleStatuses].sort((a, b) => a.localeCompare(b, "en")),
    };
  }, [explorer.peoples]);

  const effectiveFilters = useMemo<LivePeopleFilterState>(() => ({ ...filters, query: debouncedQuery }), [
    debouncedQuery,
    filters.status,
    filters.countryIso3,
    filters.language,
    filters.religion,
    filters.bibleAvailability,
    filters.minimumPopulation,
    filters.sort,
  ]);
  const results = useMemo(() => filterLivePeople(explorer.peoples, effectiveFilters), [explorer.peoples, effectiveFilters]);
  const visibleResults = useMemo(() => results.slice(0, visibleCount), [results, visibleCount]);
  const activeFilterCount = [filters.status !== "all", filters.countryIso3, filters.language, filters.religion, filters.bibleAvailability, filters.minimumPopulation > 0].filter(Boolean).length;
  const showGuidedStarts = !filters.query.trim() && activeFilterCount === 0;

  useEffect(() => setVisibleCount(PEOPLE_PAGE_SIZE), [debouncedQuery, filters.status, filters.countryIso3, filters.language, filters.religion, filters.bibleAvailability, filters.minimumPopulation, filters.sort]);

  const update = <K extends keyof LivePeopleFilterState>(key: K, value: LivePeopleFilterState[K]) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <section class="peoples-page" aria-labelledby="peoples-title">
      <header class="peoples-hero">
        <div>
          <div class="eyebrow">People Group Explorer</div>
          <h1 id="peoples-title" class="display-title">Find a people group.</h1>
          <p class="lead">Search when you know what you want, or use a guided starting point when you do not. Every path opens the same source-backed profile and prayer flow.</p>
        </div>
        <div class="peoples-hero__mark" aria-hidden="true"><UsersRound size={35} /></div>
      </header>

      {explorer.warning ? <div class="people-data-notice" role="status"><Database size={20} aria-hidden="true" /><div><strong>Showing cached source data</strong><p>{explorer.warning}</p></div></div> : null}

      {explorer.loading && !explorer.ready ? (
        <div class="people-index-state people-index-state--loading" role="status">
          <span class="loading-pulse" aria-hidden="true" />
          <strong>{loadingLabel(explorer.progress?.loadedPages, explorer.progress?.totalPages)}</strong>
          <small>Search and guided starting points appear when the shared source dataset is ready.</small>
        </div>
      ) : null}

      {!explorer.loading && explorer.error ? (
        <div class="people-data-notice" role="alert"><Database size={20} aria-hidden="true" /><div><strong>Live people-group data is temporarily unavailable</strong><p>{explorer.error}</p><button type="button" class="people-reset-filters" onClick={explorer.retry}><RefreshCw size={15} aria-hidden="true" /> Retry</button></div></div>
      ) : null}

      {explorer.ready ? (
        <>
          {showGuidedStarts ? <GuidedPeopleStarts peoples={explorer.peoples} /> : null}

          <label class="people-search people-search--primary" for="people-search">
            <Search size={19} aria-hidden="true" />
            <span class="sr-only">Search people groups</span>
            <input id="people-search" type="search" value={filters.query} onInput={(event) => update("query", event.currentTarget.value)} placeholder="Search people, country, language or PEID" autoComplete="off" />
          </label>

          <details class="people-filter-panel">
            <summary><Filter size={17} aria-hidden="true" /> Filters & sort{activeFilterCount ? ` · ${activeFilterCount} active` : ""}</summary>
            <div class="people-filter-grid">
              <label>Sort<select value={filters.sort} onChange={(event) => update("sort", event.currentTarget.value as LivePeopleFilterState["sort"])}><option value="population-desc">Largest known population</option><option value="gsec-asc">Lowest GSEC first</option><option value="name">Alphabetical</option></select></label>
              <label>Status<select value={filters.status} onChange={(event) => update("status", event.currentTarget.value as LivePeopleFilterState["status"])}><option value="all">All statuses</option><option value="unreached-only">GSEC 0–3</option><option value="other-only">GSEC 4–6</option><option value="unknown">GSEC unknown</option></select></label>
              <label>Country<select value={filters.countryIso3} onChange={(event) => update("countryIso3", event.currentTarget.value)}><option value="">All countries</option>{options.countries.map(([iso3, name]) => <option value={iso3} key={iso3}>{name}</option>)}</select></label>
              <label>Religion<select value={filters.religion} onChange={(event) => update("religion", event.currentTarget.value)}><option value="">All religions</option>{options.religions.map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label>
              <label>Language<select value={filters.language} onChange={(event) => update("language", event.currentTarget.value)}><option value="">All languages</option>{options.languages.map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label>
              <label>Bible label<select value={filters.bibleAvailability} onChange={(event) => update("bibleAvailability", event.currentTarget.value)}><option value="">Any source label</option>{options.bibleStatuses.map((status) => <option value={status} key={status}>{status}</option>)}</select></label>
              <label>Known population<select value={String(filters.minimumPopulation)} onChange={(event) => update("minimumPopulation", Number(event.currentTarget.value))}><option value="0">Any population</option><option value="10000">10K+</option><option value="100000">100K+</option><option value="1000000">1M+</option><option value="10000000">10M+</option></select></label>
            </div>
            <button class="people-reset-filters" type="button" onClick={() => setFilters(DEFAULT_FILTERS)}>Reset filters</button>
          </details>

          <div class="people-result-count" aria-live="polite">Showing {visibleResults.length} of {results.length} matches <span>· {explorer.peoples.length} total source records</span></div>

          {results.length ? (
            <>
              <div class="people-card-grid people-card-grid--concise">
                {visibleResults.map((people) => {
                  const gsec = entityGsecRange(people);
                  const context = people.contexts[0]!;
                  return (
                    <a class="people-card people-card--concise" href={hrefFor(`/peoples/${people.routeKey}`)} key={people.id}>
                      <div class="people-card__head">
                        <div><span class={`people-status people-status--${livePeopleStatusClass(people)}`}>{livePeopleStatusLabel(people)}</span><h2>{people.displayName}</h2></div>
                        <ArrowRight size={18} aria-hidden="true" />
                      </div>
                      <p class="people-card__summary">{context.country.name} · {people.primaryReligion?.name ?? "Religion unknown"} · {people.primaryLanguage?.name ?? "Language unknown"}</p>
                      <div class="people-card__keyfacts">
                        <div><span>Population</span><strong>{people.population.complete ? formatPeopleCount(people.population.knownValue) : "Unknown"}</strong></div>
                        <div><span>GSEC</span><strong>{gsec ? String(gsec.min) : "Unknown"}</strong></div>
                      </div>
                      <span class="people-card__countries">PEID {people.peid} · {context.pgid}</span>
                    </a>
                  );
                })}
              </div>
              {visibleResults.length < results.length ? (
                <div class="result-load-more"><button type="button" onClick={() => setVisibleCount((count) => Math.min(count + PEOPLE_PAGE_SIZE, results.length))}>Show {Math.min(PEOPLE_PAGE_SIZE, results.length - visibleResults.length)} more</button><span>{results.length - visibleResults.length} remaining</span></div>
              ) : null}
            </>
          ) : (
            <div class="people-index-empty people-index-empty--recover">
              <strong>No people groups match this search.</strong>
              <p>Clear the current search and filters to return to the guided starting points and full live index.</p>
              <button type="button" class="people-reset-filters" onClick={() => setFilters(DEFAULT_FILTERS)}>Clear search & filters</button>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
