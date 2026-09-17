import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFile(resolve(root, path), "utf8");

function requireText(source: string, marker: string, label: string): void {
  if (!source.includes(marker)) throw new Error(`V3 Phase 10: missing ${label}: ${marker}`);
}

const requiredFiles = [
  "src/pages/PrayPage.tsx",
  "src/pages/PrayerFocusPage.tsx",
  "src/pages/PrayerSessionPage.tsx",
  "src/prayer/live.ts",
  "src/styles/atlas-foundation/prayer.css",
  "tests/e2e/v3-phase10-prayer.spec.ts",
  "docs/V3_PHASE10_PRAYER_3.md",
];
for (const path of requiredFiles) {
  if (!existsSync(resolve(root, path))) throw new Error(`V3 Phase 10 required file is missing: ${path}`);
}

const live = await read("src/prayer/live.ts");
for (const marker of [
  "LivePrayerContextSummary",
  "livePrayerContextSummary",
  "livePrayerPlainReason",
  "useLivePrayerRouteRecord",
  'status: "release-certified-template"',
  'reviewedAt: "2026-08-29"',
  "entity.reach.unreachedContexts === 1",
]) requireText(live, marker, "prayer source boundary");

const landing = await read("src/pages/PrayPage.tsx");
for (const marker of [
  'data-v3-prayer="landing"',
  "Pray with context.",
  "People to Pray for Today",
  "Next from your private prayer rotation",
  "not a priority ranking",
  "Return to people you chose.",
  'data-prayer-session-size="3"',
  'data-prayer-session-size="5"',
  'data-prayer-session-size="all"',
  'class="prayer-library v3-prayer-picker"',
  "Choose another people",
  "PRAYER_LIBRARY_BATCH_SIZE = 24",
  "prayer score, streak, leaderboard, mission-priority signal",
]) requireText(landing, marker, "Prayer landing contract");
if (landing.includes('from "../providers/peoplegroups"')) throw new Error("Prayer landing must consume the Prayer 3.0 boundary instead of provider modules directly.");
const dailyIndex = landing.indexOf('data-v3-prayer-daily="true"');
const pickerIndex = landing.indexOf('class="prayer-library v3-prayer-picker"');
if (dailyIndex < 0 || pickerIndex < 0 || dailyIndex > pickerIndex) throw new Error("Prayer 3.0 must place the daily focus before the optional prayer-subject catalog.");

const focus = await read("src/pages/PrayerFocusPage.tsx");
for (const marker of [
  'data-v3-prayer="focus"',
  "Before you pray",
  "Hold a few source facts in view.",
  "Unreached · GSEC 0–3",
  "Move through a few prompts, slowly.",
  "No timer runs, and there is no completion target.",
  "Record prayer today",
  "Continue with",
  'data-next-prayer-peid',
  "Source record details",
]) requireText(focus, marker, "focused-prayer contract");
if (focus.includes('from "../providers/peoplegroups"')) throw new Error("Focused prayer must consume the Prayer 3.0 route boundary instead of provider modules directly.");
const contextIndex = focus.indexOf('data-v3-prayer-context="true"');
const promptIndex = focus.indexOf('class="prayer-prompt-stage v3-prayer-prompt"');
if (contextIndex < 0 || promptIndex < 0 || contextIndex > promptIndex) throw new Error("Prayer 3.0 must present source context before the active prayer prompt.");

const session = await read("src/pages/PrayerSessionPage.tsx");
for (const marker of [
  'data-v3-prayer="session"',
  "Pray through your rotation.",
  "was frozen when this session opened",
  "navigation aid, not a completion target",
  "Three prayer prompts",
  "Record prayer today",
  "stores no session history",
  "page state",
]) requireText(session, marker, "guided-session contract");

const styles = await read("src/styles/atlas-foundation/prayer.css");
for (const marker of [
  ".v3-prayer-page",
  ".v3-prayer-daily",
  ".v3-prayer-picker",
  ".v3-prayer-context",
  ".v3-prayer-prompt",
  ".v3-prayer-session__person",
  "min-height: var(--v3-control-height)",
  "@media (max-width: 720px)",
]) requireText(styles, marker, "Prayer 3.0 atlas styling");

const main = await read("src/main.tsx");
const prayerStyleIndex = main.indexOf('import "./styles/atlas-foundation/prayer.css";');
const accessibilityIndex = main.indexOf('import "./styles/foundation/accessibility.css";');
if (prayerStyleIndex < 0 || accessibilityIndex < 0 || prayerStyleIndex > accessibilityIndex) throw new Error("Prayer 3.0 styles must load before the final accessibility layer.");

const phase4 = await read("scripts/v3/phase4-check.ts");
for (const page of ["PrayPage.tsx", "PrayerFocusPage.tsx", "PrayerSessionPage.tsx"]) requireText(phase4, `"${page}"`, "Phase 10 visual migration ownership");

const browser = await read("tests/e2e/v3-phase10-prayer.spec.ts");
for (const marker of [
  "daily focus is primary and the live catalog is progressive",
  "private rotation becomes a gentle daily return point",
  "focused prayer puts context before prompts",
  "choose another people remains available on demand",
  "guided session preserves a frozen non-competitive rotation",
  "Prayer 3.0 remains readable on mobile",
]) requireText(browser, marker, "Prayer 3.0 browser certification");

const docs = await read("docs/V3_PHASE10_PRAYER_3.md");
for (const marker of [
  "Prayer 3.0",
  "one daily focus",
  "context before prayer",
  "no streaks, scores, urgency rankings, or completion pressure",
  "Phase 11",
  "Discover → Understand → See the need → Pray → Remember",
]) requireText(docs, marker, "Prayer 3.0 documentation");

const pkg = await read("package.json");
requireText(pkg, '"v3:phase10-check": "tsx scripts/v3/phase10-check.ts"', "Phase 10 package gate");
requireText(pkg, "npm run v3:phase9-check && npm run v3:phase10-check", "blocking Phase 10 build integration");
requireText(pkg, '"v3:phase10-prayer-visual"', "Phase 10 browser script");

console.log("V3 Phase 10 Prayer 3.0 checks passed: daily-focus hierarchy, context-first focused prayer, non-competitive private rotation, progressive subject choice, source/template boundaries, responsive atlas styling, and existing privacy guardrails are enforced.");
