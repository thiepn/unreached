import { ArrowLeft, ArrowUpRight, BookOpen, Database, Globe2, Languages, Link2, MapPinned, RefreshCw, UsersRound } from "lucide-preact";

import { hrefFor } from "../app/router";
import {
  formatPeopleCount,
  livePeopleStatusClass,
  livePeopleStatusLabel,
  useLivePeopleExplorer,
} from "../peoples";
import {
  PEOPLE_GROUPS_ATTRIBUTION,
  entityEditorialContext,
  entityGsecRange,
  entityResourceBreakdown,
  entityTaxonomy,
  relatedRuntimePeople,
  type RuntimePeopleContext,
  type RuntimePeopleEntity,
} from "../providers/peoplegroups";

function localStatus(context: RuntimePeopleContext): string {
  if (context.reach.classification === "unreached") return "Unreached";
  if (context.reach.classification === "other") return "Other GSEC status";
  return "Unknown";
}

function gsecLabel(context: RuntimePeopleContext): string {
  const code = context.reach.gsec.code;
  if (code === null) return "Unknown";
  return context.reach.gsec.label ? `${code} · ${context.reach.gsec.label}` : String(code);
}

function sourceDate(value: string | null): string {
  if (!value) return "Not supplied";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

function PeopleMetrics({ record }: { record: RuntimePeopleEntity }) {
  const context = record.contexts[0]!;
  const gsec = entityGsecRange(record);
  return (
    <div class="people-metric-grid" aria-label="People-group overview">
      <div class="people-metric"><span>Population estimate</span><strong>{record.population.complete ? formatPeopleCount(record.population.knownValue) : "Unknown"}</strong><small>{record.population.complete ? `PeopleGroups.org estimate for ${context.country.name}` : "No population estimate reported for this PGID"}</small></div>
      <div class="people-metric"><span>GSEC</span><strong>{gsec ? gsec.min : "Unknown"}</strong><small>{gsec ? "Source value for this PGID record" : "No GSEC value reported"}</small></div>
      <div class="people-metric"><span>Reach classification</span><strong>{livePeopleStatusLabel(record)}</strong><small>Derived only from this record’s IMB GSEC value</small></div>
      <div class="people-metric"><span>Country</span><strong>{context.country.name}</strong><small>{context.country.iso3} · {context.pgid}</small></div>
      <div class="people-metric"><span>Religion</span><strong>{record.primaryReligion?.name ?? "Unknown"}</strong><small>Source label for this PGID</small></div>
      <div class="people-metric"><span>Language</span><strong>{record.primaryLanguage?.name ?? "Unknown"}</strong><small>{record.primaryLanguage?.iso6393 ?? "ISO 639-3 not supplied"}</small></div>
      <div class="people-metric"><span>Source identity</span><strong>PEID {record.peid}</strong><small>Current API record identifier · 1:1 with {context.pgid}</small></div>
      <div class="people-metric"><span>Source updated</span><strong>{sourceDate(record.sourceUpdatedAt)}</strong><small>PeopleGroups.org record timestamp</small></div>
    </div>
  );
}

function CountryContexts({ record }: { record: RuntimePeopleEntity }) {
  return (
    <section class="people-section" aria-labelledby="people-countries-heading">
      <div class="people-section__heading"><div><span class="eyebrow">Source record</span><h2 id="people-countries-heading">People group in country</h2></div><MapPinned size={21} aria-hidden="true" /></div>
      <p class="people-section__intro">The current PeopleGroups.org API returns one PGID country-context record for this PEID. Population, GSEC and resource fields below belong to that record only; other countries are not merged into this route.</p>
      <div class="people-country-table-wrap">
        <table class="people-country-table">
          <thead><tr><th>Country</th><th>Population</th><th>Religion</th><th>Language</th><th>GSEC</th><th>Evangelical level</th><th>Bible</th><th>Engagement</th></tr></thead>
          <tbody>
            {record.contexts.map((context) => (
              <tr key={context.pgid}>
                <th scope="row">
                  <a href={hrefFor(`/countries/${context.country.iso3}`)}>{context.country.name}</a>
                  <small>PEID {context.peid} · PGID {context.pgid}</small>
                  <a class="people-map-context-link" href={`#/?country=${encodeURIComponent(context.country.iso3)}`}>Map <ArrowUpRight size={12} aria-hidden="true" /></a>
                </th>
                <td>{context.population.value === null ? "Unknown" : formatPeopleCount(context.population.value)}<small>{context.population.value === null ? "Not reported" : "Estimated"}</small></td>
                <td>{context.religion.name ?? context.religion.displayName ?? "Unknown"}</td>
                <td>{context.language.name ?? context.language.iso6393 ?? "Unknown"}</td>
                <td><span class={`people-local-status people-local-status--${context.reach.classification === "unreached" ? "unreached" : context.reach.classification === "other" ? "reached" : "unknown"}`}>{gsecLabel(context)}</span><small>{localStatus(context)}</small></td>
                <td>{context.reach.evangelicalLevel ?? "Unknown"}</td>
                <td>{context.resources.bibleAvailability ?? "Unknown"}</td>
                <td>{context.reach.engagementStatus ?? "Unknown"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SourceDisclosure({ record, loadedAt, stale }: { record: RuntimePeopleEntity; loadedAt: string | null; stale: boolean }) {
  const context = record.contexts[0]!;
  const taxonomy = entityTaxonomy(record);
  return (
    <section class="people-section people-sources" aria-labelledby="people-sources-heading">
      <div class="people-section__heading"><div><span class="eyebrow">Transparency</span><h2 id="people-sources-heading">Sources & methodology</h2></div><Link2 size={20} aria-hidden="true" /></div>
      <p class="people-section__intro">This profile is assembled at runtime from one PeopleGroups.org people-group-in-country record. Complete-corpus certification on 23 August 2026 found PEID and PGID to be 1:1 across all 12,370 current records, so Unreached does not treat PEID as a cross-country grouping key.</p>
      <div class="people-source-ids"><strong>Record identity</strong><span>PEID {record.peid} · {context.pgid} · {context.country.iso3}</span></div>
      <div class="people-source-ids"><strong>Cross-country taxonomy</strong><span>{taxonomy.peopleName ? `ROP3 people name: ${taxonomy.peopleName}` : "No ROP3 people name reported"}</span></div>
      <div class="people-source-ids"><strong>Runtime load</strong><span>{loadedAt ? sourceDate(loadedAt) : "Unknown"}{stale ? " · cached/stale fallback" : ""}</span></div>
      <div class="people-source-ids"><strong>Source update</strong><span>{sourceDate(record.sourceUpdatedAt)}</span></div>
      <a class="people-source-link" href={PEOPLE_GROUPS_ATTRIBUTION.url} target="_blank" rel="noreferrer">{PEOPLE_GROUPS_ATTRIBUTION.label} <ArrowUpRight size={13} aria-hidden="true" /></a>
      <p class="people-basis-note">Population is the estimate reported for this PGID only. “Other GSEC status” is intentionally not renamed “reached.” Bible and Jesus Film values are provider availability labels, not translation-completeness claims. Same-people links across countries use explicit source taxonomy such as PplNm/ROP3 name rather than PEID aggregation.</p>
    </section>
  );
}

export function PeoplePage({ sourcePeopleId }: { sourcePeopleId: number }) {
  const explorer = useLivePeopleExplorer();
  const record = explorer.peopleByRouteKey.get(sourcePeopleId) ?? null;

  if (explorer.loading) return <section class="people-profile people-profile--state" role="status">Loading live people-group data{explorer.progress ? `… ${explorer.progress.loadedPages}/${explorer.progress.totalPages}` : "…"}</section>;
  if (explorer.error) {
    return (
      <section class="people-profile people-profile--state">
        <Database size={24} aria-hidden="true" />
        <div class="eyebrow">People Group Explorer</div>
        <h1 class="display-title">Live people profile unavailable.</h1>
        <p>{explorer.error}</p>
        <button type="button" class="people-reset-filters" onClick={explorer.retry}><RefreshCw size={15} aria-hidden="true" /> Retry</button>
        <a class="inline-link" href={hrefFor("/peoples")}><ArrowLeft size={16} aria-hidden="true" /> Back to peoples</a>
      </section>
    );
  }
  if (!record) {
    return (
      <section class="people-profile people-profile--state">
        <div class="eyebrow">People Group Explorer</div>
        <h1 class="display-title">People group not found.</h1>
        <p>No current PeopleGroups.org PEID matches <strong>{sourcePeopleId}</strong>.</p>
        <a class="inline-link" href={hrefFor("/peoples")}><ArrowLeft size={16} aria-hidden="true" /> Back to peoples</a>
      </section>
    );
  }

  const taxonomy = entityTaxonomy(record);
  const resources = entityResourceBreakdown(record);
  const editorial = entityEditorialContext(record);
  const related = relatedRuntimePeople(record, explorer.peoples);
  const context = record.contexts[0]!;

  return (
    <article class="people-profile">
      <nav class="people-breadcrumb" aria-label="Breadcrumb"><a href={hrefFor("/peoples")}><ArrowLeft size={15} aria-hidden="true" /> Peoples</a><span>/</span><span aria-current="page">{record.displayName}</span></nav>

      {explorer.warning ? <div class="people-data-notice" role="status"><Database size={18} aria-hidden="true" /><div><strong>Cached source data</strong><p>{explorer.warning}</p></div></div> : null}

      <header class="people-profile-hero">
        <div>
          <div class="eyebrow">{taxonomy.peopleName ?? taxonomy.peopleCluster ?? taxonomy.affinityBloc ?? "PeopleGroups.org source record"}</div>
          <div class="people-profile-title-line"><h1 class="display-title">{record.displayName}</h1><span class={`people-status people-status--${livePeopleStatusClass(record)}`}>{livePeopleStatusLabel(record)}</span></div>
          <p class="people-profile-subtitle">{context.country.name} · {record.primaryLanguage?.name ?? "Language unknown"} · {record.primaryReligion?.name ?? "Religion unknown"}</p>
        </div>
        <a class="people-country-cta" href={hrefFor(`/countries/${context.country.iso3}`)}>Open {context.country.name} <ArrowUpRight size={17} aria-hidden="true" /></a>
      </header>

      <PeopleMetrics record={record} />

      <div class="people-profile-grid">
        <main class="people-profile-main">
          <CountryContexts record={record} />

          {editorial.length ? (
            <section class="people-section" aria-labelledby="people-source-context-heading">
              <div class="people-section__heading"><div><span class="eyebrow">Provider context</span><h2 id="people-source-context-heading">Source descriptions</h2></div><Globe2 size={21} aria-hidden="true" /></div>
              <p class="people-section__intro">The following text is supplied by PeopleGroups.org and is shown as attributed source material, not rewritten as an Unreached editorial claim.</p>
              {editorial.map((item) => <div class="people-source-ids" key={item.pgid}><strong>{item.countryName} · {item.pgid}</strong><span>{item.peopleDescription ?? item.locationDescription}</span></div>)}
            </section>
          ) : null}

          <section class="people-section" aria-labelledby="people-related-heading">
            <div class="people-section__heading"><div><span class="eyebrow">Source taxonomy</span><h2 id="people-related-heading">Related records</h2></div><UsersRound size={21} aria-hidden="true" /></div>
            <p class="people-section__intro">These links are source-taxonomy relationships, not PEID rollups. Matching PplNm/ROP3 people names are shown first, followed by shared cluster or affinity-bloc relationships.</p>
            {related.length ? <div class="people-related-grid">{related.map((item) => <a href={hrefFor(`/peoples/${item.entity.routeKey}`)} class="people-related-card" key={item.entity.id}><span>{item.relationship === "same-rop3-name" ? "Same ROP3 people name" : item.relationship === "same-cluster" ? "Same source cluster" : "Same affinity bloc"}</span><strong>{item.entity.displayName}</strong><small>{item.entity.contexts[0]?.country.name ?? "Country unknown"} · {item.entity.population.complete ? `${formatPeopleCount(item.entity.population.knownValue)} estimated` : "Population unknown"} · {livePeopleStatusLabel(item.entity)}</small></a>)}</div> : <p class="people-empty">No related records are available from the current source taxonomy.</p>}
          </section>

          <SourceDisclosure record={record} loadedAt={explorer.loadedAt} stale={explorer.stale} />
        </main>

        <aside class="people-profile-rail">
          <section class="people-section" aria-labelledby="people-language-heading">
            <div class="people-section__heading"><div><span class="eyebrow">Language</span><h2 id="people-language-heading">Reported language</h2></div><Languages size={20} aria-hidden="true" /></div>
            <dl class="people-fact-list"><div><dt>Language</dt><dd>{record.primaryLanguage?.name ?? "Unknown"}</dd></div><div><dt>ISO 639-3</dt><dd>{record.primaryLanguage?.iso6393 ?? "Unknown"}</dd></div></dl>
            <p class="people-basis-note">This is the language reported on this PGID record. It is not a claim that every person uses only one language.</p>
          </section>

          <section class="people-section" aria-labelledby="people-scripture-heading">
            <div class="people-section__heading"><div><span class="eyebrow">Resources</span><h2 id="people-scripture-heading">Bible & media availability</h2></div><BookOpen size={20} aria-hidden="true" /></div>
            <div class="country-compact-list">
              {resources.bible.map((item) => <div key={`bible:${item.status}`}><strong>Bible: {item.status}</strong><span>{item.contextCount} source record</span></div>)}
              {resources.jesusFilm.map((item) => <div key={`jesus:${item.status}`}><strong>Jesus Film: {item.status}</strong><span>{item.contextCount} source record</span></div>)}
            </div>
            <p class="people-basis-note">Labels are displayed verbatim as source availability descriptors; Unreached does not translate them into Scripture-completeness categories.</p>
          </section>

          <section class="people-section" aria-labelledby="people-taxonomy-heading">
            <div class="people-section__heading"><div><span class="eyebrow">Classification</span><h2 id="people-taxonomy-heading">Taxonomy</h2></div><Globe2 size={20} aria-hidden="true" /></div>
            <dl class="people-fact-list"><div><dt>ROP3 people name</dt><dd>{taxonomy.peopleName ?? "Unknown"}</dd></div><div><dt>People cluster</dt><dd>{taxonomy.peopleCluster ?? "Unknown"}</dd></div><div><dt>Affinity bloc</dt><dd>{taxonomy.affinityBloc ?? "Unknown"}</dd></div><div><dt>Ethnographic group</dt><dd>{taxonomy.ethnographicGroup ?? "Unknown"}</dd></div><div><dt>PEID</dt><dd>{record.peid}</dd></div><div><dt>PGID</dt><dd>{context.pgid}</dd></div></dl>
          </section>
        </aside>
      </div>
    </article>
  );
}
