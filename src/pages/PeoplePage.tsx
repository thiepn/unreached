import { ArrowLeft, ArrowUpRight, BookOpen, Database, Globe2, Link2, MapPinned, RefreshCw, UsersRound } from "lucide-preact";

import { hrefFor } from "../app/router";
import { ProfileLocalActions } from "../components/ProfileLocalActions";
import {
  formatPeopleCount,
  livePeopleStatusClass,
  livePeopleStatusLabel,
} from "../peoples";
import {
  PEOPLE_GROUPS_ATTRIBUTION,
  entityEditorialContext,
  entityGsecRange,
  entityResourceBreakdown,
  entityTaxonomy,
  relatedRuntimePeople,
  usePeopleGroupsRouteRecord,
  usePeopleGroupsRuntimeStore,
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

function EssentialMetrics({ record }: { record: RuntimePeopleEntity }) {
  const context = record.contexts[0]!;
  const gsec = entityGsecRange(record);
  return (
    <div class="people-metric-grid people-metric-grid--essential" aria-label="People-group overview">
      <div class="people-metric"><span>Population estimate</span><strong>{record.population.complete ? formatPeopleCount(record.population.knownValue) : "Unknown"}</strong><small>{record.population.complete ? `PeopleGroups.org estimate for ${context.country.name}` : "Not reported for this source record"}</small></div>
      <div class="people-metric"><span>GSEC</span><strong>{gsec ? gsec.min : "Unknown"}</strong><small>{livePeopleStatusLabel(record)}</small></div>
      <div class="people-metric"><span>Country</span><strong>{context.country.name}</strong><small>{context.country.iso3}</small></div>
      <div class="people-metric"><span>Language</span><strong>{record.primaryLanguage?.name ?? "Unknown"}</strong><small>{record.primaryLanguage?.iso6393 ?? "ISO code not reported"}</small></div>
    </div>
  );
}

function SourceRecord({ record }: { record: RuntimePeopleEntity }) {
  const context = record.contexts[0]!;
  return (
    <section class="people-section" aria-labelledby="people-source-record-heading">
      <div class="people-section__heading"><div><span class="eyebrow">Source record</span><h2 id="people-source-record-heading">What PeopleGroups.org reports</h2></div><MapPinned size={21} aria-hidden="true" /></div>
      <p class="people-section__intro">The current PeopleGroups.org API returns one PGID country-context record for this PEID. Population, GSEC, religion and resource fields below belong to this record only.</p>
      <div class="people-source-record-grid">
        <div><span>Country</span><strong><a href={hrefFor(`/countries/${context.country.iso3}`)}>{context.country.name}</a></strong><small>{context.country.iso3}</small></div>
        <div><span>Population</span><strong>{context.population.value === null ? "Unknown" : formatPeopleCount(context.population.value)}</strong><small>{context.population.value === null ? "Not reported" : "PeopleGroups.org estimate"}</small></div>
        <div><span>Religion</span><strong>{context.religion.name ?? context.religion.displayName ?? "Unknown"}</strong></div>
        <div><span>Language</span><strong>{context.language.name ?? context.language.iso6393 ?? "Unknown"}</strong><small>{context.language.iso6393 ?? "ISO not reported"}</small></div>
        <div><span>GSEC</span><strong>{gsecLabel(context)}</strong><small>{localStatus(context)}</small></div>
        <div><span>Evangelical level</span><strong>{context.reach.evangelicalLevel ?? "Unknown"}</strong><small>Raw source label</small></div>
        <div><span>Bible</span><strong>Bible: {context.resources.bibleAvailability ?? "Unknown"}</strong><small>Raw availability label</small></div>
        <div><span>Engagement</span><strong>{context.reach.engagementStatus ?? "Unknown"}</strong></div>
      </div>
      <div class="people-source-record-actions"><a href={`#/?country=${encodeURIComponent(context.country.iso3)}`}>View on map <ArrowUpRight size={13} aria-hidden="true" /></a></div>
    </section>
  );
}

function DeepSourceDetails({ record, loadedAt, stale }: { record: RuntimePeopleEntity; loadedAt: string | null; stale: boolean }) {
  const context = record.contexts[0]!;
  const taxonomy = entityTaxonomy(record);
  const resources = entityResourceBreakdown(record);
  return (
    <details class="people-disclosure">
      <summary><Link2 size={18} aria-hidden="true" /> Sources, taxonomy & methodology</summary>
      <div class="people-disclosure__body">
        <p>This profile is assembled at runtime from one PeopleGroups.org people-group-in-country record. Complete-corpus certification on 23 August 2026 found PEID and PGID to be 1:1 across all 12,370 current records, so Unreached does not treat PEID as a cross-country grouping key.</p>
        <dl class="people-detail-list">
          <div><dt>Record identity</dt><dd>PEID {record.peid} · PGID {context.pgid} · {context.country.iso3}</dd></div>
          <div><dt>ROP3 people name</dt><dd>{taxonomy.peopleName ?? "Unknown"}</dd></div>
          <div><dt>People cluster</dt><dd>{taxonomy.peopleCluster ?? "Unknown"}</dd></div>
          <div><dt>Affinity bloc</dt><dd>{taxonomy.affinityBloc ?? "Unknown"}</dd></div>
          <div><dt>Ethnographic group</dt><dd>{taxonomy.ethnographicGroup ?? "Unknown"}</dd></div>
          <div><dt>Runtime load</dt><dd>{loadedAt ? sourceDate(loadedAt) : "Unknown"}{stale ? " · cached/stale fallback" : ""}</dd></div>
          <div><dt>Source updated</dt><dd>{sourceDate(record.sourceUpdatedAt)}</dd></div>
          <div><dt>Jesus Film</dt><dd>{resources.jesusFilm[0]?.status ?? "Unknown"}</dd></div>
        </dl>
        <a class="people-source-link" href={PEOPLE_GROUPS_ATTRIBUTION.url} target="_blank" rel="noreferrer">{PEOPLE_GROUPS_ATTRIBUTION.label} <ArrowUpRight size={13} aria-hidden="true" /></a>
        <p class="people-basis-note">Population is the estimate reported for this PGID only. “Other GSEC status” is intentionally not renamed “reached.” Bible and Jesus Film values are provider availability labels, not translation-completeness claims.</p>
      </div>
    </details>
  );
}

export function PeoplePage({ sourcePeopleId }: { sourcePeopleId: number }) {
  const route = usePeopleGroupsRouteRecord(sourcePeopleId);
  const corpus = usePeopleGroupsRuntimeStore(false);
  const record = route.entity;

  if (route.loading) return <section class="people-profile people-profile--state" role="status">Loading live people-group record…</section>;
  if (route.error) {
    return (
      <section class="people-profile people-profile--state">
        <Database size={24} aria-hidden="true" />
        <div class="eyebrow">People Group Explorer</div>
        <h1 class="display-title">Live people profile unavailable.</h1>
        <p>{route.error}</p>
        <button type="button" class="people-reset-filters" onClick={route.retry}><RefreshCw size={15} aria-hidden="true" /> Retry</button>
        <a class="inline-link" href={hrefFor("/peoples")}><ArrowLeft size={16} aria-hidden="true" /> Back to peoples</a>
      </section>
    );
  }
  if (route.notFound || !record) {
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
  const editorial = entityEditorialContext(record);
  const related = corpus.ready ? relatedRuntimePeople(record, corpus.entities).slice(0, 8) : [];
  const context = record.contexts[0]!;

  return (
    <article class="people-profile people-profile--v11" data-people-data-source={route.source ?? "unknown"} data-people-pgid={context.pgid}>
      <nav class="people-breadcrumb" aria-label="Breadcrumb"><a href={hrefFor("/peoples")}><ArrowLeft size={15} aria-hidden="true" /> Peoples</a><span>/</span><span aria-current="page">{record.displayName}</span></nav>

      {route.warning ? <div class="people-data-notice" role="status"><Database size={18} aria-hidden="true" /><div><strong>Cached source data</strong><p>{route.warning}</p></div></div> : null}

      <header class="people-profile-hero people-profile-hero--focused">
        <div>
          <div class="eyebrow">{taxonomy.peopleName ?? taxonomy.peopleCluster ?? taxonomy.affinityBloc ?? "PeopleGroups.org source record"}</div>
          <div class="people-profile-title-line"><h1 class="display-title">{record.displayName}</h1><span class={`people-status people-status--${livePeopleStatusClass(record)}`}>{livePeopleStatusLabel(record)}</span></div>
          <p class="people-profile-subtitle">{context.country.name} · {record.primaryReligion?.name ?? "Religion unknown"} · {record.primaryLanguage?.name ?? "Language unknown"}</p>
          <p class="people-profile-identity">PEID {record.peid} · PGID {context.pgid}</p>
        </div>
        <a class="people-country-cta" href={hrefFor(`/countries/${context.country.iso3}`)}>Open {context.country.name} <ArrowUpRight size={17} aria-hidden="true" /></a>
      </header>

      <EssentialMetrics record={record} />
      <ProfileLocalActions sourcePeopleId={sourcePeopleId} />

      <div class="people-profile-flow">
        <SourceRecord record={record} />

        {editorial.length ? (
          <section class="people-section" aria-labelledby="people-source-context-heading">
            <div class="people-section__heading"><div><span class="eyebrow">Provider context</span><h2 id="people-source-context-heading">Source description</h2></div><Globe2 size={21} aria-hidden="true" /></div>
            <p class="people-section__intro">This text is supplied by PeopleGroups.org and shown as attributed provider material.</p>
            {editorial.map((item) => <p class="people-provider-description" key={item.pgid}>{item.peopleDescription ?? item.locationDescription}</p>)}
          </section>
        ) : null}

        <details class="people-disclosure">
          <summary><UsersRound size={18} aria-hidden="true" /> Related source records{related.length ? ` · ${related.length}` : ""}</summary>
          <div class="people-disclosure__body">
            <p>Relationships use explicit source taxonomy such as ROP3 people name, cluster or affinity bloc. They are not PEID rollups.</p>
            {related.length ? <div class="people-related-grid">{related.map((item) => <a href={hrefFor(`/peoples/${item.entity.routeKey}`)} class="people-related-card" key={item.entity.id}><span>{item.relationship === "same-rop3-name" ? "Same ROP3 people name" : item.relationship === "same-cluster" ? "Same source cluster" : "Same affinity bloc"}</span><strong>{item.entity.displayName}</strong><small>{item.entity.contexts[0]?.country.name ?? "Country unknown"}</small></a>)}</div> : <p class="people-empty">{corpus.ready ? "No related records are available from the current source taxonomy." : "Related records become available after a full people explorer dataset has been loaded in this session."}</p>}
          </div>
        </details>

        <DeepSourceDetails record={record} loadedAt={route.loadedAt} stale={route.stale} />

        <details class="people-disclosure">
          <summary><BookOpen size={18} aria-hidden="true" /> Why raw resource labels are preserved</summary>
          <div class="people-disclosure__body"><p>Bible and media availability values are displayed as PeopleGroups.org reports them. Unreached does not convert them into “portions,” “New Testament,” or “complete Bible” milestones.</p></div>
        </details>
      </div>
    </article>
  );
}
