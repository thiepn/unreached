import { Bookmark, Clock3, Compass, Globe2, Languages, Trash2, UsersRound } from "lucide-preact";

import { hrefFor } from "../app/router";
import { usePersonalization, type RecentVisitKind } from "../personalization";

function recentIcon(kind: RecentVisitKind) {
  if (kind === "country") return Globe2;
  if (kind === "language") return Languages;
  return UsersRound;
}

function dateLabel(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

export function SavedPage() {
  const { state, removeSaved, clearRecent } = usePersonalization();

  return (
    <section class="saved-page">
      <header class="saved-hero">
        <div>
          <div class="eyebrow">Local prayer list</div>
          <h1 class="display-title">Saved for Prayer</h1>
          <p class="lead">Your saved peoples and recent exploration stay on this browser. Unreached does not require an account or upload this activity.</p>
        </div>
        <Bookmark size={30} aria-hidden="true" />
      </header>

      <section class="saved-section" aria-labelledby="saved-peoples-heading">
        <div class="saved-section__heading"><div><span class="eyebrow">Prayer list</span><h2 id="saved-peoples-heading">Saved peoples</h2></div><span>{state.savedPeoples.length}</span></div>
        {state.savedPeoples.length ? (
          <div class="saved-people-grid">
            {state.savedPeoples.map((person) => (
              <article class="saved-person-card" key={person.sourcePeopleId}>
                <div class="saved-person-card__top"><span>{person.frontier ? "Frontier" : person.classification}</span><small>Saved {dateLabel(person.savedAt)}</small></div>
                <h3><a href={hrefFor(`/peoples/${person.sourcePeopleId}`)}>{person.name}</a></h3>
                <p>{[person.largestCountryName, person.primaryLanguageName].filter(Boolean).join(" · ") || "Profile context unavailable"}</p>
                <div class="saved-person-card__actions">
                  <a href={hrefFor(`/pray/${person.sourcePeopleId}`)}><Compass size={15} aria-hidden="true" /> Pray</a>
                  <button type="button" onClick={() => removeSaved(person.sourcePeopleId)}><Trash2 size={15} aria-hidden="true" /> Remove</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div class="saved-empty"><Bookmark size={22} aria-hidden="true" /><div><strong>No peoples saved yet.</strong><p>Open a people profile and choose <em>Save for Prayer</em>.</p><a href={hrefFor("/peoples")}>Browse peoples</a></div></div>
        )}
        <p class="saved-snapshot-note">Saved cards retain a small local snapshot for continuity. The live people profile remains authoritative when published data changes.</p>
      </section>

      <section class="saved-section" aria-labelledby="recent-heading">
        <div class="saved-section__heading">
          <div><span class="eyebrow">Continue exploring</span><h2 id="recent-heading">Recent</h2></div>
          {state.recent.length ? <button type="button" class="saved-clear-button" onClick={clearRecent}>Clear recent</button> : null}
        </div>
        {state.recent.length ? (
          <div class="recent-list">
            {state.recent.map((item) => {
              const Icon = recentIcon(item.kind);
              return <a href={item.href} key={`${item.kind}:${item.key}`}><Icon size={18} aria-hidden="true" /><span><strong>{item.label}</strong><small>{item.secondary ?? item.kind}</small></span><Clock3 size={15} aria-hidden="true" /></a>;
            })}
          </div>
        ) : <p class="saved-muted">Recently opened people, country and language profiles will appear here.</p>}
      </section>
    </section>
  );
}
