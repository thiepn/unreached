import { BookOpen, Database, Filter, Languages, Search } from "lucide-preact";
import { useEffect, useMemo, useState } from "preact/hooks";

import { positiveHashPage, readHashSearchParams, replaceHashSearchParams, setOptionalHashParam } from "../app/hash-state";
import { hrefFor } from "../app/router";
import { useDebouncedValue } from "../hooks/useResponsiveWork";
import {
  filterLiveLanguages,
  formatLanguageCount,
  rawResourceSummary,
  useLiveLanguageExplorer,
  type LiveLanguageFilterState,
  type LiveLanguageReachFilter,
  type LiveLanguageSort,
} from "../languages";

const LANGUAGE_PAGE_SIZE = 48;

const initialFilters: LiveLanguageFilterState = {
  query: "",
  reach: "all",
  bible: "all",
  sort: "name",
};

const LANGUAGE_REACH_FILTERS = new Set<LiveLanguageReachFilter>(["all", "has-unreached", "no-unreached", "unknown-only"]);
const LANGUAGE_SORTS = new Set<LiveLanguageSort>(["name", "people-count-desc", "represented-population-desc", "unreached-contexts-desc"]);

function initialLanguageState(): { filters: LiveLanguageFilterState; page: number } {
  const params = readHashSearchParams();
  const reachCandidate = params.get("reach") as LiveLanguageReachFilter | null;
  const sortCandidate = params.get("sort") as LiveLanguageSort | null;
  return {
    filters: {
      query: params.get("q") ?? "",
      reach: reachCandidate && LANGUAGE_REACH_FILTERS.has(reachCandidate) ? reachCandidate : initialFilters.reach,
      bible: params.get("bible") ?? initialFilters.bible,
      sort: sortCandidate && LANGUAGE_SORTS.has(sortCandidate) ? sortCandidate : initialFilters.sort,
    },
    page: positiveHashPage(params),
  };
}

export function LanguagesPage() {
  const explorer = useLiveLanguageExplorer();
  const initial = useMemo(initialLanguageState, []);
  const [filters, setFilters] = useState<LiveLanguageFilterState>(initial.filters);
  const [page, setPage] = useState(initial.page);
  const visibleCount = page * LANGUAGE_PAGE_SIZE;
  const debouncedQuery = useDebouncedValue(filters.query, 100);
  const effectiveFilters = useMemo<LiveLanguageFilterState>(() => ({ ...filters, query: debouncedQuery }), [debouncedQuery, filters.reach, filters.bible, filters.sort]);
  const records = useMemo(
    () => filterLiveLanguages(explorer.languages, effectiveFilters, explorer.searchIndex),
    [explorer.languages, explorer.searchIndex, effectiveFilters],
  );
  const visibleRecords = useMemo(() => records.slice(0, visibleCount), [records, visibleCount]);
  const activeFilterCount = Number(filters.reach !== "all") + Number(filters.bible !== "all");

  useEffect(() => {
    const params = new URLSearchParams();
    setOptionalHashParam(params, "q", filters.query);
    setOptionalHashParam(params, "reach", filters.reach, initialFilters.reach);
    setOptionalHashParam(params, "bible", filters.bible, initialFilters.bible);
    setOptionalHashParam(params, "sort", filters.sort, initialFilters.sort);
    setOptionalHashParam(params, "page", page, 1);
    replaceHashSearchParams(params);
  }, [filters.query, filters.reach, filters.bible, filters.sort, page]);

  const update = <K extends keyof LiveLanguageFilterState>(key: K, value: LiveLanguageFilterState[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };
  const resetFilters = () => { setFilters(initialFilters); setPage(1); };

  return (
    <section class="languages-page" aria-labelledby="languages-title">
      <header class="languages-hero">
        <div>
          <div class="eyebrow">Languages & Resources</div>
          <h1 id="languages-title" class="display-title">Explore languages.</h1>
          <p class="lead">Find a language first. Open its profile for countries, people groups and the raw Bible and media labels reported by PeopleGroups.org.</p>
        </div>
        <div class="languages-hero__mark" aria-hidden="true"><Languages size={28} /></div>
      </header>

      {explorer.loading && !explorer.ready ? <div class="languages-release-notice" role="status"><Database size={20} aria-hidden="true" /><div><strong>Loading language records</strong><p>{explorer.progress ? `Source page ${explorer.progress.loadedPages} of ${explorer.progress.totalPages}.` : "Preparing the shared mission dataset."}</p></div></div> : null}
      {explorer.error && !explorer.ready ? <div class="languages-release-notice" role="alert"><Database size={20} aria-hidden="true" /><div><strong>Live language records are unavailable</strong><p>{explorer.error}</p><button type="button" class="text-button" onClick={explorer.retry}>Retry source</button></div></div> : null}
      {explorer.warning ? <div class="languages-release-notice" role="note"><Database size={20} aria-hidden="true" /><div><strong>{explorer.stale ? "Using cached language records" : "Language source notice"}</strong><p>{explorer.warning}</p></div></div> : null}

      {explorer.ready ? (
        <>
          <label class="language-search language-search--primary">
            <Search size={18} aria-hidden="true" />
            <span class="sr-only">Search languages</span>
            <input value={filters.query} onInput={(event) => update("query", event.currentTarget.value)} placeholder="Search language, ISO code, people or country" />
          </label>

          <details class="language-filter-panel">
            <summary><Filter size={17} aria-hidden="true" /> Filters & sort{activeFilterCount ? ` · ${activeFilterCount} active` : ""}</summary>
            <div class="language-filter-grid">
              <label><span>Mission context</span><select value={filters.reach} onChange={(event) => update("reach", event.currentTarget.value as LiveLanguageFilterState["reach"])}><option value="all">All languages</option><option value="has-unreached">Has GSEC 0–3 context</option><option value="no-unreached">No GSEC 0–3 context</option><option value="unknown-only">GSEC entirely unknown</option></select></label>
              <label><span>Bible label</span><select value={filters.bible} onChange={(event) => update("bible", event.currentTarget.value)}><option value="all">Any reported label</option>{explorer.bibleLabels.map((label) => <option value={label} key={label}>{label}</option>)}</select></label>
              <label><span>Sort</span><select value={filters.sort} onChange={(event) => update("sort", event.currentTarget.value as LiveLanguageFilterState["sort"])}><option value="name">Alphabetical</option><option value="people-count-desc">Most people-group records</option><option value="represented-population-desc">Largest represented population</option><option value="unreached-contexts-desc">Most GSEC 0–3 contexts</option></select></label>
            </div>
            <button class="people-reset-filters" type="button" onClick={resetFilters}>Reset filters</button>
          </details>

          <div class="language-results-heading" aria-live="polite"><strong>Showing {visibleRecords.length} of {records.length} matches</strong><span>{explorer.languages.length} ISO-coded languages total</span></div>
          <div class="language-card-grid language-card-grid--concise">
            {visibleRecords.map((record) => (
              <a class="language-card language-card--concise" href={hrefFor(`/languages/${record.iso6393}`)} key={record.id}>
                <div class="language-card__top"><span>{record.iso6393.toUpperCase()}</span><span>{record.familyName ?? "Family not reported"}</span></div>
                <h2>{record.name}</h2>
                <p class="language-card__summary">{record.countryCount} {record.countryCount === 1 ? "country" : "countries"} · {record.peopleEntityCount} people-group {record.peopleEntityCount === 1 ? "record" : "records"}</p>
                <div class="language-card__scripture"><BookOpen size={16} aria-hidden="true" /><strong>{rawResourceSummary(record.bible.breakdown, record.bible.knownContextCount, record.contextCount)}</strong></div>
                <div class="language-card__keyfacts">
                  <div><span>Represented population</span><strong>{formatLanguageCount(record.knownPopulation)}{record.populationCoverageComplete ? "" : "*"}</strong></div>
                  <div><span>GSEC 0–3 contexts</span><strong>{record.unreachedContextCount}</strong></div>
                </div>
              </a>
            ))}
          </div>
          {!records.length ? <p class="language-empty">No current language records match this search and filters.</p> : null}
          {visibleRecords.length < records.length ? <div class="result-load-more"><button type="button" onClick={() => setPage((current) => current + 1)}>Show {Math.min(LANGUAGE_PAGE_SIZE, records.length - visibleRecords.length)} more</button><span>{records.length - visibleRecords.length} remaining</span></div> : null}
        </>
      ) : null}

      <details class="language-method-note"><summary>How to read the resource data</summary><p>These are source-reported availability labels, not a Bible-translation completeness scale. Population figures are sums of known people-group record estimates, not a language census.</p></details>
    </section>
  );
}
