import { ArrowRight, Database, Filter, RefreshCw, Search, UsersRound } from "lucide-preact";
import { useMemo, useState } from "preact/hooks";

import { hrefFor } from "../app/router";
import {
  filterLivePeople,
  formatPeopleCount,
  livePeopleStatusClass,
  livePeopleStatusLabel,
  useLivePeopleExplorer,
  type LivePeopleFilterState,
} from "../peoples";
import { entityGsecRange, entityResourceBreakdown, entityTaxonomy } from "../providers/peoplegroups";

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
  if (!loadedPages || !totalPages) return "Loading live people-group data…";
  return `Loading live people-group data… ${loadedPages} of ${totalPages} pages`;
}

export function PeoplesPage() {
  const explorer = useLivePeopleExplorer();
  const [filters, setFilters] = useState<LivePeopleFilterState>(DEFAULT_FILTERS);

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

  const results = useMemo(() => filterLivePeople(explorer.peoples, filters), [explorer.peoples, filters]);
  const update = <K extends keyof LivePeopleFilterState>(key: K, value: LivePeopleFilterState[K]) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <section class="peoples-page" aria-labelledby="peoples-title">
      <header class="peoples-hero">
        <div>
          <div class="eyebrow">People Group Explorer</div>
          <h1 id="peoples-title" class="display-title">Meet the peoples behind the map.</h1>
          <p class="lead">Browse live PeopleGroups.org records by people entity, then inspect each country context without converting IMB methodology into incompatible Joshua Project fields.</p>
        </div>
        <div class="peoples-hero__mark" aria-hidden="true"><UsersRound size={35} /></div>
      </header>

      {explorer.warning ? (
        <div class="people-data-notice" role="status">
          <Database size={20} aria-hidden="true" />
          <div><strong>Showing cached source data</strong><p>{explorer.warning}</p></div>
        </div>
      ) : null}

      {explorer.loading ? <div class="people-index-state" role="status">{loadingLabel(explorer.progress?.loadedPages, explorer.progress?.totalPages)}</div> : null}

      {!explorer.loading && explorer.error ? (
        <div class="people-data-notice" role="alert">
          <Database size={20} aria-hidden="true" />
          <div><strong>Live people-group data is temporarily unavailable</strong><p>{explorer.error}</p><button type="button" class="people-reset-filters" onClick={explorer.retry}><RefreshCw size={15} aria-hidden="true" /> Retry</button></div>
        </div>
      ) : null}

      {explorer.ready ? (
        <>
          <div class="people-discovery-bar">
            <label class="people-search" for="people-search">
              <Search size={19} aria-hidden="true" />
              <span class="sr-only">Search people groups</span>
              <input
                id="people-search"
                type="search"
                value={filters.query}
                onInput={(event) => update("query", event.currentTarget.value)}
                placeholder="Search people, PEID, PGID, country, language or religion"
                autoComplete="off"
              />
            </label>
            <div class="people-sort-control">
              <label for="people-sort">Sort</label>
              <select id="people-sort" value={filters.sort} onChange={(event) => update("sort", event.currentTarget.value as LivePeopleFilterState["sort"])}>
                <option value="population-desc">Largest known population</option>
                <option value="gsec-asc">Lowest GSEC first</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>
          </div>

          <details class="people-filter-panel" open>
            <summary><Filter size={17} aria-hidden="true" /> Filters</summary>
            <div class="people-filter-grid">
              <label>Status<select value={filters.status} onChange={(event) => update("status", event.currentTarget.value as LivePeopleFilterState["status"])}><option value="all">All statuses</option><option value="unreached-only">Unreached in all classified contexts</option><option value="mixed">Mixed GSEC status</option><option value="other-only">Other GSEC status</option><option value="unknown">Unknown</option></select></label>
              <label>Country<select value={filters.countryIso3} onChange={(event) => update("countryIso3", event.currentTarget.value)}><option value="">All countries</option>{options.countries.map(([iso3, name]) => <option value={iso3} key={iso3}>{name}</option>)}</select></label>
              <label>Religion<select value={filters.religion} onChange={(event) => update("religion", event.currentTarget.value)}><option value="">All religions</option>{options.religions.map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label>
              <label>Language<select value={filters.language} onChange={(event) => update("language", event.currentTarget.value)}><option value="">All languages</option>{options.languages.map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label>
              <label>Bible availability<select value={filters.bibleAvailability} onChange={(event) => update("bibleAvailability", event.currentTarget.value)}><option value="">Any source label</option>{options.bibleStatuses.map((status) => <option value={status} key={status}>{status}</option>)}</select></label>
              <label>Known population<select value={String(filters.minimumPopulation)} onChange={(event) => update("minimumPopulation", Number(event.currentTarget.value))}><option value="0">Any population</option><option value="10000">10K+</option><option value="100000">100K+</option><option value="1000000">1M+</option><option value="10000000">10M+</option></select></label>
            </div>
            <button class="people-reset-filters" type="button" onClick={() => setFilters(DEFAULT_FILTERS)}>Reset filters</button>
          </details>

          <div class="people-result-count" aria-live="polite">{results.length} of {explorer.peoples.length} people entities · {explorer.totalRecords} country-context records</div>

          {results.length ? (
            <div class="people-card-grid">
              {results.map((people) => {
                const taxonomy = entityTaxonomy(people);
                const gsec = entityGsecRange(people);
                const resources = entityResourceBreakdown(people);
                const bible = resources.bible[0]?.status ?? "Unknown";
                return (
                  <a class="people-card" href={hrefFor(`/peoples/${people.routeKey}`)} key={people.id}>
                    <div class="people-card__head">
                      <div>
                        <span class={`people-status people-status--${livePeopleStatusClass(people)}`}>{livePeopleStatusLabel(people)}</span>
                        <h2>{people.displayName}</h2>
                      </div>
                      <ArrowRight size={18} aria-hidden="true" />
                    </div>
                    <p class="people-card__taxonomy">{taxonomy.peopleCluster ?? taxonomy.affinityBloc ?? "People group"}</p>
                    <div class="people-card__population"><strong>{formatPeopleCount(people.population.knownValue)}</strong><span>{people.population.complete ? "Estimated population across all contexts" : `Partial estimated sum · ${people.population.knownContextCount}/${people.population.totalContextCount} contexts known`}</span></div>
                    <dl class="people-card__facts">
                      <div><dt>Religion</dt><dd>{people.primaryReligion?.name ?? "Unknown"}</dd></div>
                      <div><dt>Language</dt><dd>{people.primaryLanguage?.name ?? "Unknown"}</dd></div>
                      <div><dt>GSEC</dt><dd>{gsec ? (gsec.min === gsec.max ? String(gsec.min) : `${gsec.min}–${gsec.max}`) : "Unknown"}</dd></div>
                      <div><dt>Bible</dt><dd>{bible}</dd></div>
                    </dl>
                    <span class="people-card__countries">PEID {people.peid} · {people.contexts.length} {people.contexts.length === 1 ? "country context" : "country contexts"}</span>
                  </a>
                );
              })}
            </div>
          ) : <div class="people-index-empty">No people groups match the current filters.</div>}
        </>
      ) : null}
    </section>
  );
}
