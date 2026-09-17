import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");

const page = await readText("src/pages/PeoplesPage.tsx");
for (const marker of [
  'data-v3-people-discovery="true"',
  'class="v3-people-find"',
  'id="people-search"',
  "Unreached source records",
  'class="v3-discovery-refine"',
  "Refine results",
  'class="v3-collections"',
  'class="v3-people-result-grid"',
  'replaceHashSearchParams(params)',
]) {
  if (!page.includes(marker)) throw new Error(`Phase 8 compatibility / V3 Phase 9 Peoples discovery missing ${marker}.`);
}

const searchIndex = page.indexOf('class="v3-people-find"');
const guidedIndex = page.indexOf('class="v3-collections"');
const resultsIndex = page.indexOf('class="v3-people-results"');
if (searchIndex < 0 || guidedIndex < 0 || resultsIndex < 0 || searchIndex > guidedIndex || searchIndex > resultsIndex) {
  throw new Error("Peoples discovery must keep direct search before guided collections and catalog results.");
}

if (page.includes("Bible label<select") || page.includes("Known population<select")) {
  throw new Error("V3 Phase 9 must not restore Bible-label or population-threshold controls to the ordinary Peoples filter surface.");
}
if (!page.includes('status === "unreached-only"')) throw new Error("The source-scoped unreached quick filter must remain available.");
if (!page.includes('sort, "population-desc"')) throw new Error("People result ordering must remain shareable in URL state.");

const styles = await readText("src/styles/atlas-foundation/discovery.css");
for (const marker of [
  ".v3-people-find",
  ".v3-discovery-refine",
  ".v3-collections",
  ".v3-people-result-grid",
  ".v3-people-result",
  "@media (max-width: 720px)",
]) {
  if (!styles.includes(marker)) throw new Error(`V3 Phase 9 Peoples discovery styling missing ${marker}.`);
}

const main = await readText("src/main.tsx");
const discoveryIndex = main.indexOf('import "./styles/atlas-foundation/discovery.css"');
const accessibilityIndex = main.indexOf('import "./styles/foundation/accessibility.css"');
if (discoveryIndex < 0 || accessibilityIndex < 0 || discoveryIndex > accessibilityIndex) {
  throw new Error("V3 Phase 9 discovery styles must load before the final accessibility layer.");
}

const browserSpec = await readText("tests/e2e/phase8-peoples-explorer.spec.ts");
for (const marker of [
  "search is the first discovery action",
  "quick reach status filters results and persists in URL state",
  "refinements stay progressive and persist in URL state",
  "mobile discovery controls remain usable without horizontal overflow",
]) {
  if (!browserSpec.includes(marker)) throw new Error(`Peoples compatibility browser certification missing: ${marker}.`);
}

console.log("Phase 8 Peoples compatibility checks passed under V3 Phase 9: search-first discovery, source-status filtering, progressive refinements, guided collections, shareable URL state and responsive contracts are enforced.");
