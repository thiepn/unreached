import { ArrowLeft, ArrowUpRight, BookOpen, Compass, Database, Globe2, Languages, UsersRound } from "lucide-preact";

import { hrefFor } from "../app/router";
import { formatCount, formatPercent, formatScriptureStatus, useCountryExplorer, type CountryExplorerRecord } from "../countries";
import { useWorldGeography } from "../map/geography";

function coverageLabel(value: number | null): string {
  return value === null ? "Unknown" : `${Math.round(value)}%`;
}

function peopleProfileHref(peopleGroupId: string): string {
  const sourceId = peopleGroupId.replace(/^people:/, "");
  return hrefFor(`/peoples/${sourceId}`);
}

function CountryMetrics({ record }: { record: CountryExplorerRecord }) {
  const mission = record.mission;
  return (
    <div class="country-metric-grid" aria-label="Country mission overview">
      <div class="country-metric"><span>Country population</span><strong>{formatCount(record.population.value)}</strong><small>Source country metric</small></div>
      <div class="country-metric"><span>Represented population</span><strong>{formatCount(mission.knownPopulation)}</strong><small>Known people-group records</small></div>
      <div class="country-metric"><span>Unreached population</span><strong>{formatCount(mission.unreachedPopulation)}</strong><small>{formatPercent(mission.unreachedShare)} of classified population</small></div>
      <div class="country-metric"><span>People groups</span><strong>{mission.peopleGroupCount}</strong><small>{mission.unreachedGroupCount} unreached · {mission.frontierGroupCount} frontier</small></div>
      <div class="country-metric"><span>Evangelical presence</span><strong>{formatPercent(mission.evangelicalPercent)}</strong><small>{coverageLabel(mission.coverage.evangelical)} population coverage</small></div>
      <div class="country-metric"><span>Primary religion</span><strong>{mission.primaryReligionName ?? "Unknown"}</strong><small>Derived from represented people groups</small></div>
    </div>
  );
}

function CoveragePanel({ record }: { record: CountryExplorerRecord }) {
  const rows = [
    ["Reached / unreached", record.mission.coverage.classification],
    ["Frontier status", record.mission.coverage.frontier],
    ["Evangelical %", record.mission.coverage.evangelical],
    ["Primary religion", record.mission.coverage.religion],
    ["Scripture status", record.mission.coverage.scripture],
  ] as const;
  return (
    <section class="country-section country-coverage" aria-labelledby="coverage-heading">
      <div class="country-section__heading"><div><span class="eyebrow">Data quality</span><h2 id="coverage-heading">Population coverage</h2></div></div>
      <p class="country-section__intro">Coverage shows how much of the represented people-group population has a known value for each measure. It is not a confidence score.</p>
      <dl class="coverage-list">
        {rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{coverageLabel(value)}</dd><meter min="0" max="100" value={value ?? 0}>{coverageLabel(value)}</meter></div>)}
      </dl>
    </section>
  );
}

export function CountryPage({ iso3 }: { iso3: string }) {
  const geography = useWorldGeography();
  const intelligence = useCountryExplorer();
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
  const unreachedPeople = record?.peopleGroups.filter((people) => people.classification === "unreached") ?? [];
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
          <div class="eyebrow">{record?.regionName ?? feature.properties.continent ?? "Country Explorer"}</div>
          <h1 class="display-title">{name}</h1>
          <div class="country-identity-line"><span>{code}</span><span>{feature.properties.continent ?? "World"}</span></div>
        </div>
        <div class="country-hero-actions">
          <a class="country-map-link" href={mapHref}>Explore on map <ArrowUpRight size={17} aria-hidden="true" /></a>
          <a class="country-map-link" href={prayerHref}>Pray for this country’s peoples <Compass size={17} aria-hidden="true" /></a>
        </div>
      </header>

      {!intelligence.loading && !record ? (
        <div class="country-data-notice country-data-notice--detail" role="note">
          <Database size={20} aria-hidden="true" />
          <div>
            <strong>Mission intelligence is not published for this build</strong>
            <p>{intelligence.error ?? intelligence.status?.reason ?? "The page route and geographic identity are ready, but source-derived statistics remain release-gated."}</p>
          </div>
        </div>
      ) : null}

      {record ? (
        <>
          <CountryMetrics record={record} />

          <div class="country-content-grid">
            <main class="country-content-main">
              <section class="country-section" aria-labelledby="unreached-people-heading">
                <div class="country-section__heading">
                  <div><span class="eyebrow">Largest unreached peoples</span><h2 id="unreached-people-heading">People groups</h2></div>
                  <UsersRound size={21} aria-hidden="true" />
                </div>
                {unreachedPeople.length ? (
                  <div class="country-people-table-wrap">
                    <table class="country-people-table">
                      <thead><tr><th>People</th><th>Population</th><th>Religion</th><th>Language</th><th>Evangelical</th><th>Scripture</th><th>Status</th></tr></thead>
                      <tbody>
                        {unreachedPeople.slice(0, 20).map((people) => (
                          <tr key={people.id}>
                            <th scope="row"><a class="country-people-link" href={peopleProfileHref(people.peopleGroupId)}>{people.name}</a></th>
                            <td>{formatCount(people.population)}</td>
                            <td>{people.primaryReligionName ?? "Unknown"}</td>
                            <td>{people.primaryLanguageName ?? "Unknown"}</td>
                            <td>{formatPercent(people.evangelicalPercent)}</td>
                            <td>{formatScriptureStatus(people.scriptureStatus)}</td>
                            <td>{people.frontier ? <span class="country-status country-status--frontier">Frontier</span> : <span class="country-status country-status--unreached">Unreached</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p class="country-empty">No source-classified unreached people groups are available in this country record.</p>}
              </section>

              <section class="country-section" aria-labelledby="religion-heading">
                <div class="country-section__heading"><div><span class="eyebrow">Derived landscape</span><h2 id="religion-heading">Religious context</h2></div><Globe2 size={21} aria-hidden="true" /></div>
                <p class="country-section__intro">Shares below aggregate primary religion across people-group records with known population. They are not national census shares.</p>
                <div class="country-breakdown-list">
                  {record.religions.map((religion) => (
                    <div class="country-breakdown-row" key={religion.religionId}>
                      <div><strong>{religion.name}</strong><span>{religion.peopleGroupCount} {religion.peopleGroupCount === 1 ? "people group" : "people groups"}</span></div>
                      <div><span>{formatPercent(religion.representedShare)}</span><meter min="0" max="100" value={religion.representedShare ?? 0}>{formatPercent(religion.representedShare)}</meter></div>
                    </div>
                  ))}
                </div>
              </section>
            </main>

            <aside class="country-content-rail">
              <section class="country-section" aria-labelledby="languages-heading">
                <div class="country-section__heading"><div><span class="eyebrow">Language</span><h2 id="languages-heading">Major languages</h2></div><Languages size={20} aria-hidden="true" /></div>
                <div class="country-compact-list">
                  {record.languages.slice(0, 12).map((language) => <div key={language.languageId}><strong>{language.name}</strong><span>{formatCount(language.knownPopulation)} represented · {language.peopleGroupCount} groups</span></div>)}
                </div>
              </section>

              <section class="country-section" aria-labelledby="scripture-heading">
                <div class="country-section__heading"><div><span class="eyebrow">Resources</span><h2 id="scripture-heading">Scripture overview</h2></div><BookOpen size={20} aria-hidden="true" /></div>
                <div class="country-compact-list">
                  {record.scripture.map((item) => <div key={item.status}><strong>{formatScriptureStatus(item.status)}</strong><span>{item.peopleGroupCount} groups · {formatCount(item.knownPopulation)} represented</span></div>)}
                </div>
              </section>

              <CoveragePanel record={record} />
            </aside>
          </div>

          <footer class="country-sources">
            <strong>Data sources</strong>
            <p>{record.sourceIds.length ? record.sourceIds.join(" · ") : "No source identifiers supplied."}</p>
            {intelligence.status?.attributions.map((attribution) => <a key={attribution.sourceId} href={attribution.url} target="_blank" rel="noreferrer">{attribution.label}</a>)}
            <p>Geographic boundaries: Natural Earth de facto Admin-0 presentation. Country selection is geographic, not a sovereignty statement.</p>
          </footer>
        </>
      ) : null}
    </article>
  );
}
