import { ArrowRight, Bookmark, BookmarkCheck, Compass, Eye, HeartHandshake } from "lucide-preact";

import { hrefFor } from "../app/router";
import { isPersonSaved, usePersonalization } from "../personalization";
import type { RuntimePeopleEntity } from "../providers/peoplegroups";

export function ProfileLocalActions({ record }: { record: RuntimePeopleEntity }) {
  const personalization = usePersonalization();
  const sourcePeopleId = record.routeKey;
  const saved = isPersonSaved(personalization.state, sourcePeopleId);
  const prayerEligible = record.reach.unreachedContexts > 0;
  const Icon = saved ? BookmarkCheck : Bookmark;
  const country = record.contexts[0]?.country ?? null;

  return (
    <section class="profile-local-actions profile-local-actions--journey" aria-label="Explore understand pray journey">
      <div class="profile-journey" aria-label="Current journey step">
        <a class="profile-journey__step" href={country ? `#/?country=${encodeURIComponent(country.iso3)}` : hrefFor("/")}>
          <Compass size={17} aria-hidden="true" />
          <span><small>1 · Explore</small><strong>{country ? country.name : "Mission atlas"}</strong></span>
        </a>
        <div class="profile-journey__step is-current" aria-current="step">
          <Eye size={17} aria-hidden="true" />
          <span><small>2 · Understand</small><strong>This source record</strong></span>
        </div>
        {prayerEligible ? (
          <a class="profile-journey__step" href={hrefFor(`/pray/${sourcePeopleId}`)}>
            <HeartHandshake size={17} aria-hidden="true" />
            <span><small>3 · Pray</small><strong>Focused prayer guide</strong></span>
          </a>
        ) : (
          <div class="profile-journey__step is-disabled" aria-disabled="true">
            <HeartHandshake size={17} aria-hidden="true" />
            <span><small>3 · Pray</small><strong>Not in GSEC 0–3 flow</strong></span>
          </div>
        )}
      </div>

      <div class="profile-next-step">
        <div>
          <span class="eyebrow">Next step</span>
          <strong>{prayerEligible ? "You have the source context. Continue into prayer." : "Keep this source record for reference."}</strong>
          <p>{prayerEligible
            ? "The prayer guide uses this source-backed identity and a fixed release-certified template; it does not add unreviewed community claims."
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
      </div>
    </section>
  );
}
