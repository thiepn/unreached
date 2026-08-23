import { BookOpen, Database, Languages, Search } from "lucide-preact";
import { useMemo, useState } from "preact/hooks";

import { hrefFor } from "../app/router";
import {
  filterLiveLanguages,
  formatLanguageCount,
  rawResourceSummary,
  useLiveLanguageExplorer,
  type LiveLanguageFilterState,
} from "../languages";

const initialFilters: LiveLanguageFilterState = {
  query: "",
  reach: "all",
  bible: "all",
  sort: "name",
};

export function LanguagesPage() {
  const explorer = useLiveLanguageExplorer();
  const [filters, setFilters] = useState<LiveLanguageFilterState>(initialFilters);
  const records = useMemo(() => filterLiveLanguages(explorer.languages, filters), [explorer.languages, filters]);

  return (
    <section class="languages-page">
      <header class="languages-hero">
        <div>
          <div class="eyebrow">Languages & Resources</div>
          <h1 class="display-title">Follow gospel access through the languages people report.</h1>
          <p class="lead">Explore ISO 639-3 languages represented in current PeopleGroups.org country-context records, together with source-native Bible and Jesus Film availability labels. Unknown remains distinct from unavailable.</p>
        </div>
        <div class="languages-hero__mark" aria-hidden="true"><Languages size={28} /></div>
      </header>

      {explorer.loading && !explorer.ready ? (
        <div class="languages-release-notice" role="status">
          <Database size={20} aria-hidden="true" />
          <div><strong>Loading live language records</strong><p>{explorer.progress ? `PeopleGroups.org page ${explorer.progress.loadedPages} of ${explorer.progress.totalPages}.` : "Reading the shared PeopleGroups.org runtime corpus."}</p></div>
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
          <div><strong>{explorer.stale ? "Using stale cached language records" : "Language source notice"}</strong><p>{explorer.warning}</p></div>
        </div>
      ) : null}

      {explorer.ready ? (
        <>
          <div class="language-filters" aria-label="Language filters">
            <label class="language-search"><Search size={17} aria-hidden="true" /><span class="sr-only">Search languages</span><input value={filters.query} onInput={(event) => setFilters({ ...filters, query: event.currentTarget.value })} placeholder="Search language, ISO code, people or country" /></label>
            <label><span>GSEC context</span><select value={filters.reach} onChange={(event) => setFilters({ ...filters, reach: event.currentTarget.value as LiveLanguageFilterState["reach"] })}><option value="all">All languages</option><option value="has-unreached">Has GSEC 0–3 context</option><option value="no-unreached">No GSEC 0–3 context</option><option value="unknown-only">GSEC entirely unknown</option></select></label>
            <label><span>Bible source label</span><select value={filters.bible} onChange={(event) => setFilters({ ...filters, bible: event.currentTarget.value })}><option value="all">Any reported label</option>{explorer.bibleLabels.map((label) => <option value={label} key={label}>{label}</option>)}</select></label>
            <label><span>Sort</span><select value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.currentTarget.value as LiveLanguageFilterState["sort"] })}><option value="name">Alphabetical</option><option value="people-count-desc">Most people entities</option><option value="represented-population-desc">Largest represented population</option><option value="unreached-contexts-desc">Most GSEC 0–3 contexts</option></select></label>
          </div>

          <div class="language-results-heading"><strong>{records.length} {records.length === 1 ? "language" : "languages"}</strong><span>{explorer.languages.length} current ISO-coded languages</span></div>
          <div class="language-card-grid">
            {records.map((record) => (
              <a class="language-card" href={hrefFor(`/languages/${record.iso6393}`)} key={record.id}>
                <div class="language-card__top"><span>{record.iso6393.toUpperCase()}</span><span>{record.familyName ?? "Family not reported"}</span></div>
                <h2>{record.name}</h2>
                <div class="language-card__scripture"><BookOpen size={16} aria-hidden="true" /><strong>{rawResourceSummary(record.bible.breakdown, record.bible.knownContextCount, record.contextCount)}</strong></div>
                <dl><div><dt>People entities</dt><dd>{record.peopleEntityCount}</dd></div><div><dt>Countries</dt><dd>{record.countryCount}</dd></div><div><dt>Represented pop.</dt><dd>{formatLanguageCount(record.knownPopulation)}{record.populationCoverageComplete ? "" : "*"}</dd></div><div><dt>GSEC 0–3 contexts</dt><dd>{record.unreachedContextCount}</dd></div></dl>
              </a>
            ))}
          </div>
          {!records.length ? <p class="language-empty">No current language records match these filters.</p> : null}
        </>
      ) : null}

      <aside class="language-method-note"><strong>What these resource labels mean</strong><p>PeopleGroups.org reports language, Bible availability, Jesus Film availability and total resource indicators on people-group-in-country records. Unreached preserves those source labels. It does not translate “Available” into “portions,” “New Testament,” or “complete Bible,” and represented population is a sum of known PGID context estimates rather than a language census.</p></aside>
    </section>
  );
}
