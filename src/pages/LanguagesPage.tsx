import { BookOpen, Database, Languages, Search } from "lucide-preact";
import { useMemo, useState } from "preact/hooks";

import { hrefFor } from "../app/router";
import { filterLanguages, formatLanguageCount, formatLanguageScripture, formatLanguageStatus, useLanguageExplorer, type LanguageFilterState } from "../languages";

const initialFilters: LanguageFilterState = {
  query: "",
  status: "all",
  scripture: "all",
  focus: "all",
  sort: "name",
};

export function LanguagesPage() {
  const explorer = useLanguageExplorer();
  const [filters, setFilters] = useState<LanguageFilterState>(initialFilters);
  const records = useMemo(() => filterLanguages(explorer.dataset?.languages ?? [], filters), [explorer.dataset, filters]);

  return (
    <section class="languages-page">
      <header class="languages-hero">
        <div>
          <div class="eyebrow">Languages & Scripture</div>
          <h1 class="display-title">Follow the gospel-access story through language.</h1>
          <p class="lead">Explore which peoples and countries use a language, what Scripture milestones are reported, and which media resources are available. Unknown is kept distinct from unavailable.</p>
        </div>
        <div class="languages-hero__mark" aria-hidden="true"><Languages size={28} /></div>
      </header>

      {!explorer.loading && !explorer.dataset ? (
        <div class="languages-release-notice" role="note">
          <Database size={20} aria-hidden="true" />
          <div><strong>Language records are not published in this build</strong><p>{explorer.error ?? explorer.status?.reason ?? "The U9 experience is ready, but source-derived language records remain publication-gated."}</p></div>
        </div>
      ) : null}

      {explorer.dataset ? (
        <>
          <div class="language-filters" aria-label="Language filters">
            <label class="language-search"><Search size={17} aria-hidden="true" /><span class="sr-only">Search languages</span><input value={filters.query} onInput={(event) => setFilters({ ...filters, query: event.currentTarget.value })} placeholder="Search language, ISO code, people or country" /></label>
            <label><span>Status</span><select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.currentTarget.value as LanguageFilterState["status"] })}><option value="all">All statuses</option><option value="living">Living</option><option value="nearly-extinct">Nearly extinct</option><option value="extinct">Extinct</option><option value="historical">Historical</option><option value="ancient">Ancient</option><option value="constructed">Constructed</option><option value="unknown">Unknown</option></select></label>
            <label><span>Scripture</span><select value={filters.scripture} onChange={(event) => setFilters({ ...filters, scripture: event.currentTarget.value as LanguageFilterState["scripture"] })}><option value="all">Any Scripture status</option><option value="translation-needed">Translation needed</option><option value="translation-started">Translation started</option><option value="portions">Portions</option><option value="new-testament">New Testament</option><option value="complete-bible">Complete Bible</option><option value="unknown">Unknown</option></select></label>
            <label><span>Focus</span><select value={filters.focus} onChange={(event) => setFilters({ ...filters, focus: event.currentTarget.value as LanguageFilterState["focus"] })}><option value="all">All languages</option><option value="translation-needed">Translation needed</option><option value="no-complete-bible">No complete Bible</option><option value="audio-available">Audio available</option><option value="jesus-film">Jesus Film available</option><option value="unreached-peoples">Used by unreached peoples</option></select></label>
            <label><span>Sort</span><select value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.currentTarget.value as LanguageFilterState["sort"] })}><option value="name">Alphabetical</option><option value="people-count-desc">Most people groups</option><option value="represented-population-desc">Largest represented population</option><option value="scripture-need-first">Scripture need first</option></select></label>
          </div>

          <div class="language-results-heading"><strong>{records.length} {records.length === 1 ? "language" : "languages"}</strong><span>{explorer.dataset.languages.length} published total</span></div>
          <div class="language-card-grid">
            {records.map((record) => (
              <a class="language-card" href={hrefFor(`/languages/${record.iso6393}`)} key={record.languageId}>
                <div class="language-card__top"><span>{record.iso6393.toUpperCase()}</span><span>{formatLanguageStatus(record.status)}</span></div>
                <h2>{record.name}</h2>
                <div class="language-card__scripture"><BookOpen size={16} aria-hidden="true" /><strong>{formatLanguageScripture(record.scripture.bibleStatus)}</strong></div>
                <dl><div><dt>People groups</dt><dd>{record.peopleGroupCount}</dd></div><div><dt>Countries</dt><dd>{record.countryCount}</dd></div><div><dt>Represented pop.</dt><dd>{formatLanguageCount(record.knownRepresentedPopulation)}</dd></div><div><dt>Unreached groups</dt><dd>{record.unreachedPeopleGroupCount}</dd></div></dl>
              </a>
            ))}
          </div>
          {!records.length ? <p class="language-empty">No published languages match these filters.</p> : null}
        </>
      ) : null}

      <aside class="language-method-note"><strong>Language taxonomy rule</strong><p>Family and branch labels are shown only when a separately approved source supplies them. U9 does not infer linguistic families from names, geography, religion or people-group relationships.</p></aside>
    </section>
  );
}
