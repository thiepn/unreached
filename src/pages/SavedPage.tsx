import { useEffect, useState } from "preact/hooks";
import {
  ArrowRight,
  BookOpenText,
  Bookmark,
  Clock3,
  Compass,
  Globe2,
  Languages,
  List,
  LockKeyhole,
  NotebookPen,
  RotateCcw,
  Trash2,
  UsersRound,
} from "lucide-preact";

import { hrefFor } from "../app/router";
import {
  MAX_PERSONAL_NOTE_LENGTH,
  orderPrayerRotation,
  prayerRotationReturnLabel,
  usePersonalization,
  type RecentVisitKind,
  type SavedPersonSnapshot,
} from "../personalization";

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

interface PrivateNoteEditorProps {
  sourcePeopleId: number;
  personName: string;
  note: string;
  updatedAt: string | null;
  onSave(sourcePeopleId: number, text: string): void;
}

function PrivateNoteEditor({ sourcePeopleId, personName, note, updatedAt, onSave }: PrivateNoteEditorProps) {
  const [draft, setDraft] = useState(note);
  useEffect(() => setDraft(note), [note, sourcePeopleId]);
  const changed = draft !== note;
  const inputId = `private-note-${sourcePeopleId}`;

  return (
    <div class="v3-memory-note" data-private-note-peid={sourcePeopleId}>
      <div class="v3-memory-note__heading">
        <label for={inputId}><NotebookPen size={16} aria-hidden="true" /> Private note</label>
        <small>{updatedAt ? `Updated ${dateLabel(updatedAt)}` : "Only on this device"}</small>
      </div>
      <textarea
        id={inputId}
        aria-label={`Private note for ${personName}`}
        maxlength={MAX_PERSONAL_NOTE_LENGTH}
        placeholder="Write a personal reminder, question, or prayer thought."
        value={draft}
        onInput={(event) => setDraft(event.currentTarget.value)}
      />
      <div class="v3-memory-note__footer">
        <span>{draft.length}/{MAX_PERSONAL_NOTE_LENGTH} · Personal, not part of the people profile.</span>
        <button
          type="button"
          disabled={!changed}
          onClick={() => onSave(sourcePeopleId, draft)}
        >
          {draft.trim() ? "Save note" : note ? "Delete note" : "Save note"}
        </button>
      </div>
    </div>
  );
}

export function SavedPage() {
  const {
    state,
    removeSaved,
    removePrayer,
    savePersonalNote,
    clearPrayerHistory,
    clearRecent,
  } = usePersonalization();
  const prayerRotation = orderPrayerRotation(state.prayerList);
  const nextPrayer = prayerRotation[0] ?? null;
  const sessionHref = hrefFor("/pray/session");
  const noteFor = (sourcePeopleId: number) => state.personalNotes.find((note) => note.sourcePeopleId === sourcePeopleId) ?? null;

  return (
    <main class="v3-memory-page saved-page" data-v3-memory-page="true" aria-labelledby="saved-title">
      <header class="v3-memory-hero saved-hero">
        <div class="v3-memory-hero__copy">
          <span class="v3-memory-eyebrow">Remember</span>
          <h1 id="saved-title">Saved</h1>
          <p>Keep people you want to return to, a separate prayer list, private notes, and a small local history—without turning attention or prayer into a score.</p>
          <div class="v3-memory-privacy"><LockKeyhole size={16} aria-hidden="true" /><span><strong>Private by default.</strong> Your notes, prayer memory, and recent browsing stay on this device.</span></div>
        </div>
        <nav class="v3-memory-hero__actions" aria-label="Saved page shortcuts">
          <a href={hrefFor("/explore")}><Compass size={17} aria-hidden="true" /> Explore</a>
          <a href={hrefFor("/pray")}><BookOpenText size={17} aria-hidden="true" /> Pray</a>
          <a href={hrefFor("/account")}><LockKeyhole size={17} aria-hidden="true" /> Private Sync</a>
        </nav>
      </header>

      <div class="v3-memory-boundary" role="note">
        <strong>What can sync?</strong>
        <span>Saved membership, prayer-list membership, and the latest recorded prayer timestamp can optionally use Private Sync. Private notes, prayer memory, and recent browsing never enter that sync protocol.</span>
      </div>

      <section class="v3-memory-section saved-section" data-memory-section="saved" aria-labelledby="saved-peoples-heading">
        <div class="v3-memory-section__heading saved-section__heading">
          <div><span class="v3-memory-eyebrow">Return later</span><h2 id="saved-peoples-heading">Saved peoples</h2><p>A bookmark means “I want to remember this people.” It does not automatically add them to your prayer list.</p></div>
          <span class="v3-memory-count" aria-label={`${state.savedPeoples.length} saved peoples`}>{state.savedPeoples.length}</span>
        </div>
        {state.savedPeoples.length ? (
          <div class="v3-memory-grid saved-people-grid">
            {state.savedPeoples.map((person) => {
              const note = noteFor(person.sourcePeopleId);
              return (
                <article class="v3-memory-card saved-person-card" key={person.sourcePeopleId} data-saved-peid={person.sourcePeopleId}>
                  <div class="v3-memory-card__meta saved-person-card__top"><span>{savedStatus(person)}</span><small>Saved {dateLabel(person.savedAt)}</small></div>
                  <h3><a href={hrefFor(`/peoples/${person.sourcePeopleId}`)}>{person.name}</a></h3>
                  <p>{[person.largestCountryName, person.primaryLanguageName].filter(Boolean).join(" · ") || "Profile context unavailable"}</p>
                  <div class="v3-memory-card__actions saved-person-card__actions">
                    <a href={hrefFor(`/peoples/${person.sourcePeopleId}`)}><UsersRound size={15} aria-hidden="true" /> Open profile</a>
                    {prayerEligible(person) ? <a href={hrefFor(`/pray/${person.sourcePeopleId}`)}><Compass size={15} aria-hidden="true" /> Pray</a> : null}
                    <button type="button" onClick={() => removeSaved(person.sourcePeopleId)}><Trash2 size={15} aria-hidden="true" /> Remove</button>
                  </div>
                  <PrivateNoteEditor
                    sourcePeopleId={person.sourcePeopleId}
                    personName={person.name}
                    note={note?.text ?? ""}
                    updatedAt={note?.updatedAt ?? null}
                    onSave={savePersonalNote}
                  />
                </article>
              );
            })}
          </div>
        ) : (
          <div class="v3-memory-empty saved-empty"><Bookmark size={22} aria-hidden="true" /><div><strong>No peoples saved yet.</strong><p>Save a people profile when you want a deliberate return point.</p><a href={hrefFor("/peoples")}>Browse peoples</a></div></div>
        )}
        <details class="saved-policy-note v3-memory-policy"><summary>How saved-profile data is stored</summary><p>Saved cards are local by default and retain a small source-backed snapshot for continuity. If you explicitly enable Private Sync, saved membership and that supported snapshot can be copied to your private account. Notes remain local-only. Removing the final saved or prayer-list connection to a person also removes that person’s private note so hidden note data is not left behind.</p></details>
      </section>

      <section class="v3-memory-section saved-section saved-prayer-section" data-memory-section="prayer-list" aria-labelledby="prayer-list-heading">
        <div class="v3-memory-section__heading saved-section__heading">
          <div><span class="v3-memory-eyebrow">Chosen prayer return points</span><h2 id="prayer-list-heading">Prayer list</h2><p>This list expresses your own intent to return in prayer. Rotation order is practical, never a ranking of need or importance.</p></div>
          <span class="v3-memory-count" aria-label={`${state.prayerList.length} prayer-list people`}>{state.prayerList.length}</span>
        </div>
        {nextPrayer ? (
          <div class="v3-memory-return saved-prayer-rotation" aria-labelledby="prayer-rotation-heading">
            <div><span class="v3-memory-eyebrow">Next return point</span><h3 id="prayer-rotation-heading">{nextPrayer.name}</h3><p>{prayerRotationReturnLabel(nextPrayer)}. The rotation shows people with no prayer date first, then those least recently recorded.</p></div>
            <a data-prayer-rotation-next={nextPrayer.sourcePeopleId} href={hrefFor(`/pray/${nextPrayer.sourcePeopleId}`)}><RotateCcw size={18} aria-hidden="true" /> Pray now <ArrowRight size={18} aria-hidden="true" /></a>
          </div>
        ) : null}

        {prayerRotation.length ? (
          <div class="v3-memory-session-launcher saved-prayer-session-launcher" aria-labelledby="guided-session-heading">
            <div><span class="v3-memory-eyebrow">Guided session</span><h3 id="guided-session-heading">Pray through several return points.</h3><p>Freeze a temporary session from the current rotation. Session position is navigation, not progress.</p></div>
            <div class="saved-prayer-session-launcher__actions" role="group" aria-label="Choose prayer session size">
              <a data-prayer-session-size="3" href={`${sessionHref}?size=3`}>3 people</a>
              <a data-prayer-session-size="5" href={`${sessionHref}?size=5`}>5 people</a>
              <a data-prayer-session-size="all" href={`${sessionHref}?size=all`}>Full eligible list</a>
            </div>
          </div>
        ) : null}

        {prayerRotation.length ? (
          <div class="v3-memory-grid saved-prayer-grid">
            {prayerRotation.map((person, index) => {
              const note = noteFor(person.sourcePeopleId);
              return (
                <article class={`v3-memory-card saved-prayer-card${index === 0 ? " saved-prayer-card--next" : ""}`} key={person.sourcePeopleId} data-prayer-list-peid={person.sourcePeopleId}>
                  <div class="v3-memory-card__meta saved-prayer-card__top"><span>{index === 0 ? <RotateCcw size={14} aria-hidden="true" /> : <List size={14} aria-hidden="true" />}{index === 0 ? "Next return point" : "Private prayer list"}</span><small>{person.lastPrayedAt ? `Latest recorded prayer ${dateTimeLabel(person.lastPrayedAt)}` : "No prayer date recorded"}</small></div>
                  <h3><a href={hrefFor(`/pray/${person.sourcePeopleId}`)}>{person.name}</a></h3>
                  <p>{[person.countryName, person.languageName].filter(Boolean).join(" · ") || "Live profile context available when opened"}</p>
                  <div class="v3-memory-card__actions saved-prayer-card__actions">
                    <a href={hrefFor(`/pray/${person.sourcePeopleId}`)}><Compass size={15} aria-hidden="true" /> Pray now</a>
                    <a href={hrefFor(`/peoples/${person.sourcePeopleId}`)}><UsersRound size={15} aria-hidden="true" /> Profile</a>
                    <button type="button" onClick={() => removePrayer(person.sourcePeopleId)}><Trash2 size={15} aria-hidden="true" /> Remove</button>
                  </div>
                  <PrivateNoteEditor
                    sourcePeopleId={person.sourcePeopleId}
                    personName={person.name}
                    note={note?.text ?? ""}
                    updatedAt={note?.updatedAt ?? null}
                    onSave={savePersonalNote}
                  />
                </article>
              );
            })}
          </div>
        ) : (
          <div class="v3-memory-empty saved-empty"><List size={22} aria-hidden="true" /><div><strong>Your private prayer list is empty.</strong><p>Add a people from Prayer or a focused prayer guide. The list is local by default and never public.</p><a href={hrefFor("/pray")}>Choose someone to pray for</a></div></div>
        )}
        <details class="saved-policy-note v3-memory-policy"><summary>How prayer-list data is stored</summary><p>The prayer list is local by default. Private Sync can copy prayer-list membership and the latest prayer timestamp to your private account. Prayer memory itself remains on this device. Rotation and sessions create no streaks, scores, deadlines, urgency values, completion percentages, public activity, or session-performance history.</p></details>
      </section>

      <section class="v3-memory-section" data-memory-section="prayer-memory" aria-labelledby="prayer-memory-heading">
        <div class="v3-memory-section__heading">
          <div><span class="v3-memory-eyebrow">Local history</span><h2 id="prayer-memory-heading">Prayer memory</h2><p>A small chronological return aid from explicit “Record prayer today” actions. It is not a prayer total or measure of faithfulness.</p></div>
          {state.prayerMemory.length ? <button type="button" class="v3-memory-clear" onClick={clearPrayerHistory}><Trash2 size={15} aria-hidden="true" /> Clear prayer memory</button> : null}
        </div>
        {state.prayerMemory.length ? (
          <ol class="v3-memory-timeline">
            {state.prayerMemory.map((entry, index) => (
              <li key={`${entry.sourcePeopleId}:${entry.prayedAt}:${index}`}>
                <span class="v3-memory-timeline__dot" aria-hidden="true" />
                <div><a href={hrefFor(`/pray/${entry.sourcePeopleId}`)}>{entry.name}</a><span>{[entry.countryName, entry.languageName].filter(Boolean).join(" · ") || "People group"}</span></div>
                <time datetime={entry.prayedAt}>{dateTimeLabel(entry.prayedAt)}</time>
              </li>
            ))}
          </ol>
        ) : <div class="v3-memory-empty"><BookOpenText size={22} aria-hidden="true" /><div><strong>No prayer memory recorded yet.</strong><p>If you explicitly record a prayer moment in Prayer, a bounded local return aid will appear here.</p><a href={hrefFor("/pray")}>Open Prayer</a></div></div>}
        <p class="v3-memory-local-note"><LockKeyhole size={14} aria-hidden="true" /> Kept only on this device. At most the 30 latest recorded prayer moments are retained.</p>
      </section>

      <details class="v3-memory-section saved-section saved-recent-section" data-memory-section="recent">
        <summary class="v3-memory-recent-summary saved-recent-summary">
          <span><span class="v3-memory-eyebrow">Continue exploring</span><strong>Recently viewed</strong><small>Local-only navigation history</small></span>
          <span class="v3-memory-count">{state.recent.length}</span>
        </summary>
        <div class="saved-recent-body v3-memory-recent-body">
          {state.recent.length ? <button type="button" class="v3-memory-clear saved-clear-button" onClick={clearRecent}>Clear recent</button> : null}
          {state.recent.length ? (
            <div class="recent-list v3-memory-recent-list">
              {state.recent.map((item) => {
                const Icon = recentIcon(item.kind);
                return <a href={item.href} key={`${item.kind}:${item.key}`}><Icon size={18} aria-hidden="true" /><span><strong>{item.label}</strong><small>{item.secondary ?? item.kind}</small></span><Clock3 size={15} aria-hidden="true" /></a>;
              })}
            </div>
          ) : <p class="saved-muted">Recently opened people, country and language profiles will appear here.</p>}
          <p class="v3-memory-local-note"><LockKeyhole size={14} aria-hidden="true" /> Recent browsing never syncs and stays on this device.</p>
        </div>
      </details>
    </main>
  );
}
