import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Clock, Compass } from "lucide-preact";
import { useEffect, useMemo, useState } from "preact/hooks";

import { hrefFor } from "../app/router";
import { prayerFlow, usePrayerExperience, type PrayerCategory } from "../prayer";

type PrayerMinutes = 2 | 5 | 10;

function categoryLabel(category: PrayerCategory): string {
  return category === "specific-need" ? "Specific need" : category.charAt(0).toUpperCase() + category.slice(1);
}

export function PrayerFocusPage({ sourcePeopleId }: { sourcePeopleId: number }) {
  const prayer = usePrayerExperience();
  const [minutes, setMinutes] = useState<PrayerMinutes>(5);
  const [activeIndex, setActiveIndex] = useState(0);
  const profile = prayer.profilesBySourceId.get(sourcePeopleId) ?? null;
  const flow = useMemo(() => profile ? prayerFlow(profile, minutes) : [], [profile, minutes]);
  const activePrompt = flow[activeIndex] ?? null;

  useEffect(() => setActiveIndex(0), [minutes, sourcePeopleId]);

  if (prayer.loading) return <section class="prayer-focus prayer-state" role="status">Loading prayer guide…</section>;
  if (!prayer.dataset) {
    return (
      <section class="prayer-focus prayer-focus--state">
        <div class="eyebrow">Focused prayer</div>
        <h1 class="display-title">Prayer guide unavailable in this build.</h1>
        <p>{prayer.error ?? prayer.status?.reason ?? "Reviewed prayer content remains publication-gated."}</p>
        <a class="inline-link" href={hrefFor("/pray")}><ArrowLeft size={16} aria-hidden="true" /> Back to Prayer</a>
      </section>
    );
  }
  if (!profile || !activePrompt) {
    return (
      <section class="prayer-focus prayer-focus--state">
        <div class="eyebrow">Focused prayer</div>
        <h1 class="display-title">Prayer guide not found.</h1>
        <p>No published prayer-ready profile matches source people ID <strong>{sourcePeopleId}</strong>.</p>
        <a class="inline-link" href={hrefFor("/pray")}><ArrowLeft size={16} aria-hidden="true" /> Back to Prayer</a>
      </section>
    );
  }

  const secondsPerPrompt = Math.max(20, Math.round((minutes * 60) / flow.length));
  return (
    <article class="prayer-focus">
      <nav class="prayer-focus__back" aria-label="Prayer navigation"><a href={hrefFor("/pray")}><ArrowLeft size={15} aria-hidden="true" /> Prayer</a><span>/</span><a href={hrefFor(`/peoples/${profile.sourcePeopleId}`)}>{profile.peopleName}</a></nav>

      <header class="prayer-focus__hero">
        <div>
          <div class="eyebrow">Focused prayer</div>
          <h1 class="display-title">Pray for {profile.peopleName}</h1>
          <p>{profile.whyPray.summary}</p>
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
        {activePrompt.temporalClass === "current" && activePrompt.asOf ? <p class="prayer-freshness">Context reviewed as of {activePrompt.asOf}.</p> : null}
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

      <footer class="prayer-focus__footer">
        <p>There is no prayer score, streak, public activity record, or spiritual completion metric.</p>
        <a href={hrefFor(`/peoples/${profile.sourcePeopleId}`)}>Return to the people profile</a>
      </footer>
    </article>
  );
}
