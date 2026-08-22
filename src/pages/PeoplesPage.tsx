import { ArrowRight, Database, Filter, Search, UsersRound } from "lucide-preact";
import { useMemo, useState } from "preact/hooks";

import { hrefFor } from "../app/router";
import {
  filterPeopleProfiles,
  formatDataQuality,
  formatPeopleCount,
  formatPeoplePercent,
  formatPeopleScripture,
  usePeopleExplorer,
  type PeopleFilterState,
  type PeopleGroupProfile,
} from "../peoples";

const DEFAULT_FILTERS: PeopleFilterState = {
  query: "",
  status: "all",
  countryIso3: "",
  languageId: "",
  religionId: "",
  scriptureStatus: "",
  minimumPopulation: 0,
  sort: "population-desc",
};

function statusLabel(profile: PeopleGroupProfile): string {
  if (profile.mission.frontier === true) return "Frontier";
  if (profile.mission.classification === "unreached") return "Unreached";
  if (profile.mission.classification === "reached") return "Reached";
  return "Status unknown";
}

function statusClass(profile: PeopleGroupProfile): string {
  if (profile.mission.frontier === true) return "frontier";
  if (profile.mission.classification === "unreached") return "unreached";
  if (profile.mission.classification === "reached") return "reached";
  return "unknown";
}

export function PeoplesPage() {
  const explorer = usePeopleExplorer();
  const [filters, setFilters] = useState<PeopleFilterState>(DEFAULT_FILTERS);
  const profiles = explorer.dataset?.peoples ?? [];

  const options = useMemo(() => {
    const countries = new Map<string, string>();
    const languages = new Map<string, string>();
    const religions = new Map<string, string>();
    for (const people of profiles) {
      for (const country of people.countries) countries.set(country.iso3, country.countryName);
      if (people.primaryLanguage) languages.set(people.primaryLanguage.languageId, people.primaryLanguage.name);
      for (const country of people.countries) if (country.primaryLanguageId && country.primaryLanguageName) languages.set(country.primaryLanguageId, country.primaryLanguageName);
      if (people.primaryReligion) religions.set(people.primaryReligion.religionId, people.primaryReligion.name);
      for (const country of people.countries) if (country.primaryReligionId && country.primaryReligionName) religions.set(country.primaryReligionId, country.primaryReligionName);
    }
    return {
      countries: [...countries.entries()].sort((a, b) => a[1].localeCompare(b[1], "en")),
      languages: [...languages.entries()].sort((a, b) => a[1].localeCompare(b[1], "en")),
      religions: [...religions.entries()].sort((a, b) => a[1].localeCompare(b[1], "en")),
    };
  }, [profiles]);

  const results = useMemo(() => filterPeopleProfiles(profiles, filters), [profiles, filters]);
  const update = <K extends keyof PeopleFilterState>(key: K, value: PeopleFilterState[K]) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <section class="peoples-page" aria-labelledby="peoples-title">
      <header class="peoples-hero">
        <div>
          <div class="eyebrow">People Group Explorer</div>
          <h1 id="peoples-title" class="display-title">Meet the peoples behind the map.</h1>
          <p class="lead">Browse global people groups, then move into country context, language, religion, gospel access and Scripture availability without treating unknown values as zero.</p>
        </div>
        <div class="peoples-hero__mark" aria-hidden="true"><UsersRound size={35} /></div>
      </header>

      {!explorer.loading && !explorer.dataset ? (
        <div class="people-data-notice" role="note">
          <Database size={20} aria-hidden="true" />
          <div>
            <strong>People-group data is release-gated</strong>
            <p>{explorer.error ?? explorer.status?.reason ?? "The browser and profile system are ready, but source-derived records are not published in this build."}</p>
          </div>
        </div>
      ) : null}

      {explorer.loading ? <div class="people-index-state" role="status">Loading people-group data…</div> : null}

      {explorer.dataset ? (
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
                placeholder="Search people, country, language, religion or cluster"
                autoComplete="off"
              />
            </label>
            <div class="people-sort-control">
              <label for="people-sort">Sort</label>
              <select id="people-sort" value={filters.sort} onChange={(event) => update("sort", event.currentTarget.value as PeopleFilterState["sort"])}>
                <option value="population-desc">Largest population</option>
                <option value="least-reached">Least reached first</option>
                <option value="evangelical-asc">Lowest evangelical %</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>
          </div>

          <details class="people-filter-panel" open>
            <summary><Filter size={17} aria-hidden="true" /> Filters</summary>
            <div class="people-filter-grid">
              <label>Status<select value={filters.status} onChange={(event) => update("status", event.currentTarget.value as PeopleFilterState["status"])}><option value="all">All statuses</option><option value="frontier">Frontier</option><option value="unreached">Unreached</option><option value="reached">Reached</option><option value="unknown">Unknown</option></select></label>
              <label>Country<select value={filters.countryIso3} onChange={(event) => update("countryIso3", event.currentTarget.value)}><option value="">All countries</option>{options.countries.map(([iso3, name]) => <option value={iso3} key={iso3}>{name}</option>)}</select></label>
              <label>Religion<select value={filters.religionId} onChange={(event) => update("religionId", event.currentTarget.value)}><option value="">All religions</option>{options.religions.map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label>
              <label>Language<select value={filters.languageId} onChange={(event) => update("languageId", event.currentTarget.value)}><option value="">All languages</option>{options.languages.map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label>
              <label>Scripture<select value={filters.scriptureStatus} onChange={(event) => update("scriptureStatus", event.currentTarget.value)}><option value="">Any Scripture status</option><option value="translation-needed">Translation needed</option><option value="translation-started">Translation started</option><option value="portions">Portions</option><option value="new-testament">New Testament</option><option value="complete-bible">Complete Bible</option><option value="unknown">Unknown</option></select></label>
              <label>Population<select value={String(filters.minimumPopulation)} onChange={(event) => update("minimumPopulation", Number(event.currentTarget.value))}><option value="0">Any population</option><option value="10000">10K+</option><option value="100000">100K+</option><option value="1000000">1M+</option><option value="10000000">10M+</option></select></label>
            </div>
            <button class="people-reset-filters" type="button" onClick={() => setFilters(DEFAULT_FILTERS)}>Reset filters</button>
          </details>

          <div class="people-result-count" aria-live="polite">{results.length} of {profiles.length} {profiles.length === 1 ? "people group" : "people groups"}</div>

          {results.length ? (
            <div class="people-card-grid">
              {results.map((people) => (
                <a class="people-card" href={hrefFor(`/peoples/${people.sourcePeopleId}`)} key={people.peopleGroupId}>
                  <div class="people-card__head">
                    <div>
                      <span class={`people-status people-status--${statusClass(people)}`}>{statusLabel(people)}</span>
                      <h2>{people.name}</h2>
                    </div>
                    <ArrowRight size={18} aria-hidden="true" />
                  </div>
                  <p class="people-card__taxonomy">{people.cluster ?? people.affinityBloc ?? "People group"}</p>
                  <div class="people-card__population"><strong>{formatPeopleCount(people.globalPopulation.value)}</strong><span>{formatDataQuality(people.globalPopulation.quality)} global population</span></div>
                  <dl class="people-card__facts">
                    <div><dt>Religion</dt><dd>{people.primaryReligion?.name ?? "Unknown"}</dd></div>
                    <div><dt>Language</dt><dd>{people.primaryLanguage?.name ?? "Unknown"}</dd></div>
                    <div><dt>Evangelical</dt><dd>{formatPeoplePercent(people.mission.percentEvangelical.value)}</dd></div>
                    <div><dt>Scripture</dt><dd>{formatPeopleScripture(people.scripture.bibleStatus)}</dd></div>
                  </dl>
                  <span class="people-card__countries">{people.countryCount} {people.countryCount === 1 ? "country context" : "country contexts"}</span>
                </a>
              ))}
            </div>
          ) : <div class="people-index-empty">No people groups match the current filters.</div>}
        </>
      ) : null}
    </section>
  );
}
