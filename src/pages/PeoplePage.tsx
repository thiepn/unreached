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
  const gsec = entityGsecRange(record);
  return (
    <div class="people-metric-grid" aria-label="People-group overview">
      <div class="people-metric"><span>Known population</span><strong>{formatPeopleCount(record.population.knownValue)}</strong><small>{record.population.complete ? "All country contexts have a population estimate" : `Partial sum · ${record.population.knownContextCount}/${record.population.totalContextCount} contexts known`}</small></div>
      <div class="people-metric"><span>GSEC range</span><strong>{gsec ? (gsec.min === gsec.max ? gsec.min : `${gsec.min}–${gsec.max}`) : "Unknown"}</strong><small>{gsec ? `${gsec.knownContexts}/${record.contexts.length} contexts classified` : "No GSEC value reported"}</small></div>
      <div class="people-metric"><span>Reach rollup</span><strong>{livePeopleStatusLabel(record)}</strong><small>Derived only from IMB GSEC country contexts</small></div>
      <div class="people-metric"><span>Country contexts</span><strong>{record.contexts.length}</strong><small>{record.countries.map((country) => country.name).slice(0, 3).join(" · ")}{record.countries.length > 3 ? " …" : ""}</small></div>
      <div class="people-metric"><span>Primary religion</span><strong>{record.primaryReligion?.name ?? "Unknown"}</strong><small>Most common source context label</small></div>
      <div class="people-metric"><span>Primary language</span><strong>{record.primaryLanguage?.name ?? "Unknown"}</strong><small>{record.primaryLanguage?.iso6393 ?? "ISO 639-3 not supplied"}</small></div>
      <div class="people-metric"><span>PEID</span><strong>{record.peid}</strong><small>PeopleGroups.org entity identity</small></div>
      <div class="people-metric"><span>Source updated</span><strong>{sourceDate(record.sourceUpdatedAt)}</strong><small>Newest timestamp among country contexts</small></div>
    </div>
  );
}

function CountryContexts({ record }: { record: RuntimePeopleEntity }) {
  return (
    <section class="people-section" aria-labelledby="people-countries-heading">
      <div class="people-section__heading"><div><span class="eyebrow">Where they live</span><h2 id="people-countries-heading">Country contexts</h2></div><MapPinned size={21} aria-hidden="true" /></div>
      <p class="people-section__intro">Each row is a PeopleGroups.org PGID record for this PEID. Population is an estimate for that country context; GSEC and resource fields retain the provider’s own labels.</p>
      <div class="people-country-table-wrap">
        <table class="people-country-table">
          <thead><tr><th>Country</th><th>Population</th><th>Religion</th><th>Language</th><th>GSEC</th><th>Evangelical level</th><th>Bible</th><th>Engagement</th></tr></thead>
          <tbody>
            {record.contexts.map((context) => (
              <tr key={context.pgid}>
                <th scope="row">
                  <a href={hrefFor(`/countries/${context.country.iso3}`)}>{context.country.name}</a>
                  {context.displayName !== record.displayName ? <small>Listed as {context.displayName}</small> : null}
                  <small>PGID {context.pgid}</small>
                  <a class="people-map-context-link" href={`#/?country=${encodeURIComponent(context.country.iso3)}`}>Map <ArrowUpRight size={12} aria-hidden="true" /></a>
                </th>
                <td>{formatPeopleCount(context.population.value)}<small>Estimated</small></td>
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
  return (
    <section class="people-section people-sources" aria-labelledby="people-sources-heading">
      <div class="people-section__heading"><div><span class="eyebrow">Transparency</span><h2 id="people-sources-heading">Sources & methodology</h2></div><Link2 size={20} aria-hidden="true" /></div>
      <p class="people-section__intro">This profile is assembled at runtime from PeopleGroups.org. PEID is the cross-country people identity; PGIDs remain visible as country-context records. Unreached status is derived only from IMB GSEC 0–3.</p>
      <div class="people-source-ids"><strong>Identity</strong><span>PEID {record.peid} · {record.contexts.length} PGID records</span></div>
      <div class="people-source-ids"><strong>Runtime load</strong><span>{loadedAt ? sourceDate(loadedAt) : "Unknown"}{stale ? " · cached/stale fallback" : ""}</span></div>
      <div class="people-source-ids"><strong>Newest source update</strong><span>{sourceDate(record.sourceUpdatedAt)}</span></div>
      <a class="people-source-link" href={PEOPLE_GROUPS_ATTRIBUTION.url} target="_blank" rel="noreferrer">{PEOPLE_GROUPS_ATTRIBUTION.label} <ArrowUpRight size={13} aria-hidden="true" /></a>
      <p class="people-basis-note">Population sums include only known country-context estimates. “Other GSEC status” is intentionally not renamed “reached.” Bible and Jesus Film values are provider availability labels, not translation-completeness claims.</p>
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
  const largestContext = record.contexts[0] ?? null;

  return (
    <article class="people-profile">
      <nav class="people-breadcrumb" aria-label="Breadcrumb"><a href={hrefFor("/peoples")}><ArrowLeft size={15} aria-hidden="true" /> Peoples</a><span>/</span><span aria-current="page">{record.displayName}</span></nav>

      {explorer.warning ? <div class="people-data-notice" role="status"><Database size={18} aria-hidden="true" /><div><strong>Cached source data</strong><p>{explorer.warning}</p></div></div> : null}

      <header class="people-profile-hero">
        <div>
          <div class="eyebrow">{taxonomy.peopleCluster ?? taxonomy.affinityBloc ?? "PeopleGroups.org people entity"}</div>
          <div class="people-profile-title-line"><h1 class="display-title">{record.displayName}</h1><span class={`people-status people-status--${livePeopleStatusClass(record)}`}>{livePeopleStatusLabel(record)}</span></div>
          <p class="people-profile-subtitle">{largestContext ? `${largestContext.country.name} · ` : ""}{record.primaryLanguage?.name ?? "Language unknown"} · {record.primaryReligion?.name ?? "Religion unknown"}</p>
        </div>
        {largestContext ? <a class="people-country-cta" href={hrefFor(`/countries/${largestContext.country.iso3}`)}>Largest known country context <ArrowUpRight size={17} aria-hidden="true" /></a> : null}
      </header>

      <PeopleMetrics record={record} />

      <div class="people-profile-grid">
        <main class="people-profile-main">
          <CountryContexts record={record} />

          {editorial.length ? (
            <section class="people-section" aria-labelledby="people-source-context-heading">
              <div class="people-section__heading"><div><span class="eyebrow">Provider context</span><h2 id="people-source-context-heading">Source descriptions</h2></div><Globe2 size={21} aria-hidden="true" /></div>
              <p class="people-section__intro">The following text is supplied by PeopleGroups.org and is shown as attributed source material, not rewritten as an Unreached editorial claim.</p>
              {editorial.slice(0, 4).map((item) => <div class="people-source-ids" key={item.pgid}><strong>{item.countryName} · {item.pgid}</strong><span>{item.peopleDescription ?? item.locationDescription}</span></div>)}
            </section>
          ) : null}

          <section class="people-section" aria-labelledby="people-related-heading">
            <div class="people-section__heading"><div><span class="eyebrow">Source taxonomy</span><h2 id="people-related-heading">Related peoples</h2></div><UsersRound size={21} aria-hidden="true" /></div>
            <p class="people-section__intro">These links mean only that PeopleGroups.org places the records in the same source cluster or affinity bloc.</p>
            {related.length ? <div class="people-related-grid">{related.map((item) => <a href={hrefFor(`/peoples/${item.entity.routeKey}`)} class="people-related-card" key={item.entity.id}><span>{item.relationship === "same-cluster" ? "Same source cluster" : "Same affinity bloc"}</span><strong>{item.entity.displayName}</strong><small>{formatPeopleCount(item.entity.population.knownValue)} known population · {livePeopleStatusLabel(item.entity)}</small></a>)}</div> : <p class="people-empty">No related groups are available from the current source taxonomy.</p>}
          </section>

          <SourceDisclosure record={record} loadedAt={explorer.loadedAt} stale={explorer.stale} />
        </main>

        <aside class="people-profile-rail">
          <section class="people-section" aria-labelledby="people-language-heading">
            <div class="people-section__heading"><div><span class="eyebrow">Language</span><h2 id="people-language-heading">Primary language</h2></div><Languages size={20} aria-hidden="true" /></div>
            <dl class="people-fact-list"><div><dt>Language</dt><dd>{record.primaryLanguage?.name ?? "Unknown"}</dd></div><div><dt>ISO 639-3</dt><dd>{record.primaryLanguage?.iso6393 ?? "Unknown"}</dd></div></dl>
            <p class="people-basis-note">Primary language is the most common source-context label for this PEID, not a claim that every community uses only one language.</p>
          </section>

          <section class="people-section" aria-labelledby="people-scripture-heading">
            <div class="people-section__heading"><div><span class="eyebrow">Resources</span><h2 id="people-scripture-heading">Bible & media availability</h2></div><BookOpen size={20} aria-hidden="true" /></div>
            <div class="country-compact-list">
              {resources.bible.map((item) => <div key={`bible:${item.status}`}><strong>Bible: {item.status}</strong><span>{item.contextCount} {item.contextCount === 1 ? "context" : "contexts"}</span></div>)}
              {resources.jesusFilm.map((item) => <div key={`jesus:${item.status}`}><strong>Jesus Film: {item.status}</strong><span>{item.contextCount} {item.contextCount === 1 ? "context" : "contexts"}</span></div>)}
            </div>
            <p class="people-basis-note">Labels are displayed verbatim as source availability descriptors; Unreached does not translate them into Scripture-completeness categories.</p>
          </section>

          <section class="people-section" aria-labelledby="people-taxonomy-heading">
            <div class="people-section__heading"><div><span class="eyebrow">Classification</span><h2 id="people-taxonomy-heading">Taxonomy</h2></div><Globe2 size={20} aria-hidden="true" /></div>
            <dl class="people-fact-list"><div><dt>Affinity bloc</dt><dd>{taxonomy.affinityBloc ?? "Unknown"}</dd></div><div><dt>People cluster</dt><dd>{taxonomy.peopleCluster ?? "Unknown"}</dd></div><div><dt>People name</dt><dd>{taxonomy.peopleName ?? "Unknown"}</dd></div><div><dt>Ethnographic group</dt><dd>{taxonomy.ethnographicGroup ?? "Unknown"}</dd></div><div><dt>PEID</dt><dd>{record.peid}</dd></div></dl>
          </section>
        </aside>
      </div>
    </article>
  );
}
