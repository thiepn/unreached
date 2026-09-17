import { ArrowRight, BookOpenText, Database, Filter, Globe2, Languages, RefreshCw, Search, UsersRound, X } from "lucide-preact";
import { useLayoutEffect, useMemo, useState } from "preact/hooks";

import { positiveHashPage, readHashSearchParams, replaceHashSearchParams, setOptionalHashParam } from "../app/hash-state";
import { hrefFor } from "../app/router";
import { useEditorialContext } from "../context";
import { buildDiscoveryCollections } from "../discovery/collections";
import { atlasRegionForCountry, routeCodeForCountry } from "../geography/regions";
import { useDebouncedValue } from "../hooks/useResponsiveWork";
import { useWorldGeography } from "../map/geography";
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

const PEOPLE_PAGE_SIZE = 36;
const STATUS_SET = new Set<LivePeopleStatusFilter>(["all", "unreached-only", "other-only", "unknown"]);
const SORT_SET = new Set<LivePeopleSort>(["population-desc", "name", "gsec-asc"]);

interface PeopleDiscoveryState {
  query: string;
  status: LivePeopleStatusFilter;
  countryIso3: string;
  language: string;
  religion: string;
  reviewedOnly: boolean;
  sort: LivePeopleSort;
  page: number;
}

function initialState(): PeopleDiscoveryState {
  const params = readHashSearchParams();
  const rawStatus = params.get("status") as LivePeopleStatusFilter | null;
  const rawSort = params.get("sort") as LivePeopleSort | null;
  return {
    query: params.get("q") ?? "",
    status: rawStatus && STATUS_SET.has(rawStatus) ? rawStatus : "all",
    countryIso3: params.get("country")?.toUpperCase() ?? "",
    language: params.get("language") ?? "",
    religion: params.get("religion") ?? "",
    reviewedOnly: params.get("reviewed") === "1",
    sort: rawSort && SORT_SET.has(rawSort) ? rawSort : "population-desc",
    page: positiveHashPage(params),
  };
}

function statusLabel(people: RuntimePeopleEntity): string {
  if (people.reach.classification === "unreached-only") return "Unreached";
  if (people.reach.classification === "other-only") return "Other source status";
  return "Status unknown";
}

function collectionPeopleMeta(people: RuntimePeopleEntity): string {
  return [people.contexts[0]?.country.name, people.primaryLanguage?.name].filter(Boolean).join(" · ") || "Source profile";
}

export function PeoplesPage() {
  const explorer = useLivePeopleExplorer();
  const editorial = useEditorialContext(true);
  const geography = useWorldGeography(true);
  const initial = useMemo(initialState, []);
  const [query, setQuery] = useState(initial.query);
  const [status, setStatus] = useState(initial.status);
  const [countryIso3, setCountryIso3] = useState(initial.countryIso3);
  const [language, setLanguage] = useState(initial.language);
  const [religion, setReligion] = useState(initial.religion);
  const [reviewedOnly, setReviewedOnly] = useState(initial.reviewedOnly);
  const [sort, setSort] = useState(initial.sort);
  const [page, setPage] = useState(initial.page);
  const debouncedQuery = useDebouncedValue(query, 90);

  const options = explorer.peopleSearchIndex.options;
  const filterState = useMemo<LivePeopleFilterState>(() => ({
    query: debouncedQuery,
    status,
    countryIso3,
    language,
    religion,
    bibleAvailability: "",
    minimumPopulation: 0,
    sort,
  }), [debouncedQuery, status, countryIso3, language, religion, sort]);

  const filtered = useMemo(
    () => filterLivePeople(explorer.peoples, filterState, explorer.peopleSearchIndex),
    [explorer.peoples, explorer.peopleSearchIndex, filterState],
  );
  const results = useMemo(
    () => reviewedOnly ? filtered.filter((people) => editorial.profilesByPeid.has(people.peid)) : filtered,
    [filtered, reviewedOnly, editorial.profilesByPeid],
  );
  const visibleResults = useMemo(() => results.slice(0, page * PEOPLE_PAGE_SIZE), [results, page]);

  const regionByCountryIso3 = useMemo(() => {
    const index = new Map<string, string>();
    for (const country of geography.countries) {
      const iso3 = routeCodeForCountry(country);
      const region = atlasRegionForCountry(country);
      if (iso3 && region) index.set(iso3, region.name);
    }
    return index;
  }, [geography.countries]);

  const reviewedPeids = useMemo(() => new Set(editorial.profilesByPeid.keys()), [editorial.profilesByPeid]);
  const collections = useMemo(
    () => buildDiscoveryCollections({ peoples: explorer.peoples, reviewedPeids, regionByCountryIso3 }),
    [explorer.peoples, reviewedPeids, regionByCountryIso3],
  );

  const activeRefinementCount = [status !== "all", countryIso3, language, religion, reviewedOnly, sort !== "population-desc"].filter(Boolean).length;
  const discoveryMode = explorer.interactive && !query.trim() && activeRefinementCount === 0;

  useLayoutEffect(() => {
    const params = new URLSearchParams();
    setOptionalHashParam(params, "q", query);
    setOptionalHashParam(params, "status", status, "all");
    setOptionalHashParam(params, "country", countryIso3);
    setOptionalHashParam(params, "language", language);
    setOptionalHashParam(params, "religion", religion);
    setOptionalHashParam(params, "reviewed", reviewedOnly ? "1" : "");
    setOptionalHashParam(params, "sort", sort, "population-desc");
    setOptionalHashParam(params, "page", page, 1);
    replaceHashSearchParams(params);
  }, [query, status, countryIso3, language, religion, reviewedOnly, sort, page]);

  const reset = () => {
    setQuery("");
    setStatus("all");
    setCountryIso3("");
    setLanguage("");
    setReligion("");
    setReviewedOnly(false);
    setSort("population-desc");
    setPage(1);
  };
  const refine = (setter: (value: string) => void, value: string) => { setter(value); setPage(1); };

  return (
    <section class="peoples-page peoples-page--comprehension v3-people-discovery" aria-labelledby="peoples-title" data-v3-people-discovery="true">
      <header class="peoples-hero peoples-hero--explorer v3-people-discovery__hero">
        <div>
          <span class="v3-type-label">People discovery</span>
          <h1 id="peoples-title" class="v3-type-display-xl">Find a people group.</h1>
          <p class="v3-type-body-lg v3-reading">Start with a name, follow a guided collection, or refine the live source catalog. Every result opens the same definitive people profile.</p>
        </div>
        <UsersRound size={40} aria-hidden="true" />
      </header>

      {explorer.warning ? <div class="v3-discovery-state" role="status"><Database size={18} aria-hidden="true" /><span><strong>Using cached source data.</strong> {explorer.warning}</span></div> : null}
      {explorer.partial ? <div class="v3-discovery-state" role="status"><Database size={18} aria-hidden="true" /><span>Loading the complete source catalog… current matches may change while remaining pages arrive.</span></div> : null}
      {explorer.loading && !explorer.interactive ? <div class="v3-discovery-state" role="status"><span class="loading-pulse" aria-hidden="true" /><span>Preparing people-group records{explorer.progress ? `… ${explorer.progress.loadedPages}/${explorer.progress.totalPages}` : "…"}</span></div> : null}
      {!explorer.loading && explorer.error ? <div class="v3-discovery-state v3-discovery-state--error" role="alert"><Database size={18} aria-hidden="true" /><span>{explorer.error}</span><button type="button" onClick={explorer.retry}><RefreshCw size={15} aria-hidden="true" /> Retry</button></div> : null}

      {explorer.interactive ? (
        <>
          <section class="v3-people-find" aria-label="Find people groups">
            <div class="v3-people-find__search">
              <label for="people-search"><Search size={21} aria-hidden="true" /><span class="sr-only">Search people groups</span><input id="people-search" type="search" value={query} onInput={(event) => { setQuery(event.currentTarget.value); setPage(1); }} placeholder="Search people, country, language or source ID…" autoComplete="off" /></label>
              {query ? <button type="button" aria-label="Clear people search" onClick={() => { setQuery(""); setPage(1); }}><X size={17} aria-hidden="true" /></button> : null}
            </div>
            <div class="v3-people-find__quick" role="group" aria-label="Quick mission-status filter">
              <button type="button" class={status === "all" ? "is-active" : ""} aria-pressed={status === "all"} onClick={() => { setStatus("all"); setPage(1); }}>All people</button>
              <button type="button" class={status === "unreached-only" ? "is-active" : ""} aria-pressed={status === "unreached-only"} onClick={() => { setStatus("unreached-only"); setPage(1); }}>Unreached source records</button>
              <a href={hrefFor("/search")}><Search size={15} aria-hidden="true" /> Search whole atlas</a>
            </div>

            <details class="v3-discovery-refine" open={activeRefinementCount > 0}>
              <summary><Filter size={17} aria-hidden="true" /><span>Refine results</span>{activeRefinementCount ? <strong>{activeRefinementCount}</strong> : <small>country, language, religion, status and depth</small>}</summary>
              <div class="v3-discovery-refine__grid">
                <label>Mission status<select value={status} onChange={(event) => { setStatus(event.currentTarget.value as LivePeopleStatusFilter); setPage(1); }}><option value="all">All source statuses</option><option value="unreached-only">Unreached</option><option value="other-only">Other source status</option><option value="unknown">Unknown</option></select></label>
                <label>Country<select value={countryIso3} onChange={(event) => refine(setCountryIso3, event.currentTarget.value)}><option value="">All countries</option>{options.countries.map(([iso3, name]) => <option value={iso3} key={iso3}>{name}</option>)}</select></label>
                <label>Language<select value={language} onChange={(event) => refine(setLanguage, event.currentTarget.value)}><option value="">All languages</option>{options.languages.map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label>
                <label>Religion<select value={religion} onChange={(event) => refine(setReligion, event.currentTarget.value)}><option value="">All reported religions</option>{options.religions.map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label>
                <label>Order<select value={sort} onChange={(event) => { setSort(event.currentTarget.value as LivePeopleSort); setPage(1); }}><option value="population-desc">Largest represented population</option><option value="name">Alphabetical</option><option value="gsec-asc">Source GSEC code</option></select></label>
                <label class="v3-discovery-refine__check"><span>Editorial depth</span><span><input type="checkbox" checked={reviewedOnly} disabled={editorial.loading || Boolean(editorial.error)} onChange={(event) => { setReviewedOnly(event.currentTarget.checked); setPage(1); }} /> Reviewed context only</span></label>
              </div>
              <div class="v3-discovery-refine__footer"><button type="button" onClick={reset}>Clear refinements</button><p>Reviewed coverage describes research depth, not mission importance.</p></div>
            </details>
          </section>

          {discoveryMode ? (
            <section class="v3-collections" aria-labelledby="guided-collections-title">
              <div class="v3-section-heading">
                <div><span class="v3-type-label">Guided discovery</span><h2 id="guided-collections-title" class="v3-type-heading-xl">Begin with a path, not a filter wall.</h2></div>
                <p>These collections are transparent entry points into the current atlas. None is an urgency score or a ranking of peoples.</p>
              </div>
              <div class="v3-collection-grid">
                {collections.map((collection) => (
                  <article class="v3-collection" key={collection.id} data-collection-id={collection.id}>
                    <header><span>{collection.id === "reviewed-context" ? <BookOpenText size={18} aria-hidden="true" /> : collection.id === "language-pathways" ? <Languages size={18} aria-hidden="true" /> : <Globe2 size={18} aria-hidden="true" />}</span><div><h3>{collection.title}</h3><p>{collection.description}</p></div></header>
                    {collection.people.length ? <div class="v3-collection__people">{collection.people.map((people) => <a href={hrefFor(`/peoples/${people.routeKey}`)} key={people.id}><span><strong>{people.displayName}</strong><small>{collectionPeopleMeta(people)}</small></span><ArrowRight size={16} aria-hidden="true" /></a>)}</div> : <p class="v3-collection__empty">This collection becomes available when the required live and editorial records are ready.</p>}
                    <footer>{collection.methodNote}</footer>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section class="v3-people-results" aria-labelledby="people-results-title">
            <div class="v3-people-results__heading">
              <div><span class="v3-type-label">Catalog</span><h2 id="people-results-title">{query.trim() || activeRefinementCount ? `${results.length} matching people` : "Browse the live catalog"}</h2></div>
              {(query.trim() || activeRefinementCount) ? <button type="button" onClick={reset}>Reset</button> : null}
            </div>

            {results.length ? (
              <div class="v3-people-result-grid">
                {visibleResults.map((people) => {
                  const reviewed = editorial.profilesByPeid.has(people.peid);
                  const context = people.contexts[0] ?? null;
                  return (
                    <a class="v3-people-result" href={hrefFor(`/peoples/${people.routeKey}`)} key={people.id}>
                      <div class="v3-people-result__top"><span class={`v3-source-status is-${livePeopleStatusClass(people)}`}>{statusLabel(people)}</span><span class={`v3-depth-tag ${reviewed ? "is-reviewed" : "is-source"}`}>{reviewed ? "Reviewed context" : "Source profile"}</span></div>
                      <h3>{people.displayName}</h3>
                      <p>{[context?.country.name, people.primaryLanguage?.name].filter(Boolean).join(" · ") || "Current PeopleGroups source record"}</p>
                      <dl><div><dt>Population</dt><dd>{formatPeopleCount(people.population.complete ? people.population.knownValue : null)}</dd></div><div><dt>Religion</dt><dd>{people.primaryReligion?.name ?? "Not reported"}</dd></div></dl>
                      <span class="v3-people-result__open">Open profile <ArrowRight size={16} aria-hidden="true" /></span>
                    </a>
                  );
                })}
              </div>
            ) : (
              <div class="v3-people-empty"><Search size={22} aria-hidden="true" /><h3>No people match these refinements.</h3><p>Try a broader search or clear one of the refinements.</p><button type="button" onClick={reset}>Reset people discovery</button></div>
            )}

            {visibleResults.length < results.length ? <button class="v3-people-load-more" type="button" onClick={() => setPage((value) => value + 1)}>Show more people <span>{visibleResults.length} of {results.length}</span></button> : null}
          </section>
        </>
      ) : null}
    </section>
  );
}
