import { Bookmark, BookmarkCheck } from "lucide-preact";

import { useLivePeopleExplorer } from "../peoples";
import { isPersonSaved, usePersonalization } from "../personalization";

export function ProfileLocalActions({ sourcePeopleId }: { sourcePeopleId: number }) {
  const people = useLivePeopleExplorer();
  const personalization = usePersonalization();
  const record = people.peopleByRouteKey.get(sourcePeopleId) ?? null;
  if (!record) return null;

  const saved = isPersonSaved(personalization.state, sourcePeopleId);
  const prayerEligible = record.reach.unreachedContexts > 0;
  const Icon = saved ? BookmarkCheck : Bookmark;

  return (
    <section class="profile-local-actions" aria-label="Local saved list">
      <div>
        <span class="eyebrow">This browser</span>
        <strong>{saved ? "Saved locally" : prayerEligible ? "Keep this people in prayer" : "Keep this profile in view"}</strong>
        <p>{saved
          ? "This PEID snapshot is stored only in this browser; the live profile remains authoritative."
          : prayerEligible
            ? "Save this people locally so you can return to the profile or focused prayer later."
            : "Save this profile locally for later reference. Focused prayer guides are reserved for PEIDs with at least one current GSEC 0–3 context."}</p>
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
        {saved ? "Remove from saved" : prayerEligible ? "Save for Prayer" : "Save profile"}
      </button>
    </section>
  );
}
