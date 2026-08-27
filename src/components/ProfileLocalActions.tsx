import { ArrowRight, Bookmark, BookmarkCheck, Check, Compass, Eye, HeartHandshake } from "lucide-preact";

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
    <section class="profile-local-actions profile-local-actions--journey profile-local-actions--phase9" aria-labelledby="profile-next-step-heading">
      <div class="profile-action-heading">
        <div>
          <span class="eyebrow">2 · Act from context</span>
          <h2 id="profile-next-step-heading">{prayerEligible ? "Carry what you learned into prayer." : "Keep this source record for reference."}</h2>
        </div>
        <p>{prayerEligible
          ? "Prayer comes after the source context on this profile. The focused guide keeps the same people-group identity and does not add unreviewed community claims."
          : "This record is outside the GSEC 0–3 focused-prayer flow. You can still save it locally and continue exploring the source context."}</p>
      </div>

      <div class="profile-journey" aria-label="Explore understand pray journey">
        <a class="profile-journey__step is-complete" href={country ? `#/?country=${encodeURIComponent(country.iso3)}` : hrefFor("/")}>
          <Compass size={17} aria-hidden="true" />
          <span><small>1 · Explore</small><strong>{country ? country.name : "Mission atlas"}</strong></span>
          <Check class="profile-journey__check" size={15} aria-hidden="true" />
        </a>
        <div class="profile-journey__step is-current" aria-current="step">
          <Eye size={17} aria-hidden="true" />
          <span><small>2 · Understand</small><strong>Source context reviewed</strong></span>
          <Check class="profile-journey__check" size={15} aria-hidden="true" />
        </div>
        {prayerEligible ? (
          <a class="profile-journey__step is-next" href={hrefFor(`/pray/${sourcePeopleId}`)}>
            <HeartHandshake size={17} aria-hidden="true" />
            <span><small>3 · Pray</small><strong>Focused prayer guide</strong></span>
            <ArrowRight size={15} aria-hidden="true" />
          </a>
        ) : (
          <div class="profile-journey__step is-disabled" aria-disabled="true">
            <HeartHandshake size={17} aria-hidden="true" />
            <span><small>3 · Pray</small><strong>Not in GSEC 0–3 flow</strong></span>
          </div>
        )}
      </div>

      <div class="profile-next-step profile-next-step--phase9">
        <div>
          <strong>{prayerEligible ? "Ready for the next step?" : "Want to return to this profile?"}</strong>
          <p>{prayerEligible
            ? "Open the prayer guide when you are ready; saving is optional and stays local unless you have explicitly enabled Private Sync."
            : "Saving keeps this people-group reference available in your personal list."}</p>
        </div>
        <div class="profile-local-actions__buttons">
          {prayerEligible ? <a class="profile-pray-button" href={hrefFor(`/pray/${sourcePeopleId}`)}>Pray with this context <ArrowRight size={17} aria-hidden="true" /></a> : null}
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
