import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");

const page = await readText("src/pages/PeoplePage.tsx");
for (const marker of [
  "people-profile--comprehension",
  "<MeaningSummary record={record} />",
  "<UnreachedExplanation record={record} />",
  "Four facts to understand first.",
  "Pray for this people",
  "Detailed data, sources & methodology",
  '<SourceRecord record={record} />',
  '<ProviderContext record={record} />',
  '<ProfileLocalActions record={record} />',
]) {
  if (!page.includes(marker)) throw new Error(`U11 comprehension profile missing ${marker}.`);
}

const heroStart = page.indexOf('<header class="people-profile-hero');
const heroEnd = page.indexOf("</header>", heroStart);
if (heroStart < 0 || heroEnd < 0) throw new Error("U11 people-profile hero could not be located.");
const hero = page.slice(heroStart, heroEnd);
for (const technicalMarker of ["PEID", "PGID", "GSEC"]) {
  if (hero.includes(technicalMarker)) throw new Error(`U11 hero exposes technical identifier ${technicalMarker}.`);
}

const explanationIndex = page.lastIndexOf("<UnreachedExplanation record={record} />");
const factsIndex = page.lastIndexOf("<EssentialMetrics record={record} />");
const sourceIndex = page.lastIndexOf('<SourceRecord record={record} />');
const providerIndex = page.lastIndexOf('<ProviderContext record={record} />');
const actionIndex = page.lastIndexOf('<ProfileLocalActions record={record} />');
const referenceIndex = page.lastIndexOf('data-profile-stage="reference"');
if (!(explanationIndex < factsIndex && factsIndex < sourceIndex && sourceIndex < providerIndex && providerIndex < actionIndex && actionIndex < referenceIndex)) {
  throw new Error("U11 profile must keep meaning -> essential facts -> context -> prayer -> research order.");
}

const definitions = await readText("src/comprehension/definitions.ts");
for (const term of ["people-group", "unreached", "gsec", "population-estimate", "evangelical-level", "bible-resource-status"]) {
  if (!definitions.includes(`\"${term}\"`)) throw new Error(`U11 terminology registry missing ${term}.`);
}
if (!definitions.includes("does not reinterpret raw provider labels")) {
  throw new Error("U11 Bible resource source-truth guardrail is missing.");
}

const explanations = await readText("src/comprehension/explain.ts");
for (const guardrail of [
  "rather than converting it into a new percentage or category",
  "not as a normalized translation-completeness claim",
  "does not infer a mission status",
]) {
  if (!explanations.includes(guardrail)) throw new Error(`U11 source-safe explanation missing: ${guardrail}`);
}

const termHelp = await readText("src/components/TermHelp.tsx");
if (!termHelp.includes('<details class="term-help">') || !termHelp.includes("<summary>")) {
  throw new Error("U11 term help must use native keyboard-accessible disclosure semantics.");
}

const explore = await readText("src/pages/ExplorePage.tsx");
for (const marker of [
  "explore-screen--comprehension",
  "Explore unreached peoples.",
  "Unreached population share",
  "Unreached people-group share",
  "Mission-status data coverage",
  "Population-data coverage",
  "Source people-group records",
  "Change map view",
  'optgroup label="Mission views"',
  'optgroup label="Data & research views"',
  "selected-mission-meaning",
  "Not national census data.",
  "Pray for this country’s peoples →",
]) {
  if (!explore.includes(marker)) throw new Error(`U11-C Explore comprehension missing ${marker}.`);
}

const pickerIndex = explore.indexOf('<details class="mission-view-picker">');
const selectorIndex = explore.indexOf("<LayerSelector activeLayer={activeLayer} onChange={onChange}");
if (pickerIndex < 0 || selectorIndex < pickerIndex) {
  throw new Error("U11-C research/alternate map views must remain behind the Change map view disclosure.");
}

const liveTypes = await readText("src/visualization/liveTypes.ts");
const urlState = await readText("src/map/urlState.ts");
for (const layerId of ["unreached-population", "unreached-contexts", "gsec-coverage", "population-coverage", "people-contexts"]) {
  if (!liveTypes.includes(`\"${layerId}\"`)) throw new Error(`U11-C removed certified map layer ID ${layerId}.`);
}
if (!urlState.includes('if (raw === "unreached") return "unreached-population";')) {
  throw new Error("U11-C removed the legacy unreached map URL alias.");
}
if (!urlState.includes('state.layer !== "unreached-population"')) {
  throw new Error("U11-C changed the default map URL-state contract.");
}

const countryPage = await readText("src/pages/CountryPage.tsx");
for (const marker of [
  "country-page--comprehension",
  "country-metric-grid--comprehension",
  "Largest unreached peoples represented",
  "country-largest-people-list",
  "country-research-disclosure",
  "Detailed country data & people records",
  "not national census population",
  "PEID and PGID as a one-to-one record identity",
]) {
  if (!countryPage.includes(marker)) throw new Error(`U11-D country comprehension missing ${marker}.`);
}

const countryMetricsStart = countryPage.indexOf("function CountryMetrics");
const countryMetricsEnd = countryPage.indexOf("function CountryResearchMetrics", countryMetricsStart);
if (countryMetricsStart < 0 || countryMetricsEnd < 0) throw new Error("U11-D primary country metrics could not be located.");
const primaryCountryMetrics = countryPage.slice(countryMetricsStart, countryMetricsEnd);
const primaryMetricCount = (primaryCountryMetrics.match(/class=\"country-metric\"/g) ?? []).length;
if (primaryMetricCount !== 3) throw new Error(`U11-D country first view must contain exactly three metrics; received ${primaryMetricCount}.`);

const countryLargestIndex = countryPage.indexOf("country-largest-unreached");
const countryResearchIndex = countryPage.indexOf('class="country-research-disclosure"');
const countryTableIndex = countryPage.indexOf('id="unreached-people-heading"');
if (!(countryLargestIndex >= 0 && countryResearchIndex > countryLargestIndex && countryTableIndex > countryResearchIndex)) {
  throw new Error("U11-D must show largest unreached peoples before the detailed country record table, with the table inside research disclosure.");
}

const peoplesPage = await readText("src/pages/PeoplesPage.tsx");
for (const marker of [
  "peoples-page--comprehension",
  "people-primary-context-filters",
  "Search people, country or language",
  "Other mission status",
  "Bible resources",
  "Learn about this people",
  "Bible label, population and reviewed context",
]) {
  if (!peoplesPage.includes(marker)) throw new Error(`U11-D people explorer comprehension missing ${marker}.`);
}

const primaryFiltersIndex = peoplesPage.indexOf('class="people-primary-context-filters"');
const advancedFiltersIndex = peoplesPage.indexOf('class="people-filter-panel people-filter-panel--advanced"');
if (!(primaryFiltersIndex >= 0 && advancedFiltersIndex > primaryFiltersIndex)) {
  throw new Error("U11-D country/language/religion filters must appear before advanced source filters.");
}
const advancedFiltersEnd = peoplesPage.indexOf("</details>", advancedFiltersIndex);
const advancedFilters = peoplesPage.slice(advancedFiltersIndex, advancedFiltersEnd);
for (const primaryLabel of [">Country<select", ">Language<select", ">Religion<select"]) {
  if (advancedFilters.includes(primaryLabel)) throw new Error(`U11-D primary context filter remains buried in advanced filters: ${primaryLabel}`);
}

const cardStart = peoplesPage.indexOf('class="people-card people-card--concise people-card--explorer people-card--comprehension"');
const cardEnd = peoplesPage.indexOf("</a>", cardStart);
if (cardStart < 0 || cardEnd < 0) throw new Error("U11-D people comprehension card could not be located.");
const cardMarkup = peoplesPage.slice(cardStart, cardEnd);
for (const technicalMarker of ["PEID", "PGID", "GSEC"]) {
  if (cardMarkup.includes(technicalMarker)) throw new Error(`U11-D people card exposes technical identifier ${technicalMarker}.`);
}

const main = await readText("src/main.tsx");
if (!main.includes('import "./styles/comprehension.css"')) throw new Error("U11 comprehension stylesheet is not loaded.");
if (main.indexOf('import "./styles/comprehension.css"') > main.indexOf('import "./styles/foundation/accessibility.css"')) {
  throw new Error("U11 styles must remain below the final accessibility cascade layer.");
}

const styles = await readText("src/styles/comprehension.css");
for (const marker of [
  ".mission-view-current",
  ".mission-view-picker",
  ".selected-mission-meaning",
  ".country-prayer-link",
  ".country-largest-people-list",
  ".country-research-disclosure",
  ".country-research-metrics",
  ".people-primary-context-filters",
  ".people-card--comprehension",
]) {
  if (!styles.includes(marker)) throw new Error(`U11 comprehension styling missing ${marker}.`);
}

const browserSpec = await readText("tests/e2e/u11-comprehension-first.spec.ts");
for (const marker of [
  "newcomer sees meaning before technical identifiers",
  "primary overview is limited to four understandable facts",
  "mission terminology can be explained in place",
  "prayer is a first-class action without hiding research depth",
  "comprehension-first profile remains usable at narrow mobile width",
  "map starts with a plain-language mission view and keeps research views opt in",
  "selected country explains the map result before source breakdown",
  "research map layer IDs remain URL compatible",
  "country starts with three metrics and people before research tables",
  "people explorer cards hide source identifiers and expose normal context filters",
]) {
  if (!browserSpec.includes(marker)) throw new Error(`U11 browser certification missing: ${marker}.`);
}

console.log("U11 comprehension-first checks passed: people and country meaning precede technical data, map research views and country record tables are opt in, cards hide source identifiers, certified source semantics and URL IDs remain available on demand, and prayer stays first-class.");
