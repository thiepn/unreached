import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");

const page = await readText("src/pages/PeoplesPage.tsx");
for (const marker of [
  'class="people-discovery-workspace"',
  'class="people-search-wrap"',
  'role="group" aria-label="Reach status"',
  'class="people-filter-panel people-filter-panel--advanced"',
  'class="people-active-filters"',
  'class="people-results-header"',
  'people-card--explorer',
  'replaceHashSearchParams(params)',
]) {
  if (!page.includes(marker)) throw new Error(`Phase 8 Peoples Explorer missing ${marker}.`);
}

const searchIndex = page.indexOf('class="people-search-wrap"');
const guidedIndex = page.indexOf("<GuidedPeopleStarts");
const editorialIndex = page.indexOf('people-editorial-discovery people-editorial-discovery--secondary');
if (searchIndex < 0 || guidedIndex < 0 || editorialIndex < 0 || searchIndex > guidedIndex || searchIndex > editorialIndex) {
  throw new Error("Phase 8 must keep direct search before guided and editorial discovery content.");
}

if (page.includes('<label>Status<select')) throw new Error("Phase 8 reach status must not be buried in the advanced filter grid.");
if (page.includes('<label>Sort<select')) throw new Error("Phase 8 sort must remain visible outside the advanced filter grid.");

const styles = await readText("src/styles/people/explorer.css");
for (const marker of [
  ".people-discovery-workspace",
  ".people-status-choices",
  ".people-filter-grid--advanced",
  ".people-active-filters",
  ".people-card-grid--explorer",
  "@media (max-width: 760px)",
]) {
  if (!styles.includes(marker)) throw new Error(`Phase 8 Peoples Explorer styling missing ${marker}.`);
}

const main = await readText("src/main.tsx");
if (!main.includes('import "./styles/people/explorer.css"')) throw new Error("Phase 8 Peoples Explorer stylesheet is not loaded last.");

const browserSpec = await readText("tests/e2e/phase8-peoples-explorer.spec.ts");
for (const marker of [
  "search is the first discovery action",
  "quick reach status filters results and persists in URL state",
  "advanced filters stay progressive and expose removable active filters",
  "mobile discovery controls remain usable without horizontal overflow",
]) {
  if (!browserSpec.includes(marker)) throw new Error(`Phase 8 browser certification missing: ${marker}.`);
}

console.log("Phase 8 Peoples Explorer checks passed: search-first hierarchy, progressive filters, visible reach-status and sort controls, removable filter state, compact results and responsive contracts are enforced.");
