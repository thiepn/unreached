import { ArrowLeft, ArrowUpRight, BookOpen, Compass, Database, Globe2, Languages, RefreshCw, UsersRound } from "lucide-preact";

import { hrefFor } from "../app/router";
import { formatCount, formatPercent, useLiveCountryExplorer } from "../countries";
import { useWorldGeography } from "../map/geography";
import { PEOPLE_GROUPS_ATTRIBUTION, type VisibleCountryRecord } from "../providers/peoplegroups";

function sourceDate(value: string | null): string {
  if (!value) return "Not supplied";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

function contextCoverage(record: VisibleCountryRecord): string {
  const known = record.summary.populationKnownContextCount;
  const total = record.summary.peopleContextCount;
  return known === total ? "Complete across source contexts" : `${known}/${total} contexts have population estimates`;
}

function CountryMetrics({ record }: { record: VisibleCountryRecord }) {
  const summary = record.summary;
  return (
    <div class="country-metric-grid" aria-label="Country mission overview">
      <div class="country-metric"><span>Known represented population</span><strong>{formatCount(summary.knownPopulation)}</strong><small>Sum of known people-group-in-country estimates</small></div>
      <div class="country-metric"><span>People contexts</span><strong>{summary.peopleContextCount}</strong><small>PeopleGroups.org PGID records in this country</small></div>
      <div class="country-metric"><span>Unreached contexts</span><strong>{summary.unreachedContextCount}</strong><small>GSEC 0–3</small></div>
      <div class="country-metric"><span>Other GSEC contexts</span><strong>{summary.otherContextCount}</strong><small>GSEC 4–6; intentionally not relabeled “reached”</small></div>
      <div class="country-metric"><span>Unknown GSEC</span><strong>{summary.unknownContextCount}</strong><small>Source value not supplied</small></div>
      <div class="country-metric"><span>Population coverage</span><strong>{summary.populationKnownContextCount}/{summary.peopleContextCount}</strong><small>{contextCoverage(record)}</small></div>
    </div>
  );
}

function CoveragePanel({ record }: { record: VisibleCountryRecord }) {
  const total = record.summary.peopleContextCount;
  const knownPopulation = record.summary.populationKnownContextCount;
  const classified = total - record.summary.unknownContextCount;
  const languageKnown = record.contexts.filter((context) => context.language.iso6393 || context.language.name).length;
  const religionKnown = record.contexts.filter((context) => context.religion.code || context.religion.name || context.religion.displayName).length;
  const bibleKnown = record.contexts.filter((context) => context.resources.bibleAvailability).length;
  const rows = [
    ["Population estimate", knownPopulation],
    ["GSEC classification", classified],
    ["Primary language", languageKnown],
    ["Primary religion", religionKnown],
    ["Bible availability label", bibleKnown],
  ] as const;

  return (
    <section class="country-section country-coverage" aria-labelledby="coverage-heading">
      <div class="country-section__heading"><div><span class="eyebrow">Data coverage</span><h2 id="coverage-heading">Source-context completeness</h2></div></div>
      <p class="country-section__intro">Coverage is the share of PeopleGroups.org country-context records with a reported field. It is not a confidence score and is not national-population coverage.</p>
      <dl class="coverage-list">
        {rows.map(([label, known]) => {
          const value = total ? known / total * 100 : 0;
          return <div key={label}><dt>{label}</dt><dd>{known}/{total}</dd><meter min="0" max="100" value={value}>{Math.round(value)}%</meter></div>;
        })}
      </dl>
    </section>
  );
}

export function CountryPage({ iso3 }: { iso3: string }) {
  const geography = useWorldGeography();
  const intelligence = useLiveCountryExplorer();
  const code = iso3.toUpperCase();
  const feature = geography.countries.find((country) => country.properties.iso3 === code || country.properties.adminA3 === code) ?? null;
  const record = intelligence.countriesByIso3.get(code) ?? null;

  if (geography.loading) return <section class="country-page country-page--state" role="status">Loading country geography…</section>;
  if (geography.error) return <section class="country-page country-page--state" role="alert">{geography.error}</section>;
  if (!feature) {
    return (
      <section class="country-page country-page--state">
        <div class="eyebrow">Country Explorer</div>
        <h1 class="display-title">Country not found.</h1>
        <p>No Natural Earth Admin-0 area could be matched to <strong>{code}</strong>.</p>
        <a class="inline-link" href={hrefFor("/countries")}><ArrowLeft size={16} aria-hidden="true" /> Back to countries</a>
      </section>
    );
  }

  const name = record?.name ?? feature.properties.name;
  const unreachedPeople = record?.contexts.filter((context) => context.reach.classification === "unreached") ?? [];
  const mapHref = `#/?country=${encodeURIComponent(feature.properties.mapKey)}`;
  const prayerHref = `#/pray?country=${encodeURIComponent(code)}`;

  return (
    <article class="country-page">
      <nav class="country-breadcrumb" aria-label="Breadcrumb">
        <a href={hrefFor("/countries")}><ArrowLeft size={15} aria-hidden="true" /> Countries</a>
        <span>/</span>
        <span aria-current="page">{name}</span>
      </nav>

      <header class="country-hero">
        <div>
          <div class="eyebrow">{record?.subregionName ?? record?.regionName ?? feature.properties.continent ?? "Country Explorer"}</div>
          <h1 class="display-title">{name}</h1>
          <div class="country-identity-line"><span>{code}</span><span>{feature.properties.continent ?? "World"}</span></div>
        </div>
        <div class="country-hero-actions">
          <a class="country-map-link" href={mapHref}>Explore on map <ArrowUpRight size={17} aria-hidden="true" /></a>
          <a class="country-map-link" href={prayerHref}>Pray for this country’s peoples <Compass size={17} aria-hidden="true" /></a>
        </div>
      </header>

      {intelligence.warning ? <div class="country-data-notice country-data-notice--detail" role="status"><Database size={20} aria-hidden="true" /><div><strong>Showing cached source data</strong><p>{intelligence.warning}</p></div></div> : null}
      {intelligence.loading ? <div class="country-data-notice country-data-notice--detail" role="status"><Database size={20} aria-hidden="true" /><div><strong>Loading PeopleGroups.org</strong><p>{intelligence.progress ? `${intelligence.progress.loadedPages}/${intelligence.progress.totalPages} pages` : "Loading live people-country records…"}</p></div></div> : null}
      {!intelligence.loading && intelligence.error ? <div class="country-data-notice country-data-notice--detail" role="alert"><Database size={20} aria-hidden="true" /><div><strong>Live mission data is temporarily unavailable</strong><p>{intelligence.error}</p><button type="button" class="people-reset-filters" onClick={intelligence.retry}><RefreshCw size={15} aria-hidden="true" /> Retry</button></div></div> : null}
      {intelligence.ready && !record ? <div class="country-data-notice country-data-notice--detail" role="note"><Database size={20} aria-hidden="true" /><div><strong>No PeopleGroups.org country-context records found</strong><p>Geographic identity remains available, but the current provider corpus has no matching {code} record.</p></div></div> : null}

      {record ? (
        <>
          <CountryMetrics record={record} />

          <div class="country-content-grid">
            <main class="country-content-main">
              <section class="country-section" aria-labelledby="unreached-people-heading">
                <div class="country-section__heading">
                  <div><span class="eyebrow">GSEC 0–3</span><h2 id="unreached-people-heading">Unreached people contexts</h2></div>
                  <UsersRound size={21} aria-hidden="true" />
                </div>
                <p class="country-section__intro">Rows are country-specific PGID records. A PEID can appear in multiple countries; population and status are therefore shown at the country-context level.</p>
                {unreachedPeople.length ? (
                  <div class="country-people-table-wrap">
                    <table class="country-people-table">
                      <thead><tr><th>People</th><th>Population</th><th>Religion</th><th>Language</th><th>GSEC</th><th>Evangelical level</th><th>Bible</th></tr></thead>
                      <tbody>
                        {unreachedPeople.slice(0, 40).map((people) => (
                          <tr key={people.pgid}>
                            <th scope="row"><a class="country-people-link" href={hrefFor(`/peoples/${people.peid}`)}>{people.displayName}</a><small>PGID {people.pgid} · PEID {people.peid}</small></th>
                            <td>{formatCount(people.population.value)}</td>
                            <td>{people.religion.name ?? people.religion.displayName ?? "Unknown"}</td>
                            <td>{people.language.name ?? people.language.iso6393 ?? "Unknown"}</td>
                            <td>{people.reach.gsec.code ?? "Unknown"}</td>
                            <td>{people.reach.evangelicalLevel ?? "Unknown"}</td>
                            <td>{people.resources.bibleAvailability ?? "Unknown"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p class="country-empty">No current country-context record is classified GSEC 0–3.</p>}
              </section>

              <section class="country-section" aria-labelledby="religion-heading">
                <div class="country-section__heading"><div><span class="eyebrow">Represented source records</span><h2 id="religion-heading">Religious context</h2></div><Globe2 size={21} aria-hidden="true" /></div>
                <p class="country-section__intro">Shares use the summed known population of PeopleGroups.org country-context records. They are not national census shares.</p>
                <div class="country-breakdown-list">
                  {record.religions.map((religion) => (
                    <div class="country-breakdown-row" key={religion.key}>
                      <div><strong>{religion.name}</strong><span>{religion.contextCount} {religion.contextCount === 1 ? "context" : "contexts"} · {formatCount(religion.knownPopulation)} known represented population</span></div>
                      <div><span>{formatPercent(religion.representedShare)}</span><meter min="0" max="100" value={religion.representedShare ?? 0}>{formatPercent(religion.representedShare)}</meter></div>
                    </div>
                  ))}
                </div>
              </section>
            </main>

            <aside class="country-content-rail">
              <section class="country-section" aria-labelledby="languages-heading">
                <div class="country-section__heading"><div><span class="eyebrow">Language</span><h2 id="languages-heading">Major source languages</h2></div><Languages size={20} aria-hidden="true" /></div>
                <div class="country-compact-list">
                  {record.languages.slice(0, 12).map((language) => <div key={language.key}><strong>{language.name}</strong><span>{formatCount(language.knownPopulation)} represented · {language.contextCount} contexts{language.code ? ` · ${language.code}` : ""}</span></div>)}
                </div>
              </section>

              <section class="country-section" aria-labelledby="scripture-heading">
                <div class="country-section__heading"><div><span class="eyebrow">Resources</span><h2 id="scripture-heading">Bible availability</h2></div><BookOpen size={20} aria-hidden="true" /></div>
                <div class="country-compact-list">
                  {record.bibleAvailability.map((item) => <div key={item.status}><strong>{item.status}</strong><span>{item.contextCount} contexts · {formatCount(item.knownPopulation)} known represented population</span></div>)}
                </div>
                <p class="country-section__intro">These are source availability labels, not normalized translation-completeness categories.</p>
              </section>

              <section class="country-section" aria-labelledby="jesus-film-heading">
                <div class="country-section__heading"><div><span class="eyebrow">Media</span><h2 id="jesus-film-heading">Jesus Film availability</h2></div><BookOpen size={20} aria-hidden="true" /></div>
                <div class="country-compact-list">
                  {record.jesusFilmAvailability.map((item) => <div key={item.status}><strong>{item.status}</strong><span>{item.contextCount} contexts</span></div>)}
                </div>
              </section>

              <CoveragePanel record={record} />
            </aside>
          </div>

          <footer class="country-sources">
            <strong>Data sources & denominator</strong>
            <p>{record.summary.denominator}. Newest provider context update: {sourceDate(record.sourceUpdatedAt)}.</p>
            <a href={PEOPLE_GROUPS_ATTRIBUTION.url} target="_blank" rel="noreferrer">{PEOPLE_GROUPS_ATTRIBUTION.label}</a>
            <p>Geographic boundaries: Natural Earth de facto Admin-0 presentation. Country selection is geographic, not a sovereignty statement.</p>
          </footer>
        </>
      ) : null}
    </article>
  );
}
