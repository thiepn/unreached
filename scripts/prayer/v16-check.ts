import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  addPrayerPerson,
  normalizePersonalizationState,
  recordPrayerForPerson,
  removePrayerPerson,
} from "../../src/personalization/model.js";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");
const readJson = async <T>(path: string): Promise<T> => JSON.parse(await readText(path)) as T;

const pkg = await readJson<{ version?: string }>("package.json");
if (pkg.version !== "1.6.0") throw new Error(`v1.6 package version mismatch: ${String(pkg.version)}`);

const legacy = {
  version: 1,
  savedPeoples: [{
    sourcePeopleId: 12319,
    peopleGroupId: "people-entity:peoplegroups:12319",
    name: "Fon",
    largestCountryName: "Benin",
    primaryLanguageName: "Fon",
    classification: "unreached-only",
    frontier: null,
    savedAt: "2026-08-24T18:00:00.000Z",
  }],
  recent: [{
    kind: "people",
    key: "12319",
    label: "Fon",
    secondary: "Benin",
    href: "#/peoples/12319",
    visitedAt: "2026-08-24T18:05:00.000Z",
  }],
};
const migrated = normalizePersonalizationState(legacy);
if (migrated.version !== 2 || migrated.savedPeoples.length !== 1 || migrated.recent.length !== 1 || migrated.prayerList.length !== 0) {
  throw new Error("v1.6 personalization migration must preserve v1 Saved/Recent data and initialize an empty prayer list.");
}

const snapshot = {
  sourcePeopleId: 12319,
  peopleGroupId: "people-entity:peoplegroups:12319",
  name: "Fon",
  countryName: "Benin",
  languageName: "Fon",
};
const added = addPrayerPerson(migrated, snapshot, new Date("2026-08-24T20:00:00.000Z"));
if (added.prayerList.length !== 1 || added.prayerList[0]?.lastPrayedAt !== null) throw new Error("Adding a prayer-list entry must not fabricate a prayer date.");
const recorded = recordPrayerForPerson(added, snapshot, new Date("2026-08-24T20:30:00.000Z"));
if (recorded.prayerList[0]?.lastPrayedAt !== "2026-08-24T20:30:00.000Z") throw new Error("Prayer practice must store only the explicit latest prayer timestamp.");
const removed = removePrayerPerson(recorded, 12319);
if (removed.prayerList.length !== 0) throw new Error("Prayer-list removal failed.");

const personalizationFiles = await Promise.all([
  "src/personalization/types.ts",
  "src/personalization/model.ts",
  "src/personalization/runtime.ts",
].map(readText));
const personalizationSource = personalizationFiles.join("\n");
for (const forbidden of ["prayerCount", "totalPrayers", "prayerScore", "prayerStreak", "leaderboardRank"]) {
  if (personalizationSource.includes(forbidden)) throw new Error(`v1.6 private prayer data must not introduce competitive/spiritual metric field '${forbidden}'.`);
}
const runtime = personalizationFiles[2]!;
for (const forbiddenNetwork of ["fetch(", "XMLHttpRequest", "sendBeacon", "WebSocket("]) {
  if (runtime.includes(forbiddenNetwork)) throw new Error(`v1.6 personalization runtime must remain browser-local; found ${forbiddenNetwork}`);
}
if (!runtime.includes('unreached.personal.v2') || !runtime.includes('unreached.personal.v1')) throw new Error("v1.6 runtime must read v2 storage and preserve v1 migration fallback.");

const prayPage = await readText("src/pages/PrayPage.tsx");
for (const required of ["private prayer list", "listedEligibleInScope", "From your private prayer list", "togglePrayer(prayerSnapshotFromEntity(entity))"]) {
  if (!prayPage.includes(required)) throw new Error(`v1.6 Prayer page integration missing: ${required}`);
}

const focusPage = await readText("src/pages/PrayerFocusPage.tsx");
for (const required of ["Record prayer today", "Prayer noted today", "recordPrayer(prayerSnapshot)", "stores only the latest timestamp"] ) {
  if (!focusPage.includes(required)) throw new Error(`v1.6 focused-prayer practice missing: ${required}`);
}

const savedPage = await readText("src/pages/SavedPage.tsx");
for (const required of ["Saved & prayer", "Prayer list", "data-prayer-list-peid", "No prayer date recorded", "removePrayer(person.sourcePeopleId)"]) {
  if (!savedPage.includes(required)) throw new Error(`v1.6 Saved/prayer workspace missing: ${required}`);
}

const main = await readText("src/main.tsx");
if (!main.includes('"./styles/v16.css"')) throw new Error("v1.6 stylesheet is not loaded.");

console.log("v1.6 private prayer practice checks passed: v1→v2 migration, browser-local prayer list, latest-only prayer timestamp, daily-list preference, and non-competitive policy guardrails.");
