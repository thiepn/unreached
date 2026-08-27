import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");

const [prayPage, focusPage, savedPage, sessionPage, main] = await Promise.all([
  readText("src/pages/PrayPage.tsx"),
  readText("src/pages/PrayerFocusPage.tsx"),
  readText("src/pages/SavedPage.tsx"),
  readText("src/pages/PrayerSessionPage.tsx"),
  readText("src/main.tsx"),
]);

for (const marker of ["PRAYER_LIBRARY_BATCH_SIZE = 24", "Showing {visible.length} of {scoped.length}", "Show {Math.min(PRAYER_LIBRARY_BATCH_SIZE, remaining)} more"]) {
  if (!prayPage.includes(marker)) throw new Error(`Phase 12 Prayer library progressive-disclosure contract missing: ${marker}`);
}
if (prayPage.includes("slice(0, 60)") || prayPage.includes("Showing up to 60")) throw new Error("Phase 12 must not silently cap the Prayer library at 60 records.");

for (const marker of ["Short", "Standard", "Extended", "3 prompts", "5 prompts", "7 prompts", "No timer runs"]) {
  if (!focusPage.includes(marker)) throw new Error(`Phase 12 focused-prayer length contract missing: ${marker}`);
}
for (const forbidden of ["2 min", "5 min", "10 min", "seconds per prompt", "Prayer mode length"]) {
  if (focusPage.includes(forbidden)) throw new Error(`Phase 12 focused-prayer UI must not expose pseudo-time semantics: ${forbidden}`);
}

for (const marker of ["How prayer-list data is stored", "How saved-profile data is stored", "saved-recent-section", "My lists"]) {
  if (!savedPage.includes(marker)) throw new Error(`Phase 12 My lists simplification missing: ${marker}`);
}
if (!savedPage.includes('<details class="saved-section saved-recent-section">')) throw new Error("Phase 12 Recents must be collapsed by default with native details disclosure.");
if (savedPage.includes("<details class=\"saved-section saved-recent-section\" open")) throw new Error("Phase 12 Recents must not default open.");

if (sessionPage.includes("Saved & prayer")) throw new Error("Phase 12 prayer-session navigation must consistently use My lists naming.");
if (!main.includes('"./styles/v26-prayer-saved.css"')) throw new Error("Phase 12 stylesheet is not loaded.");

console.log("Phase 12 Prayer/Saved simplification gate passed: explicit prompt lengths, complete progressive Prayer browsing, collapsed secondary policy/recent content, and consistent My lists naming.");
