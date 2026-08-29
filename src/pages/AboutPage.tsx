import { BookOpen, Database, Globe2, Info, Scale, ShieldCheck } from "lucide-preact";

const definitions = [
  ["Unreached", "For the active PeopleGroups.org runtime, people-group-in-country records at IMB GSEC 0–3 are treated as unreached. This is a source mission-status classification, not a claim about every individual person."],
  ["GSEC", "Global Status of Evangelical Christianity is the IMB / PeopleGroups.org source framework. Unreached preserves the source value and does not translate it into Joshua Project JPScale or Frontier fields."],
  ["PGID", "The PeopleGroups.org primary identifier for a people-group-in-country source record."],
  ["PEID", "The PeopleGroups.org People Group Entity ID field. The 23 August 2026 certification snapshot contained 12,370 PGIDs and 12,370 PEIDs in a one-to-one relationship. That is a dated release result, not a permanent guarantee about future provider data."],
  ["Reviewed editorial context", "Separately authored, cited contextual material attached only after explicit PeopleGroups.org source-record identity review. Missing reviewed context stays missing rather than being replaced with generated cultural or spiritual claims."],
  ["Unknown", "Missing or unavailable information. Unknown values stay unknown and are not silently converted to zero."],
] as const;

export function AboutPage() {
  return (
    <article class="about-page">
      <header class="about-hero">
        <div>
          <div class="eyebrow">Methodology & transparency</div>
          <h1 class="display-title">Know what the map means—and what it cannot prove.</h1>
          <p class="lead">Unreached combines public-domain geography, live mission research, a small reviewed editorial publication and private prayer tools. Source identities remain visible, derived values stay narrow, and missing information remains missing.</p>
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
          <li><strong>Source before assertion.</strong><span>Provider identifiers, raw resource labels, update dates and country contexts remain distinguishable from Unreached-authored interpretation.</span></li>
          <li><strong>Provider semantics stay provider semantics.</strong><span>GSEC remains IMB GSEC. Bible and Jesus Film fields remain availability labels rather than fabricated translation-completeness milestones.</span></li>
          <li><strong>Coverage beside aggregates.</strong><span>Map, country and language summaries are aggregates over source records, not national census or language-census statistics.</span></li>
          <li><strong>Editorial identity must be proven.</strong><span>Reviewed articles store explicit PEID, PGID, country, language and name evidence before publication.</span></li>
          <li><strong>External data fails closed.</strong><span>Runtime responses are schema-validated, bounded and rejected when source contracts drift incompatibly.</span></li>
          <li><strong>Prayer without performance tracking.</strong><span>Private prayer tools store only the limited continuity state needed for Saved/list membership, rotation and the latest explicit prayer timestamp.</span></li>
        </ol>
      </section>

      <section class="about-section" aria-labelledby="sources-heading">
        <div class="about-section__heading"><Scale size={20} aria-hidden="true" /><div><span class="eyebrow">Sources & permissions</span><h2 id="sources-heading">Current release status</h2></div></div>
        <div class="about-source-grid">
          <div><strong>PeopleGroups.org / IMB Global Research</strong><span class="about-source-status about-source-status--approved">Runtime active</span><p>The public read-only API is the active mission-data source. Unreached uses it at runtime for maps, people, countries, languages/resources and prayer-subject selection. The provider corpus is not published or relicensed as a static Unreached dataset.</p><a href="https://peoplegroups.org/using-the-api/" target="_blank" rel="noreferrer">PeopleGroups.org API documentation</a></div>
          <div><strong>Reviewed editorial context</strong><span class="about-source-status about-source-status--approved">Active · partial coverage</span><p>Twelve contextual profiles are separately authored and citation-reviewed. Coverage is intentionally partial and is not a mission-priority ranking.</p></div>
          <div><strong>Natural Earth</strong><span class="about-source-status about-source-status--approved">Public domain</span><p>Bundled geographic base. Current boundaries follow Natural Earth's de facto Admin-0 presentation.</p><a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noreferrer">Natural Earth terms</a></div>
          <div><strong>Joshua Project API</strong><span class="about-source-status about-source-status--gated">Not active</span><p>Not used by the production people runtime. A fresh terms/architecture review is required before any reintroduction.</p><a href="https://api.joshuaproject.net/terms_of_use" target="_blank" rel="noreferrer">Joshua Project terms</a></div>
          <div><strong>ProgressBible registered data</strong><span class="about-source-status about-source-status--gated">Permission required</span><p>Not bundled or used. Product/service inclusion requires written permission under the published registered-data terms.</p><a href="https://progress.bible/terms-of-use/" target="_blank" rel="noreferrer">ProgressBible terms</a></div>
          <div><strong>Ethnologue</strong><span class="about-source-status about-source-status--gated">License required</span><p>Proprietary linguistic content is not bundled, scraped or used to supplement the runtime source.</p><a href="https://shop.ethnologue.com/policies/terms-of-service" target="_blank" rel="noreferrer">Ethnologue terms</a></div>
        </div>
      </section>

      <section class="about-section about-release-state" aria-labelledby="release-heading">
        <div class="about-section__heading"><ShieldCheck size={20} aria-hidden="true" /><div><span class="eyebrow">Production truth</span><h2 id="release-heading">Release 2.1.3 preserves the certified data boundary and fixes narrow Explore methodology layout</h2></div></div>
        <p>PeopleGroups.org is approved in project policy for direct public runtime reads. That approval is separate from static redistribution: Unreached does not expose a downloadable corpus mirror or relicense provider data.</p>
        <p>Prepared PeopleGroups data hydrates immediately from the validated device-local IndexedDB snapshot. On a true cold load, only People Explorer may become interactive from validated partial provider pages, and it labels that catalog as incomplete until the full corpus is ready. Map, country, language and prayer aggregates continue to require the complete validated corpus.</p>
        <p>The Explore map’s opened “About this view” methodology explainer now occupies a full-width control row at narrow desktop/sidebar widths so its source-method text remains readable and does not collide with the country browser below.</p>
        <p>The service worker does not intercept or runtime-cache PeopleGroups.org requests. Partial provider data is never persisted as a complete prepared snapshot.</p>
        <p>Anonymous/local-only use is the default. Optional private continuity requires a separate merge-and-enable action after authentication and syncs only Saved/prayer membership, source-backed snapshots and the latest prayer timestamp. Recent browsing and prayer-performance/history data are excluded.</p>
        <p><a href="/unreached/privacy.html">Read the public privacy notice</a>. Source and licensing records were reviewed on <strong>28 August 2026</strong>.</p>
      </section>

      <section class="about-section" aria-labelledby="boundaries-heading">
        <div class="about-section__heading"><Globe2 size={20} aria-hidden="true" /><div><span class="eyebrow">Map boundaries</span><h2 id="boundaries-heading">Geography is navigation, not endorsement</h2></div></div>
        <p>Country polygons and names are a cartographic navigation layer. Their presence does not constitute a theological or political judgment about sovereignty. Disputed-boundary presentation follows the documented Natural Earth base unless a future release explicitly records a modification.</p>
      </section>
    </article>
  );
}
