import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

const STYLES_ROOT = "src/styles";

function read(path: string): string {
  return readFileSync(path, "utf8");
}

function requireText(source: string, needle: string, label: string): void {
  if (!source.includes(needle)) throw new Error(`Phase 15: missing ${label}`);
}

function collectFiles(root: string, extension: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...collectFiles(path, extension));
    else if (path.endsWith(extension)) files.push(path);
  }
  return files;
}

function portable(path: string): string {
  return path.split(sep).join("/");
}

function sha256(source: string): string {
  return createHash("sha256").update(source).digest("hex");
}

function reconstruct(paths: string[]): string {
  return `${paths.map((path) => read(join(STYLES_ROOT, path)).trimEnd()).join("\n\n")}\n`;
}

function requireConsecutive(values: string[], expected: string[], label: string): void {
  const start = values.indexOf(expected[0]!);
  if (start < 0 || expected.some((value, index) => values[start + index] !== value)) {
    throw new Error(`Phase 15: ${label} is not loaded in the certified cascade order`);
  }
}

const main = read("src/main.tsx");
const app = read("src/app/App.tsx");
const packageJson = read("package.json");
const browserSpec = read("tests/e2e/phase15-css-architecture.spec.ts");
const docs = read("docs/PHASE15_CSS_ARCHITECTURE.md");
const finalizationPlan = read("docs/FINALIZATION_PLAN.md");
const explorePage = read("src/pages/ExplorePage.tsx");

const cssFiles = collectFiles(STYLES_ROOT, ".css").map(portable).sort();
const legacyFiles = cssFiles.filter((path) => /(?:^|\/)(?:v\d+|u\d+)[^/]*\.css$/i.test(path));
if (legacyFiles.length > 0) {
  throw new Error(`Phase 15: release/update-number CSS files remain: ${legacyFiles.join(", ")}`);
}

for (const obsolete of [
  "src/styles/v101-hotfix.css",
  "src/styles/v11.css",
  "src/styles/v12.css",
  "src/styles/u5-integration.css",
  "src/styles/u12e-languages.css",
]) {
  if (existsSync(obsolete)) throw new Error(`Phase 15: obsolete stylesheet remains: ${obsolete}`);
}

const sourceFiles = [...collectFiles("src", ".ts"), ...collectFiles("src", ".tsx")];
const sourceText = sourceFiles.map(read).join("\n");
if (/styles\/(?:v\d+|u\d+)[^"']*\.css/i.test(sourceText)) {
  throw new Error("Phase 15: source code still imports a release/update-number stylesheet");
}

const imports = [...main.matchAll(/import\s+["']\.\/styles\/([^"']+\.css)["'];/g)].map((match) => match[1]!);
if (new Set(imports).size !== imports.length) throw new Error("Phase 15: duplicate application stylesheet import");

const cssRelative = cssFiles.map((path) => portable(relative(STYLES_ROOT, path)));
const imported = new Set(imports);
const onDisk = new Set(cssRelative);
const missingImports = cssRelative.filter((path) => !imported.has(path));
const missingFiles = imports.filter((path) => !onDisk.has(path));
if (missingImports.length > 0 || missingFiles.length > 0) {
  throw new Error(`Phase 15: stylesheet graph mismatch; unimported=${missingImports.join(",") || "none"}; missing=${missingFiles.join(",") || "none"}`);
}

if (imports.at(-1) !== "foundation/accessibility.css") {
  throw new Error("Phase 15: accessibility ownership must remain the final application cascade layer");
}

const languageIndex = imports.indexOf("languages.css");
if (languageIndex < 0 || imports[languageIndex + 1] !== "language/resource-breakdown.css") {
  throw new Error("Phase 15: language resource ownership no longer overlays the language base at its certified slot");
}

const v101Fragments = [
  "shell/overflow-guard.css",
  "foundation/loading-state.css",
  "people/index-loading.css",
  "foundation/result-pagination.css",
  "foundation/content-wrapping.css",
  "language/card-alignment.css",
  "shell/compact-navigation.css",
  "foundation/result-pagination-mobile.css",
  "foundation/loading-motion.css",
];
const v11Fragments = [
  "shell/browse-actions.css",
  "explore/layer-controls.css",
  "foundation/catalog-search.css",
  "foundation/catalog-cards.css",
  "country/catalog-cards.css",
  "people/profile-flow.css",
  "foundation/catalog-responsive.css",
];
const v12Fragments = [
  "discovery/guided-start.css",
  "people/profile-journey.css",
  "country/guided-start.css",
  "people/empty-state.css",
  "foundation/guided-responsive.css",
];
requireConsecutive(imports, v101Fragments, "v101 semantic fragments");
requireConsecutive(imports, v11Fragments, "v11 semantic fragments");
requireConsecutive(imports, v12Fragments, "v12 semantic fragments");

const v101Hash = sha256(reconstruct(v101Fragments));
if (v101Hash !== "cc1e61ba87d4369118f10c7f701857acb7079b6cbfbca29843914347c7a6548d") {
  throw new Error(`Phase 15: v101 semantic reconstruction changed (${v101Hash})`);
}
const v11Hash = sha256(reconstruct(v11Fragments));
if (v11Hash !== "b3ed266506c4abdf50f64776dd1618f954dfcad6f0cd270d7ca1291e42beaa56") {
  throw new Error(`Phase 15: v11 semantic reconstruction changed (${v11Hash})`);
}
const v12Hash = sha256(reconstruct(v12Fragments));
if (v12Hash !== "c44a4a61abaa74ad7535b061bce2c33b8f151a1c324235c4be65d843b295eded") {
  throw new Error(`Phase 15: v12 semantic reconstruction changed (${v12Hash})`);
}
const languageResourceHash = sha256(read("src/styles/language/resource-breakdown.css"));
if (languageResourceHash !== "33253211cdd98a0c5deedf5e701ae45448be82fcc956399dca82b09f60154073") {
  throw new Error(`Phase 15: language resource stylesheet changed (${languageResourceHash})`);
}

if (main.includes("maplibre-gl/dist/maplibre-gl.css")) {
  throw new Error("Phase 15: MapLibre CSS is still globally loaded by main.tsx");
}
requireText(app, 'import("maplibre-gl/dist/maplibre-gl.css")', "lazy MapLibre CSS import");
requireText(app, 'import("../pages/ExplorePage")', "lazy Explore page import");
requireText(browserSpec, "MapLibre CSS is loaded only with the lazy Explore route", "route-loaded MapLibre browser certification");
requireText(browserSpec, "searchable area list remains available", "map fallback browser certification");

const sharedDetail = read("src/styles/foundation/detail-records.css");
for (const marker of [
  ".detail-record-progress",
  ".result-load-more--detail",
  ".language-profile-main,",
  ".country-content-main",
  ".language-table-wrap,",
  ".country-people-table-wrap",
]) {
  requireText(sharedDetail, marker, `shared detail-record marker ${marker}`);
}
requireText(explorePage, 'class="country-profile-link"', "current Explore country-profile link markup");
requireText(packageJson, '"css:check": "tsx scripts/styles/phase15-check.ts"', "css:check package script");
requireText(packageJson, "npm run accessibility:check && npm run css:check && npm run release:check", "blocking build integration");
requireText(docs, "Final semantic import graph", "final semantic import graph documentation");
requireText(docs, "Dormant u5 resolution", "dormant u5 resolution documentation");
requireText(finalizationPlan, "Phase 2 — CSS Architecture Closure", "Phase 2 finalization plan entry");

console.log(`Phase 15 CSS architecture certification passed for ${cssFiles.length} semantic stylesheets.`);
