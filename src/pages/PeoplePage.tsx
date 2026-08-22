import { ArrowLeft, ArrowUpRight, BookOpen, Database, Globe2, Languages, Link2, MapPinned, UsersRound } from "lucide-preact";

import { hrefFor } from "../app/router";
import {
  formatBooleanAvailability,
  formatDataQuality,
  formatPeopleCount,
  formatPeoplePercent,
  formatPeopleScripture,
  usePeopleExplorer,
  type PeopleCountryContext,
  type PeopleGroupProfile,
} from "../peoples";

function statusLabel(record: PeopleGroupProfile): string {
  if (record.mission.frontier === true) return "Frontier";
  if (record.mission.classification === "unreached") return "Unreached";
  if (record.mission.classification === "reached") return "Reached";
  return "Status unknown";
}

function statusClass(record: PeopleGroupProfile): string {
  if (record.mission.frontier === true) return "frontier";
  return record.mission.classification;
}

function scriptureBasis(record: PeopleGroupProfile): string {
  if (record.scripture.basis === "primary-language") return "Primary-language record";
  if (record.scripture.basis === "country-record") return "Country-specific source record";
  return "No Scripture basis available";
}

function localStatus(context: PeopleCountryContext): string {
  if (context.mission.frontier === true) return "Frontier";
  if (context.mission.classification === "unreached") return "Unreached";
  if (context.mission.classification === "reached") return "Reached";
  return "Unknown";
}

function PeopleMetrics({ record }: { record: PeopleGroupProfile }) {
  return (
    <div class="people-metric-grid" aria-label="People-group overview">
      <div class="people-metric"><span>Global population</span><strong>{formatPeopleCount(record.globalPopulation.value)}</strong><small>{formatDataQuality(record.globalPopulation.quality)}</small></div>
      <div class="people-metric"><span>Christian adherents</span><strong>{formatPeoplePercent(record.mission.percentChristian.value)}</strong><small>{formatDataQuality(record.mission.percentChristian.quality)}</small></div>
      <div class="people-metric"><span>Evangelical</span><strong>{formatPeoplePercent(record.mission.percentEvangelical.value)}</strong><small>{formatDataQuality(record.mission.percentEvangelical.quality)}</small></div>
      <div class="people-metric"><span>Gospel-access status</span><strong>{statusLabel(record)}</strong><small>Source classification retained</small></div>
      <div class="people-metric"><span>Primary religion</span><strong>{record.primaryReligion?.name ?? "Unknown"}</strong><small>Source people-group classification</small></div>
      <div class="people-metric"><span>Primary language</span><strong>{record.primaryLanguage?.name ?? "Unknown"}</strong><small>{record.primaryLanguage?.iso6393 ?? "No ISO 639-3 code"}</small></div>
      <div class="people-metric"><span>Scripture</span><strong>{formatPeopleScripture(record.scripture.bibleStatus)}</strong><small>{scriptureBasis(record)}</small></div>
      <div class="people-metric"><span>Country contexts</span><strong>{record.countryCount}</strong><small>{record.largestCountry ? `Largest: ${record.largestCountry.name}` : "Largest context unknown"}</small></div>
    </div>
  );
}

function CountryContexts({ record }: { record: PeopleGroupProfile }) {
  return (
    <section class="people-section" aria-labelledby="people-countries-heading">
      <div class="people-section__heading"><div><span class="eyebrow">Where they live</span><h2 id="people-countries-heading">Country contexts</h2></div><MapPinned size={21} aria-hidden="true" /></div>
      <p class="people-section__intro">Country rows are source-specific contexts for this global people group. Location text is shown when supplied; precise source coordinates are not exposed here.</p>
      {record.countries.length ? (
        <div class="people-country-table-wrap">
          <table class="people-country-table">
            <thead><tr><th>Country</th><th>Population</th><th>Religion</th><th>Language</th><th>Evangelical</th><th>Scripture</th><th>Status</th></tr></thead>
            <tbody>
              {record.countries.map((context) => (
                <tr key={context.id}>
                  <th scope="row">
                    <a href={hrefFor(`/countries/${context.iso3}`)}>{context.countryName}</a>
                    {context.nameInCountry !== record.name ? <small>Listed locally as {context.nameInCountry}</small> : null}
                    {context.locationText ? <small>{context.locationText}</small> : null}
                    <a class="people-map-context-link" href={`#/?country=${encodeURIComponent(context.iso3)}`}>Map <ArrowUpRight size={12} aria-hidden="true" /></a>
                  </th>
                  <td>{formatPeopleCount(context.population.value)}<small>{formatDataQuality(context.population.quality)}</small></td>
                  <td>{context.primaryReligionName ?? "Unknown"}</td>
                  <td>{context.primaryLanguageName ?? "Unknown"}</td>
                  <td>{formatPeoplePercent(context.mission.percentEvangelical.value)}</td>
                  <td>{formatPeopleScripture(context.scripture.bibleStatus)}</td>
                  <td><span class={`people-local-status people-local-status--${context.mission.frontier ? "frontier" : context.mission.classification}`}>{localStatus(context)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p class="people-empty">No country-specific source records are available for this global people group.</p>}
    </section>
  );
}

function SourceDisclosure({ record, attributions }: { record: PeopleGroupProfile; attributions: Array<{ sourceId: string; label: string; url: string }> }) {
  const provenance = [
    ...record.provenance.map((item) => ({ scope: "Global people record", ...item })),
    ...(record.primaryLanguage?.provenance.map((item) => ({ scope: "Primary language", ...item })) ?? []),
    ...(record.primaryReligion?.provenance.map((item) => ({ scope: "Primary religion", ...item })) ?? []),
    ...record.countries.flatMap((country) => country.provenance.map((item) => ({ scope: `Country: ${country.countryName}`, ...item }))),
  ];

  return (
    <section class="people-section people-sources" aria-labelledby="people-sources-heading">
      <div class="people-section__heading"><div><span class="eyebrow">Transparency</span><h2 id="people-sources-heading">Sources & provenance</h2></div><Link2 size={20} aria-hidden="true" /></div>
      <p class="people-section__intro">Displayed facts retain source identifiers and field-level provenance. A transformation note describes normalized or derived values when applicable.</p>
      <div class="people-source-ids"><strong>Source IDs</strong><span>{record.sourceIds.length ? record.sourceIds.join(" · ") : "None supplied"}</span></div>
      {attributions.map((attribution) => <a class="people-source-link" href={attribution.url} target="_blank" rel="noreferrer" key={attribution.sourceId}>{attribution.label} <ArrowUpRight size={13} aria-hidden="true" /></a>)}
      <details class="people-provenance-details">
        <summary>View field provenance ({provenance.length})</summary>
        <div class="people-provenance-table-wrap">
          <table class="people-provenance-table">
            <thead><tr><th>Scope</th><th>Field</th><th>Source field</th><th>Record</th><th>Retrieved</th><th>Transformation</th></tr></thead>
            <tbody>{provenance.map((item, index) => <tr key={`${item.scope}-${item.field}-${item.sourceRecordId}-${index}`}><td>{item.scope}</td><td>{item.field}</td><td>{item.sourceField}</td><td>{item.sourceRecordId}</td><td>{new Date(item.retrievedAt).toLocaleDateString("en")}</td><td>{item.transformation ?? "Direct normalization"}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

export function PeoplePage({ sourcePeopleId }: { sourcePeopleId: number }) {
  const explorer = usePeopleExplorer();
  const record = explorer.peopleBySourceId.get(sourcePeopleId) ?? null;

  if (explorer.loading) return <section class="people-profile people-profile--state" role="status">Loading people-group data…</section>;
  if (!explorer.dataset) {
    return (
      <section class="people-profile people-profile--state">
        <div class="eyebrow">People Group Explorer</div>
        <h1 class="display-title">People profile unavailable in this build.</h1>
        <p>{explorer.error ?? explorer.status?.reason ?? "Source-derived people-group records remain release-gated."}</p>
        <p class="people-profile-id">Requested source people ID: {sourcePeopleId}</p>
        <a class="inline-link" href={hrefFor("/peoples")}><ArrowLeft size={16} aria-hidden="true" /> Back to peoples</a>
      </section>
    );
  }
  if (!record) {
    return (
      <section class="people-profile people-profile--state">
        <div class="eyebrow">People Group Explorer</div>
        <h1 class="display-title">People group not found.</h1>
        <p>No published global people-group record matches source ID <strong>{sourcePeopleId}</strong>.</p>
        <a class="inline-link" href={hrefFor("/peoples")}><ArrowLeft size={16} aria-hidden="true" /> Back to peoples</a>
      </section>
    );
  }

  return (
    <article class="people-profile">
      <nav class="people-breadcrumb" aria-label="Breadcrumb"><a href={hrefFor("/peoples")}><ArrowLeft size={15} aria-hidden="true" /> Peoples</a><span>/</span><span aria-current="page">{record.name}</span></nav>

      <header class="people-profile-hero">
        <div>
          <div class="eyebrow">{record.cluster ?? record.affinityBloc ?? "Global people group"}</div>
          <div class="people-profile-title-line"><h1 class="display-title">{record.name}</h1><span class={`people-status people-status--${statusClass(record)}`}>{statusLabel(record)}</span></div>
          <p class="people-profile-subtitle">{record.largestCountry ? `${record.largestCountry.name} · ` : ""}{record.primaryLanguage?.name ?? "Language unknown"} · {record.primaryReligion?.name ?? "Religion unknown"}</p>
        </div>
        {record.largestCountry ? <a class="people-country-cta" href={hrefFor(`/countries/${record.largestCountry.iso3}`)}>Largest country context <ArrowUpRight size={17} aria-hidden="true" /></a> : null}
      </header>

      <PeopleMetrics record={record} />

      <div class="people-profile-grid">
        <main class="people-profile-main">
          <CountryContexts record={record} />

          <section class="people-section" aria-labelledby="people-related-heading">
            <div class="people-section__heading"><div><span class="eyebrow">Source taxonomy</span><h2 id="people-related-heading">Related peoples</h2></div><UsersRound size={21} aria-hidden="true" /></div>
            <p class="people-section__intro">Relationships below reflect shared source cluster or affinity-bloc classifications. They do not assert precise ethnographic, genetic, political or self-identity relationships.</p>
            {record.relatedPeople.length ? <div class="people-related-grid">{record.relatedPeople.map((related) => <a href={hrefFor(`/peoples/${related.sourcePeopleId}`)} class="people-related-card" key={related.peopleGroupId}><span>{related.relationship === "same-cluster" ? "Same source cluster" : "Same affinity bloc"}</span><strong>{related.name}</strong><small>{formatPeopleCount(related.globalPopulation.value)} · {related.frontier ? "Frontier" : related.classification}</small></a>)}</div> : <p class="people-empty">No related groups are available from the current source taxonomy.</p>}
          </section>

          <SourceDisclosure record={record} attributions={explorer.status?.attributions ?? []} />
        </main>

        <aside class="people-profile-rail">
          <section class="people-section" aria-labelledby="people-language-heading">
            <div class="people-section__heading"><div><span class="eyebrow">Language</span><h2 id="people-language-heading">Primary language</h2></div><Languages size={20} aria-hidden="true" /></div>
            {record.primaryLanguage ? <dl class="people-fact-list"><div><dt>Language</dt><dd>{record.primaryLanguage.name}</dd></div><div><dt>ISO 639-3</dt><dd>{record.primaryLanguage.iso6393}</dd></div><div><dt>Status</dt><dd>{record.primaryLanguage.status.replaceAll("-", " ")}</dd></div></dl> : <p class="people-empty">Primary language unknown.</p>}
          </section>

          <section class="people-section" aria-labelledby="people-scripture-heading">
            <div class="people-section__heading"><div><span class="eyebrow">Resources</span><h2 id="people-scripture-heading">Scripture & media</h2></div><BookOpen size={20} aria-hidden="true" /></div>
            <dl class="people-fact-list">
              <div><dt>Bible status</dt><dd>{formatPeopleScripture(record.scripture.bibleStatus)}</dd></div>
              <div><dt>Audio</dt><dd>{formatBooleanAvailability(record.scripture.hasAudioRecordings)}</dd></div>
              <div><dt>Jesus Film</dt><dd>{formatBooleanAvailability(record.scripture.hasJesusFilm)}</dd></div>
              {record.scripture.portionsYear ? <div><dt>Portions year</dt><dd>{record.scripture.portionsYear}</dd></div> : null}
              {record.scripture.newTestamentYear ? <div><dt>NT year</dt><dd>{record.scripture.newTestamentYear}</dd></div> : null}
              {record.scripture.bibleYear ? <div><dt>Bible year</dt><dd>{record.scripture.bibleYear}</dd></div> : null}
            </dl>
            <p class="people-basis-note">Basis: {scriptureBasis(record)}.</p>
          </section>

          <section class="people-section" aria-labelledby="people-taxonomy-heading">
            <div class="people-section__heading"><div><span class="eyebrow">Classification</span><h2 id="people-taxonomy-heading">Taxonomy</h2></div><Globe2 size={20} aria-hidden="true" /></div>
            <dl class="people-fact-list"><div><dt>Affinity bloc</dt><dd>{record.affinityBloc ?? "Unknown"}</dd></div><div><dt>People cluster</dt><dd>{record.cluster ?? "Unknown"}</dd></div><div><dt>Source people ID</dt><dd>{record.sourcePeopleId}</dd></div><div><dt>JP scale</dt><dd>{record.mission.jpScale ?? "Unknown"}</dd></div></dl>
          </section>
        </aside>
      </div>
    </article>
  );
}
