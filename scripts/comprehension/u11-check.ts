import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");

const page = await readText("src/pages/PeoplePage.tsx");
for (const marker of [
  "people-profile--comprehension",
  "v3-people-profile",
  "<MeaningSummary record={record} />",
  "<UnreachedExplanation record={record} />",
  "<EssentialMetrics record={record} />",
  "Four facts to understand first.",
  "Pray for this people",
  "Detailed data, sources & methodology",
  "<SourceContext record={record} />",
  "<ProviderContext record={record} />",
  "<DefinitiveEditorialProfile profile={profile} />",
  "<ProfileLocalActions record={record} contextTier={profileTier} />",
]) {
  if (!page.includes(marker)) throw new Error(`U11/V3 comprehension profile missing ${marker}.`);
}

const heroStart = page.indexOf('<header class="people-profile-hero');
const heroEnd = page.indexOf("</header>", heroStart);
if (heroStart < 0 || heroEnd < 0) throw new Error("U11 people-profile hero could not be located.");
const hero = page.slice(heroStart, heroEnd);
for (const technicalMarker of ["PEID", "PGID", "GSEC"]) {
  if (hero.includes(technicalMarker)) throw new Error(`U11 hero exposes technical identifier ${technicalMarker}.`);
}

const factsIndex = page.lastIndexOf("<EssentialMetrics record={record} />");
const explanationIndex = page.lastIndexOf("<UnreachedExplanation record={record} />");
const sourceIndex = page.lastIndexOf("<SourceContext record={record} />");
const providerIndex = page.lastIndexOf("<ProviderContext record={record} />");
const editorialIndex = page.lastIndexOf("<DefinitiveEditorialProfile profile={profile} />");
const actionIndex = page.lastIndexOf("<ProfileLocalActions record={record} contextTier={profileTier} />");
const referenceIndex = page.lastIndexOf('data-profile-stage="reference"');
if (!(factsIndex < explanationIndex && explanationIndex < sourceIndex && sourceIndex < providerIndex && providerIndex < editorialIndex && editorialIndex < actionIndex && actionIndex < referenceIndex)) {
  throw new Error("U11/V3 profile must keep basic facts -> mission/source context -> explicit editorial depth -> action -> research order.");
}

const definitions = await readText("src/comprehension/definitions.ts");
for (const term of ["people-group", "unreached", "gsec", "population-estimate", "evangelical-level", "bible-resource-status"]) {
  if (!definitions.includes(`\"${term}\"`)) throw new Error(`U11 terminology registry missing ${term}.`);
}
if (!definitions.includes("less than 2% evangelical Christian")) throw new Error("U11 unreached definition must state the current PeopleGroups/IMB threshold.");
if (!definitions.includes("does not reinterpret raw provider labels")) throw new Error("U11 Bible resource source-truth guardrail is missing.");

const explanations = await readText("src/comprehension/explain.ts");
for (const guardrail of ["rather than converting it into a new percentage or category", "not as a normalized translation-completeness claim", "does not infer a mission status"]) {
  if (!explanations.includes(guardrail)) throw new Error(`U11 source-safe explanation missing: ${guardrail}`);
}

const termHelp = await readText("src/components/TermHelp.tsx");
if (!termHelp.includes('<details class="term-help">') || !termHelp.includes("<summary>")) throw new Error("U11 term help must use native keyboard-accessible disclosure semantics.");

const editorial = await readText("src/components/DefinitiveEditorialProfile.tsx");
for (const marker of ["Reviewed editorial context is not yet published for this record.", 'data-editorial-tier="source"', "Evidence & sources", "Pray from what is actually known.", "Research gaps"]) {
  if (!editorial.includes(marker)) throw new Error(`U11/V3 editorial-depth contract missing ${marker}.`);
}

const explore = await readText("src/pages/ExplorePage.tsx");
for (const marker of [
  "explore-screen--comprehension",
  "Explore unreached peoples.",
  "explore-newcomer-actions",
  "What does “unreached” mean?",
  "Pray today →",
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
  "Explore country →",
  "Pray for its peoples →",
]) {
  if (!explore.includes(marker)) throw new Error(`U11-C Explore comprehension missing ${marker}.`);
}
const pickerIndex = explore.indexOf('class="mission-view-picker');
const selectorIndex = explore.indexOf("<LayerSelector activeLayer={activeLayer} onChange={onChange}");
if (pickerIndex < 0 || selectorIndex < pickerIndex) throw new Error("U11-C research/alternate map views must remain behind Change map view.");

const liveTypes = await readText("src/visualization/liveTypes.ts");
const urlState = await readText("src/map/urlState.ts");
for (const layerId of ["unreached-population", "unreached-contexts", "gsec-coverage", "population-coverage", "people-contexts"]) {
  if (!liveTypes.includes(`\"${layerId}\"`)) throw new Error(`U11-C removed certified map layer ID ${layerId}.`);
}
if (!urlState.includes('if (raw === "unreached") return "unreached-population";')) throw new Error("U11-C removed the legacy unreached map URL alias.");
if (!urlState.includes('state.layer !== "unreached-population"')) throw new Error("U11-C changed the default map URL-state contract.");

const countryPage = await readText("src/pages/CountryPage.tsx");
for (const marker of ["country-page--comprehension", "country-metric-grid--comprehension", "Largest unreached peoples represented", "country-largest-people-list", "country-research-disclosure", "Detailed country data & people records", "not national census population", "PEID and PGID as a one-to-one record identity"]) {
  if (!countryPage.includes(marker)) throw new Error(`U11-D country comprehension missing ${marker}.`);
}
const countryMetricsStart = countryPage.indexOf("function CountryMetrics");
const countryMetricsEnd = countryPage.indexOf("function CountryResearchMetrics", countryMetricsStart);
if (countryMetricsStart < 0 || countryMetricsEnd < 0) throw new Error("U11-D primary country metrics could not be located.");
const primaryMetricCount = (countryPage.slice(countryMetricsStart, countryMetricsEnd).match(/class=\"country-metric\"/g) ?? []).length;
if (primaryMetricCount !== 3) throw new Error(`U11-D country first view must contain exactly three metrics; received ${primaryMetricCount}.`);
const countryLargestIndex = countryPage.indexOf("country-largest-unreached");
const countryResearchIndex = countryPage.indexOf('class="country-research-disclosure"');
const countryTableIndex = countryPage.indexOf('id="unreached-people-heading"');
if (!(countryLargestIndex >= 0 && countryResearchIndex > countryLargestIndex && countryTableIndex > countryResearchIndex)) throw new Error("U11-D must show people before detailed country records.");

const peoplesPage = await readText("src/pages/PeoplesPage.tsx");
for (const marker of ["peoples-page--comprehension", "people-primary-context-filters", "Search people, country or language", "Other mission status", "Bible resources", "Learn about this people", "Bible label, population and reviewed context"]) {
  if (!peoplesPage.includes(marker)) throw new Error(`U11-D people explorer comprehension missing ${marker}.`);
}
const primaryFiltersIndex = peoplesPage.indexOf('class="people-primary-context-filters"');
const advancedFiltersIndex = peoplesPage.indexOf('class="people-filter-panel people-filter-panel--advanced"');
if (!(primaryFiltersIndex >= 0 && advancedFiltersIndex > primaryFiltersIndex)) throw new Error("U11-D primary context filters must precede advanced source filters.");
const advancedFiltersEnd = peoplesPage.indexOf("</details>", advancedFiltersIndex);
const advancedFilters = peoplesPage.slice(advancedFiltersIndex, advancedFiltersEnd);
for (const primaryLabel of [">Country<select", ">Language<select", ">Religion<select"]) if (advancedFilters.includes(primaryLabel)) throw new Error(`U11-D primary context filter remains buried: ${primaryLabel}`);
const cardStart = peoplesPage.indexOf('class="people-card people-card--concise people-card--explorer people-card--comprehension"');
const cardEnd = peoplesPage.indexOf("</a>", cardStart);
if (cardStart < 0 || cardEnd < 0) throw new Error("U11-D people comprehension card could not be located.");
const cardMarkup = peoplesPage.slice(cardStart, cardEnd);
for (const technicalMarker of ["PEID", "PGID", "GSEC"]) if (cardMarkup.includes(technicalMarker)) throw new Error(`U11-D people card exposes ${technicalMarker}.`);

const main = await readText("src/main.tsx");
for (const marker of ['import "./styles/comprehension.css"', 'import "./styles/explore/newcomer-entry.css"', 'import "./styles/atlas-foundation/people-profile.css"']) {
  if (!main.includes(marker)) throw new Error(`U11 required stylesheet missing ${marker}.`);
}
if (main.indexOf('import "./styles/atlas-foundation/people-profile.css"') > main.indexOf('import "./styles/foundation/accessibility.css"')) throw new Error("V3 people profile styles must remain below the final accessibility layer.");

const browserSpec = await readText("tests/e2e/u11-comprehension-first.spec.ts");
for (const marker of ["newcomer sees meaning before technical identifiers", "primary overview is limited to four understandable facts", "mission terminology can be explained in place", "prayer is a first-class action without hiding research depth", "comprehension-first profile remains usable at narrow mobile width", "map starts with a plain-language mission view and keeps research views opt in", "selected country explains the map result before source breakdown", "research map layer IDs remain URL compatible", "country starts with three metrics and people before research tables", "people explorer cards hide source identifiers and expose normal context filters"]) {
  if (!browserSpec.includes(marker)) throw new Error(`U11 browser certification missing: ${marker}.`);
}

const firstMinuteSpec = await readText("tests/e2e/u11-first-minute-acceptance.spec.ts");
for (const marker of ["newcomer can understand unreached and start today's prayer from Explore", "less than 2% evangelical Christian", "Pray today →", "People to Pray for Today"]) {
  if (!firstMinuteSpec.includes(marker)) throw new Error(`U11 first-minute browser certification missing: ${marker}.`);
}

console.log("U11 comprehension-first checks passed under V3: meaning remains primary, editorial depth is explicit rather than fabricated, research stays opt-in, source semantics remain recoverable, and prayer stays first-class.");
