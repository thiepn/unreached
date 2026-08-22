import { ArrowLeft, ArrowUpRight, BookOpen, Database, Film, Headphones, Languages, Link2, UsersRound } from "lucide-preact";

import { hrefFor } from "../app/router";
import { formatAvailability, formatLanguageCount, formatLanguageScripture, formatLanguageStatus, useLanguageExplorer, type LanguageExplorerRecord } from "../languages";

function missionStatus(record: LanguageExplorerRecord): string {
  if (record.mission.frontier === true) return "Frontier-associated source classification";
  if (record.mission.classification === "unreached") return "Unreached-associated source classification";
  if (record.mission.classification === "reached") return "Reached-associated source classification";
  return "Mission classification unknown";
}

export function LanguagePage({ iso6393 }: { iso6393: string }) {
  const explorer = useLanguageExplorer();
  const code = iso6393.toLowerCase();
  const record = explorer.languagesByIso.get(code) ?? null;

  if (explorer.loading) return <section class="language-page language-page--state" role="status">Loading language data…</section>;
  if (!explorer.dataset) return <section class="language-page language-page--state"><div class="eyebrow">Languages & Scripture</div><h1 class="display-title">Language profile unavailable in this build.</h1><p>{explorer.error ?? explorer.status?.reason ?? "Source-derived language records remain publication-gated."}</p><p>Requested ISO 639-3 code: <strong>{code}</strong></p><a class="inline-link" href={hrefFor("/languages")}><ArrowLeft size={16} aria-hidden="true" /> Back to languages</a></section>;
  if (!record) return <section class="language-page language-page--state"><div class="eyebrow">Languages & Scripture</div><h1 class="display-title">Language not found.</h1><p>No published language record matches <strong>{code}</strong>.</p><a class="inline-link" href={hrefFor("/languages")}><ArrowLeft size={16} aria-hidden="true" /> Back to languages</a></section>;

  return (
    <article class="language-page">
      <nav class="language-breadcrumb" aria-label="Breadcrumb"><a href={hrefFor("/languages")}><ArrowLeft size={15} aria-hidden="true" /> Languages</a><span>/</span><span aria-current="page">{record.name}</span></nav>
      <header class="language-profile-hero">
        <div><div class="eyebrow">ISO 639-3 · {record.iso6393.toUpperCase()}</div><h1 class="display-title">{record.name}</h1><p>{formatLanguageStatus(record.status)} language · {missionStatus(record)}</p></div>
        {record.hubCountry ? <a class="language-country-cta" href={hrefFor(`/countries/${record.hubCountry.iso3}`)}>Hub country: {record.hubCountry.name} <ArrowUpRight size={16} aria-hidden="true" /></a> : null}
      </header>

      <div class="language-metric-grid"><div><span>People groups</span><strong>{record.peopleGroupCount}</strong><small>{record.unreachedPeopleGroupCount} unreached · {record.frontierPeopleGroupCount} frontier</small></div><div><span>Countries</span><strong>{record.countryCount}</strong><small>Country contexts using this primary language</small></div><div><span>Represented population</span><strong>{formatLanguageCount(record.knownRepresentedPopulation)}</strong><small>Known country-context populations</small></div><div><span>Scripture</span><strong>{formatLanguageScripture(record.scripture.bibleStatus)}</strong><small>Source-reported language status</small></div></div>

      <div class="language-profile-grid">
        <main>
          <section class="language-section" aria-labelledby="language-peoples-heading"><div class="language-section__heading"><div><span class="eyebrow">People groups</span><h2 id="language-peoples-heading">Peoples using {record.name}</h2></div><UsersRound size={20} aria-hidden="true" /></div><p class="language-section__intro">These are canonical global people groups whose normalized primary-language record points to this language.</p>{record.peoples.length ? <div class="language-table-wrap"><table class="language-table"><thead><tr><th>People</th><th>Population</th><th>Largest country</th><th>Status</th></tr></thead><tbody>{record.peoples.map((people) => <tr key={people.peopleGroupId}><th scope="row"><a href={hrefFor(`/peoples/${people.sourcePeopleId}`)}>{people.name}</a></th><td>{people.globalPopulation.value === null ? "Unknown" : formatLanguageCount(people.globalPopulation.value)}</td><td>{people.largestCountryIso3 ? <a href={hrefFor(`/countries/${people.largestCountryIso3}`)}>{people.largestCountryName}</a> : "Unknown"}</td><td>{people.frontier ? "Frontier" : people.classification}</td></tr>)}</tbody></table></div> : <p class="language-empty">No canonical people relationships are published for this language.</p>}</section>

          <section class="language-section" aria-labelledby="language-countries-heading"><div class="language-section__heading"><div><span class="eyebrow">Geographic context</span><h2 id="language-countries-heading">Countries</h2></div><Languages size={20} aria-hidden="true" /></div>{record.countries.length ? <div class="language-country-grid">{record.countries.map((country) => <a href={hrefFor(`/countries/${country.iso3}`)} key={country.countryId}><strong>{country.name}</strong><span>{country.peopleGroupCount} groups · {formatLanguageCount(country.knownPopulation)} represented</span></a>)}</div> : <p class="language-empty">No country-specific people records are published for this language.</p>}</section>
        </main>

        <aside>
          <section class="language-section language-scripture-panel" aria-labelledby="language-scripture-heading"><div class="language-section__heading"><div><span class="eyebrow">Scripture access</span><h2 id="language-scripture-heading">Translation & media</h2></div><BookOpen size={20} aria-hidden="true" /></div><dl class="language-fact-list"><div><dt>Current status</dt><dd>{formatLanguageScripture(record.scripture.bibleStatus)}</dd></div>{record.scripture.portionsYear ? <div><dt>Portions year</dt><dd>{record.scripture.portionsYear}</dd></div> : null}{record.scripture.newTestamentYear ? <div><dt>New Testament year</dt><dd>{record.scripture.newTestamentYear}</dd></div> : null}{record.scripture.bibleYear ? <div><dt>Complete Bible year</dt><dd>{record.scripture.bibleYear}</dd></div> : null}<div><dt><Headphones size={15} aria-hidden="true" /> Audio</dt><dd>{formatAvailability(record.scripture.hasAudioRecordings)}</dd></div><div><dt><Film size={15} aria-hidden="true" /> Jesus Film</dt><dd>{formatAvailability(record.scripture.hasJesusFilm)}</dd></div></dl><p class="language-resource-note">Availability fields mean the source reports that a resource exists. U9 does not imply a specific edition, dialect fit, download URL, current licensing status or local accessibility unless separately sourced.</p></section>

          <section class="language-section" aria-labelledby="language-taxonomy-heading"><div class="language-section__heading"><div><span class="eyebrow">Linguistic identity</span><h2 id="language-taxonomy-heading">Taxonomy</h2></div><Languages size={20} aria-hidden="true" /></div><dl class="language-fact-list"><div><dt>ISO 639-3</dt><dd>{record.iso6393}</dd></div><div><dt>Status</dt><dd>{formatLanguageStatus(record.status)}</dd></div><div><dt>Family</dt><dd>{record.familyName ?? "Not published from an approved source"}</dd></div><div><dt>Branch</dt><dd>{record.branchName ?? "Not published from an approved source"}</dd></div>{record.primaryReligion ? <div><dt>Source primary religion</dt><dd>{record.primaryReligion.name}</dd></div> : null}</dl></section>

          <section class="language-section" aria-labelledby="language-sources-heading"><div class="language-section__heading"><div><span class="eyebrow">Transparency</span><h2 id="language-sources-heading">Sources & provenance</h2></div><Link2 size={20} aria-hidden="true" /></div><p class="language-section__intro">Language facts retain field-level provenance. Family/branch taxonomy remains blank unless its own approved source is recorded.</p><div class="language-source-ids">{record.sourceIds.length ? record.sourceIds.join(" · ") : "No source identifiers supplied"}</div>{explorer.status?.attributions.map((attribution) => <a class="language-source-link" href={attribution.url} target="_blank" rel="noreferrer" key={attribution.sourceId}>{attribution.label} <ArrowUpRight size={13} aria-hidden="true" /></a>)}<details><summary>View field provenance ({record.provenance.length})</summary><div class="language-table-wrap"><table class="language-table"><thead><tr><th>Field</th><th>Source field</th><th>Record</th><th>Retrieved</th></tr></thead><tbody>{record.provenance.map((item, index) => <tr key={`${item.field}-${index}`}><td>{item.field}</td><td>{item.sourceField}</td><td>{item.sourceRecordId}</td><td>{new Date(item.retrievedAt).toLocaleDateString("en")}</td></tr>)}</tbody></table></div></details></section>
        </aside>
      </div>

      <footer class="language-meaning-note"><Database size={19} aria-hidden="true" /><div><strong>How to read Scripture status</strong><p>“Translation needed,” “translation started,” “portions,” “New Testament,” and “complete Bible” describe reported translation milestones. They do not by themselves measure literacy, comprehension, dialect suitability, distribution, church access, digital access, audio quality or actual use.</p></div></footer>
    </article>
  );
}
