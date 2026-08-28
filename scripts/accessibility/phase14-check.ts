import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");

function selectorBlock(source: string, selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return source.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`))?.[1] ?? "";
}

const [a11y, main, shell, pkg, browserSpec, doc, tokens] = await Promise.all([
  readText("src/styles/foundation/accessibility.css"),
  readText("src/main.tsx"),
  readText("src/components/AppShell.tsx"),
  readText("package.json"),
  readText("tests/e2e/phase14-accessibility.spec.ts"),
  readText("docs/PHASE14_ACCESSIBILITY.md"),
  readText("src/styles/tokens.css"),
]);

if (!main.includes('import "./styles/foundation/accessibility.css"')) throw new Error("Phase 14 accessibility stylesheet is not loaded.");
if (!pkg.includes('"accessibility:check": "tsx scripts/accessibility/phase14-check.ts"')) throw new Error("Phase 14 accessibility gate is not exposed through package.json.");
if (!pkg.includes("npm run accessibility:check")) throw new Error("Phase 14 accessibility gate is not blocking the production build.");

for (const marker of [
  "--interactive-target-min: 44px",
  "button,",
  "summary,",
  ".nav-link,",
  ".button,",
  ".main-content:focus-visible",
  "outline: 3px solid",
  "prefers-reduced-motion: reduce",
  ".loading-pulse,",
  ".browse-trigger__chevron,",
  ".skip-link",
  "font-size: 1rem",
  "font-size: max(0.75rem, 12px)",
]) {
  if (!a11y.includes(marker)) throw new Error(`Phase 14 accessibility contract missing: ${marker}`);
}

if ((shell.match(/<main\b/g) ?? []).length !== 1) throw new Error("Phase 14 requires exactly one main landmark in AppShell.");
if (!shell.includes('id="main-content"') || !shell.includes('tabIndex={-1}')) throw new Error("Phase 14 main landmark must remain programmatically focusable.");

const mutedToken = a11y.match(/--ink-2:\s*(#[0-9a-fA-F]{6})/)?.[1];
if (!mutedToken) throw new Error("Phase 14 must define an explicit muted-text color.");

function hexToRgb(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}
function luminance(hex: string) {
  const channels = hexToRgb(hex).map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
function contrast(a: string, b: string) {
  const [bright, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (bright + 0.05) / (dark + 0.05);
}
for (const background of ["#f4f0e6", "#e9e3d6"]) {
  if (contrast(mutedToken, background) < 4.5) throw new Error(`Phase 14 muted text ${mutedToken} fails AA on ${background}.`);
}

const reducedMotion = tokens.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
if (!reducedMotion.includes("animation-duration: .001ms !important") || !reducedMotion.includes("transition-duration: .001ms !important")) {
  throw new Error("Phase 14 must preserve the existing global reduced-motion baseline.");
}

for (const marker of [
  "muted text and critical microcopy meet the Phase 14 readability floor",
  "primary controls expose at least 44 CSS px touch targets",
  "skip navigation and routed main focus remain keyboard visible",
  "reduced motion collapses visible interface animation",
  "mobile form controls retain 16px text and critical labels stay readable",
  "Browse, global search and disclosure controls remain keyboard operable",
  "representative routes do not overflow horizontally at 390px",
]) {
  if (!browserSpec.includes(marker)) throw new Error(`Phase 14 browser certification missing: ${marker}.`);
}

for (const marker of ["WCAG 2.2 AA", "44", "reduced motion", "keyboard", "390", "one `main`"]) {
  if (!doc.toLowerCase().includes(marker.toLowerCase())) throw new Error(`Phase 14 documentation missing: ${marker}`);
}

const mainFocus = selectorBlock(a11y, ".main-content:focus-visible");
if (!mainFocus.includes("outline")) throw new Error("Phase 14 main focus contract must expose an outline.");

console.log(`Phase 14 accessibility gate passed: muted text ${mutedToken} is AA-readable on paper surfaces, 44px target policy and main focus treatment are present, reduced motion/mobile form/microcopy contracts are explicit, and browser certification covers keyboard plus 390px overflow.`);
