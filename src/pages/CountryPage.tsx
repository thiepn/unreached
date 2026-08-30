import { ArrowLeft, ArrowUpRight, BookOpen, Compass, Database, Globe2, Languages, RefreshCw, UsersRound } from "lucide-preact";
import { useEffect, useState } from "preact/hooks";

import { hrefFor } from "../app/router";
import { CountryGuidedStart } from "../components/CountryGuidedStart";
import { formatCount, formatPercent, useLiveCountryExplorer } from "../countries";
import { useWorldGeography } from "../map/geography";
import { PEOPLE_GROUPS_ATTRIBUTION, type VisibleCountryRecord } from "../providers/peoplegroups";

const DETAIL_RECORD_BATCH_SIZE = 40;

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
    <div class="country-metric-grid country-metric-grid--comprehension" aria-label="Country mission overview">
      <div class="country-metric"><span>Unreached people groups</span><strong>{summary.unreachedContextCount}</strong><small>Source records classified as unreached.</small></div>
      <div class="country-metric"><span>People groups represented</span><strong>{summary.peopleContextCount}</strong><small>People-group-in-country records in the current source.</small></div>
      <div class="country-metric"><span>Known represented population</span><strong>{formatCount(summary.knownPopulation)}</strong><small>Sum of available source estimates; not national census population.</small></div>
    </div>
  );
}

function CountryResearchMetrics({ record }: { record: VisibleCountryRecord }) {
  const summary = record.summary;
  const classified = summary.peopleContextCount - summary.unknownContextCount;
  return (
    <dl class="country-research-metrics" aria-label="Detailed country source metrics">
      <div><dt>Other GSEC contexts</dt><dd>{summary.otherContextCount}</dd><small>GSEC 4–6; not relabeled “reached.”</small></div>
      <div><dt>Unknown GSEC</dt><dd>{summary.unknownContextCount}</dd><small>No source mission-status value.</small></div>
      <div><dt>Population estimate fields</dt><dd>{summary.populationKnownContextCount}/{summary.peopleContextCount}</dd><small>{contextCoverage(record)}</small></div>
      <div><dt>Mission-status fields</dt><dd>{classified}/{summary.peopleContextCount}</dd><small>Source records with a reported GSEC value.</small></div>
    </dl>
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
  const [visiblePeopleCount, setVisiblePeopleCount] = useState(DETAIL_RECORD_BATCH_SIZE);

  useEffect(() => {
    setVisiblePeopleCount(DETAIL_RECORD_BATCH_SIZE);
  }, [code]);

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
  const largestUnreachedPeople = [...unreachedPeople]
    .sort((a, b) => (b.population.value ?? -1) - (a.population.value ?? -1) || a.displayName.localeCompare(b.displayName, "en"))
    .slice(0, 5);
  const visibleUnreachedPeople = unreachedPeople.slice(0, visiblePeopleCount);
  const remainingUnreachedPeople = Math.max(0, unreachedPeople.length - visibleUnreachedPeople.length);
  const mapHref = `#/?country=${encodeURIComponent(feature.properties.mapKey)}`;
  const prayerHref = `#/pray?country=${encodeURIComponent(code)}`;

  return (
    <article class="country-page country-page--comprehension">
      <nav class="country-breadcrumb" aria-label="Breadcrumb">
        <a href={hrefFor("/countries")}><ArrowLeft size={15} aria-hidden="true" /> Countries</a>
        <span>/</span>
        <span aria-current="page">{name}</span>
      </nav>

      <header class="country-hero">
        <div>
          <div class="eyebrow">{record?.subregionName ?? record?.regionName ?? feature.properties.continent ?? "Country Explorer"}</div>
          <h1 class="display-title">{name}</h1>
          <p class="country-hero-summary">Explore the people-group records represented in {name}, understand which are classified as unreached, and move from data into prayer.</p>
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
          <CountryGuidedStart countryName={name} contexts={record.contexts} />

          <section class="country-section country-largest-unreached" aria-labelledby="largest-unreached-heading">
            <div class="country-section__heading">
              <div><span class="eyebrow">Start with the people</span><h2 id="largest-unreached-heading">Largest unreached peoples represented</h2></div>
              <UsersRound size={21} aria-hidden="true" />
            </div>
            <p class="country-section__intro">Sorted by the known population estimate reported for each source record in {name}. These are represented source estimates, not a national census ranking.</p>
            {largestUnreachedPeople.length ? (
              <div class="country-largest-people-list">
                {largestUnreachedPeople.map((people, index) => (
                  <a href={hrefFor(`/peoples/${people.peid}`)} class="country-largest-person" key={people.pgid}>
                    <span class="country-largest-person__rank">{index + 1}</span>
                    <span class="country-largest-person__identity"><strong>{people.displayName}</strong><small>{people.language.name ?? people.language.iso6393 ?? "Language unknown"} · {people.religion.name ?? people.religion.displayName ?? "Religion unknown"}</small></span>
                    <span class="country-largest-person__population">{formatCount(people.population.value)}</span>
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                ))}
              </div>
            ) : <p class="country-empty">No current country-context record is classified as unreached.</p>}
          </section>

          <div class="country-content-grid country-content-grid--comprehension">
            <div class="country-content-main">
              <section class="country-section" aria-labelledby="religion-heading">
                <div class="country-section__heading"><div><span class="eyebrow">Religious context</span><h2 id="religion-heading">Religions represented</h2></div><Globe2 size={21} aria-hidden="true" /></div>
                <p class="country-section__intro">Shares use the summed known population of PeopleGroups.org country-context records. They are not national census shares.</p>
                <div class="country-breakdown-list">
                  {record.religions.map((religion) => (
                    <div class="country-breakdown-row" key={religion.key}>
                      <div><strong>{religion.name}</strong><span>{religion.contextCount} {religion.contextCount === 1 ? "people-group record" : "people-group records"} · {formatCount(religion.knownPopulation)} known represented population</span></div>
                      <div><span>{formatPercent(religion.representedShare)}</span><meter min="0" max="100" value={religion.representedShare ?? 0}>{formatPercent(religion.representedShare)}</meter></div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside class="country-content-rail">
              <section class="country-section" aria-labelledby="languages-heading">
                <div class="country-section__heading"><div><span class="eyebrow">Language</span><h2 id="languages-heading">Major languages represented</h2></div><Languages size={20} aria-hidden="true" /></div>
                <div class="country-compact-list">
                  {record.languages.slice(0, 12).map((language) => <div key={language.key}><strong>{language.name}</strong><span>{formatCount(language.knownPopulation)} represented · {language.contextCount} records{language.code ? ` · ${language.code}` : ""}</span></div>)}
                </div>
                {record.languages.length > 12 ? <p class="country-section__intro country-section__intro--compact">Showing 12 of {record.languages.length} source-language aggregations. <a href={hrefFor("/languages")}>Browse all languages</a>.</p> : null}
              </section>

              <section class="country-section" aria-labelledby="scripture-heading">
                <div class="country-section__heading"><div><span class="eyebrow">Bible resources</span><h2 id="scripture-heading">Bible resource status</h2></div><BookOpen size={20} aria-hidden="true" /></div>
                <div class="country-compact-list">
                  {record.bibleAvailability.map((item) => <div key={item.status}><strong>{item.status}</strong><span>{item.contextCount} records · {formatCount(item.knownPopulation)} known represented population</span></div>)}
                </div>
                <p class="country-section__intro">These are source availability labels, not normalized translation-completeness categories.</p>
              </section>
            </aside>
          </div>

          <details class="country-research-disclosure">
            <summary><Database size={19} aria-hidden="true" /><span><strong>Detailed country data & people records</strong><small>GSEC, source IDs, coverage, media labels and the complete unreached-record table</small></span></summary>
            <div class="country-research-disclosure__body">
              <CountryResearchMetrics record={record} />

              <section class="country-section country-section--research-records" aria-labelledby="unreached-people-heading">
                <div class="country-section__heading">
                  <div><span class="eyebrow">GSEC 0–3 source records</span><h2 id="unreached-people-heading">Unreached people contexts</h2></div>
                  <UsersRound size={21} aria-hidden="true" />
                </div>
                <p class="country-section__intro">Rows are current PeopleGroups.org PEID/PGID records for this country. The certified runtime validates PEID and PGID as a one-to-one record identity; it does not infer a separate cross-country people identity from a repeated name.</p>
                {unreachedPeople.length ? (
                  <>
                    <div class="detail-record-progress" aria-live="polite"><strong>Showing {visibleUnreachedPeople.length} of {unreachedPeople.length}</strong><span>GSEC 0–3 PEID/PGID records</span></div>
                    <div class="country-people-table-wrap">
                      <table class="country-people-table">
                        <thead><tr><th>People</th><th>Population</th><th>Religion</th><th>Language</th><th>GSEC</th><th>Evangelical level</th><th>Bible</th></tr></thead>
                        <tbody>
                          {visibleUnreachedPeople.map((people) => (
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
                    {remainingUnreachedPeople ? <div class="result-load-more result-load-more--detail"><button type="button" onClick={() => setVisiblePeopleCount((current) => Math.min(current + DETAIL_RECORD_BATCH_SIZE, unreachedPeople.length))}>Show {Math.min(DETAIL_RECORD_BATCH_SIZE, remainingUnreachedPeople)} more</button><span>{remainingUnreachedPeople} remaining</span></div> : null}
                  </>
                ) : <p class="country-empty">No current country-context record is classified GSEC 0–3.</p>}
              </section>

              <div class="country-research-grid">
                <section class="country-section" aria-labelledby="jesus-film-heading">
                  <div class="country-section__heading"><div><span class="eyebrow">Media source labels</span><h2 id="jesus-film-heading">Jesus Film availability</h2></div><BookOpen size={20} aria-hidden="true" /></div>
                  <div class="country-compact-list">
                    {record.jesusFilmAvailability.map((item) => <div key={item.status}><strong>{item.status}</strong><span>{item.contextCount} records</span></div>)}
                  </div>
                </section>

                <CoveragePanel record={record} />
              </div>
            </div>
          </details>

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
