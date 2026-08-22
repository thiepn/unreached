import { BookOpen, Database, Globe2, Info, Scale, ShieldCheck } from "lucide-preact";

const definitions = [
  ["Unreached", "A missiological classification for a people group without an indigenous believing community with adequate numbers and resources to evangelize the group without outside assistance. Unreached does not mean that no Christian exists or that every individual has never heard of Christianity."],
  ["Frontier", "A source-defined subset of unreached peoples with virtually no followers of Jesus and no confirmed sustained movement. Unreached uses the source classification rather than inferring movement status from percentages alone."],
  ["Christian Adherent", "A broad affiliation or identification measure in mission datasets. It is not equivalent to personal conversion, evangelical theology, church participation or active discipleship."],
  ["Evangelical", "When Joshua Project data is used, this follows Joshua Project / Operation World's theological definition. It is not a political identity or voting category."],
  ["Scripture availability", "A reported translation/resource status for a language. It does not by itself establish literacy, distribution, comprehension, practical access or actual use in every community speaking that language."],
  ["Unknown", "Missing or unavailable information. Unknown values stay unknown; they are never silently converted to zero."],
] as const;

export function AboutPage() {
  return (
    <article class="about-page">
      <header class="about-hero">
        <div>
          <div class="eyebrow">Methodology & transparency</div>
          <h1 class="display-title">Know what the map means—and what it cannot prove.</h1>
          <p class="lead">Unreached combines geography, mission research, original contextual synthesis and prayer guidance. Source classifications are retained, derived values are labeled, changing claims expire for review, and uncertain information remains uncertain.</p>
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
          <li><strong>Source before assertion.</strong><span>Imported facts retain source identifiers, retrieval dates and transformation notes.</span></li>
          <li><strong>Classification before recomputation.</strong><span>Unreached and frontier labels prefer the provider's published classification rather than independently reclassifying boundary cases.</span></li>
          <li><strong>Coverage beside metrics.</strong><span>Aggregated percentages can expose how much represented population actually has a known value.</span></li>
          <li><strong>Evidence before explanation.</strong><span>“Why unreached?” separates sourced facts, multi-source synthesis and explicit interpretation.</span></li>
          <li><strong>Freshness for changing claims.</strong><span>Current legal, conflict, displacement and resource claims carry review dates and fail publication checks when stale.</span></li>
          <li><strong>Prayer without scoring.</strong><span>Prayer guides structure attention without XP, streaks, public completion histories or spiritual-performance metrics.</span></li>
        </ol>
      </section>

      <section class="about-section" aria-labelledby="sources-heading">
        <div class="about-section__heading"><Scale size={20} aria-hidden="true" /><div><span class="eyebrow">Sources & permissions</span><h2 id="sources-heading">Current release status</h2></div></div>
        <div class="about-source-grid">
          <div><strong>Natural Earth</strong><span class="about-source-status about-source-status--approved">Approved</span><p>Public-domain geographic base. Current V1 map boundaries follow Natural Earth's de facto Admin-0 presentation.</p><a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noreferrer">Natural Earth terms</a></div>
          <div><strong>Joshua Project API</strong><span class="about-source-status about-source-status--gated">Release gated</span><p>Development ingestion is supported, but substantial static browser redistribution remains disabled pending written confirmation for the intended public presentation.</p><a href="https://api.joshuaproject.net/terms_of_use" target="_blank" rel="noreferrer">Joshua Project terms</a></div>
          <div><strong>ProgressBible registered data</strong><span class="about-source-status about-source-status--gated">Permission required</span><p>Not bundled. Current terms require written permission before supplied registered data is incorporated into a product or service.</p><a href="https://progress.bible/terms-of-use/" target="_blank" rel="noreferrer">ProgressBible terms</a></div>
          <div><strong>Ethnologue</strong><span class="about-source-status about-source-status--gated">Licensed / permission required</span><p>Proprietary linguistic content is not bundled or scraped. Language-family taxonomy stays unpublished unless a compatible approved source is added.</p><a href="https://shop.ethnologue.com/policies/terms-of-service" target="_blank" rel="noreferrer">Ethnologue terms</a></div>
          <div><strong>Wikimedia Commons</strong><span class="about-source-status">Per item</span><p>Media may be used only after the individual file's creator, license, attribution, modification and non-copyright restrictions are checked.</p><a href="https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia" target="_blank" rel="noreferrer">Commons reuse guidance</a></div>
        </div>
      </section>

      <section class="about-section about-release-state" aria-labelledby="release-heading">
        <div class="about-section__heading"><ShieldCheck size={20} aria-hidden="true" /><div><span class="eyebrow">Production truth</span><h2 id="release-heading">Why some statistics may be unavailable</h2></div></div>
        <p>The application is designed to fail closed on data permissions. If a source is not approved for browser redistribution, the production build shows geography and an explicit unavailable state instead of shipping synthetic data, silently scraping another service or publishing an unapproved cache.</p>
        <p>The current source-policy review was refreshed on <strong>22 August 2026</strong>. Source terms can change, so release checks treat permission status as an operational dependency rather than a one-time footnote.</p>
      </section>

      <section class="about-section" aria-labelledby="boundaries-heading">
        <div class="about-section__heading"><Globe2 size={20} aria-hidden="true" /><div><span class="eyebrow">Map boundaries</span><h2 id="boundaries-heading">Geography is navigation, not endorsement</h2></div></div>
        <p>Country polygons and names are a cartographic navigation layer. Their presence does not constitute a theological or political judgment about sovereignty. Disputed-boundary presentation follows the documented Natural Earth base unless a future release explicitly records a modification.</p>
      </section>
    </article>
  );
}
