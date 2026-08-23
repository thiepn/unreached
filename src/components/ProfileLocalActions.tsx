import { ArrowRight, Bookmark, BookmarkCheck } from "lucide-preact";

import { hrefFor } from "../app/router";
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
    <section class="profile-local-actions" aria-label="Profile actions">
      <div>
        <span class="eyebrow">Next step</span>
        <strong>{prayerEligible ? "Understand, then pray." : "Keep this profile for reference."}</strong>
        <p>{prayerEligible
          ? "Open the focused prayer guide now, or save this people locally for another time."
          : "This current source record is not eligible for the GSEC 0–3 focused prayer flow, but you can save the profile locally."}</p>
      </div>
      <div class="profile-local-actions__buttons">
        {prayerEligible ? <a class="profile-pray-button" href={hrefFor(`/pray/${sourcePeopleId}`)}>Pray now <ArrowRight size={17} aria-hidden="true" /></a> : null}
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
          {saved ? "Remove from saved" : prayerEligible ? "Save for later" : "Save profile"}
        </button>
      </div>
    </section>
  );
}
