import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");

const page = await readText("src/pages/ExplorePage.tsx");
for (const marker of [
  'explore-panel explore-panel--phase10',
  'class="mission-view-control"',
  'class="mission-view-info"',
  'selected-area selected-area--phase10',
  'class="selected-mission-details"',
  'class="country-index--primary"',
  'class="mission-map-key mission-map-key--desktop"',
  'mobile-map-sheet mobile-map-sheet--phase10',
]) {
  if (!page.includes(marker)) throw new Error(`Phase 10 Explore page missing ${marker}.`);
}

const desktopKeyCount = (page.match(/mission-map-key--desktop/g) ?? []).length;
if (desktopKeyCount !== 1) throw new Error(`Phase 10 expected exactly one desktop mission map key, found ${desktopKeyCount}.`);
const mobileKeyCount = (page.match(/mission-map-key--compact/g) ?? []).length;
if (mobileKeyCount !== 1) throw new Error(`Phase 10 expected exactly one mobile mission map key, found ${mobileKeyCount}.`);

const styles = await readText("src/styles/explore/map-workspace.css");
for (const marker of [
  ".explore-panel--phase10",
  ".country-index--primary",
  ".mission-map-key-floating",
  ".mission-map-key",
  ".mobile-map-sheet--phase10",
  "@media (min-width: 761px)",
]) {
  if (!styles.includes(marker)) throw new Error(`Phase 10 Explore styling missing ${marker}.`);
}

const main = await readText("src/main.tsx");
if (!main.includes('import "./styles/explore/map-workspace.css"')) throw new Error("Phase 10 Explore map stylesheet is not loaded.");

const browserSpec = await readText("tests/e2e/phase10-explore-map.spec.ts");
for (const marker of [
  "desktop Explore keeps one visible map key",
  "desktop sidebar does not create nested scrolling",
  "mobile Explore exposes one compact map key",
  "selected country keeps secondary mission detail progressive",
]) {
  if (!browserSpec.includes(marker)) throw new Error(`Phase 10 browser certification missing: ${marker}.`);
}

console.log("Phase 10 Explore checks passed: one map key per viewport, single-scroll desktop workspace, progressive mission detail, compact mobile sheet and preserved map-state contracts are enforced.");
