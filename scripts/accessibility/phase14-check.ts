import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function read(path: string): string {
  return readFileSync(path, "utf8");
}

function requireText(source: string, needle: string, label: string): void {
  if (!source.includes(needle)) throw new Error(`Phase 14: missing ${label}`);
}

function collectFiles(root: string, extension: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) files.push(...collectFiles(path, extension));
    else if (path.endsWith(extension)) files.push(path);
  }
  return files;
}

function parseHexVariable(source: string, name: string): string {
  const match = source.match(new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`Phase 14: unable to read ${name}`);
  return match[1]!;
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function contrast(a: string, b: string): number {
  const first = luminance(a);
  const second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

const packageJson = read("package.json");
const main = read("src/main.tsx");
const base = read("src/styles/base.css");
const tokens = read("src/styles/tokens.css");
const accessibility = read("src/styles/foundation/accessibility.css");
const browserSpec = read("tests/e2e/phase14-accessibility.spec.ts");
const docs = read("docs/PHASE14_ACCESSIBILITY.md");

requireText(main, 'import "./styles/foundation/accessibility.css";', "accessibility stylesheet import");
requireText(packageJson, '"accessibility:check": "tsx scripts/accessibility/phase14-check.ts"', "accessibility:check script");
requireText(packageJson, "npm run accessibility:check", "blocking build integration");
requireText(base, "@media (prefers-reduced-motion: reduce)", "base reduced-motion policy");
requireText(accessibility, "--interactive-target-min: 44px", "44px target token");
requireText(accessibility, ".main-content:focus-visible", "visible main focus rule");
requireText(accessibility, "font-size: 1rem", "mobile form text sizing");
requireText(accessibility, "font-size: max(0.75rem, 12px)", "critical microcopy floor");
requireText(browserSpec, "representative mobile routes do not overflow", "representative-route overflow certification");
requireText(browserSpec, "primary keyboard paths remain operable", "keyboard certification");
requireText(browserSpec, "exactly one main landmark", "main-landmark certification");
requireText(docs, "Exit criterion", "Phase 14 exit criterion documentation");

const tsx = collectFiles("src", ".tsx").map((path) => read(path)).join("\n");
const mainCount = (tsx.match(/<main\b/g) ?? []).length;
if (mainCount !== 1) throw new Error(`Phase 14: expected exactly one <main> in src, found ${mainCount}`);
requireText(tsx, '<main id="main-content" class="main-content" tabIndex={-1}>', "focusable canonical main landmark");

const muted = parseHexVariable(accessibility, "--ink-2");
const paper0 = parseHexVariable(tokens, "--paper-0");
const paper1 = parseHexVariable(tokens, "--paper-1");
for (const [surface, value] of [["paper-0", paper0], ["paper-1", paper1]] as const) {
  const ratio = contrast(muted, value);
  if (ratio < 4.5) throw new Error(`Phase 14: muted-text contrast on ${surface} is ${ratio.toFixed(2)}:1`);
}

console.log("Phase 14 accessibility static certification passed.");
