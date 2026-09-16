import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFile(resolve(root, path), "utf8");

function requireText(source: string, marker: string, label: string): void {
  if (!source.includes(marker)) throw new Error(`V3 Phase 6: missing ${label}: ${marker}`);
}

for (const path of [
  "src/pages/ExplorePage.tsx",
  "src/styles/atlas-foundation/explore.css",
  "src/visualization/live.ts",
  "tests/e2e/v3-phase6-explore.spec.ts",
  "docs/V3_PHASE6_EXPLORE.md",
]) {
  if (!existsSync(resolve(root, path))) throw new Error(`V3 Phase 6 required file is missing: ${path}`);
}

const explore = await read("src/pages/ExplorePage.tsx");
for (const marker of [
  "explore-v3",
  "explore-v3__rail",
  "explore-v3__map",
  "Explore unreached peoples.",
  "Unreached population share",
  "Not national census data.",
  "Change map view",
  "About this view",
  "Source breakdown",
  "Largest unreached peoples represented",
  "Explore country →",
  "Pray for its peoples →",
  'key="country-index"',
  "Browse all →",
  "mobile-map-sheet--phase10 explore-v3__mobile-sheet",
  "setMobileSheetOpen(true)",
  "countryBriefsByIso3",
]) requireText(explore, marker, "Explore 3.0 marker");

if (explore.includes('from "../providers/peoplegroups')) {
  throw new Error("V3 Phase 6 Explore must not import PeopleGroups provider DTO/runtime modules directly.");
}

for (const research of ["gsec-coverage", "population-coverage", "people-contexts"]) {
  requireText(explore, research, `research layer ${research}`);
}

const live = await read("src/visualization/live.ts");
for (const marker of [
  "export interface LiveMissionCountryBrief",
  "export interface LiveMissionPeoplePreview",
  "buildLiveMissionCountryBrief",
  'context.reach.classification === "unreached"',
  ".slice(0, 5)",
  "countryBriefsByIso3",
]) requireText(live, marker, "country-brief visualization boundary");

const urlState = await read("src/map/urlState.ts");
requireText(urlState, 'return parsed.success ? parsed.data : "unreached-population"', "default map layer");
requireText(urlState, 'state.layer !== "unreached-population"', "default-layer URL omission contract");

const styles = await read("src/styles/atlas-foundation/explore.css");
for (const marker of [
  "grid-template-columns: minmax(318px, 352px) minmax(0, 1fr)",
  "height: calc(100dvh - var(--v3-header-height))",
  ".explore-v3__country-facts",
  ".explore-v3__top-people",
  ".explore-v3__mobile-sheet.mobile-map-sheet",
  "@media (max-width: 760px)",
]) requireText(styles, marker, "Explore atlas styling");

const main = await read("src/main.tsx");
requireText(main, 'import "./styles/atlas-foundation/explore.css";', "Explore foundation stylesheet import");
const exploreImport = main.indexOf('import "./styles/atlas-foundation/explore.css";');
const accessibilityImport = main.indexOf('import "./styles/foundation/accessibility.css";');
if (exploreImport < 0 || accessibilityImport < 0 || exploreImport > accessibilityImport) {
  throw new Error("V3 Phase 6 Explore stylesheet must load before the canonical accessibility layer.");
}

const doc = await read("docs/V3_PHASE6_EXPLORE.md");
for (const marker of [
  "Where should I look?",
  "map is now the primary workspace",
  "represented population",
  "Research detail is secondary",
  "Country finder and accessible map alternative",
  "Mobile is map-first",
  "Phase 7 — Regions & Countries",
]) requireText(doc, marker, "Phase 6 documentation marker");

const browser = await read("tests/e2e/v3-phase6-explore.spec.ts");
for (const marker of [
  "map owns most of the desktop workspace",
  "country selection explains the map and reveals people behind it",
  "research views remain opt in and URL compatible",
  "mobile selection opens the explanatory sheet",
  "Explore stays inside desktop and mobile viewports",
]) requireText(browser, marker, "Phase 6 browser acceptance");

const packageJson = await read("package.json");
requireText(packageJson, '"v3:phase6-check": "tsx scripts/v3/phase6-check.ts"', "Phase 6 package script");
requireText(packageJson, "npm run v3:phase5-check && npm run v3:phase6-check", "blocking Phase 6 build integration");

console.log("V3 Phase 6 Explore checks passed: map-first composition, plain-language default semantics, human country briefing, people-behind-the-map discovery, research disclosure, mobile sheet behavior, provider boundary, and accessibility fallback are enforced.");
