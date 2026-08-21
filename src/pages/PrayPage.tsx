import { ArrowRight, CalendarDays, Compass, Database, Globe2 } from "lucide-preact";

import { hrefFor } from "../app/router";
import { dateKeyLocal, selectDailyPrayerProfile, usePrayerExperience, type PrayerCategory, type PrayerProfile } from "../prayer";

function categoryLabel(category: PrayerCategory): string {
  const labels: Record<PrayerCategory, string> = {
    gospel: "Gospel",
    believers: "Believers",
    church: "Church",
    scripture: "Scripture",
    workers: "Workers",
    community: "Community",
    authorities: "Authorities",
    "specific-need": "Specific need",
  };
  return labels[category];
}

function countryFilterFromHash(): string | null {
  const query = window.location.hash.split("?", 2)[1] ?? "";
  const country = new URLSearchParams(query).get("country")?.toUpperCase() ?? null;
  return country && /^[A-Z]{3}$/.test(country) ? country : null;
}

function PrayerCard({ profile, featured = false }: { profile: PrayerProfile; featured?: boolean }) {
  const categories = Array.from(new Set(profile.prompts.map((prompt) => prompt.category))).slice(0, 5);
  return (
    <article class={`prayer-card${featured ? " prayer-card--featured" : ""}`}>
      <div class="prayer-card__meta">
        <span>{featured ? "People to Pray for Today" : "Prayer-ready people"}</span>
        <span>{profile.countryIso3s.join(" · ")}</span>
      </div>
      <h2>{profile.peopleName}</h2>
      <p>{profile.whyPray.summary}</p>
      <div class="prayer-category-row" aria-label="Prayer categories">
        {categories.map((category) => <span key={category}>{categoryLabel(category)}</span>)}
      </div>
      <a class="prayer-card__cta" href={hrefFor(`/pray/${profile.sourcePeopleId}`)}>
        Pray for this people <ArrowRight size={17} aria-hidden="true" />
      </a>
    </article>
  );
}

export function PrayPage() {
  const prayer = usePrayerExperience();
  const countryIso3 = countryFilterFromHash();
  const profiles = (prayer.dataset?.profiles ?? []).filter((profile) => profile.review.status === "published").filter((profile) => !countryIso3 || profile.countryIso3s.includes(countryIso3));
  const daily = prayer.dataset ? selectDailyPrayerProfile(prayer.dataset.profiles, dateKeyLocal(), countryIso3) : null;

  return (
    <section class="prayer-page" aria-labelledby="prayer-page-title">
      <header class="prayer-hero">
        <div>
          <div class="eyebrow">Prayer</div>
          <h1 id="prayer-page-title" class="display-title">Understand enough to pray specifically.</h1>
          <p class="lead">Prayer guides turn verified context into concrete intercession without scores, streaks, leaderboards, or claims that prayer can be measured.</p>
        </div>
        <div class="prayer-hero__mark" aria-hidden="true"><Compass size={34} /></div>
      </header>

      {countryIso3 ? (
        <div class="prayer-scope-banner">
          <Globe2 size={18} aria-hidden="true" />
          <span>Showing prayer-ready peoples connected to <strong>{countryIso3}</strong>.</span>
          <a href={hrefFor("/pray")}>Clear country filter</a>
        </div>
      ) : null}

      {prayer.loading ? <div class="prayer-state" role="status">Loading reviewed prayer guides…</div> : null}

      {!prayer.loading && !prayer.dataset ? (
        <div class="prayer-release-notice" role="note">
          <Database size={21} aria-hidden="true" />
          <div>
            <strong>Reviewed prayer guides are not published in this build</strong>
            <p>{prayer.error ?? prayer.status?.reason ?? "The prayer experience is implemented, but real-world guides remain intentionally publication-gated."}</p>
          </div>
        </div>
      ) : null}

      {prayer.dataset ? (
        <>
          <section class="prayer-daily" aria-labelledby="daily-prayer-heading">
            <div class="prayer-section-heading">
              <div><span class="eyebrow">Daily focus</span><h2 id="daily-prayer-heading">People to Pray for Today</h2></div>
              <CalendarDays size={21} aria-hidden="true" />
            </div>
            {daily ? <PrayerCard profile={daily} featured /> : <p class="prayer-empty">No reviewed daily-prayer profile is available for this scope.</p>}
          </section>

          <section class="prayer-library" aria-labelledby="prayer-library-heading">
            <div class="prayer-section-heading"><div><span class="eyebrow">Prayer-ready profiles</span><h2 id="prayer-library-heading">Choose a people</h2></div><Compass size={21} aria-hidden="true" /></div>
            {profiles.length ? <div class="prayer-card-grid">{profiles.map((profile) => <PrayerCard key={profile.peopleGroupId} profile={profile} />)}</div> : <p class="prayer-empty">No reviewed prayer profiles match this scope.</p>}
          </section>
        </>
      ) : null}

      <footer class="prayer-principle">
        <strong>Prayer is not gamified.</strong>
        <p>Unreached can help structure attention and provide reliable subjects for prayer. It does not award points, spiritual rankings, completion scores, or public prayer status.</p>
      </footer>
    </section>
  );
}
