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
  livePrayerContextSummary,
  livePrayerPlainReason,
  selectDailyLivePrayerEntity,
  useLivePrayerExperience,
  type LivePrayerEntity,
  type LivePrayerProfile,
  type PrayerCategory,
} from "../prayer";

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
  entity: LivePrayerEntity;
  profile: LivePrayerProfile;
  featured?: boolean;
  listed: boolean;
  onTogglePrayer: (entity: LivePrayerEntity) => void;
}) {
  const categories = Array.from(new Set(profile.prompts.map((prompt) => prompt.category))).slice(0, featured ? 4 : 3);
  const context = livePrayerContextSummary(entity);
  return (
    <article class={`prayer-card v3-prayer-card${featured ? " prayer-card--featured v3-prayer-card--featured" : ""}`}>
      <div class="prayer-card__meta v3-prayer-card__meta">
        <span>{featured ? "People to Pray for Today" : context.countryName}</span>
        {!featured ? <span>{context.languageName ?? "Language not reported"}</span> : null}
      </div>
      <h2>{profile.peopleName}</h2>
      <p>{livePrayerPlainReason(entity)}</p>
      {featured ? (
        <dl class="v3-prayer-facts" aria-label="Prayer context">
          <div><dt>Place</dt><dd>{context.countryName}</dd></div>
          <div><dt>Language</dt><dd>{context.languageName ?? "Not reported"}</dd></div>
          <div><dt>Religion</dt><dd>{context.religionName ?? "Not reported"}</dd></div>
          <div><dt>Bible label</dt><dd>{context.bibleLabel ?? "Not reported"}</dd></div>
        </dl>
      ) : (
        <div class="prayer-category-row" aria-label="Prayer categories">
          {categories.map((category) => <span key={category}>{categoryLabel(category)}</span>)}
        </div>
      )}
      <div class="prayer-card__actions v3-prayer-card__actions">
        <a class="prayer-card__cta v3-button v3-button--primary" href={hrefFor(`/pray/${profile.sourcePeopleId}`)}>
          Pray for this people <ArrowRight size={17} aria-hidden="true" />
        </a>
        {featured ? <a class="v3-prayer-profile-link" href={hrefFor(`/peoples/${profile.sourcePeopleId}`)}>Read the people profile</a> : null}
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

  const togglePrayer = (entity: LivePrayerEntity) => personalization.togglePrayer(prayerSnapshotFromEntity(entity));
  const clearCountryHref = hrefFor(`/pray${query ? `?q=${encodeURIComponent(query)}` : ""}`);
  const pickerStartsOpen = Boolean(query.trim() || countryIso3);

  return (
    <section class="prayer-page v3-prayer-page" aria-labelledby="prayer-page-title" data-v3-prayer="landing">
      <header class="prayer-hero v3-prayer-hero">
        <div>
          <span class="v3-type-label">Prayer</span>
          <h1 id="prayer-page-title" class="v3-type-display-xl">Pray with context.</h1>
          <p class="v3-type-body-lg v3-reading">Begin with one people group, understand the source context, and pray through a small set of Scripture-shaped prompts. No streaks, scores, urgency rankings, or completion pressure.</p>
        </div>
        <Compass size={38} aria-hidden="true" />
      </header>

      {countryIso3 ? (
        <div class="prayer-scope-banner v3-prayer-scope">
          <Globe2 size={18} aria-hidden="true" />
          <span>Prayer focus is scoped to current GSEC 0–3 records connected to <strong>{countryIso3}</strong>.</span>
          <a href={clearCountryHref}>Clear country filter</a>
        </div>
      ) : null}

      {prayer.warning ? <div class="prayer-release-notice" role="status"><Database size={21} aria-hidden="true" /><div><strong>Showing cached source data</strong><p>{prayer.warning}</p></div></div> : null}
      {prayer.loading ? <div class="prayer-state v3-prayer-state" role="status">Preparing today’s prayer focus{prayer.progress ? `… ${prayer.progress.loadedPages}/${prayer.progress.totalPages}` : "…"}</div> : null}
      {!prayer.loading && prayer.error ? <div class="prayer-release-notice" role="alert"><Database size={21} aria-hidden="true" /><div><strong>Live prayer subjects are temporarily unavailable</strong><p>{prayer.error}</p><button type="button" class="people-reset-filters" onClick={prayer.retry}><RefreshCw size={15} aria-hidden="true" /> Retry</button></div></div> : null}

      {prayer.ready ? (
        <>
          <section class="prayer-daily v3-prayer-daily" aria-labelledby="daily-prayer-heading" data-v3-prayer-daily="true">
            <div class="prayer-section-heading v3-prayer-section-heading">
              <div><span class="v3-type-label">Daily focus</span><h2 id="daily-prayer-heading" class="v3-type-heading-xl">People to Pray for Today</h2></div>
              <CalendarDays size={21} aria-hidden="true" />
            </div>
            {dailyFromRotation ? (
              <div class="prayer-list-source prayer-rotation-source v3-prayer-rotation-note">
                <RotateCcw size={16} aria-hidden="true" />
                <span><strong>Next from your private prayer rotation</strong><small>Never-recorded entries come first, then the least recently recorded. This is a return aid, not a priority ranking.</small></span>
              </div>
            ) : <p class="v3-prayer-daily-note">Today’s fallback focus is selected deterministically from current eligible source records. It is not a ranking of urgency or importance.</p>}
            {daily && dailyEntity ? <PrayerCard entity={dailyEntity} profile={daily} featured listed={prayerListIds.has(dailyEntity.routeKey)} onTogglePrayer={togglePrayer} /> : <p class="prayer-empty">No current GSEC 0–3 people context is available for this scope.</p>}
          </section>

          <section class="v3-prayer-rhythm" aria-labelledby="prayer-rhythm-heading">
            <div>
              <span class="v3-type-label">Private continuity</span>
              <h2 id="prayer-rhythm-heading" class="v3-type-heading-lg">Return to people you chose.</h2>
              <p>{personalization.state.prayerList.length
                ? `Your private prayer list has ${personalization.state.prayerList.length} ${personalization.state.prayerList.length === 1 ? "person" : "people"}. A session follows your oldest-return rotation and never becomes a score or obligation.`
                : "Add people to your private prayer list when you want a simple way to remember them later."}</p>
            </div>
            {personalization.state.prayerList.length ? (
              <div class="v3-prayer-session-launchers" aria-label="Prayer session length">
                <a data-prayer-session-size="3" href={hrefFor("/pray/session?size=3")}><strong>3 people</strong><small>Compact rotation session</small></a>
                <a data-prayer-session-size="5" href={hrefFor("/pray/session?size=5")}><strong>5 people</strong><small>Longer rotation session</small></a>
                <a data-prayer-session-size="all" href={hrefFor("/pray/session?size=all")}><strong>Full eligible list</strong><small>Use every currently eligible saved person</small></a>
              </div>
            ) : null}
            <a class="prayer-private-list-link" href={hrefFor("/saved")}><List size={16} aria-hidden="true" /> Open private prayer list <span>{personalization.state.prayerList.length}</span></a>
          </section>

          <details class="prayer-library v3-prayer-picker" open={pickerStartsOpen}>
            <summary>
              <span><Search size={18} aria-hidden="true" /><strong>Choose another people</strong><small>Search current source-defined prayer subjects when you do not want today’s focus.</small></span>
              <span>{scoped.length} available</span>
            </summary>
            <div class="v3-prayer-picker__body">
              <div class="prayer-section-heading"><div><span class="eyebrow">Live prayer subjects</span><h2 id="prayer-library-heading">Choose a people</h2></div><Compass size={21} aria-hidden="true" /></div>
              <label class="countries-search v3-prayer-search" for="prayer-search"><Search size={18} aria-hidden="true" /><span class="sr-only">Search prayer subjects</span><input id="prayer-search" type="search" value={query} onInput={(event) => setQuery(event.currentTarget.value)} placeholder="Search people, country, language or PEID" /></label>
              {scoped.length ? <div class="detail-record-progress prayer-library-progress" aria-live="polite"><strong>Showing {visible.length} of {scoped.length}</strong><span>Current GSEC 0–3 prayer subjects</span></div> : null}
              {visible.length ? <div class="prayer-card-grid v3-prayer-choice-grid">{visible.map((entity) => <PrayerCard key={entity.id} entity={entity} profile={buildLivePrayerProfile(entity)} listed={prayerListIds.has(entity.routeKey)} onTogglePrayer={togglePrayer} />)}</div> : <p class="prayer-empty">No live prayer subjects match this scope.</p>}
              {remaining ? <div class="result-load-more result-load-more--detail prayer-library-more"><button type="button" onClick={() => setVisibleCount((current) => Math.min(current + PRAYER_LIBRARY_BATCH_SIZE, scoped.length))}>Show {Math.min(PRAYER_LIBRARY_BATCH_SIZE, remaining)} more</button><span>{remaining} remaining</span></div> : null}
            </div>
          </details>
        </>
      ) : null}

      <details class="prayer-principle v3-prayer-method">
        <summary>How prayer wording and source facts are handled</summary>
        <div>
          <strong>Prayer wording is template-certified, not person-by-person AI-generated.</strong>
          <p>Template {LIVE_PRAYER_TEMPLATE_REVIEW.version} was release-certified on {LIVE_PRAYER_TEMPLATE_REVIEW.reviewedAt}. Runtime interpolation is limited to source-backed identity, country, GSEC, and resource information. Prayer-list membership and the latest prayer timestamp are local by default; if you explicitly enable Private Sync, only those supported private fields can be copied to your account. Recent browsing never syncs, and no prayer score, streak, leaderboard, mission-priority signal, or spiritual completion metric is created.</p>
        </div>
      </details>
    </section>
  );
}
