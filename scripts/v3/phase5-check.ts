import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFile(resolve(root, path), "utf8");

function requireText(source: string, marker: string, label: string): void {
  if (!source.includes(marker)) throw new Error(`V3 Phase 5: missing ${label}: ${marker}`);
}

for (const path of [
  "src/styles/atlas-foundation/shell.css",
  "docs/V3_PHASE5_SHELL_NAVIGATION_IA.md",
  "tests/e2e/v3-phase5-shell-navigation.spec.ts",
]) {
  if (!existsSync(resolve(root, path))) throw new Error(`V3 Phase 5 required file is missing: ${path}`);
}

const shell = await read("src/components/AppShell.tsx");
const primaryStart = shell.indexOf("const primaryNav");
const primaryEnd = shell.indexOf("const savedNav");
if (primaryStart < 0 || primaryEnd < 0) throw new Error("V3 Phase 5 primary navigation declaration is missing.");
const primary = shell.slice(primaryStart, primaryEnd);
for (const marker of ['label: "Explore"', 'label: "Peoples"', 'label: "Pray"']) requireText(primary, marker, "primary destination");
for (const forbidden of ['label: "Countries"', 'label: "Languages"', 'label: "Saved"', 'label: "Account', 'Reviewed coverage']) {
  if (primary.includes(forbidden)) throw new Error(`V3 Phase 5 primary navigation contains secondary destination: ${forbidden}`);
}

for (const marker of [
  'label: "Saved"',
  'label: "Countries"',
  'label: "Languages"',
  'label: "Sources & methodology"',
  'label: "Account & sync"',
  "const mobileNav = [...primaryNav, savedNav]",
  'aria-label="Search people, countries and languages"',
  'aria-label="My saved people and prayer list"',
  'aria-label="More navigation"',
  'id="desktop-more-menu"',
  'id="mobile-more-menu"',
  'data-v3-shell="true"',
]) requireText(shell, marker, "shell IA marker");

if (shell.includes("Reviewed coverage")) throw new Error("V3 Phase 5 must remove Reviewed Coverage from normal shell navigation.");
if (shell.includes("account-action")) throw new Error("V3 Phase 5 Account must not remain permanent header chrome.");

const styles = await read("src/styles/atlas-foundation/shell.css");
for (const marker of [
  ".v3-shell-header.site-header",
  ".v3-primary-nav.desktop-nav",
  ".v3-shell-actions.header-actions",
  ".v3-shell-more__panel.browse-menu__panel",
  ".v3-mobile-nav.mobile-nav",
  "grid-template-columns: repeat(5, minmax(0, 1fr))",
  ".v3-mobile-more-sheet.mobile-browse-sheet",
  'data-data-state="idle"',
  'data-data-state="live"',
  'data-data-state="cached"',
  "min-height: var(--v3-control-height)",
  "@media (max-width: 760px)",
  "prefers-reduced-motion",
]) requireText(styles, marker, "V3 shell style marker");

const main = await read("src/main.tsx");
const shellImport = 'import "./styles/atlas-foundation/shell.css";';
const accessibilityImport = 'import "./styles/foundation/accessibility.css";';
requireText(main, shellImport, "shell stylesheet import");
requireText(main, accessibilityImport, "accessibility stylesheet import");
if (main.indexOf(shellImport) > main.indexOf(accessibilityImport)) {
  throw new Error("V3 Phase 5 shell styles must load before the canonical accessibility layer.");
}

const legacyGate = await read("scripts/navigation/phase7-check.ts");
for (const marker of [
  "Explore/Peoples/Pray are primary",
  "Reviewed Coverage is hidden from normal navigation",
  "Saved is direct",
]) requireText(legacyGate, marker, "reconciled legacy navigation gate");

const browser = await read("tests/e2e/v3-phase5-shell-navigation.spec.ts");
for (const marker of [
  "desktop shell exposes only the three primary product destinations",
  "More contains secondary atlas and personal destinations but not Reviewed Coverage",
  "mobile bottom navigation is Explore Peoples Pray Saved More",
  "desktop and mobile shell stay within the viewport",
]) requireText(browser, marker, "Phase 5 browser certification");

const docs = await read("docs/V3_PHASE5_SHELL_NAVIGATION_IA.md");
for (const marker of [
  "Explore · Peoples · Pray · Saved · More",
  "Reviewed Coverage is no longer part of normal user navigation",
  "Data status is exceptional-state UI",
  "Phase 6 — Explore 3.0",
]) requireText(docs, marker, "Phase 5 documentation");

const packageJson = await read("package.json");
requireText(packageJson, '"v3:phase5-check": "tsx scripts/v3/phase5-check.ts"', "Phase 5 package script");
requireText(packageJson, "npm run v3:phase4-check && npm run v3:phase5-check", "blocking Phase 5 build integration");

console.log("V3 Phase 5 shell checks passed: primary navigation is focused, supporting atlas/reference/account destinations are secondary, Saved is direct, editorial tooling is hidden, healthy data status is quiet, and responsive/accessibility contracts remain enforced.");
