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
]) {
  if (!styles.includes(marker)) throw new Error(`U11-C comprehension styling missing ${marker}.`);
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
]) {
  if (!browserSpec.includes(marker)) throw new Error(`U11 browser certification missing: ${marker}.`);
}

console.log("U11 comprehension-first checks passed: people meaning precedes technical data, map research views are opt in, certified source semantics and URL layer IDs are preserved, prayer remains first-class, and research depth stays available on demand.");
