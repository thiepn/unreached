import { BookOpen, Database, Globe2, Info, Scale, ShieldCheck } from "lucide-preact";

const definitions = [
  ["Unreached", "For the active PeopleGroups.org runtime, Unreached uses the IMB GSEC framework: people-group-in-country records at GSEC 0–3 are treated as unreached. The label describes mission access/status at the source-record level; it is not a claim that no Christian exists or that every individual has never heard of Christianity."],
  ["GSEC", "Global Status of Evangelical Christianity is the IMB / PeopleGroups.org source framework carried by live people-group-in-country records. Unreached preserves the source value and does not translate it into Joshua Project JPScale or Frontier fields."],
  ["PGID", "The PeopleGroups.org primary identifier for a people-group-in-country source record."],
  ["PEID", "The PeopleGroups.org People Group Entity ID field. A complete live-corpus audit on 23 August 2026 found the current API to contain 12,370 PGIDs and 12,370 PEIDs in a one-to-one relationship, with no PEID spanning multiple PGIDs or countries. Unreached keeps PEID in existing route URLs for compatibility but does not use it as a cross-country grouping key."],
  ["ROP3 people name", "The PeopleGroups.org PplNm source field used to relate same-named people records across countries. It is a source-taxonomy relationship, not proof that all records are identical in every ethnographic sense, and it is kept distinct from PEID/PGID record identity."],
  ["ISO 639-3 language", "Live language pages group PeopleGroups.org PGID records only when the source reports a syntactically valid three-letter ROL code. Language names and families remain source values; Unreached does not fill proprietary linguistic taxonomy from Ethnologue."],
  ["Reviewed editorial context", "A separately authored, claim-cited contextual profile attached only after explicit PeopleGroups PEID, PGID, name, country and language identity review. Published context can include sourced facts, evidence synthesis and labeled interpretation, each with review/freshness rules."],
  ["Resource availability", "PeopleGroups.org Bible and Jesus Film fields are source availability descriptors. Unreached displays their wording without converting them into a stronger claim about portions, New Testament, complete-Bible status, practical access, distribution, comprehension, or use."],
  ["Unknown", "Missing or unavailable information. Unknown values stay unknown; they are never silently converted to zero. Country and language aggregates disclose the source-record coverage used in their calculations."],
] as const;

export function AboutPage() {
  return (
    <article class="about-page">
      <header class="about-hero">
        <div>
          <div class="eyebrow">Methodology & transparency</div>
          <h1 class="display-title">Know what the map means—and what it cannot prove.</h1>
          <p class="lead">Unreached combines geography with live mission research, reviewed contextual articles and fixed prayer guidance. Provider identities and classifications are retained, derived values are narrow and labeled, and missing information remains missing.</p>
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
          <li><strong>Coverage beside aggregates.</strong><span>Country, language and map aggregates disclose which people-group-in-country source records contribute population or classification values; they are not national or language-census statistics.</span></li>
          <li><strong>Identity at the correct level.</strong><span>The current API's PEID and PGID fields identify one people-group-in-country record each in the certified corpus. Same-people relationships across countries use explicit source taxonomy such as PplNm/ROP3 people name, never invented PEID aggregation.</span></li>
          <li><strong>Editorial identity must be proven.</strong><span>Reviewed contextual articles store target PEID plus provider PGID, country, language and name evidence. A legacy numeric ID is never treated as a PEID merely because the number happens to match.</span></li>
          <li><strong>Claims stay distinguishable.</strong><span>Editorial facts, multi-source synthesis and interpretation carry different evidence rules. Current claims require review dates; restricted material and stereotype shortcuts are blocked from publication.</span></li>
          <li><strong>Resource labels remain resource labels.</strong><span>Bible, Jesus Film and total-resource fields are aggregated as source values and field coverage. “Available” is not silently upgraded into a translation milestone.</span></li>
          <li><strong>External data fails closed.</strong><span>Runtime responses are schema-validated, bounded, checked for pagination/count/identity consistency, and never silently reinterpreted after provider schema drift. Duplicate PEIDs now fail certification because the current runtime contract is explicitly one PEID per PGID record.</span></li>
          <li><strong>Prayer without fabricated claims.</strong><span>Live prayer uses one source people-group-in-country record to select a subject and interpolate limited facts into a fixed release-certified biblical template. Same-named records in other countries are not silently merged into the prayer profile.</span></li>
        </ol>
      </section>

      <section class="about-section" aria-labelledby="sources-heading">
        <div class="about-section__heading"><Scale size={20} aria-hidden="true" /><div><span class="eyebrow">Sources & permissions</span><h2 id="sources-heading">Current release status</h2></div></div>
        <div class="about-source-grid">
          <div><strong>PeopleGroups.org / IMB Global Research</strong><span class="about-source-status about-source-status--approved">Runtime active</span><p>Live mission-map, people, country, language/resource and prayer-subject data is read directly through the public read-only API. Unreached does not publish a bundled static mirror of the provider database and linked third-party people photos remain excluded.</p><a href="https://peoplegroups.org/using-the-api/" target="_blank" rel="noreferrer">PeopleGroups.org API documentation</a></div>
          <div><strong>Reviewed editorial context</strong><span class="about-source-status about-source-status--approved">Active with partial coverage</span><p>Contextual articles are published only after source, freshness, sensitivity and source-record identity checks. The first production article is anchored to Fon of Benin, PEID 12319 / PG012319. Records without reviewed coverage keep their live source profile and receive no generated filler.</p></div>
          <div><strong>Natural Earth</strong><span class="about-source-status about-source-status--approved">Approved</span><p>Public-domain geographic base. Current map boundaries follow Natural Earth's de facto Admin-0 presentation.</p><a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noreferrer">Natural Earth terms</a></div>
          <div><strong>Joshua Project API</strong><span class="about-source-status about-source-status--gated">Release gated</span><p>Development ingestion remains supported, but Joshua Project records are not used as the active public people runtime and substantial static browser redistribution remains disabled.</p><a href="https://api.joshuaproject.net/terms_of_use" target="_blank" rel="noreferrer">Joshua Project terms</a></div>
          <div><strong>ProgressBible registered data</strong><span class="about-source-status about-source-status--gated">Permission required</span><p>Not bundled or used by the live language pages. Translation-progress milestones remain excluded without written permission covering this public product.</p><a href="https://progress.bible/terms-of-use/" target="_blank" rel="noreferrer">ProgressBible terms</a></div>
          <div><strong>Ethnologue</strong><span class="about-source-status about-source-status--gated">Licensed / permission required</span><p>Proprietary linguistic content is not bundled or scraped. Live family labels come only from the PeopleGroups.org field and are not supplemented from Ethnologue without a compatible license.</p><a href="https://shop.ethnologue.com/policies/terms-of-service" target="_blank" rel="noreferrer">Ethnologue terms</a></div>
          <div><strong>Wikimedia Commons</strong><span class="about-source-status">Per item</span><p>Media may be used only after the individual file's creator, license, attribution, modification and non-copyright restrictions are checked.</p><a href="https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia" target="_blank" rel="noreferrer">Commons reuse guidance</a></div>
        </div>
      </section>

      <section class="about-section about-release-state" aria-labelledby="release-heading">
        <div class="about-section__heading"><ShieldCheck size={20} aria-hidden="true" /><div><span class="eyebrow">Production truth</span><h2 id="release-heading">Runtime data and editorial publication are separate contracts</h2></div></div>
        <p>PeopleGroups.org is active through direct browser runtime reads. The source policy treats this separately from bundling or mirroring the provider database. The application cache is origin-local, temporary and used for resilience; it is not a public dataset endpoint.</p>
        <p>On <strong>23 August 2026</strong>, Unreached certified the complete current PeopleGroups API corpus: 12,370 PGIDs, 12,370 PEIDs, zero PEIDs attached to multiple PGIDs, zero PEIDs spanning multiple countries, and every PGID numeric suffix matching its PEID. Existing PEID routes remain stable for compatibility, but cross-country identity is no longer inferred from PEID.</p>
        <p>The live mission atlas uses only source-native or narrowly derived PeopleGroups.org measures: GSEC 0–3 population/context shares, GSEC coverage, population-estimate coverage and PGID context counts. Frontier, JPScale, fabricated evangelical percentages and normalized Scripture-completeness layers are not inferred from PeopleGroups fields.</p>
        <p>Live language pages aggregate PeopleGroups.org PGID country-context records by source ISO 639-3 language. Repeated same-named people in different countries remain separate records; they are not counted as one cross-country PEID entity.</p>
        <p>Reviewed editorial context is active as a separately authored publication layer. Each article is attached to a specific current source record only after explicit PEID, PGID, country, language and name evidence is certified. Coverage is intentionally partial: a missing article remains missing rather than being replaced with generic AI-generated cultural or spiritual claims.</p>
        <p>ProgressBible translation-progress data and Ethnologue proprietary taxonomy remain separately permission-gated. The source-policy review was refreshed on <strong>22 August 2026</strong>; the current PeopleGroups identity contract was live-certified on <strong>23 August 2026</strong>, and editorial publication evidence carries its own review dates.</p>
      </section>

      <section class="about-section" aria-labelledby="boundaries-heading">
        <div class="about-section__heading"><Globe2 size={20} aria-hidden="true" /><div><span class="eyebrow">Map boundaries</span><h2 id="boundaries-heading">Geography is navigation, not endorsement</h2></div></div>
        <p>Country polygons and names are a cartographic navigation layer. Their presence does not constitute a theological or political judgment about sovereignty. Disputed-boundary presentation follows the documented Natural Earth base unless a future release explicitly records a modification.</p>
      </section>
    </article>
  );
}
