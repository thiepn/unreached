import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFile(resolve(root, path), "utf8");

function requireText(source: string, marker: string, label: string): void {
  if (!source.includes(marker)) throw new Error(`V3 Phase 4: missing ${label}: ${marker}`);
}

const foundationRoot = "src/styles/atlas-foundation";
const requiredFiles = [
  `${foundationRoot}/tokens.css`,
  `${foundationRoot}/typography.css`,
  `${foundationRoot}/layout.css`,
  `${foundationRoot}/components.css`,
  `${foundationRoot}/atlas.css`,
  `${foundationRoot}/responsive.css`,
  "src/pages/DesignSystemPage.tsx",
  "tests/e2e/v3-phase4-design-system.spec.ts",
  "docs/V3_PHASE4_VISUAL_FOUNDATION.md",
];
for (const path of requiredFiles) {
  if (!existsSync(resolve(root, path))) throw new Error(`V3 Phase 4 required file is missing: ${path}`);
}

const tokens = await read(`${foundationRoot}/tokens.css`);
for (const marker of [
  '--v3-font-ui: "Source Sans 3 Variable"',
  '--v3-font-editorial: "Newsreader Variable"',
  "--v3-control-height: 44px",
  "--v3-content-max: 1480px",
  "--v3-reading-max: 760px",
  "--v3-status-unreached:",
  "--v3-status-unknown:",
]) requireText(tokens, marker, "canonical V3 token");

const typography = await read(`${foundationRoot}/typography.css`);
for (const marker of [
  ".v3-type-display-xl",
  ".v3-type-heading-xl",
  ".v3-type-body-lg",
  ".v3-type-meta",
  ".v3-type-prose",
]) requireText(typography, marker, "typography scale marker");

const components = await read(`${foundationRoot}/components.css`);
for (const marker of [
  ".v3-surface--page",
  ".v3-surface--editorial",
  ".v3-surface--utility",
  ".v3-surface--overlay",
  ".v3-button--primary",
  ".v3-button--secondary",
  ".v3-status--unreached",
  "min-height: var(--v3-control-height)",
]) requireText(components, marker, "surface/control marker");

const atlas = await read(`${foundationRoot}/atlas.css`);
for (const marker of [
  ".v3-masthead",
  ".v3-fact-strip",
  ".v3-source-note",
  ".v3-map-shell",
  ".v3-map-legend",
]) requireText(atlas, marker, "atlas primitive marker");

const responsive = await read(`${foundationRoot}/responsive.css`);
for (const marker of ["@media (max-width: 1000px)", "@media (max-width: 720px)", "prefers-reduced-motion"]) {
  requireText(responsive, marker, "responsive/accessibility marker");
}

const main = await read("src/main.tsx");
const foundationImports = [
  'import "./styles/atlas-foundation/tokens.css";',
  'import "./styles/atlas-foundation/typography.css";',
  'import "./styles/atlas-foundation/layout.css";',
  'import "./styles/atlas-foundation/components.css";',
  'import "./styles/atlas-foundation/atlas.css";',
  'import "./styles/atlas-foundation/responsive.css";',
];
for (const marker of foundationImports) requireText(main, marker, "V3 foundation stylesheet import");
if (!main.trim().includes('import "./styles/foundation/accessibility.css";')) {
  throw new Error("V3 Phase 4 must preserve the certified accessibility stylesheet in the application cascade.");
}

const router = await read("src/app/router.ts");
requireText(router, '"/dev/design-system": "design-system"', "unlinked design-system reference route");
const app = await read("src/app/App.tsx");
requireText(app, 'import("../pages/DesignSystemPage")', "lazy design-system page import");
requireText(app, 'case "design-system": page = <DesignSystemPage />;', "design-system route rendering");

const designPage = await read("src/pages/DesignSystemPage.tsx");
for (const marker of [
  "Visual Foundation",
  "Editorial voice, interface discipline",
  "Structure without a sea of floating cards",
  "A people profile should read like an atlas article",
  "The map is a workspace, not a background illustration",
  'data-v3-control="true"',
  'data-v3-map-shell="true"',
]) requireText(designPage, marker, "reference-page marker");

// Phase 4 is foundation work, not an early rewrite of production routes.
const pageFiles = (await readdir(resolve(root, "src/pages"))).filter((name) => name.endsWith(".tsx") && name !== "DesignSystemPage.tsx");
for (const file of pageFiles) {
  const source = await read(`src/pages/${file}`);
  if (/\bv3-[a-z0-9-]+/.test(source)) {
    throw new Error(`V3 Phase 4 leaked new visual-system classes into production page ${file}; page migration belongs to later phases.`);
  }
}

const docs = await read("docs/V3_PHASE4_VISUAL_FOUNDATION.md");
for (const marker of [
  "Modern Mission Atlas",
  "four surface roles",
  "mission-status color is semantic",
  "44×44",
  "Phase 5",
  "does not redesign production routes",
  "src/styles/atlas-foundation/",
]) requireText(docs, marker, "Phase 4 documentation marker");

const packageJson = await read("package.json");
requireText(packageJson, '"v3:phase4-check": "tsx scripts/v3/phase4-check.ts"', "Phase 4 package script");
requireText(packageJson, "npm run v3:phase3-check && npm run v3:phase4-check", "blocking Phase 4 build integration");

console.log("V3 Phase 4 visual foundation checks passed: canonical tokens, typography, layout, surfaces, controls, editorial/map primitives, responsive behavior, reference route, and later-phase migration boundary are enforced.");
