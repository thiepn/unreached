import { ArrowRight, Bookmark, Clock3, Compass, Globe2, Languages, List, RotateCcw, Trash2, UsersRound } from "lucide-preact";

import { hrefFor } from "../app/router";
import { orderPrayerRotation, prayerRotationReturnLabel, usePersonalization, type RecentVisitKind, type SavedPersonSnapshot } from "../personalization";

function recentIcon(kind: RecentVisitKind) {
  if (kind === "country") return Globe2;
  if (kind === "language") return Languages;
  return UsersRound;
}

function dateLabel(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

function dateTimeLabel(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function savedStatus(person: SavedPersonSnapshot): string {
  if (person.frontier) return "Frontier (legacy snapshot)";
  if (person.classification === "unreached-only" || person.classification === "unreached") return "Unreached";
  if (person.classification === "mixed") return "Mixed GSEC status (legacy snapshot)";
  if (person.classification === "other-only") return "Other GSEC status";
  if (person.classification === "reached") return "Reached (legacy snapshot)";
  return "Status unknown";
}

function prayerEligible(person: SavedPersonSnapshot): boolean {
  return Boolean(person.frontier)
    || person.classification === "unreached"
    || person.classification === "unreached-only"
    || person.classification === "mixed";
}

export function SavedPage() {
  const { state, removeSaved, removePrayer, clearRecent } = usePersonalization();
  const prayerRotation = orderPrayerRotation(state.prayerList);
  const nextPrayer = prayerRotation[0] ?? null;
  const sessionHref = hrefFor("/pray/session");

  return (
    <section class="saved-page" aria-labelledby="my-lists-title">
      <header class="saved-hero">
        <div>
          <div class="eyebrow">Private workspace</div>
          <h1 id="my-lists-title" class="display-title">My lists</h1>
          <p class="lead">Manage your prayer list and saved people here. Recent profiles stay available as an optional return aid.</p>
        </div>
        <Bookmark size={30} aria-hidden="true" />
      </header>

      <section class="saved-section saved-prayer-section" aria-labelledby="prayer-list-heading">
        <div class="saved-section__heading"><div><span class="eyebrow">Private prayer practice</span><h2 id="prayer-list-heading">Prayer list</h2></div><span>{state.prayerList.length}</span></div>
        {nextPrayer ? (
          <div class="saved-prayer-rotation" aria-labelledby="prayer-rotation-heading">
            <div>
              <span class="eyebrow">Prayer rotation</span>
              <h3 id="prayer-rotation-heading">Next return point</h3>
              <p>The rotation surfaces people with no recorded prayer date first, then those least recently recorded. It only helps you revisit your list; it does not rank urgency, importance, unreachedness, or prayer faithfulness.</p>
            </div>
            <a data-prayer-rotation-next={nextPrayer.sourcePeopleId} href={hrefFor(`/pray/${nextPrayer.sourcePeopleId}`)}>
              <RotateCcw size={18} aria-hidden="true" />
              <span><strong>{nextPrayer.name}</strong><small>{prayerRotationReturnLabel(nextPrayer)}</small></span>
              <ArrowRight size={18} aria-hidden="true" />
            </a>
          </div>
        ) : null}

        {prayerRotation.length ? (
          <div class="saved-prayer-session-launcher" aria-labelledby="guided-session-heading">
            <div>
              <span class="eyebrow">Guided prayer session</span>
              <h3 id="guided-session-heading">Pray through several return points.</h3>
              <p>Freeze a temporary 3-person, 5-person, or full-list session from the current rotation. No session history or completion record is created.</p>
            </div>
            <div class="saved-prayer-session-launcher__actions" role="group" aria-label="Choose prayer session size">
              <a data-prayer-session-size="3" href={`${sessionHref}?size=3`}>3 people</a>
              <a data-prayer-session-size="5" href={`${sessionHref}?size=5`}>5 people</a>
              <a data-prayer-session-size="all" href={`${sessionHref}?size=all`}>Full eligible list</a>
            </div>
          </div>
        ) : null}

        {prayerRotation.length ? (
          <div class="saved-prayer-grid">
            {prayerRotation.map((person, index) => (
              <article class={`saved-prayer-card${index === 0 ? " saved-prayer-card--next" : ""}`} key={person.sourcePeopleId} data-prayer-list-peid={person.sourcePeopleId}>
                <div class="saved-prayer-card__top">
                  <span>{index === 0 ? <RotateCcw size={14} aria-hidden="true" /> : <List size={14} aria-hidden="true" />}{index === 0 ? "Next return point" : "Private prayer list"}</span>
                  <small>{person.lastPrayedAt ? `Last prayed ${dateTimeLabel(person.lastPrayedAt)}` : "No prayer date recorded"}</small>
                </div>
                <h3><a href={hrefFor(`/pray/${person.sourcePeopleId}`)}>{person.name}</a></h3>
                <p>{[person.countryName, person.languageName].filter(Boolean).join(" · ") || "Live profile context available when opened"}</p>
                <div class="saved-prayer-card__actions">
                  <a href={hrefFor(`/pray/${person.sourcePeopleId}`)}><Compass size={15} aria-hidden="true" /> Pray now</a>
                  <a href={hrefFor(`/peoples/${person.sourcePeopleId}`)}><UsersRound size={15} aria-hidden="true" /> Profile</a>
                  <button type="button" onClick={() => removePrayer(person.sourcePeopleId)}><Trash2 size={15} aria-hidden="true" /> Remove</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div class="saved-empty"><List size={22} aria-hidden="true" /><div><strong>Your private prayer list is empty.</strong><p>Add a people from Prayer or a focused prayer guide. The list is local by default and is never public.</p><a href={hrefFor("/pray")}>Choose someone to pray for</a></div></div>
        )}
        <details class="saved-policy-note"><summary>How prayer-list data is stored</summary><p>Prayer practice is local by default and stores only a small identity snapshot, when the person was added, and the latest prayer timestamp if you choose to record one. If you explicitly enable Private Sync, prayer-list membership and that latest timestamp can be copied to your private account. Rotation and guided-session planning do not add totals, scores, streaks, deadlines, priority values, session histories, completion metrics, or public activity.</p></details>
      </section>

      <section class="saved-section" aria-labelledby="saved-peoples-heading">
        <div class="saved-section__heading"><div><span class="eyebrow">Profiles</span><h2 id="saved-peoples-heading">Saved peoples</h2></div><span>{state.savedPeoples.length}</span></div>
        {state.savedPeoples.length ? (
          <div class="saved-people-grid">
            {state.savedPeoples.map((person) => (
              <article class="saved-person-card" key={person.sourcePeopleId}>
                <div class="saved-person-card__top"><span>{savedStatus(person)}</span><small>Saved {dateLabel(person.savedAt)}</small></div>
                <h3><a href={hrefFor(`/peoples/${person.sourcePeopleId}`)}>{person.name}</a></h3>
                <p>{[person.largestCountryName, person.primaryLanguageName].filter(Boolean).join(" · ") || "Profile context unavailable"}</p>
                <div class="saved-person-card__actions">
                  {prayerEligible(person) ? <a href={hrefFor(`/pray/${person.sourcePeopleId}`)}><Compass size={15} aria-hidden="true" /> Pray</a> : null}
                  <button type="button" onClick={() => removeSaved(person.sourcePeopleId)}><Trash2 size={15} aria-hidden="true" /> Remove</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div class="saved-empty"><Bookmark size={22} aria-hidden="true" /><div><strong>No peoples saved yet.</strong><p>Open a live people profile and save it for later exploration or prayer.</p><a href={hrefFor("/peoples")}>Browse peoples</a></div></div>
        )}
        <details class="saved-policy-note"><summary>How saved-profile data is stored</summary><p>Saved cards are local by default and retain a small source-backed snapshot for continuity. If you explicitly enable Private Sync, saved membership and that supported snapshot can be copied to your private account. The live PeopleGroups.org record remains authoritative when source data changes. Older pre-U12F values such as Frontier or mixed PEID rollups are labeled as legacy and are not generated by the corrected current runtime.</p></details>
      </section>

      <details class="saved-section saved-recent-section">
        <summary class="saved-recent-summary">
          <span><span class="eyebrow">Continue exploring</span><strong>Recent</strong></span>
          <span>{state.recent.length}</span>
        </summary>
        <div class="saved-recent-body">
          {state.recent.length ? <button type="button" class="saved-clear-button" onClick={clearRecent}>Clear recent</button> : null}
          {state.recent.length ? (
            <div class="recent-list">
              {state.recent.map((item) => {
                const Icon = recentIcon(item.kind);
                return <a href={item.href} key={`${item.kind}:${item.key}`}><Icon size={18} aria-hidden="true" /><span><strong>{item.label}</strong><small>{item.secondary ?? item.kind}</small></span><Clock3 size={15} aria-hidden="true" /></a>;
              })}
            </div>
          ) : <p class="saved-muted">Recently opened people, country and language profiles will appear here.</p>}
          <p class="saved-muted">Recent browsing never syncs and stays on this device.</p>
        </div>
      </details>
    </section>
  );
}
