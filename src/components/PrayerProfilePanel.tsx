import { ArrowRight, BookOpen, Compass } from "lucide-preact";

import { hrefFor } from "../app/router";
import { usePrayerExperience } from "../prayer";

export function PrayerProfilePanel({ sourcePeopleId }: { sourcePeopleId: number }) {
  const prayer = usePrayerExperience();
  const profile = prayer.profilesBySourceId.get(sourcePeopleId) ?? null;
  if (prayer.loading || !profile) return null;

  return (
    <section class="profile-prayer-panel" aria-labelledby="profile-prayer-heading">
      <div class="profile-prayer-panel__heading">
        <div><span class="eyebrow">Pray</span><h2 id="profile-prayer-heading">Why pray for {profile.peopleName}?</h2></div>
        <Compass size={22} aria-hidden="true" />
      </div>
      <p>{profile.whyPray.summary}</p>
      <div class="profile-prayer-preview">
        {profile.prompts.slice(0, 3).map((prompt) => <div key={prompt.id}><span>{prompt.category.replace("specific-need", "specific need")}</span><p>{prompt.text}</p></div>)}
      </div>
      <div class="profile-prayer-scripture">
        <BookOpen size={17} aria-hidden="true" />
        <span>{profile.whyPray.scriptureReferences.map((item) => item.reference).join(" · ")}</span>
      </div>
      <a class="profile-prayer-cta" href={hrefFor(`/pray/${profile.sourcePeopleId}`)}>Pray for this people <ArrowRight size={17} aria-hidden="true" /></a>
    </section>
  );
}
