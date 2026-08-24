import { ArrowLeft, BookOpen, Check, ChevronLeft, ChevronRight, Compass, Database, List, RefreshCw, RotateCcw } from "lucide-preact";
import { useEffect, useMemo, useState } from "preact/hooks";

import { hrefFor } from "../app/router";
import {
  buildPrayerSessionPlan,
  isSameLocalDate,
  prayerSessionSizeFromValue,
  prayerSessionSizeLabel,
  prayerSnapshotFromEntity,
  usePersonalization,
} from "../personalization";
import { buildLivePrayerProfile, livePrayerFlow, useLivePrayerExperience } from "../prayer";

function sessionSizeFromHash() {
  const query = window.location.hash.split("?", 2)[1] ?? "";
  return prayerSessionSizeFromValue(new URLSearchParams(query).get("size"));
}

export function PrayerSessionPage() {
  const prayer = useLivePrayerExperience();
  const personalization = usePersonalization();
  const sessionSize = sessionSizeFromHash();
  const eligibleIds = useMemo(() => new Set(prayer.eligible.map((entity) => entity.routeKey)), [prayer.eligible]);
  const [planIds, setPlanIds] = useState<number[]>([]);
  const [planInitialized, setPlanInitialized] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!prayer.ready || planInitialized) return;
    const plan = buildPrayerSessionPlan(personalization.state.prayerList, {
      eligibleSourcePeopleIds: eligibleIds,
      size: sessionSize,
    });
    setPlanIds(plan.map((entry) => entry.sourcePeopleId));
    setPlanInitialized(true);
  }, [prayer.ready, planInitialized, personalization.state.prayerList, eligibleIds, sessionSize]);

  const currentId = planIds[activeIndex] ?? null;
  const entity = currentId ? prayer.peopleByRouteKey.get(currentId) ?? null : null;
  const profile = entity ? buildLivePrayerProfile(entity) : null;
  const prompts = profile ? livePrayerFlow(profile, 2) : [];
  const prayerEntry = currentId ? personalization.state.prayerList.find((entry) => entry.sourcePeopleId === currentId) ?? null : null;
  const recordedToday = isSameLocalDate(prayerEntry?.lastPrayedAt ?? null);

  if (prayer.loading || (prayer.ready && !planInitialized)) {
    return <section class="prayer-session prayer-state" role="status">Preparing private prayer session{prayer.progress ? `… ${prayer.progress.loadedPages}/${prayer.progress.totalPages}` : "…"}</section>;
  }

  if (prayer.error) {
    return (
      <section class="prayer-session prayer-session--state">
        <Database size={25} aria-hidden="true" />
        <div class="eyebrow">Guided prayer session</div>
        <h1 class="display-title">Live prayer subjects are unavailable.</h1>
        <p>{prayer.error}</p>
        <button type="button" class="people-reset-filters" onClick={prayer.retry}><RefreshCw size={15} aria-hidden="true" /> Retry</button>
        <a class="inline-link" href={hrefFor("/saved")}><ArrowLeft size={16} aria-hidden="true" /> Back to Saved & prayer</a>
      </section>
    );
  }

  if (!planIds.length) {
    return (
      <section class="prayer-session prayer-session--state">
        <List size={26} aria-hidden="true" />
        <div class="eyebrow">Guided prayer session</div>
        <h1 class="display-title">No eligible people are in your prayer list.</h1>
        <p>Add current GSEC 0–3 people to your private prayer list first. Session planning stays local to this browser.</p>
        <a class="prayer-session__primary-link" href={hrefFor("/pray")}>Choose people to pray for</a>
        <a class="inline-link" href={hrefFor("/saved")}>Back to Saved & prayer</a>
      </section>
    );
  }

  if (!entity || !profile) {
    return (
      <section class="prayer-session prayer-session--state">
        <Database size={25} aria-hidden="true" />
        <div class="eyebrow">Guided prayer session</div>
        <h1 class="display-title">A session person is no longer available.</h1>
        <p>The frozen session plan points to a person whose current live record could not be resolved. Return to the prayer list to start a fresh session from current source data.</p>
        <a class="prayer-session__primary-link" href={hrefFor("/saved")}>Return to prayer list</a>
      </section>
    );
  }

  const canGoBack = activeIndex > 0;
  const canGoNext = activeIndex < planIds.length - 1;

  return (
    <article class="prayer-session" data-prayer-session-plan={planIds.join(",")}>
      <nav class="prayer-session__back" aria-label="Prayer session navigation">
        <a href={hrefFor("/saved")}><ArrowLeft size={15} aria-hidden="true" /> Saved & prayer</a>
        <span>/</span>
        <a href={hrefFor("/pray")}>Prayer</a>
      </nav>

      {prayer.warning ? <div class="prayer-release-notice" role="status"><Database size={18} aria-hidden="true" /><div><strong>Cached source data</strong><p>{prayer.warning}</p></div></div> : null}

      <header class="prayer-session__hero">
        <div>
          <div class="eyebrow">Guided prayer session</div>
          <h1 class="display-title">Pray through your rotation.</h1>
          <p>A {prayerSessionSizeLabel(sessionSize).toLowerCase()} was frozen when this session opened. Recording prayer can update future rotation order, but it will not reshuffle the people already selected here.</p>
        </div>
        <RotateCcw size={31} aria-hidden="true" />
      </header>

      <div class="prayer-session__policy">
        <Compass size={18} aria-hidden="true" />
        <p>This is a navigation aid, not a completion target. Unreached stores no session history, completion percentage, session count, score, streak, or ranking.</p>
      </div>

      <section class="prayer-session__person" aria-labelledby="prayer-session-person-heading">
        <div class="prayer-session__position" data-session-position={`${activeIndex + 1}/${planIds.length}`}>
          <span>Session position</span>
          <strong>Person {activeIndex + 1} of {planIds.length}</strong>
        </div>
        <div class="prayer-session__identity">
          <span class="eyebrow">Current prayer subject</span>
          <h2 id="prayer-session-person-heading">{profile.peopleName}</h2>
          <p>{profile.countryNames.join(" · ")}</p>
        </div>
        <p class="prayer-session__why">{profile.whyPray}</p>
        <a class="inline-link" href={hrefFor(`/peoples/${profile.sourcePeopleId}`)}>Open people profile</a>
      </section>

      <section class="prayer-session__prompts" aria-labelledby="session-prompts-heading">
        <div class="prayer-section-heading"><div><span class="eyebrow">Compact guide</span><h2 id="session-prompts-heading">Three prayer prompts</h2></div><BookOpen size={21} aria-hidden="true" /></div>
        <div class="prayer-session__prompt-list">
          {prompts.map((prompt) => (
            <article key={prompt.id}>
              <span>{prompt.category === "specific-need" ? "Specific need" : prompt.category}</span>
              <p>{prompt.text}</p>
              {prompt.scriptureReferences[0] ? <small><strong>{prompt.scriptureReferences[0].reference}</strong> — {prompt.scriptureReferences[0].purpose}</small> : null}
            </article>
          ))}
        </div>
        <a class="inline-link" href={hrefFor(`/pray/${profile.sourcePeopleId}`)}>Open full focused-prayer guide</a>
      </section>

      <section class="prayer-session__record" aria-labelledby="session-record-heading">
        <div>
          <span class="eyebrow">Optional local note</span>
          <h2 id="session-record-heading">Record prayer for this person</h2>
          <p>This uses the existing latest-only prayer timestamp. Skipping it does not mark anything incomplete.</p>
        </div>
        <button
          type="button"
          class={`prayer-practice-record${recordedToday ? " is-recorded" : ""}`}
          disabled={recordedToday}
          onClick={() => personalization.recordPrayer(prayerSnapshotFromEntity(entity))}
        >
          {recordedToday ? <Check size={17} aria-hidden="true" /> : <Compass size={17} aria-hidden="true" />}
          {recordedToday ? "Prayer noted today" : "Record prayer today"}
        </button>
      </section>

      <div class="prayer-session__controls">
        <button type="button" onClick={() => setActiveIndex((index) => Math.max(0, index - 1))} disabled={!canGoBack}><ChevronLeft size={18} aria-hidden="true" /> Previous person</button>
        {canGoNext ? (
          <button type="button" onClick={() => setActiveIndex((index) => Math.min(planIds.length - 1, index + 1))}>Next person <ChevronRight size={18} aria-hidden="true" /></button>
        ) : (
          <a href={hrefFor("/saved")}>Return to prayer list</a>
        )}
      </div>

      <footer class="prayer-session__footer">
        <p>The session plan exists only in this page state. Closing or leaving the page discards it. Future sessions are rebuilt from the current private rotation and current live PeopleGroups.org eligibility.</p>
      </footer>
    </article>
  );
}
