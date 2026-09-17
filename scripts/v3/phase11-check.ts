import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  MAX_PERSONAL_NOTE_LENGTH,
  MAX_PRAYER_MEMORY,
  clearPrayerMemory,
  normalizePersonalizationState,
  recordPrayerForPerson,
  savePersonSnapshot,
  setPersonalNote,
} from "../../src/personalization/model";

const root = process.cwd();
const read = (path: string) => readFile(resolve(root, path), "utf8");

function requireText(source: string, marker: string, label: string): void {
  if (!source.includes(marker)) throw new Error(`V3 Phase 11: missing ${label}: ${marker}`);
}

const requiredFiles = [
  "src/pages/SavedPage.tsx",
  "src/personalization/types.ts",
  "src/personalization/model.ts",
  "src/personalization/runtime.ts",
  "src/styles/atlas-foundation/memory.css",
  "tests/e2e/v3-phase11-personal-memory.spec.ts",
  "docs/V3_PHASE11_PERSONAL_MISSION_MEMORY.md",
];
for (const path of requiredFiles) {
  if (!existsSync(resolve(root, path))) throw new Error(`V3 Phase 11 required file is missing: ${path}`);
}

const types = await read("src/personalization/types.ts");
for (const marker of [
  "personalNoteSchema",
  ".max(2000)",
  "prayerMemoryEntrySchema",
  "legacyPersonalizationStateV2Schema",
  "version: z.literal(3)",
  "personalNotes: z.array(personalNoteSchema)",
  "prayerMemory: z.array(prayerMemoryEntrySchema).max(30)",
]) requireText(types, marker, "personal-memory schema");

const model = await read("src/personalization/model.ts");
for (const marker of [
  "PERSONALIZATION_VERSION = 3",
  "MAX_PERSONAL_NOTE_LENGTH = 2000",
  "MAX_PRAYER_MEMORY = 30",
  "legacyPersonalizationStateV2Schema.safeParse",
  "setPersonalNote",
  "clearPrayerMemory",
  "prayerMemory = [",
  "withoutOrphanedNote",
]) requireText(model, marker, "personal-memory model");

const legacy = normalizePersonalizationState({ version: 2, savedPeoples: [], prayerList: [], recent: [] });
if (legacy.version !== 3 || legacy.personalNotes.length !== 0 || legacy.prayerMemory.length !== 0) {
  throw new Error("V3 Phase 11 must migrate valid v2 personalization state to v3 without inventing memory data.");
}

const person = {
  sourcePeopleId: 12319,
  peopleGroupId: "people-entity:peoplegroups:12319" as const,
  name: "Phase 11 Test People",
  largestCountryName: "Benin",
  primaryLanguageName: "Fon",
  classification: "unreached" as const,
  frontier: false,
};
const remembered = savePersonSnapshot(legacy, person, new Date("2026-09-17T10:00:00.000Z"));
const noted = setPersonalNote(remembered, person.sourcePeopleId, `  ${"n".repeat(MAX_PERSONAL_NOTE_LENGTH + 40)}  `, new Date("2026-09-17T10:01:00.000Z"));
if (noted.personalNotes[0]?.text.length !== MAX_PERSONAL_NOTE_LENGTH) throw new Error("V3 Phase 11 must bound private notes to 2,000 characters.");
const deletedNote = setPersonalNote(noted, person.sourcePeopleId, "   ");
if (deletedNote.personalNotes.length !== 0) throw new Error("V3 Phase 11 blank note save must delete the private note.");

const prayerSnapshot = {
  sourcePeopleId: person.sourcePeopleId,
  peopleGroupId: person.peopleGroupId,
  name: person.name,
  countryName: person.largestCountryName,
  languageName: person.primaryLanguageName,
};
let withPrayerMemory = remembered;
for (let index = 0; index < MAX_PRAYER_MEMORY + 4; index += 1) {
  withPrayerMemory = recordPrayerForPerson(withPrayerMemory, prayerSnapshot, new Date(Date.UTC(2026, 8, 1, 0, index)));
}
if (withPrayerMemory.prayerMemory.length !== MAX_PRAYER_MEMORY) throw new Error("V3 Phase 11 prayer memory must remain bounded to the latest 30 explicit prayer records.");
if (clearPrayerMemory(withPrayerMemory).prayerMemory.length !== 0) throw new Error("V3 Phase 11 must provide explicit local prayer-memory deletion.");

const runtime = await read("src/personalization/runtime.ts");
for (const marker of [
  'PERSONALIZATION_STORAGE_KEY = "unreached.personal.v2"',
  "retained intentionally",
  "savePersonalNote",
  "clearPrayerHistory",
]) requireText(runtime, marker, "runtime compatibility/privacy boundary");

const sync = await read("src/sync/reconcile.ts");
if (sync.includes("personalNotes") || sync.includes("prayerMemory")) throw new Error("Phase 11 notes and prayer memory must not enter the existing private-sync reconciliation protocol.");
requireText(sync, "return { ...current, savedPeoples, prayerList };", "local-only memory preservation during sync merges");

const page = await read("src/pages/SavedPage.tsx");
for (const marker of [
  'data-v3-memory-page="true"',
  'data-memory-section="saved"',
  'data-memory-section="prayer-list"',
  'data-memory-section="prayer-memory"',
  'data-memory-section="recent"',
  "Private note",
  "Prayer memory",
  "Private by default.",
  "never enter that sync protocol",
  "It is not a prayer total or measure of faithfulness.",
  "Clear prayer memory",
]) requireText(page, marker, "Saved memory surface");
if (page.includes('from "../providers/peoplegroups"')) throw new Error("Saved must not cross the provider boundary directly in Phase 11.");

const styles = await read("src/styles/atlas-foundation/memory.css");
for (const marker of [
  ".v3-memory-page",
  ".v3-memory-hero",
  ".v3-memory-card",
  ".v3-memory-note",
  ".v3-memory-timeline",
  "min-height: var(--v3-control-height)",
  "@media (max-width: 720px)",
]) requireText(styles, marker, "Personal Mission Memory atlas styling");

const main = await read("src/main.tsx");
const memoryStyleIndex = main.indexOf('import "./styles/atlas-foundation/memory.css";');
const accessibilityIndex = main.indexOf('import "./styles/foundation/accessibility.css";');
if (memoryStyleIndex < 0 || accessibilityIndex < 0 || memoryStyleIndex > accessibilityIndex) throw new Error("Phase 11 memory styles must load before the final accessibility layer.");

const phase4 = await read("scripts/v3/phase4-check.ts");
requireText(phase4, '"SavedPage.tsx"', "Phase 11 visual migration ownership");

const browser = await read("tests/e2e/v3-phase11-personal-memory.spec.ts");
for (const marker of [
  "Saved separates bookmarks, prayer intent, memory and recents",
  "private notes persist locally without changing source content",
  "prayer memory is bounded local history with explicit deletion",
  "Personal Mission Memory remains readable on mobile",
]) requireText(browser, marker, "Phase 11 browser certification");

const docs = await read("docs/V3_PHASE11_PERSONAL_MISSION_MEMORY.md");
for (const marker of [
  "Personal Mission Memory",
  "Remember",
  "Saved is not Prayer",
  "device-local",
  "30",
  "2,000",
  "storage key remains `unreached.personal.v2`",
  "Phase 12",
  "Discover → Understand → See the need → Pray → Remember",
]) requireText(docs, marker, "Phase 11 documentation");

const pkg = await read("package.json");
requireText(pkg, '"v3:phase11-check": "tsx scripts/v3/phase11-check.ts"', "Phase 11 package gate");
requireText(pkg, "npm run v3:phase10-check && npm run v3:phase11-check", "blocking Phase 11 build integration");
requireText(pkg, '"v3:phase11-memory-visual"', "Phase 11 browser script");

console.log("V3 Phase 11 Personal Mission Memory checks passed: v2→v3 migration, semantic Saved/Prayer separation, local-only notes and bounded prayer memory, explicit deletion, unchanged sync scope, responsive atlas styling, and anti-gamification boundaries are enforced.");
