import { ArrowLeft, ArrowUpRight, BookOpen, Database, Film, Languages, Link2, UsersRound } from "lucide-preact";

import { hrefFor } from "../app/router";
import { formatLanguageCount, rawResourceSummary, useLiveLanguageExplorer, type LiveLanguagePeopleSummary } from "../languages";

function peopleReachLabel(people: LiveLanguagePeopleSummary): string {
  const known = people.unreachedContextCount + people.otherContextCount;
  if (!known) return "GSEC unknown";
  if (people.unreachedContextCount && people.otherContextCount) return "Mixed GSEC contexts";
  if (people.unreachedContextCount) return "GSEC 0–3 contexts";
  return "GSEC 4–6 contexts";
}

function resourceBreakdownRows(items: Array<{ label: string; contextCount: number }>) {
  return items.length ? items.map((item) => <li key={item.label}><strong>{item.label}</strong><span>{item.contextCount} {item.contextCount === 1 ? "context" : "contexts"}</span></li>) : <li><strong>Unknown</strong><span>No source value reported</span></li>;
}

export function LanguagePage({ iso6393 }: { iso6393: string }) {
  const explorer = useLiveLanguageExplorer();
  const code = iso6393.toLowerCase();
  const record = explorer.languagesByIso.get(code) ?? null;

  if (explorer.loading && !explorer.ready) return <section class="language-page language-page--state" role="status">Loading live language data{explorer.progress ? `… ${explorer.progress.loadedPages}/${explorer.progress.totalPages}` : "…"}</section>;
  if (explorer.error && !explorer.ready) return <section class="language-page language-page--state"><div class="eyebrow">Languages & Resources</div><h1 class="display-title">Language profile unavailable.</h1><p>{explorer.error}</p><button type="button" class="text-button" onClick={explorer.retry}>Retry source</button><a class="inline-link" href={hrefFor("/languages")}><ArrowLeft size={16} aria-hidden="true" /> Back to languages</a></section>;
  if (!record) return <section class="language-page language-page--state"><div class="eyebrow">Languages & Resources</div><h1 class="display-title">Language not found.</h1><p>No current PeopleGroups.org record with ISO 639-3 code <strong>{code}</strong> is available.</p><a class="inline-link" href={hrefFor("/languages")}><ArrowLeft size={16} aria-hidden="true" /> Back to languages</a></section>;

  return (
    <article class="language-page">
      <nav class="language-breadcrumb" aria-label="Breadcrumb"><a href={hrefFor("/languages")}><ArrowLeft size={15} aria-hidden="true" /> Languages</a><span>/</span><span aria-current="page">{record.name}</span></nav>
      <header class="language-profile-hero">
        <div><div class="eyebrow">ISO 639-3 · {record.iso6393.toUpperCase()}</div><h1 class="display-title">{record.name}</h1><p>{record.familyName ? `${record.familyName} · ` : ""}{record.contextCount} PeopleGroups.org country-context {record.contextCount === 1 ? "record" : "records"}</p></div>
        {record.countries[0] ? <a class="language-country-cta" href={hrefFor(`/countries/${record.countries[0].iso3}`)}>Top represented country: {record.countries[0].name} <ArrowUpRight size={16} aria-hidden="true" /></a> : null}
      </header>

      {explorer.warning ? <div class="languages-release-notice" role="note"><Database size={18} aria-hidden="true" /><div><strong>{explorer.stale ? "Using stale cached source data" : "Source notice"}</strong><p>{explorer.warning}</p></div></div> : null}

      <div class="language-metric-grid"><div><span>People entities</span><strong>{record.peopleEntityCount}</strong><small>Unique PEIDs represented by this language code</small></div><div><span>Countries</span><strong>{record.countryCount}</strong><small>PGID country contexts using this ISO code</small></div><div><span>Represented population</span><strong>{formatLanguageCount(record.knownPopulation)}</strong><small>{record.populationKnownContextCount}/{record.contextCount} contexts report population</small></div><div><span>GSEC 0–3 contexts</span><strong>{record.unreachedContextCount}</strong><small>{record.otherContextCount} GSEC 4–6 · {record.unknownContextCount} unknown</small></div></div>

      <div class="language-profile-grid">
        <main>
          <section class="language-section" aria-labelledby="language-peoples-heading"><div class="language-section__heading"><div><span class="eyebrow">People groups</span><h2 id="language-peoples-heading">Peoples represented under {record.name}</h2></div><UsersRound size={20} aria-hidden="true" /></div><p class="language-section__intro">PEIDs are grouped only from PeopleGroups.org records whose primary-language field reports this ISO 639-3 code. Counts below remain tied to those country contexts.</p>{record.peoples.length ? <div class="language-table-wrap"><table class="language-table"><thead><tr><th>People</th><th>Contexts</th><th>Known population</th><th>GSEC</th></tr></thead><tbody>{record.peoples.map((people) => <tr key={people.peid}><th scope="row"><a href={hrefFor(`/peoples/${people.peid}`)}>{people.name}</a></th><td>{people.contextCount}</td><td>{formatLanguageCount(people.knownPopulation)}</td><td>{peopleReachLabel(people)}</td></tr>)}</tbody></table></div> : <p class="language-empty">No current PEID relationships are available for this language.</p>}</section>

          <section class="language-section" aria-labelledby="language-countries-heading"><div class="language-section__heading"><div><span class="eyebrow">Geographic context</span><h2 id="language-countries-heading">Countries</h2></div><Languages size={20} aria-hidden="true" /></div>{record.countries.length ? <div class="language-country-grid">{record.countries.map((country) => <a href={hrefFor(`/countries/${country.iso3}`)} key={country.iso3}><strong>{country.name}</strong><span>{country.contextCount} contexts · {country.unreachedContextCount} GSEC 0–3 · {formatLanguageCount(country.knownPopulation)} represented</span></a>)}</div> : <p class="language-empty">No country contexts are available for this language.</p>}</section>
        </main>

        <aside>
          <section class="language-section language-scripture-panel" aria-labelledby="language-scripture-heading"><div class="language-section__heading"><div><span class="eyebrow">Source-reported resources</span><h2 id="language-scripture-heading">Bible & media</h2></div><BookOpen size={20} aria-hidden="true" /></div><dl class="language-fact-list"><div><dt>Bible summary</dt><dd>{rawResourceSummary(record.bible.breakdown, record.bible.knownContextCount, record.contextCount)}</dd></div><div><dt><Film size={15} aria-hidden="true" /> Jesus Film</dt><dd>{rawResourceSummary(record.jesusFilm.breakdown, record.jesusFilm.knownContextCount, record.contextCount)}</dd></div><div><dt>Resource-count field</dt><dd>{record.resources.knownContextCount}/{record.contextCount} contexts reported</dd></div></dl><h3 class="language-resource-subheading">Bible source labels</h3><ul class="language-resource-breakdown">{resourceBreakdownRows(record.bible.breakdown)}</ul><h3 class="language-resource-subheading">Jesus Film source labels</h3><ul class="language-resource-breakdown">{resourceBreakdownRows(record.jesusFilm.breakdown)}</ul><p class="language-resource-note">These labels are preserved exactly as source availability indicators. They are not converted into “portions,” “New Testament,” or “complete Bible,” and they do not establish dialect fit, licensing, local accessibility, literacy, comprehension, or actual use.</p></section>

          <section class="language-section" aria-labelledby="language-taxonomy-heading"><div class="language-section__heading"><div><span class="eyebrow">Linguistic identity</span><h2 id="language-taxonomy-heading">Source identity</h2></div><Languages size={20} aria-hidden="true" /></div><dl class="language-fact-list"><div><dt>ISO 639-3</dt><dd>{record.iso6393}</dd></div><div><dt>Language name</dt><dd>{record.name}</dd></div><div><dt>Family</dt><dd>{record.familyName ?? "Not reported"}</dd></div><div><dt>Source contexts</dt><dd>{record.contextCount}</dd></div><div><dt>Population field coverage</dt><dd>{record.populationKnownContextCount}/{record.contextCount}</dd></div></dl></section>

          <section class="language-section" aria-labelledby="language-sources-heading"><div class="language-section__heading"><div><span class="eyebrow">Transparency</span><h2 id="language-sources-heading">Source & denominator</h2></div><Link2 size={20} aria-hidden="true" /></div><p class="language-section__intro">{record.denominator}. Repeated language/resource labels across PGID contexts are shown as a distribution rather than collapsed into a stronger translation-status claim.</p><div class="language-source-ids">peoplegroups-org-api · loaded {explorer.loadedAt ? new Date(explorer.loadedAt).toLocaleDateString("en") : "this session"}{record.sourceUpdatedAt ? ` · newest source update ${new Date(record.sourceUpdatedAt).toLocaleDateString("en")}` : ""}</div><a class="language-source-link" href="https://peoplegroups.org/using-the-api/" target="_blank" rel="noreferrer">PeopleGroups.org — IMB Global Research <ArrowUpRight size={13} aria-hidden="true" /></a></section>
        </aside>
      </div>

      <footer class="language-meaning-note"><Database size={19} aria-hidden="true" /><div><strong>How to read this page</strong><p>This is a source-aware aggregation of PeopleGroups.org people-group-in-country records by ISO 639-3 language. It is not an Ethnologue language census or a ProgressBible translation-progress dataset, and it does not infer missing translation milestones.</p></div></footer>
    </article>
  );
}
