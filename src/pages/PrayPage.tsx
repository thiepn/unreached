import { ArrowRight, Bookmark, CalendarDays, Compass, Database, Globe2, List, RefreshCw, RotateCcw, Search } from "lucide-preact";
import { useEffect, useMemo, useState } from "preact/hooks";

import { readHashSearchParams, replaceHashSearchParams, setOptionalHashParam } from "../app/hash-state";
import { hrefFor } from "../app/router";
import { useDebouncedValue } from "../hooks/useResponsiveWork";
import { prayerSnapshotFromEntity, selectNextPrayerRotationEntry, usePersonalization } from "../personalization";
import {
  LIVE_PRAYER_TEMPLATE_REVIEW,
  buildLivePrayerProfile,
  dateKeyLocal,
  filterLivePrayerEntities,
  selectDailyLivePrayerEntity,
  useLivePrayerExperience,
  type LivePrayerProfile,
  type PrayerCategory,
} from "../prayer";
import type { RuntimePeopleEntity } from "../providers/peoplegroups";

const PRAYER_LIBRARY_BATCH_SIZE = 24;

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
  const country = readHashSearchParams().get("country")?.toUpperCase() ?? null;
  return country && /^[A-Z]{3}$/.test(country) ? country : null;
}

function PrayerCard({
  entity,
  profile,
  featured = false,
  listed,
  onTogglePrayer,
}: {
  entity: RuntimePeopleEntity;
  profile: LivePrayerProfile;
  featured?: boolean;
  listed: boolean;
  onTogglePrayer: (entity: RuntimePeopleEntity) => void;
}) {
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
      <div class="prayer-card__actions">
        <a class="prayer-card__cta" href={hrefFor(`/pray/${profile.sourcePeopleId}`)}>
          Pray for this people <ArrowRight size={17} aria-hidden="true" />
        </a>
        <button
          type="button"
          class={`prayer-list-toggle${listed ? " is-active" : ""}`}
          aria-label={`${listed ? "Remove" : "Add"} ${profile.peopleName} ${listed ? "from" : "to"} private prayer list`}
          aria-pressed={listed}
          onClick={() => onTogglePrayer(entity)}
        >
          <Bookmark size={16} aria-hidden="true" />
          {listed ? "In prayer list" : "Add to prayer list"}
        </button>
      </div>
    </article>
  );
}

export function PrayPage() {
  const prayer = useLivePrayerExperience();
  const personalization = usePersonalization();
  const countryIso3 = countryFilterFromHash();
  const [query, setQuery] = useState(() => readHashSearchParams().get("q") ?? "");
  const [visibleCount, setVisibleCount] = useState(PRAYER_LIBRARY_BATCH_SIZE);
  const debouncedQuery = useDebouncedValue(query, 100);

  const prayerListIds = useMemo(() => new Set(personalization.state.prayerList.map((item) => item.sourcePeopleId)), [personalization.state.prayerList]);
  const eligibleSourcePeopleIdsInScope = useMemo(() => new Set(prayer.eligible
    .filter((entity) => !countryIso3 || prayer.peopleSearchIndex.byRouteKey.get(entity.routeKey)?.unreachedCountryIso3s.has(countryIso3))
    .map((entity) => entity.routeKey)), [prayer.eligible, prayer.peopleSearchIndex, countryIso3]);

  const rotationEntry = useMemo(() => selectNextPrayerRotationEntry(personalization.state.prayerList, {
    eligibleSourcePeopleIds: eligibleSourcePeopleIdsInScope,
  }), [personalization.state.prayerList, eligibleSourcePeopleIdsInScope]);
  const rotationEntity = rotationEntry ? prayer.peopleByRouteKey.get(rotationEntry.sourcePeopleId) ?? null : null;

  const scoped = useMemo(
    () => filterLivePrayerEntities(prayer.eligible, debouncedQuery, countryIso3, prayer.peopleSearchIndex),
    [prayer.eligible, prayer.peopleSearchIndex, countryIso3, debouncedQuery],
  );

  useEffect(() => {
    const params = new URLSearchParams();
    setOptionalHashParam(params, "country", countryIso3);
    setOptionalHashParam(params, "q", query);
    replaceHashSearchParams(params);
  }, [countryIso3, query]);

  useEffect(() => {
    setVisibleCount(PRAYER_LIBRARY_BATCH_SIZE);
  }, [debouncedQuery, countryIso3]);

  const dailyEntity = prayer.ready
    ? rotationEntity ?? selectDailyLivePrayerEntity(prayer.eligible, dateKeyLocal(), countryIso3)
    : null;
  const daily = dailyEntity ? buildLivePrayerProfile(dailyEntity) : null;
  const dailyFromRotation = Boolean(dailyEntity && rotationEntry && dailyEntity.routeKey === rotationEntry.sourcePeopleId);
  const visible = scoped.slice(0, visibleCount);
  const remaining = Math.max(0, scoped.length - visible.length);

  const togglePrayer = (entity: RuntimePeopleEntity) => personalization.togglePrayer(prayerSnapshotFromEntity(entity));
  const clearCountryHref = hrefFor(`/pray${query ? `?q=${encodeURIComponent(query)}` : ""}`);

  return (
    <section class="prayer-page" aria-labelledby="prayer-page-title">
      <header class="prayer-hero">
        <div>
          <div class="eyebrow">Prayer</div>
          <h1 id="prayer-page-title" class="display-title">Understand enough to pray specifically.</h1>
          <p class="lead">Live source records identify prayer subjects; a fixed release-certified template supplies the prayer wording. Unreached does not generate unreviewed claims about individual communities.</p>
          <a class="prayer-private-list-link" href={hrefFor("/saved")}><List size={16} aria-hidden="true" /> Open private prayer list <span>{personalization.state.prayerList.length}</span></a>
        </div>
        <div class="prayer-hero__mark" aria-hidden="true"><Compass size={34} /></div>
      </header>

      {countryIso3 ? (
        <div class="prayer-scope-banner">
          <Globe2 size={18} aria-hidden="true" />
          <span>Showing GSEC 0–3 people contexts connected to <strong>{countryIso3}</strong>.</span>
          <a href={clearCountryHref}>Clear country filter</a>
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
            {dailyFromRotation ? (
              <div class="prayer-list-source prayer-rotation-source">
                <RotateCcw size={15} aria-hidden="true" />
                <span><strong>Next from your private prayer rotation</strong><small>Never-recorded entries come first, then the least recently recorded. This is a return aid, not a priority ranking.</small></span>
              </div>
            ) : null}
            {daily && dailyEntity ? <PrayerCard entity={dailyEntity} profile={daily} featured listed={prayerListIds.has(dailyEntity.routeKey)} onTogglePrayer={togglePrayer} /> : <p class="prayer-empty">No current GSEC 0–3 people context is available for this scope.</p>}
          </section>

          <section class="prayer-library" aria-labelledby="prayer-library-heading">
            <div class="prayer-section-heading"><div><span class="eyebrow">Live prayer subjects</span><h2 id="prayer-library-heading">Choose a people</h2></div><Compass size={21} aria-hidden="true" /></div>
            <label class="countries-search" for="prayer-search"><Search size={18} aria-hidden="true" /><span class="sr-only">Search prayer subjects</span><input id="prayer-search" type="search" value={query} onInput={(event) => setQuery(event.currentTarget.value)} placeholder="Search people, country, language or PEID" /></label>
            {scoped.length ? <div class="detail-record-progress prayer-library-progress" aria-live="polite"><strong>Showing {visible.length} of {scoped.length}</strong><span>Current GSEC 0–3 prayer subjects</span></div> : null}
            {visible.length ? <div class="prayer-card-grid">{visible.map((entity) => <PrayerCard key={entity.id} entity={entity} profile={buildLivePrayerProfile(entity)} listed={prayerListIds.has(entity.routeKey)} onTogglePrayer={togglePrayer} />)}</div> : <p class="prayer-empty">No live prayer subjects match this scope.</p>}
            {remaining ? <div class="result-load-more result-load-more--detail prayer-library-more"><button type="button" onClick={() => setVisibleCount((current) => Math.min(current + PRAYER_LIBRARY_BATCH_SIZE, scoped.length))}>Show {Math.min(PRAYER_LIBRARY_BATCH_SIZE, remaining)} more</button><span>{remaining} remaining</span></div> : null}
          </section>
        </>
      ) : null}

      <footer class="prayer-principle">
        <strong>Prayer wording is template-certified, not person-by-person AI-generated.</strong>
        <p>Template {LIVE_PRAYER_TEMPLATE_REVIEW.version} was release-certified on {LIVE_PRAYER_TEMPLATE_REVIEW.reviewedAt}. Runtime interpolation is limited to source-backed identity, country, GSEC, and resource information. Prayer-list membership and the latest prayer timestamp are local by default; if you explicitly enable Private Sync, only those supported private fields can be copied to your account. Recent browsing never syncs, and no prayer score, streak, leaderboard, mission-priority signal, or spiritual completion metric is created.</p>
      </footer>
    </section>
  );
}
