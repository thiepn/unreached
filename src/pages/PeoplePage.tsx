import { ArrowLeft, ArrowUpRight, BookOpen, Database, Globe2, HeartHandshake, Link2, MapPinned, RefreshCw, UsersRound } from "lucide-preact";

import { hrefFor } from "../app/router";
import { MeaningSummary } from "../components/MeaningSummary";
import { ProfileLocalActions } from "../components/ProfileLocalActions";
import { TermHelp } from "../components/TermHelp";
import { UnreachedExplanation } from "../components/UnreachedExplanation";
import { bibleResourceExplanation, evangelicalLevelExplanation } from "../comprehension/explain";
import {
  formatPeopleCount,
  livePeopleStatusClass,
  livePeopleStatusLabel,
} from "../peoples";
import {
  PEOPLE_GROUPS_ATTRIBUTION,
  entityEditorialContext,
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
  return (
    <section class="people-profile-overview" aria-labelledby="people-overview-heading">
      <div class="people-profile-overview__heading">
        <div>
          <span class="eyebrow">At a glance</span>
          <h2 id="people-overview-heading">Four facts to understand first.</h2>
        </div>
        <p>These are the few source facts most useful for orienting yourself before reading deeper research data.</p>
      </div>
      <div class="people-metric-grid people-metric-grid--essential" aria-label="Essential people-group facts">
        <div class="people-metric">
          <span>Population</span>
          <strong>{context.population.value === null ? "Unknown" : formatPeopleCount(context.population.value)}</strong>
          <small>{context.population.value === null ? "Not reported for this source record" : `Estimate for this record in ${context.country.name}`}</small>
          <TermHelp term="population-estimate" />
        </div>
        <div class="people-metric">
          <span>Primary religion</span>
          <strong>{context.religion.name ?? context.religion.displayName ?? "Unknown"}</strong>
          <small>Religious context reported by the source</small>
        </div>
        <div class="people-metric">
          <span>Primary language</span>
          <strong>{context.language.name ?? context.language.iso6393 ?? "Unknown"}</strong>
          <small>{context.language.iso6393 ? `Language code: ${context.language.iso6393}` : "Language code not reported"}</small>
        </div>
        <div class="people-metric">
          <span>Bible resource status</span>
          <strong>{context.resources.bibleAvailability ?? "Unknown"}</strong>
          <small>{bibleResourceExplanation(context.resources.bibleAvailability)}</small>
          <TermHelp term="bible-resource-status" />
        </div>
      </div>
    </section>
  );
}

function SourceRecord({ record }: { record: RuntimePeopleEntity }) {
  const context = record.contexts[0]!;
  return (
    <section class="people-section people-section--source" aria-labelledby="people-source-record-heading">
      <div class="people-section__heading">
        <div><span class="eyebrow">1 · Understand</span><h2 id="people-source-record-heading">Understand the source context</h2></div>
        <MapPinned size={21} aria-hidden="true" />
      </div>
      <p class="people-section__intro">Before the detailed identifiers and methodology, focus on where this record is located and what the source reports about evangelical presence.</p>
      <div class="people-source-record-grid people-source-record-grid--comprehension">
        <div>
          <span>Country context</span>
          <strong><a href={hrefFor(`/countries/${context.country.iso3}`)}>{context.country.name}</a></strong>
          <p>This population, language, religion and mission-status record belongs to this country context.</p>
        </div>
        <div>
          <span>Evangelical presence</span>
          <strong>{context.reach.evangelicalLevel ?? "Unknown"}</strong>
          <p>{evangelicalLevelExplanation(context.reach.evangelicalLevel)}</p>
          <TermHelp term="evangelical-level" />
        </div>
      </div>
      <div class="people-source-record-actions"><a href={`#/?country=${encodeURIComponent(context.country.iso3)}`}>Find {context.country.name} on the map <ArrowUpRight size={13} aria-hidden="true" /></a></div>
    </section>
  );
}

function ProviderContext({ record }: { record: RuntimePeopleEntity }) {
  const editorial = entityEditorialContext(record);
  if (!editorial.length) {
    return (
      <div class="people-context-absence" role="note">
        <strong>No provider description is available for this record.</strong>
        <p>Use the structured source facts above as the available context. Unreached does not invent a narrative when PeopleGroups.org does not supply one.</p>
      </div>
    );
  }

  return (
    <section class="people-section people-section--provider" aria-labelledby="people-source-context-heading">
      <div class="people-section__heading"><div><span class="eyebrow">About this people</span><h2 id="people-source-context-heading">Read the available description</h2></div><Globe2 size={21} aria-hidden="true" /></div>
      <p class="people-section__intro">The following description is supplied by PeopleGroups.org. It is shown as attributed provider context rather than rewritten as an Unreached-authored community profile.</p>
      {editorial.map((item) => <p class="people-provider-description" key={item.pgid}>{item.peopleDescription ?? item.locationDescription}</p>)}
    </section>
  );
}

function DeepSourceDetails({ record, loadedAt, stale }: { record: RuntimePeopleEntity; loadedAt: string | null; stale: boolean }) {
  const context = record.contexts[0]!;
  const taxonomy = entityTaxonomy(record);
  const resources = entityResourceBreakdown(record);
  return (
    <details class="people-disclosure people-disclosure--sources">
      <summary><Link2 size={18} aria-hidden="true" /> Detailed data, sources & methodology</summary>
      <div class="people-disclosure__body">
        <p>This profile is assembled at runtime from one PeopleGroups.org people-group-in-country record. Complete-corpus certification on 23 August 2026 found PEID and PGID to be 1:1 across all 12,370 current records, so Unreached does not treat PEID as a cross-country grouping key.</p>
        <dl class="people-detail-list">
          <div><dt>Mission status</dt><dd>{localStatus(context)}</dd></div>
          <div><dt>GSEC</dt><dd>{gsecLabel(context)}</dd></div>
          <div><dt>Evangelical level</dt><dd>{context.reach.evangelicalLevel ?? "Unknown"}</dd></div>
          <div><dt>Engagement status</dt><dd>{context.reach.engagementStatus ?? "Unknown"}</dd></div>
          <div><dt>Congregation exists</dt><dd>{context.reach.congregationExists ?? "Unknown"}</dd></div>
          <div><dt>Church planting</dt><dd>{context.reach.churchPlanting ?? "Unknown"}</dd></div>
          <div><dt>Bible availability</dt><dd>{context.resources.bibleAvailability ?? "Unknown"}</dd></div>
          <div><dt>Jesus Film</dt><dd>{resources.jesusFilm[0]?.status ?? "Unknown"}</dd></div>
          <div><dt>Record identity</dt><dd>PEID {record.peid} · PGID {context.pgid} · {context.country.iso3}</dd></div>
          <div><dt>ROP3 people name</dt><dd>{taxonomy.peopleName ?? "Unknown"}</dd></div>
          <div><dt>People cluster</dt><dd>{taxonomy.peopleCluster ?? "Unknown"}</dd></div>
          <div><dt>Affinity bloc</dt><dd>{taxonomy.affinityBloc ?? "Unknown"}</dd></div>
          <div><dt>Ethnographic group</dt><dd>{taxonomy.ethnographicGroup ?? "Unknown"}</dd></div>
          <div><dt>Runtime load</dt><dd>{loadedAt ? sourceDate(loadedAt) : "Unknown"}{stale ? " · cached/stale fallback" : ""}</dd></div>
          <div><dt>Source updated</dt><dd>{sourceDate(record.sourceUpdatedAt)}</dd></div>
        </dl>
        <TermHelp term="gsec" />
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
  const related = corpus.ready ? relatedRuntimePeople(record, corpus.entities).slice(0, 8) : [];
  const context = record.contexts[0]!;
  const prayerEligible = record.reach.unreachedContexts > 0;

  return (
    <article class="people-profile people-profile--v11 people-profile--phase9 people-profile--comprehension" data-people-data-source={route.source ?? "unknown"} data-people-pgid={context.pgid}>
      <nav class="people-breadcrumb" aria-label="Breadcrumb"><a href={hrefFor("/peoples")}><ArrowLeft size={15} aria-hidden="true" /> Peoples</a><span>/</span><span aria-current="page">{record.displayName}</span></nav>

      {route.warning ? <div class="people-data-notice" role="status"><Database size={18} aria-hidden="true" /><div><strong>Cached source data</strong><p>{route.warning}</p></div></div> : null}

      <header class="people-profile-hero people-profile-hero--focused people-profile-hero--phase9">
        <div>
          <div class="eyebrow">People group</div>
          <div class="people-profile-title-line"><h1 class="display-title">{record.displayName}</h1><span class={`people-status people-status--${livePeopleStatusClass(record)}`}>{livePeopleStatusLabel(record)}</span></div>
          <p class="people-profile-subtitle">{context.country.name} · {record.primaryLanguage?.name ?? "Language unknown"}</p>
          <MeaningSummary record={record} />
        </div>
        <div class="people-profile-hero-actions">
          {prayerEligible ? <a class="people-hero-pray" href={hrefFor(`/pray/${record.routeKey}`)}>Pray for this people <HeartHandshake size={17} aria-hidden="true" /></a> : null}
          <a class="people-hero-secondary" href={hrefFor(`/countries/${context.country.iso3}`)}>View {context.country.name} <ArrowUpRight size={17} aria-hidden="true" /></a>
        </div>
      </header>

      <UnreachedExplanation record={record} />
      <EssentialMetrics record={record} />

      <div class="people-profile-flow people-profile-flow--phase9">
        <div class="people-profile-context" data-profile-stage="understand">
          <SourceRecord record={record} />
          <ProviderContext record={record} />
        </div>

        <div class="people-profile-action-stage" data-profile-stage="act">
          <ProfileLocalActions record={record} />
        </div>

        <div class="people-profile-reference-stage" data-profile-stage="reference">
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
      </div>
    </article>
  );
}
