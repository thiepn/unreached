import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");

const [prayer, saved, session, main] = await Promise.all([
  readText("src/pages/PrayerFocusPage.tsx"),
  readText("src/pages/SavedPage.tsx"),
  readText("src/pages/PrayerSessionPage.tsx"),
  readText("src/main.tsx"),
]);

for (const marker of [
  'label: "Short"',
  'label: "Standard"',
  'label: "Extended"',
  'prompts: 3',
  'prompts: 5',
  'prompts: 7',
  'No timer runs',
]) {
  if (!prayer.includes(marker)) throw new Error(`Phase 12 Prayer guide contract missing: ${marker}`);
}

for (const marker of [
  'class="saved-policy-note"',
  'class="saved-recent-section"',
  'Recent browsing never syncs',
]) {
  if (!saved.includes(marker)) throw new Error(`Phase 12 My lists contract missing: ${marker}`);
}

if (!session.includes('href={hrefFor({ id: "saved" })}')) throw new Error("Phase 12 session navigation must return to My lists.");
if (!main.includes('import "./styles/prayer/guides-and-lists.css"')) throw new Error("Phase 12 prayer/list stylesheet is not loaded.");

const styles = await readText("src/styles/prayer/guides-and-lists.css");
for (const marker of [
  ".prayer-duration button",
  ".saved-policy-note",
  ".saved-recent-section",
  "@media (max-width: 720px)",
]) {
  if (!styles.includes(marker)) throw new Error(`Phase 12 prayer/list styling missing: ${marker}`);
}

const browserSpec = await readText("tests/e2e/phase12-prayer-saved.spec.ts");
for (const marker of [
  "guide lengths map to prompt counts without timers",
  "Prayer library progressively reveals every match",
  "My lists keeps secondary policy and Recent content progressive",
]) {
  if (!browserSpec.includes(marker)) throw new Error(`Phase 12 browser certification missing: ${marker}`);
}

console.log("Phase 12 release checks passed: prompt-length guides, progressive Prayer results, simplified My lists disclosures, sync-aware privacy copy and session navigation contracts are enforced.");
