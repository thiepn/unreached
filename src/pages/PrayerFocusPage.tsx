import { ArrowLeft, BookOpen, Bookmark, Check, ChevronLeft, ChevronRight, Clock, Compass, Database, RefreshCw } from "lucide-preact";
import { useEffect, useMemo, useState } from "preact/hooks";

import { hrefFor } from "../app/router";
import { isSameLocalDate, prayerSnapshotFromEntity, usePersonalization } from "../personalization";
import {
  LIVE_PRAYER_TEMPLATE_REVIEW,
  buildLivePrayerProfile,
  isLivePrayerEligible,
  livePrayerFlow,
  useLivePrayerExperience,
  type PrayerCategory,
} from "../prayer";

type PrayerMinutes = 2 | 5 | 10;

function categoryLabel(category: PrayerCategory): string {
  return category === "specific-need" ? "Specific need" : category.charAt(0).toUpperCase() + category.slice(1);
}

export function PrayerFocusPage({ sourcePeopleId }: { sourcePeopleId: number }) {
  const prayer = useLivePrayerExperience();
  const personalization = usePersonalization();
  const [minutes, setMinutes] = useState<PrayerMinutes>(5);
  const [activeIndex, setActiveIndex] = useState(0);
  const entity = prayer.peopleByRouteKey.get(sourcePeopleId) ?? null;
  const profile = entity && isLivePrayerEligible(entity) ? buildLivePrayerProfile(entity) : null;
  const flow = useMemo(() => profile ? livePrayerFlow(profile, minutes) : [], [profile, minutes]);
  const activePrompt = flow[activeIndex] ?? null;
  const prayerSnapshot = entity ? prayerSnapshotFromEntity(entity) : null;
  const prayerListEntry = personalization.state.prayerList.find((item) => item.sourcePeopleId === sourcePeopleId) ?? null;
  const listed = Boolean(prayerListEntry);
  const recordedToday = isSameLocalDate(prayerListEntry?.lastPrayedAt ?? null);

  useEffect(() => setActiveIndex(0), [minutes, sourcePeopleId]);

  if (prayer.loading) return <section class="prayer-focus prayer-state" role="status">Loading live prayer guide{prayer.progress ? `… ${prayer.progress.loadedPages}/${prayer.progress.totalPages}` : "…"}</section>;
  if (prayer.error) {
    return (
      <section class="prayer-focus prayer-focus--state">
        <Database size={24} aria-hidden="true" />
        <div class="eyebrow">Focused prayer</div>
        <h1 class="display-title">Live prayer guide unavailable.</h1>
        <p>{prayer.error}</p>
        <button type="button" class="people-reset-filters" onClick={prayer.retry}><RefreshCw size={15} aria-hidden="true" /> Retry</button>
        <a class="inline-link" href={hrefFor("/pray")}><ArrowLeft size={16} aria-hidden="true" /> Back to Prayer</a>
      </section>
    );
  }
  if (!profile || !activePrompt || !entity || !prayerSnapshot) {
    return (
      <section class="prayer-focus prayer-focus--state">
        <div class="eyebrow">Focused prayer</div>
        <h1 class="display-title">Prayer guide not found.</h1>
        <p>No current GSEC 0–3 PeopleGroups.org context matches PEID <strong>{sourcePeopleId}</strong>.</p>
        <a class="inline-link" href={hrefFor("/pray")}><ArrowLeft size={16} aria-hidden="true" /> Back to Prayer</a>
      </section>
    );
  }

  const secondsPerPrompt = Math.max(20, Math.round((minutes * 60) / flow.length));
  return (
    <article class="prayer-focus">
      <nav class="prayer-focus__back" aria-label="Prayer navigation"><a href={hrefFor("/pray")}><ArrowLeft size={15} aria-hidden="true" /> Prayer</a><span>/</span><a href={hrefFor(`/peoples/${profile.sourcePeopleId}`)}>{profile.peopleName}</a></nav>

      {prayer.warning ? <div class="prayer-release-notice" role="status"><Database size={18} aria-hidden="true" /><div><strong>Cached source data</strong><p>{prayer.warning}</p></div></div> : null}

      <header class="prayer-focus__hero">
        <div>
          <div class="eyebrow">Focused prayer</div>
          <h1 class="display-title">Pray for {profile.peopleName}</h1>
          <p>{profile.whyPray}</p>
          <button
            type="button"
            class={`prayer-list-toggle prayer-list-toggle--focus${listed ? " is-active" : ""}`}
            aria-pressed={listed}
            onClick={() => personalization.togglePrayer(prayerSnapshot)}
          >
            <Bookmark size={16} aria-hidden="true" />
            {listed ? "Remove from private prayer list" : "Add to private prayer list"}
          </button>
        </div>
        <Compass size={32} aria-hidden="true" />
      </header>

      <div class="prayer-duration" aria-label="Prayer mode length">
        <span><Clock size={16} aria-hidden="true" /> Choose a pace</span>
        <div role="group" aria-label="Prayer duration">
          {([2, 5, 10] as const).map((value) => <button type="button" class={minutes === value ? "is-active" : ""} aria-pressed={minutes === value} onClick={() => setMinutes(value)} key={value}>{value} min</button>)}
        </div>
        <small>About {secondsPerPrompt} seconds per prompt. This is a pacing aid, not a timer or completion target.</small>
      </div>

      <section class="prayer-prompt-stage" aria-live="polite">
        <div class="prayer-prompt-stage__top">
          <span class="prayer-category">{categoryLabel(activePrompt.category)}</span>
          <span>Prayer step {activeIndex + 1} of {flow.length}</span>
        </div>
        <p class="prayer-prompt-text">{activePrompt.text}</p>
        {activePrompt.scriptureReferences.length ? (
          <div class="prayer-scripture-list">
            <div class="prayer-scripture-label"><BookOpen size={17} aria-hidden="true" /> Scripture for this prayer</div>
            {activePrompt.scriptureReferences.map((scripture) => <div key={`${activePrompt.id}-${scripture.reference}`}><strong>{scripture.reference}</strong><span>{scripture.purpose}</span></div>)}
          </div>
        ) : null}
        {activePrompt.sourceGrounding ? <p class="prayer-freshness">Source grounding: {activePrompt.sourceGrounding}</p> : null}
      </section>

      <div class="prayer-focus__controls">
        <button type="button" onClick={() => setActiveIndex((value) => Math.max(0, value - 1))} disabled={activeIndex === 0}><ChevronLeft size={18} aria-hidden="true" /> Previous</button>
        <div class="prayer-step-dots" aria-hidden="true">{flow.map((prompt, index) => <span class={index === activeIndex ? "is-active" : ""} key={prompt.id} />)}</div>
        {activeIndex < flow.length - 1 ? (
          <button type="button" onClick={() => setActiveIndex((value) => Math.min(flow.length - 1, value + 1))}>Next <ChevronRight size={18} aria-hidden="true" /></button>
        ) : (
          <a class="prayer-return" href={hrefFor("/pray")}>Return to Prayer</a>
        )}
      </div>

      <section class="prayer-practice-panel" aria-labelledby="prayer-practice-heading">
        <div>
          <span class="eyebrow">Private prayer practice</span>
          <h2 id="prayer-practice-heading">Keep one simple return point.</h2>
          <p>If useful, record that you prayed for this people today. Unreached stores only the latest timestamp in this browser—never a total, score, streak, or public activity record.</p>
        </div>
        <button
          type="button"
          class={`prayer-practice-record${recordedToday ? " is-recorded" : ""}`}
          disabled={recordedToday}
          onClick={() => personalization.recordPrayer(prayerSnapshot)}
        >
          {recordedToday ? <Check size={17} aria-hidden="true" /> : <Compass size={17} aria-hidden="true" />}
          {recordedToday ? "Prayer noted today" : "Record prayer today"}
        </button>
        {prayerListEntry?.lastPrayedAt ? <small>Last recorded locally: {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(prayerListEntry.lastPrayedAt))}</small> : <small>No prayer date is stored yet.</small>}
      </section>

      <footer class="prayer-focus__footer">
        <p>Template {LIVE_PRAYER_TEMPLATE_REVIEW.version} is fixed and release-certified. Runtime facts come from the current PeopleGroups.org record. Private prayer practice is optional and non-competitive: no prayer score, streak, public activity record, or spiritual completion metric is created.</p>
        <a href={hrefFor(`/peoples/${profile.sourcePeopleId}`)}>Return to the people profile</a>
      </footer>
    </article>
  );
}
