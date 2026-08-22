import { Bookmark, BookmarkCheck } from "lucide-preact";

import { useLivePeopleExplorer } from "../peoples";
import { isPersonSaved, usePersonalization } from "../personalization";

export function ProfileLocalActions({ sourcePeopleId }: { sourcePeopleId: number }) {
  const people = useLivePeopleExplorer();
  const personalization = usePersonalization();
  const record = people.peopleByRouteKey.get(sourcePeopleId) ?? null;
  if (!record) return null;

  const saved = isPersonSaved(personalization.state, sourcePeopleId);
  const Icon = saved ? BookmarkCheck : Bookmark;

  return (
    <section class="profile-local-actions" aria-label="Local prayer list">
      <div>
        <span class="eyebrow">This browser</span>
        <strong>{saved ? "Saved for prayer" : "Keep this people in view"}</strong>
        <p>{saved ? "This PEID snapshot is stored only in this browser." : "Save this people locally so you can return to pray later. The live profile remains authoritative."}</p>
      </div>
      <button
        type="button"
        class={`profile-save-button${saved ? " is-saved" : ""}`}
        aria-pressed={saved}
        onClick={() => personalization.toggleSavedPerson({
          sourcePeopleId: record.routeKey,
          peopleGroupId: record.id,
          name: record.displayName,
          largestCountryName: record.contexts[0]?.country.name ?? null,
          primaryLanguageName: record.primaryLanguage?.name ?? null,
          classification: record.reach.classification,
          frontier: null,
        })}
      >
        <Icon size={17} aria-hidden="true" />
        {saved ? "Remove from saved" : "Save for Prayer"}
      </button>
    </section>
  );
}
