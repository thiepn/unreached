import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");

const explore = await readText("src/pages/ExplorePage.tsx");
for (const marker of [
  "explore-screen--phase10",
  "explore-panel--phase10",
  "mission-view-control",
  "mission-data-status",
  "country-index--primary",
  'key="country-index"',
  "mission-map-key-floating",
  "mobile-map-sheet--phase10",
  "Source breakdown",
  "About this view",
]) {
  if (!explore.includes(marker)) throw new Error(`Phase 10 Explore workspace missing ${marker}.`);
}

if (explore.includes("function MissionLegend")) {
  throw new Error("Phase 10 must not keep the duplicated MissionLegend implementation.");
}
if (explore.includes("map-legend-floating")) {
  throw new Error("Phase 10 must not render the legacy duplicate floating legend.");
}

const desktopKey = '<div class="mission-map-key-floating"><MissionMapKey activeLayer={activeLayer} /></div>';
const mobileKey = '<MissionMapKey activeLayer={activeLayer} compact />';
if (!explore.includes(desktopKey) || !explore.includes(mobileKey)) {
  throw new Error("Phase 10 requires one desktop map key and one mobile-sheet map key for mutually exclusive viewports.");
}

const styles = await readText("src/styles/explore/map-workspace.css");
for (const marker of [
  ".explore-panel--phase10",
  ".mission-data-status",
  "display: contents",
  "overflow: hidden",
  ".country-index--primary",
  ".explore-panel--phase10 .country-list",
  "overflow-y: auto",
  ".mission-map-key-floating",
  ".mobile-map-sheet--phase10 .mission-map-key--compact",
  "@media (max-width: 760px)",
]) {
  if (!styles.includes(marker)) throw new Error(`Phase 10 map styling missing ${marker}.`);
}

const main = await readText("src/main.tsx");
if (!main.includes('import "./styles/explore/map-workspace.css"')) {
  throw new Error("Phase 10 stylesheet is not loaded.");
}

const sidebarSpec = await readText("tests/e2e/map-sidebar-layout.spec.ts");
if (!sidebarSpec.includes("map sidebar keeps one scroll region")) {
  throw new Error("Phase 10 must certify the single-scroll desktop sidebar contract.");
}

const browserSpec = await readText("tests/e2e/phase10-explore-map.spec.ts");
for (const marker of [
  "desktop exposes one visible map key",
  "selected country keeps detailed breakdown opt in",
  "toHaveClass(/is-selected/)",
  "mobile sheet owns the only visible map key",
  "mobile map sheet does not overflow horizontally",
]) {
  if (!browserSpec.includes(marker)) throw new Error(`Phase 10 browser certification missing: ${marker}.`);
}

console.log("Phase 10 Explore/map checks passed: one scroll region per viewport, stable live-data interaction, one visible map key per viewport, progressive source detail, and responsive map-sheet contracts are enforced.");
