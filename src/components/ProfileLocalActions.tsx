import { Bookmark, BookmarkCheck } from "lucide-preact";

import { isPersonSaved, usePersonalization } from "../personalization";
import { usePeopleExplorer } from "../peoples";

export function ProfileLocalActions({ sourcePeopleId }: { sourcePeopleId: number }) {
  const people = usePeopleExplorer();
  const personalization = usePersonalization();
  const record = people.peopleBySourceId.get(sourcePeopleId) ?? null;
  if (!record) return null;

  const saved = isPersonSaved(personalization.state, sourcePeopleId);
  const Icon = saved ? BookmarkCheck : Bookmark;

  return (
    <section class="profile-local-actions" aria-label="Local prayer list">
      <div>
        <span class="eyebrow">This browser</span>
        <strong>{saved ? "Saved for prayer" : "Keep this people in view"}</strong>
        <p>{saved ? "This people is stored only in this browser." : "Save this people locally so you can return to pray later. No account is required."}</p>
      </div>
      <button
        type="button"
        class={`profile-save-button${saved ? " is-saved" : ""}`}
        aria-pressed={saved}
        onClick={() => personalization.toggleSavedPerson({
          sourcePeopleId: record.sourcePeopleId,
          peopleGroupId: record.peopleGroupId,
          name: record.name,
          largestCountryName: record.largestCountry?.name ?? null,
          primaryLanguageName: record.primaryLanguage?.name ?? null,
          classification: record.mission.classification,
          frontier: record.mission.frontier,
        })}
      >
        <Icon size={17} aria-hidden="true" />
        {saved ? "Remove from saved" : "Save for Prayer"}
      </button>
    </section>
  );
}
