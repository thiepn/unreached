import { ArrowRight, CalendarDays, Compass, Database, Globe2, RefreshCw, Search } from "lucide-preact";
import { useMemo, useState } from "preact/hooks";

import { hrefFor } from "../app/router";
import {
  LIVE_PRAYER_TEMPLATE_REVIEW,
  buildLivePrayerProfile,
  dateKeyLocal,
  selectDailyLivePrayerEntity,
  useLivePrayerExperience,
  type LivePrayerProfile,
  type PrayerCategory,
} from "../prayer";
import type { RuntimePeopleEntity } from "../providers/peoplegroups";

function categoryLabel(category: PrayerCategory): string {
  const labels: Record<PrayerCategory, string> = {
    gospel: "Gospel",
    believers: "Believers",
    church: "Church",
    scripture: "Scripture",
    workers: "Workers",
    community: "Community",
    authorities: "Authorities",
    "specific-need": "Specific need",
  };
  return labels[category];
}

function countryFilterFromHash(): string | null {
  const query = window.location.hash.split("?", 2)[1] ?? "";
  const country = new URLSearchParams(query).get("country")?.toUpperCase() ?? null;
  return country && /^[A-Z]{3}$/.test(country) ? country : null;
}

function PrayerCard({ profile, featured = false }: { profile: LivePrayerProfile; featured?: boolean }) {
  const categories = Array.from(new Set(profile.prompts.map((prompt) => prompt.category))).slice(0, 5);
  return (
    <article class={`prayer-card${featured ? " prayer-card--featured" : ""}`}>
      <div class="prayer-card__meta">
        <span>{featured ? "People to Pray for Today" : "Source-grounded prayer guide"}</span>
        <span>{profile.countryIso3s.slice(0, 4).join(" · ")}{profile.countryIso3s.length > 4 ? " …" : ""}</span>
      </div>
      <h2>{profile.peopleName}</h2>
      <p>{profile.whyPray}</p>
      <div class="prayer-category-row" aria-label="Prayer categories">
        {categories.map((category) => <span key={category}>{categoryLabel(category)}</span>)}
      </div>
      <a class="prayer-card__cta" href={hrefFor(`/pray/${profile.sourcePeopleId}`)}>
        Pray for this people <ArrowRight size={17} aria-hidden="true" />
      </a>
    </article>
  );
}

function matchesQuery(entity: RuntimePeopleEntity, query: string): boolean {
  const needle = query.trim().toLocaleLowerCase("en");
  if (!needle) return true;
  return [
    entity.displayName,
    String(entity.peid),
    entity.primaryLanguage?.name,
    entity.primaryReligion?.name,
    ...entity.contexts.flatMap((context) => [context.country.name, context.country.iso3, context.pgid]),
  ].some((value) => value?.toLocaleLowerCase("en").includes(needle));
}

export function PrayPage() {
  const prayer = useLivePrayerExperience();
  const countryIso3 = countryFilterFromHash();
  const [query, setQuery] = useState("");

  const scoped = useMemo(() => prayer.eligible
    .filter((entity) => !countryIso3 || entity.contexts.some((context) => context.country.iso3 === countryIso3 && context.reach.classification === "unreached"))
    .filter((entity) => matchesQuery(entity, query))
    .sort((a, b) => b.population.knownValue - a.population.knownValue || a.displayName.localeCompare(b.displayName, "en")), [prayer.eligible, countryIso3, query]);
  const dailyEntity = prayer.ready ? selectDailyLivePrayerEntity(prayer.eligible, dateKeyLocal(), countryIso3) : null;
  const daily = dailyEntity ? buildLivePrayerProfile(dailyEntity) : null;
  const visible = scoped.slice(0, 60);

  return (
    <section class="prayer-page" aria-labelledby="prayer-page-title">
      <header class="prayer-hero">
        <div>
          <div class="eyebrow">Prayer</div>
          <h1 id="prayer-page-title" class="display-title">Understand enough to pray specifically.</h1>
          <p class="lead">Live source records identify prayer subjects; a fixed release-certified template supplies the prayer wording. Unreached does not generate unreviewed claims about individual communities.</p>
        </div>
        <div class="prayer-hero__mark" aria-hidden="true"><Compass size={34} /></div>
      </header>

      {countryIso3 ? (
        <div class="prayer-scope-banner">
          <Globe2 size={18} aria-hidden="true" />
          <span>Showing GSEC 0–3 people contexts connected to <strong>{countryIso3}</strong>.</span>
          <a href={hrefFor("/pray")}>Clear country filter</a>
        </div>
      ) : null}

      {prayer.warning ? <div class="prayer-release-notice" role="status"><Database size={21} aria-hidden="true" /><div><strong>Showing cached source data</strong><p>{prayer.warning}</p></div></div> : null}
      {prayer.loading ? <div class="prayer-state" role="status">Loading live people-group records{prayer.progress ? `… ${prayer.progress.loadedPages}/${prayer.progress.totalPages}` : "…"}</div> : null}
      {!prayer.loading && prayer.error ? <div class="prayer-release-notice" role="alert"><Database size={21} aria-hidden="true" /><div><strong>Live prayer subjects are temporarily unavailable</strong><p>{prayer.error}</p><button type="button" class="people-reset-filters" onClick={prayer.retry}><RefreshCw size={15} aria-hidden="true" /> Retry</button></div></div> : null}

      {prayer.ready ? (
        <>
          <section class="prayer-daily" aria-labelledby="daily-prayer-heading">
            <div class="prayer-section-heading">
              <div><span class="eyebrow">Daily focus</span><h2 id="daily-prayer-heading">People to Pray for Today</h2></div>
              <CalendarDays size={21} aria-hidden="true" />
            </div>
            {daily ? <PrayerCard profile={daily} featured /> : <p class="prayer-empty">No current GSEC 0–3 people context is available for this scope.</p>}
          </section>

          <section class="prayer-library" aria-labelledby="prayer-library-heading">
            <div class="prayer-section-heading"><div><span class="eyebrow">Live prayer subjects</span><h2 id="prayer-library-heading">Choose a people</h2></div><Compass size={21} aria-hidden="true" /></div>
            <label class="countries-search" for="prayer-search"><Search size={18} aria-hidden="true" /><span class="sr-only">Search prayer subjects</span><input id="prayer-search" type="search" value={query} onInput={(event) => setQuery(event.currentTarget.value)} placeholder="Search people, country, language or PEID" /></label>
            <p class="prayer-empty">{scoped.length} matching people entities. Showing up to 60 at once.</p>
            {visible.length ? <div class="prayer-card-grid">{visible.map((entity) => <PrayerCard key={entity.id} profile={buildLivePrayerProfile(entity)} />)}</div> : <p class="prayer-empty">No live prayer subjects match this scope.</p>}
          </section>
        </>
      ) : null}

      <footer class="prayer-principle">
        <strong>Prayer wording is template-certified, not person-by-person AI-generated.</strong>
        <p>Template {LIVE_PRAYER_TEMPLATE_REVIEW.version} was release-certified on {LIVE_PRAYER_TEMPLATE_REVIEW.reviewedAt}. Runtime interpolation is limited to source-backed identity, country, GSEC, and resource information. There is no prayer score, streak, leaderboard, or public activity record.</p>
      </footer>
    </section>
  );
}
