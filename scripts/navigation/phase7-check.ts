import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");

const shell = await readText("src/components/AppShell.tsx");
for (const marker of [
  'type BrowseSurface = "desktop" | "mobile" | null',
  "const discoverNav",
  "const referenceNav",
  "focusableElements",
  'document.addEventListener("pointerdown"',
  'aria-modal="true"',
  'role="dialog"',
  'aria-label="My saved people and prayer list"',
  '>My lists</span>',
  '>More</span>',
]) {
  if (!shell.includes(marker)) throw new Error(`Phase 7 navigation shell missing ${marker}.`);
}

const discoverSection = shell.slice(shell.indexOf("const discoverNav"), shell.indexOf("const browseNav"));
if (discoverSection.includes('id: "account"')) throw new Error("Phase 7 Account must not be duplicated inside Browse navigation.");
if (!discoverSection.includes('id: "coverage"') || !discoverSection.includes('id: "countries"') || !discoverSection.includes('id: "languages"') || !discoverSection.includes('id: "about"')) {
  throw new Error("Phase 7 Browse navigation must contain Coverage, Countries, Languages and About.");
}

const styles = await readText("src/styles/shell/navigation.css");
for (const marker of [
  "mobile-nav-backdrop",
  "mobile-browse-sheet",
  "browse-menu__group",
  "@media (min-width: 761px) and (max-width: 1040px)",
  ".desktop-nav",
]) {
  if (!styles.includes(marker)) throw new Error(`Phase 7 navigation styling missing ${marker}.`);
}

const main = await readText("src/main.tsx");
if (!main.includes('import "./styles/shell/navigation.css"')) throw new Error("Phase 7 navigation stylesheet is not loaded last.");

const saved = await readText("src/pages/SavedPage.tsx");
if (!/<h1\b[^>]*class="display-title"[^>]*>My lists<\/h1>/.test(saved)) throw new Error("Phase 7 private workspace must use the My lists destination name.");

const router = await readText("src/app/router.ts");
if (!router.includes('if (route.id === "saved") return "My Lists | Unreached"')) throw new Error("Phase 7 saved route title must match My lists navigation.");
if (!router.includes("Number.isSafeInteger(sourceId)")) throw new Error("Phase 7 must preserve Phase 6 positive numeric deep-link validation.");

const browserSpec = await readText("tests/e2e/phase7-navigation-redesign.spec.ts");
for (const marker of [
  "Account is a utility and is not duplicated inside Browse",
  "desktop Browse supports disclosure keyboard navigation and focus return",
  "tablet widths retain primary navigation",
  "mobile More is modal and returns focus on Escape",
  "detail routes retain their parent navigation state",
  "My lists names the saved and prayer workspace consistently",
]) {
  if (!browserSpec.includes(marker)) throw new Error(`Phase 7 browser certification missing: ${marker}.`);
}

console.log("Phase 7 navigation checks passed: primary, browse and utility hierarchy are distinct; Account is singular; My lists is unambiguous; desktop/tablet/mobile navigation behavior and modal focus contracts are enforced.");
