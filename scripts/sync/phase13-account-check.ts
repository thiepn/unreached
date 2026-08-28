import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");

const [account, prayer, saved, main] = await Promise.all([
  readText("src/pages/AccountPage.tsx"),
  readText("src/pages/PrayPage.tsx"),
  readText("src/pages/SavedPage.tsx"),
  readText("src/main.tsx"),
]);

for (const marker of [
  "account-next-step",
  "account-primary-actions",
  "account-privacy-disclosure",
  "account-controls-disclosure",
  "account-merge-disclosure",
  "account-danger-disclosure",
  "No action needed.",
  "Automatic sync is active",
  "Check sign-in status",
  "Sync paused · different account",
  "Sync paused · sign in again",
  "Sign in again",
  "Merge this device & enable sync",
  "Export private data",
  "Disconnect this device",
  "Delete private account data",
]) {
  if (!account.includes(marker)) throw new Error(`Phase 13 Account UX contract missing: ${marker}`);
}
if (account.includes('class="account-grid"')) throw new Error("Phase 13 must not keep the old equal-weight account-grid hierarchy.");
if (account.includes("I finished signing in")) throw new Error("Phase 13 removes the duplicate equal-weight sign-in completion action.");
if (!account.includes("Nothing is uploaded while you remain signed out")) throw new Error("Phase 13 must retain explicit local-only default copy.");

if (prayer.includes("stay only in this browser")) throw new Error("Prayer privacy copy must not claim browser-only storage when Private Sync can be enabled.");
for (const marker of ["local by default", "Private Sync", "Recent browsing never syncs"]) {
  if (!prayer.includes(marker)) throw new Error(`Phase 13 Prayer privacy copy missing: ${marker}`);
}
for (const marker of ["local by default", "Private Sync", "Recent browsing never syncs"]) {
  if (!saved.includes(marker)) throw new Error(`Phase 13 My lists privacy copy missing: ${marker}`);
}

if (!main.includes('"./styles/account/ux.css"')) throw new Error("Phase 13 Account UX stylesheet is not loaded.");

console.log("Phase 13 Account UX gate passed: local-first status/action hierarchy, progressive advanced controls, preserved recovery actions, and sync-aware privacy copy are enforced.");
