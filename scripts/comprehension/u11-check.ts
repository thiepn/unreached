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

const main = await readText("src/main.tsx");
if (!main.includes('import "./styles/comprehension.css"')) throw new Error("U11 comprehension stylesheet is not loaded.");
if (main.indexOf('import "./styles/comprehension.css"') > main.indexOf('import "./styles/foundation/accessibility.css"')) {
  throw new Error("U11 styles must remain below the final accessibility cascade layer.");
}

const browserSpec = await readText("tests/e2e/u11-comprehension-first.spec.ts");
for (const marker of [
  "newcomer sees meaning before technical identifiers",
  "primary overview is limited to four understandable facts",
  "mission terminology can be explained in place",
  "prayer is a first-class action without hiding research depth",
  "comprehension-first profile remains usable at narrow mobile width",
]) {
  if (!browserSpec.includes(marker)) throw new Error(`U11 browser certification missing: ${marker}.`);
}

console.log("U11 comprehension-first checks passed: meaning precedes technical data, four essential facts are primary, source truth is preserved, prayer remains first-class, and research depth is retained on demand.");
