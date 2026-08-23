import { BookOpen, Database, Languages, Search } from "lucide-preact";
import { useEffect, useMemo, useState } from "preact/hooks";

import { hrefFor } from "../app/router";
import {
  filterLiveLanguages,
  formatLanguageCount,
  rawResourceSummary,
  useLiveLanguageExplorer,
  type LiveLanguageFilterState,
} from "../languages";

const LANGUAGE_PAGE_SIZE = 60;

const initialFilters: LiveLanguageFilterState = {
  query: "",
  reach: "all",
  bible: "all",
  sort: "name",
};

export function LanguagesPage() {
  const explorer = useLiveLanguageExplorer();
  const [filters, setFilters] = useState<LiveLanguageFilterState>(initialFilters);
  const [visibleCount, setVisibleCount] = useState(LANGUAGE_PAGE_SIZE);
  const records = useMemo(() => filterLiveLanguages(explorer.languages, filters), [explorer.languages, filters]);
  const visibleRecords = useMemo(() => records.slice(0, visibleCount), [records, visibleCount]);

  useEffect(() => setVisibleCount(LANGUAGE_PAGE_SIZE), [filters]);

  return (
    <section class="languages-page" aria-labelledby="languages-title">
      <header class="languages-hero">
        <div>
          <div class="eyebrow">Languages & Resources</div>
          <h1 id="languages-title" class="display-title">Explore languages and resources.</h1>
          <p class="lead">See which languages appear in the mission data, where they are represented, and which Bible and Jesus Film resource labels PeopleGroups.org reports.</p>
        </div>
        <div class="languages-hero__mark" aria-hidden="true"><Languages size={28} /></div>
      </header>

      {explorer.loading && !explorer.ready ? (
        <div class="languages-release-notice" role="status">
          <Database size={20} aria-hidden="true" />
          <div><strong>Loading current language records</strong><p>{explorer.progress ? `Source page ${explorer.progress.loadedPages} of ${explorer.progress.totalPages}.` : "Preparing the shared mission dataset."}</p></div>
        </div>
      ) : null}

      {explorer.error && !explorer.ready ? (
        <div class="languages-release-notice" role="alert">
          <Database size={20} aria-hidden="true" />
          <div><strong>Live language records are unavailable</strong><p>{explorer.error}</p><button type="button" class="text-button" onClick={explorer.retry}>Retry source</button></div>
        </div>
      ) : null}

      {explorer.warning ? (
        <div class="languages-release-notice" role="note">
          <Database size={20} aria-hidden="true" />
          <div><strong>{explorer.stale ? "Using cached language records" : "Language source notice"}</strong><p>{explorer.warning}</p></div>
        </div>
      ) : null}

      {explorer.ready ? (
        <>
          <div class="language-filters" aria-label="Language filters">
            <label class="language-search"><Search size={17} aria-hidden="true" /><span class="sr-only">Search languages</span><input value={filters.query} onInput={(event) => setFilters({ ...filters, query: event.currentTarget.value })} placeholder="Search language, ISO code, people or country" /></label>
            <label><span>Mission context</span><select value={filters.reach} onChange={(event) => setFilters({ ...filters, reach: event.currentTarget.value as LiveLanguageFilterState["reach"] })}><option value="all">All languages</option><option value="has-unreached">Has GSEC 0–3 context</option><option value="no-unreached">No GSEC 0–3 context</option><option value="unknown-only">GSEC entirely unknown</option></select></label>
            <label><span>Bible label</span><select value={filters.bible} onChange={(event) => setFilters({ ...filters, bible: event.currentTarget.value })}><option value="all">Any reported label</option>{explorer.bibleLabels.map((label) => <option value={label} key={label}>{label}</option>)}</select></label>
            <label><span>Sort</span><select value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.currentTarget.value as LiveLanguageFilterState["sort"] })}><option value="name">Alphabetical</option><option value="people-count-desc">Most people-group records</option><option value="represented-population-desc">Largest represented population</option><option value="unreached-contexts-desc">Most GSEC 0–3 contexts</option></select></label>
          </div>

          <div class="language-results-heading" aria-live="polite"><strong>Showing {visibleRecords.length} of {records.length} matching languages</strong><span>{explorer.languages.length} current ISO-coded languages total</span></div>
          <div class="language-card-grid">
            {visibleRecords.map((record) => (
              <a class="language-card" href={hrefFor(`/languages/${record.iso6393}`)} key={record.id}>
                <div class="language-card__top"><span>{record.iso6393.toUpperCase()}</span><span>{record.familyName ?? "Family not reported"}</span></div>
                <h2>{record.name}</h2>
                <div class="language-card__scripture"><BookOpen size={16} aria-hidden="true" /><strong>{rawResourceSummary(record.bible.breakdown, record.bible.knownContextCount, record.contextCount)}</strong></div>
                <dl><div><dt>People-group records</dt><dd>{record.peopleEntityCount}</dd></div><div><dt>Countries</dt><dd>{record.countryCount}</dd></div><div><dt>Represented pop.</dt><dd>{formatLanguageCount(record.knownPopulation)}{record.populationCoverageComplete ? "" : "*"}</dd></div><div><dt>GSEC 0–3 contexts</dt><dd>{record.unreachedContextCount}</dd></div></dl>
              </a>
            ))}
          </div>
          {!records.length ? <p class="language-empty">No current language records match these filters.</p> : null}
          {visibleRecords.length < records.length ? (
            <div class="result-load-more">
              <button type="button" onClick={() => setVisibleCount((count) => Math.min(count + LANGUAGE_PAGE_SIZE, records.length))}>Show {Math.min(LANGUAGE_PAGE_SIZE, records.length - visibleRecords.length)} more</button>
              <span>{records.length - visibleRecords.length} remaining</span>
            </div>
          ) : null}
        </>
      ) : null}

      <aside class="language-method-note"><strong>How to read the resource data</strong><p>These are source-reported availability labels, not a Bible-translation completeness scale. Population figures are sums of known people-group record estimates, not a language census.</p></aside>
    </section>
  );
}
