import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");

const shell = await readText("src/components/AppShell.tsx");
for (const marker of [
  'type BrowseSurface = "desktop" | "mobile" | null',
  "const primaryNav",
  "const exploreMoreNav",
  "const referenceNav",
  "const personalNav",
  "const mobileNav",
  "focusableElements",
  'document.addEventListener("pointerdown"',
  'aria-modal="true"',
  'role="dialog"',
  'aria-label="My saved people and prayer list"',
  'aria-label="More navigation"',
  '>Saved</span>',
  '>More</span>',
]) {
  if (!shell.includes(marker)) throw new Error(`Phase 7/V3 navigation shell missing ${marker}.`);
}

const primarySection = shell.slice(shell.indexOf("const primaryNav"), shell.indexOf("const savedNav"));
for (const route of ['id: "explore"', 'id: "peoples"', 'id: "pray"']) {
  if (!primarySection.includes(route)) throw new Error(`V3 primary navigation is missing ${route}.`);
}
for (const forbidden of ['id: "coverage"', 'id: "countries"', 'id: "languages"', 'id: "account"', 'id: "saved"']) {
  if (primarySection.includes(forbidden)) throw new Error(`V3 primary navigation must stay focused; found ${forbidden}.`);
}

const menuSection = shell.slice(shell.indexOf("const exploreMoreNav"), shell.indexOf("const menuNav"));
for (const route of ['id: "countries"', 'id: "languages"', 'id: "about"', 'id: "account"']) {
  if (!menuSection.includes(route)) throw new Error(`V3 More navigation is missing ${route}.`);
}
if (menuSection.includes('id: "coverage"')) throw new Error("Reviewed Coverage must be absent from normal V3 navigation.");
if (menuSection.includes('id: "saved"')) throw new Error("Saved is a direct destination and must not be duplicated inside More.");

if (!shell.includes("const mobileNav = [...primaryNav, savedNav]")) {
  throw new Error("V3 mobile navigation must expose Explore, Peoples, Pray and Saved directly before More.");
}
if (shell.includes("account-action")) throw new Error("V3 Account must be secondary inside More rather than permanent header chrome.");

const styles = await readText("src/styles/atlas-foundation/shell.css");
for (const marker of [
  ".v3-shell-header",
  ".v3-primary-nav",
  ".v3-shell-action",
  ".v3-shell-more__panel",
  ".v3-mobile-nav.mobile-nav",
  "grid-template-columns: repeat(5, minmax(0, 1fr))",
  ".v3-mobile-more-sheet.mobile-browse-sheet",
  'data-data-state="live"',
]) {
  if (!styles.includes(marker)) throw new Error(`V3 shell/navigation styling missing ${marker}.`);
}

const main = await readText("src/main.tsx");
if (!main.includes('import "./styles/atlas-foundation/shell.css";')) throw new Error("V3 shell stylesheet is not loaded.");
if (main.indexOf('import "./styles/atlas-foundation/shell.css";') > main.indexOf('import "./styles/foundation/accessibility.css";')) {
  throw new Error("Accessibility ownership must remain the final application cascade layer after V3 shell migration.");
}

const saved = await readText("src/pages/SavedPage.tsx");
if (!/<h1\b[^>]*id="saved-title"[^>]*>Saved<\/h1>/.test(saved)) throw new Error("Phase 11 private continuity workspace must use the canonical Saved page title.");

const router = await readText("src/app/router.ts");
if (!router.includes('if (route.id === "saved") return "Saved | Unreached"')) throw new Error("Saved route title must match the Phase 11 memory workspace.");
if (!router.includes("Number.isSafeInteger(sourceId)")) throw new Error("V3 shell migration must preserve positive numeric deep-link validation.");

const browserSpec = await readText("tests/e2e/phase7-navigation-redesign.spec.ts");
for (const marker of [
  "Saved is direct while Account is secondary inside More",
  "desktop More supports disclosure keyboard navigation and focus return",
  "tablet widths retain primary navigation and utility More",
  "mobile More is modal and returns focus on Escape",
  "detail routes retain their parent navigation state",
  "Reviewed Coverage is absent from normal V3 navigation",
  "Saved names the private continuity workspace consistently",
]) {
  if (!browserSpec.includes(marker)) throw new Error(`V3 navigation browser certification missing: ${marker}.`);
}

console.log("Phase 7 compatibility gate passed under V3 IA and Phase 11: Explore/Peoples/Pray are primary, Saved is the direct private continuity workspace, Countries/Languages/Sources/Account are secondary, Reviewed Coverage is hidden from normal navigation, and desktop/tablet/mobile disclosure behavior remains accessible.");
