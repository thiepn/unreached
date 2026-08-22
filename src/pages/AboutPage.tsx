import { BookOpen, Database, Globe2, Info, Scale, ShieldCheck } from "lucide-preact";

const definitions = [
  ["Unreached", "For the active PeopleGroups.org runtime, Unreached uses the IMB GSEC framework: country-context records at GSEC 0–3 are treated as unreached. The label describes mission access/status at the source-record level; it is not a claim that no Christian exists or that every individual has never heard of Christianity."],
  ["GSEC", "Global Status of Evangelical Christianity is the IMB / PeopleGroups.org source framework carried by live people-group-in-country records. Unreached preserves the source value and does not translate it into Joshua Project JPScale or Frontier fields."],
  ["PEID", "The PeopleGroups.org cross-country people entity identifier. Live people profile routes use PEID so country-specific records for the same people can be viewed together."],
  ["PGID", "A PeopleGroups.org people-group record in a particular country/context. PGIDs remain separate below the PEID rather than being collapsed into one false global record."],
  ["Resource availability", "PeopleGroups.org Bible and Jesus Film fields are source availability descriptors. Unreached displays their wording without converting them into a stronger claim about translation completeness, practical access, distribution, comprehension, or use."],
  ["Unknown", "Missing or unavailable information. Unknown values stay unknown; they are never silently converted to zero. Population sums explicitly show when one or more country contexts have no known estimate."],
] as const;

export function AboutPage() {
  return (
    <article class="about-page">
      <header class="about-hero">
        <div>
          <div class="eyebrow">Methodology & transparency</div>
          <h1 class="display-title">Know what the map means—and what it cannot prove.</h1>
          <p class="lead">Unreached combines geography with live mission research and fixed prayer guidance. Provider identities and classifications are retained, derived values are narrow and labeled, and missing information remains missing.</p>
        </div>
        <Info size={34} aria-hidden="true" />
      </header>

      <section class="about-section" aria-labelledby="definitions-heading">
        <div class="about-section__heading"><BookOpen size={20} aria-hidden="true" /><div><span class="eyebrow">Definitions</span><h2 id="definitions-heading">Core terms</h2></div></div>
        <div class="about-definition-grid">{definitions.map(([term, description]) => <div key={term}><h3>{term}</h3><p>{description}</p></div>)}</div>
      </section>

      <section class="about-section" aria-labelledby="method-heading">
        <div class="about-section__heading"><Database size={20} aria-hidden="true" /><div><span class="eyebrow">Method</span><h2 id="method-heading">How information is handled</h2></div></div>
        <ol class="about-method-list">
          <li><strong>Source before assertion.</strong><span>Provider identifiers, source update dates, raw resource labels and country contexts remain visible instead of being hidden behind a synthetic global record.</span></li>
          <li><strong>Provider methodology before compatibility.</strong><span>Live GSEC values stay IMB GSEC values. Unreached does not manufacture JPScale, Frontier, exact evangelical percentages or Scripture-completeness categories.</span></li>
          <li><strong>Coverage beside aggregates.</strong><span>Population totals show how many country contexts actually have a known estimate. Country shares describe represented source records, not national census populations.</span></li>
          <li><strong>Identity at the correct level.</strong><span>PEID groups related country contexts; PGID preserves each country-specific record and its own population, status and resources.</span></li>
          <li><strong>External data fails closed.</strong><span>Runtime responses are schema-validated, bounded, checked for pagination/count/identity consistency, and never silently reinterpreted after provider schema drift.</span></li>
          <li><strong>Prayer without fabricated claims.</strong><span>Live prayer uses source records only to select subjects and interpolate limited facts into a fixed release-certified biblical template. There are no scores, streaks or public completion histories.</span></li>
        </ol>
      </section>

      <section class="about-section" aria-labelledby="sources-heading">
        <div class="about-section__heading"><Scale size={20} aria-hidden="true" /><div><span class="eyebrow">Sources & permissions</span><h2 id="sources-heading">Current release status</h2></div></div>
        <div class="about-source-grid">
          <div><strong>PeopleGroups.org / IMB Global Research</strong><span class="about-source-status about-source-status--approved">Runtime active</span><p>Live people, country and prayer-subject data is read directly through the public read-only API. Unreached does not publish a bundled static mirror, and linked third-party people photos remain excluded.</p><a href="https://peoplegroups.org/using-the-api/" target="_blank" rel="noreferrer">PeopleGroups.org API documentation</a></div>
          <div><strong>Natural Earth</strong><span class="about-source-status about-source-status--approved">Approved</span><p>Public-domain geographic base. Current map boundaries follow Natural Earth's de facto Admin-0 presentation.</p><a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noreferrer">Natural Earth terms</a></div>
          <div><strong>Joshua Project API</strong><span class="about-source-status about-source-status--gated">Release gated</span><p>Development ingestion remains supported, but Joshua Project records are not used as the active public people runtime and substantial static browser redistribution remains disabled.</p><a href="https://api.joshuaproject.net/terms_of_use" target="_blank" rel="noreferrer">Joshua Project terms</a></div>
          <div><strong>ProgressBible registered data</strong><span class="about-source-status about-source-status--gated">Permission required</span><p>Not bundled. Registered supplied data remains excluded without written permission covering this public product.</p><a href="https://progress.bible/terms-of-use/" target="_blank" rel="noreferrer">ProgressBible terms</a></div>
          <div><strong>Ethnologue</strong><span class="about-source-status about-source-status--gated">Licensed / permission required</span><p>Proprietary linguistic content is not bundled or scraped. Language-family taxonomy is not filled from Ethnologue without a compatible license.</p><a href="https://shop.ethnologue.com/policies/terms-of-service" target="_blank" rel="noreferrer">Ethnologue terms</a></div>
          <div><strong>Wikimedia Commons</strong><span class="about-source-status">Per item</span><p>Media may be used only after the individual file's creator, license, attribution, modification and non-copyright restrictions are checked.</p><a href="https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia" target="_blank" rel="noreferrer">Commons reuse guidance</a></div>
        </div>
      </section>

      <section class="about-section about-release-state" aria-labelledby="release-heading">
        <div class="about-section__heading"><ShieldCheck size={20} aria-hidden="true" /><div><span class="eyebrow">Production truth</span><h2 id="release-heading">Runtime access is not static redistribution</h2></div></div>
        <p>PeopleGroups.org is active through direct browser runtime reads. The source policy treats this separately from bundling or mirroring the provider database. The application cache is origin-local, temporary and used for resilience; it is not a public dataset endpoint.</p>
        <p>Mission visualization layers, the separate editorial-context dataset and the legacy language/Scripture dataset remain independently gated until compatible production data sources and semantics are certified.</p>
        <p>The current source-policy review was refreshed on <strong>22 August 2026</strong>. Source terms and APIs can change, so release checks treat permission and live-contract status as operational dependencies.</p>
      </section>

      <section class="about-section" aria-labelledby="boundaries-heading">
        <div class="about-section__heading"><Globe2 size={20} aria-hidden="true" /><div><span class="eyebrow">Map boundaries</span><h2 id="boundaries-heading">Geography is navigation, not endorsement</h2></div></div>
        <p>Country polygons and names are a cartographic navigation layer. Their presence does not constitute a theological or political judgment about sovereignty. Disputed-boundary presentation follows the documented Natural Earth base unless a future release explicitly records a modification.</p>
      </section>
    </article>
  );
}
