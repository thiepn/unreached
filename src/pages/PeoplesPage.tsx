import { ArrowRight, BookOpenText, Database, Filter, RefreshCw, Search, UsersRound, X } from "lucide-preact";
import { useLayoutEffect, useMemo, useState } from "preact/hooks";

import { positiveHashPage, readHashSearchParams, replaceHashSearchParams, setOptionalHashParam } from "../app/hash-state";
import { hrefFor } from "../app/router";
import { GuidedPeopleStarts } from "../components/GuidedPeopleStarts";
import { useEditorialContext } from "../context";
import { useDebouncedValue } from "../hooks/useResponsiveWork";
import {
  filterLivePeople,
  formatPeopleCount,
  livePeopleStatusClass,
  useLivePeopleExplorer,
  type LivePeopleFilterState,
  type LivePeopleSort,
  type LivePeopleStatusFilter,
} from "../peoples";
import type { RuntimePeopleEntity } from "../providers/peoplegroups";

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

const PEOPLE_STATUSES = new Set<LivePeopleStatusFilter>(["all", "unreached-only", "other-only", "unknown"]);
const PEOPLE_SORTS = new Set<LivePeopleSort>(["population-desc", "name", "gsec-asc"]);
const STATUS_CHOICES: Array<{ value: LivePeopleStatusFilter; label: string; hint: string }> = [
  { value: "all", label: "All", hint: "All people-group source records" },
  { value: "unreached-only", label: "Unreached", hint: "Records classified as unreached" },
  { value: "other-only", label: "Other", hint: "Records with another reported mission status" },
  { value: "unknown", label: "Unknown", hint: "No mission-status value reported" },
];

function peopleCardStatusLabel(people: RuntimePeopleEntity): string {
  if (people.reach.classification === "unreached-only") return "Unreached";
  if (people.reach.classification === "other-only") return "Other mission status";
  return "Status unknown";
}

function initialPeopleState(): { filters: LivePeopleFilterState; reviewedOnly: boolean; page: number } {
  const params = readHashSearchParams();
  const statusCandidate = params.get("status") as LivePeopleStatusFilter | null;
  const sortCandidate = params.get("sort") as LivePeopleSort | null;
  const populationCandidate = Number(params.get("population") ?? 0);
  return {
    filters: {
      query: params.get("q") ?? "",
      status: statusCandidate && PEOPLE_STATUSES.has(statusCandidate) ? statusCandidate : DEFAULT_FILTERS.status,
      countryIso3: params.get("country")?.toUpperCase() ?? "",
      language: params.get("language") ?? "",
      religion: params.get("religion") ?? "",
      bibleAvailability: params.get("bible") ?? "",
      minimumPopulation: Number.isFinite(populationCandidate) && populationCandidate >= 0 ? populationCandidate : 0,
      sort: sortCandidate && PEOPLE_SORTS.has(sortCandidate) ? sortCandidate : DEFAULT_FILTERS.sort,
    },
    reviewedOnly: params.get("reviewed") === "1",
    page: positiveHashPage(params),
  };
}

function loadingLabel(loadedPages: number | undefined, totalPages: number | undefined): string {
  if (!loadedPages || !totalPages) return "Loading people-group records…";
  return `Loading people-group records… ${loadedPages} of ${totalPages} source pages`;
}

function optionLabel(options: Array<[string, string]>, value: string, fallback: string): string {
  return options.find(([id]) => id === value)?.[1] ?? fallback;
}

function populationLabel(value: number): string {
  if (value >= 10_000_000) return "10M+ population";
  if (value >= 1_000_000) return "1M+ population";
  if (value >= 100_000) return "100K+ population";
  if (value >= 10_000) return "10K+ population";
  return "Any population";
}

export function PeoplesPage() {
  const explorer = useLivePeopleExplorer();
  const editorial = useEditorialContext();
  const initial = useMemo(initialPeopleState, []);
  const [filters, setFilters] = useState<LivePeopleFilterState>(initial.filters);
  const [reviewedOnly, setReviewedOnly] = useState(initial.reviewedOnly);
  const [page, setPage] = useState(initial.page);
  const visibleCount = page * PEOPLE_PAGE_SIZE;
  const debouncedQuery = useDebouncedValue(filters.query, 100);
  const options = explorer.peopleSearchIndex.options;

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
  const filteredResults = useMemo(
    () => filterLivePeople(explorer.peoples, effectiveFilters, explorer.peopleSearchIndex),
    [explorer.peoples, explorer.peopleSearchIndex, effectiveFilters],
  );
  const results = useMemo(
    () => reviewedOnly ? filteredResults.filter((people) => editorial.profilesByPeid.has(people.peid)) : filteredResults,
    [filteredResults, reviewedOnly, editorial.profilesByPeid],
  );
  const visibleResults = useMemo(() => results.slice(0, visibleCount), [results, visibleCount]);
  const activeFilterCount = [filters.status !== "all", filters.countryIso3, filters.language, filters.religion, filters.bibleAvailability, filters.minimumPopulation > 0, reviewedOnly].filter(Boolean).length;
  const advancedFilterCount = [filters.bibleAvailability, filters.minimumPopulation > 0, reviewedOnly].filter(Boolean).length;
  const showGuidedStarts = explorer.ready && !filters.query.trim() && activeFilterCount === 0;

  useLayoutEffect(() => {
    const params = new URLSearchParams();
    setOptionalHashParam(params, "q", filters.query);
    setOptionalHashParam(params, "status", filters.status, DEFAULT_FILTERS.status);
    setOptionalHashParam(params, "country", filters.countryIso3);
    setOptionalHashParam(params, "language", filters.language);
    setOptionalHashParam(params, "religion", filters.religion);
    setOptionalHashParam(params, "bible", filters.bibleAvailability);
    setOptionalHashParam(params, "population", filters.minimumPopulation, DEFAULT_FILTERS.minimumPopulation);
    setOptionalHashParam(params, "sort", filters.sort, DEFAULT_FILTERS.sort);
    setOptionalHashParam(params, "reviewed", reviewedOnly ? "1" : "");
    setOptionalHashParam(params, "page", page, 1);
    replaceHashSearchParams(params);
  }, [filters.query, filters.status, filters.countryIso3, filters.language, filters.religion, filters.bibleAvailability, filters.minimumPopulation, filters.sort, reviewedOnly, page]);

  const update = <K extends keyof LivePeopleFilterState>(key: K, value: LivePeopleFilterState[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };
  const setReviewed = (value: boolean) => { setReviewedOnly(value); setPage(1); };
  const resetFilters = () => { setFilters(DEFAULT_FILTERS); setReviewedOnly(false); setPage(1); };

  const activeChips: Array<{ id: string; label: string; clear: () => void }> = [];
  if (filters.status !== "all") activeChips.push({ id: "status", label: STATUS_CHOICES.find((choice) => choice.value === filters.status)?.label ?? "Status", clear: () => update("status", "all") });
  if (filters.countryIso3) activeChips.push({ id: "country", label: optionLabel(options.countries, filters.countryIso3, filters.countryIso3), clear: () => update("countryIso3", "") });
  if (filters.language) activeChips.push({ id: "language", label: optionLabel(options.languages, filters.language, filters.language), clear: () => update("language", "") });
  if (filters.religion) activeChips.push({ id: "religion", label: optionLabel(options.religions, filters.religion, filters.religion), clear: () => update("religion", "") });
  if (filters.bibleAvailability) activeChips.push({ id: "bible", label: filters.bibleAvailability, clear: () => update("bibleAvailability", "") });
  if (filters.minimumPopulation > 0) activeChips.push({ id: "population", label: populationLabel(filters.minimumPopulation), clear: () => update("minimumPopulation", 0) });
  if (reviewedOnly) activeChips.push({ id: "reviewed", label: "Reviewed context", clear: () => setReviewed(false) });

  return (
    <section class="peoples-page peoples-page--comprehension" aria-labelledby="peoples-title">
      <header class="peoples-hero peoples-hero--explorer">
        <div>
          <div class="eyebrow">People Group Explorer</div>
          <h1 id="peoples-title" class="display-title">Find a people group.</h1>
          <p class="lead">Search by people, country or language. Use mission status when helpful, then open a profile to understand the people and pray.</p>
        </div>
        <div class="peoples-hero__mark" aria-hidden="true"><UsersRound size={35} /></div>
      </header>

      {explorer.warning ? <div class="people-data-notice" role="status"><Database size={20} aria-hidden="true" /><div><strong>Showing cached source data</strong><p>{explorer.warning}</p></div></div> : null}

      {explorer.partial ? (
        <div class="people-data-notice people-data-notice--progressive" role="status" data-progressive-catalog="true">
          <Database size={20} aria-hidden="true" />
          <div>
            <strong>Loading the complete catalog</strong>
            <p>Showing {explorer.previewRecordCount} validated source records received so far. Search, filters and match counts are temporary until all {explorer.progress?.totalPages ?? "remaining"} source pages finish loading.</p>
          </div>
        </div>
      ) : null}

      {explorer.loading && !explorer.interactive ? (
        <div class="people-index-state people-index-state--loading" role="status">
          <span class="loading-pulse" aria-hidden="true" />
          <strong>{loadingLabel(explorer.progress?.loadedPages, explorer.progress?.totalPages)}</strong>
          <small>Search and discovery controls appear as soon as the first validated source page arrives.</small>
        </div>
      ) : null}

      {!explorer.loading && explorer.error ? (
        <div class="people-data-notice" role="alert"><Database size={20} aria-hidden="true" /><div><strong>Live people-group data is temporarily unavailable</strong><p>{explorer.error}</p><button type="button" class="people-reset-filters" onClick={explorer.retry}><RefreshCw size={15} aria-hidden="true" /> Retry</button></div></div>
      ) : null}

      {explorer.interactive ? (
        <>
          <section class="people-discovery-workspace" aria-label="Find and filter people groups">
            <div class="people-search-wrap">
              <label class="people-search people-search--primary" for="people-search">
                <Search size={20} aria-hidden="true" />
                <span class="sr-only">Search people groups</span>
                <input id="people-search" type="search" value={filters.query} onInput={(event) => update("query", event.currentTarget.value)} placeholder="Search people, country or language" autoComplete="off" />
              </label>
              {filters.query ? <button type="button" class="people-search-clear" aria-label="Clear people search" onClick={() => update("query", "")}><X size={17} aria-hidden="true" /></button> : null}
            </div>

            <div class="people-discovery-toolbar">
              <div class="people-status-choices" role="group" aria-label="Reach status">
                {STATUS_CHOICES.map((choice) => (
                  <button key={choice.value} type="button" class={`people-status-choice${filters.status === choice.value ? " is-active" : ""}`} aria-pressed={filters.status === choice.value} title={choice.hint} onClick={() => update("status", choice.value)}>{choice.label}</button>
                ))}
              </div>
              <label class="people-sort-control people-sort-control--compact">
                <span>Sort</span>
                <select value={filters.sort} onChange={(event) => update("sort", event.currentTarget.value as LivePeopleFilterState["sort"])}>
                  <option value="population-desc">Largest population</option>
                  <option value="name">Alphabetical</option>
                  <option value="gsec-asc">Source mission status</option>
                </select>
              </label>
            </div>

            <div class="people-primary-context-filters" aria-label="Primary people filters">
              <label>Country<select value={filters.countryIso3} onChange={(event) => update("countryIso3", event.currentTarget.value)}><option value="">All countries</option>{options.countries.map(([iso3, name]) => <option value={iso3} key={iso3}>{name}</option>)}</select></label>
              <label>Language<select value={filters.language} onChange={(event) => update("language", event.currentTarget.value)}><option value="">All languages</option>{options.languages.map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label>
              <label>Religion<select value={filters.religion} onChange={(event) => update("religion", event.currentTarget.value)}><option value="">All religions</option>{options.religions.map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label>
            </div>

            <details class="people-filter-panel people-filter-panel--advanced" open={advancedFilterCount > 0}>
              <summary><Filter size={17} aria-hidden="true" /><span>More filters</span>{advancedFilterCount ? <span class="people-filter-count">{advancedFilterCount}</span> : <span class="people-filter-hint">Bible label, population and reviewed context</span>}</summary>
              <div class="people-filter-grid people-filter-grid--advanced">
                <label>Bible label<select value={filters.bibleAvailability} onChange={(event) => update("bibleAvailability", event.currentTarget.value)}><option value="">Any source label</option>{options.bibleStatuses.map((status) => <option value={status} key={status}>{status}</option>)}</select></label>
                <label>Known population<select value={String(filters.minimumPopulation)} onChange={(event) => update("minimumPopulation", Number(event.currentTarget.value))}><option value="0">Any population</option><option value="10000">10K+</option><option value="100000">100K+</option><option value="1000000">1M+</option><option value="10000000">10M+</option></select></label>
                <label class="people-reviewed-filter"><span>Editorial coverage</span><span class="people-reviewed-filter__control"><input type="checkbox" checked={reviewedOnly} disabled={editorial.loading || Boolean(editorial.error)} onChange={(event) => setReviewed(event.currentTarget.checked)} /> Reviewed context only</span></label>
              </div>
              <div class="people-filter-actions"><button class="people-reset-filters" type="button" onClick={resetFilters}>Reset all filters</button></div>
            </details>

            {activeChips.length ? (
              <div class="people-active-filters" aria-label="Active filters">
                <span>Active</span>
                {activeChips.map((chip) => <button type="button" key={chip.id} onClick={chip.clear}>{chip.label}<X size={13} aria-hidden="true" /><span class="sr-only">Remove filter</span></button>)}
                {activeChips.length > 1 ? <button type="button" class="people-active-filters__clear" onClick={resetFilters}>Clear all</button> : null}
              </div>
            ) : null}

            <div class="people-results-header">
              <div class="people-result-count" aria-live="polite"><strong>{results.length}</strong> matches <span>from {explorer.peoples.length} {explorer.partial ? "loaded " : ""}people-group source records</span>{reviewedOnly ? <span> · reviewed context only</span> : null}</div>
              {visibleResults.length < results.length ? <span class="people-visible-count">Showing first {visibleResults.length}</span> : null}
            </div>
          </section>

          {showGuidedStarts ? <GuidedPeopleStarts peoples={explorer.peoples} /> : null}

          {showGuidedStarts && !editorial.loading && !editorial.error && editorial.dataset?.profiles.length ? (
            <a class="people-editorial-discovery people-editorial-discovery--secondary" href={hrefFor("/coverage")}>
              <BookOpenText size={20} aria-hidden="true" />
              <span><strong>Prefer researched context?</strong><small>Browse {editorial.dataset.profiles.length} people-group records with deeper, cited editorial articles.</small></span>
              <ArrowRight size={17} aria-hidden="true" />
            </a>
          ) : null}

          {results.length ? (
            <>
              <div class="people-card-grid people-card-grid--concise people-card-grid--explorer">
                {visibleResults.map((people) => {
                  const context = people.contexts[0]!;
                  const hasReviewedContext = editorial.profilesByPeid.has(people.peid);
                  return (
                    <a class="people-card people-card--concise people-card--explorer people-card--comprehension" href={hrefFor(`/peoples/${people.routeKey}`)} key={people.id}>
                      <div class="people-card__head">
                        <div><div class="people-card__badges"><span class={`people-status people-status--${livePeopleStatusClass(people)}`}>{peopleCardStatusLabel(people)}</span>{hasReviewedContext ? <span class="people-editorial-badge"><BookOpenText size={12} aria-hidden="true" /> Reviewed</span> : null}</div><h2>{people.displayName}</h2></div>
                        <ArrowRight size={18} aria-hidden="true" />
                      </div>
                      <p class="people-card__summary">{context.country.name} · {people.primaryLanguage?.name ?? "Language unknown"}</p>
                      <p class="people-card__religion">{people.primaryReligion?.name ?? "Religion unknown"}</p>
                      <div class="people-card__keyfacts">
                        <div><span>Population</span><strong>{people.population.complete ? formatPeopleCount(people.population.knownValue) : "Unknown"}</strong></div>
                        <div><span>Bible resources</span><strong>{context.resources.bibleAvailability ?? "Unknown"}</strong></div>
                      </div>
                      <span class="people-card__countries">Learn about this people</span>
                    </a>
                  );
                })}
              </div>
              {visibleResults.length < results.length ? (
                <div class="result-load-more"><button type="button" onClick={() => setPage((current) => current + 1)}>Show {Math.min(PEOPLE_PAGE_SIZE, results.length - visibleResults.length)} more</button><span>{results.length - visibleResults.length} remaining</span></div>
              ) : null}
            </>
          ) : (
            <div class="people-index-empty people-index-empty--recover">
              <strong>{explorer.partial ? "No loaded records match this search yet." : "No people groups match this search."}</strong>
              <p>{explorer.partial ? "More validated source pages are still arriving. Adjust the filters now or keep this search while the catalog finishes loading." : reviewedOnly ? "No currently published reviewed editorial profile matches these source filters. Coverage is limited and is not a mission-priority ranking." : "Remove one or more filters, or clear the search, to return to the full live index."}</p>
              <button type="button" class="people-reset-filters" onClick={resetFilters}>Clear search & filters</button>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
