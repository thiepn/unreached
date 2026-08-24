import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { orderPrayerRotation, selectNextPrayerRotationEntry } from "../../src/personalization/rotation.js";
import type { PrayerListEntry } from "../../src/personalization/types.js";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");
const pkg = JSON.parse(await readText("package.json")) as { version?: string };
if (pkg.version !== "1.7.0") throw new Error(`v1.7 package version mismatch: ${String(pkg.version)}`);

const entries: PrayerListEntry[] = [
  { sourcePeopleId: 12319, peopleGroupId: "people-entity:peoplegroups:12319", name: "Fon", countryName: "Benin", languageName: "Fon", addedAt: "2026-08-22T10:00:00.000Z", lastPrayedAt: "2026-08-24T20:00:00.000Z" },
  { sourcePeopleId: 11954, peopleGroupId: "people-entity:peoplegroups:11954", name: "Somali", countryName: "Somalia", languageName: "Somali", addedAt: "2026-08-20T10:00:00.000Z", lastPrayedAt: null },
  { sourcePeopleId: 24277, peopleGroupId: "people-entity:peoplegroups:24277", name: "Kazakh", countryName: "Kazakhstan", languageName: "Kazakh", addedAt: "2026-08-21T10:00:00.000Z", lastPrayedAt: "2026-08-23T20:00:00.000Z" },
  { sourcePeopleId: 24529, peopleGroupId: "people-entity:peoplegroups:24529", name: "Tajiks", countryName: "Tajikistan", languageName: "Tajik", addedAt: "2026-08-19T10:00:00.000Z", lastPrayedAt: null },
];
const ordered = orderPrayerRotation(entries);
const expected = [24529, 11954, 24277, 12319];
if (ordered.map((entry) => entry.sourcePeopleId).join(",") !== expected.join(",")) throw new Error(`v1.7 rotation order mismatch: ${ordered.map((entry) => entry.sourcePeopleId).join(",")}`);
if (entries[0]?.sourcePeopleId !== 12319) throw new Error("v1.7 rotation must not mutate stored prayer-list order.");

const eligible = new Set([12319, 24277]);
const selected = selectNextPrayerRotationEntry(entries, { eligibleSourcePeopleIds: eligible });
if (selected?.sourcePeopleId !== 24277) throw new Error("v1.7 eligibility-aware rotation must skip ineligible entries and choose least-recently recorded eligible entry.");
const excluded = selectNextPrayerRotationEntry(entries, { eligibleSourcePeopleIds: eligible, excludeSourcePeopleId: 24277 });
if (excluded?.sourcePeopleId !== 12319) throw new Error("v1.7 next-person selection must honor current-person exclusion.");

const types = await readText("src/personalization/types.ts");
const model = await readText("src/personalization/model.ts");
const rotation = await readText("src/personalization/rotation.ts");
const prayPage = await readText("src/pages/PrayPage.tsx");
const savedPage = await readText("src/pages/SavedPage.tsx");
const focusPage = await readText("src/pages/PrayerFocusPage.tsx");
const main = await readText("src/main.tsx");
if (!types.includes("version: z.literal(2)")) throw new Error("v1.7 must reuse personalization schema v2 rather than add tracking fields.");
const persistentSource = `${types}\n${model}`;
for (const forbidden of ["rotationScore", "priorityScore", "urgencyScore", "overdueAt", "prayerCount", "prayerStreak", "rotationPosition"]) if (persistentSource.includes(forbidden)) throw new Error(`v1.7 must not persist ranking/performance field ${forbidden}.`);
for (const marker of ["No prayer date recorded yet", "least-recently recorded", "not a mission-priority, urgency", "orderPrayerRotation"]) if (!rotation.includes(marker)) throw new Error(`v1.7 rotation helper missing contract marker: ${marker}`);
for (const marker of ["Next from your private prayer rotation", "selectNextPrayerRotationEntry", "not a priority ranking"]) if (!prayPage.includes(marker)) throw new Error(`v1.7 Prayer integration missing: ${marker}`);
for (const marker of ["Prayer rotation", "Next return point", "data-prayer-rotation-next", "does not rank urgency"]) if (!savedPage.includes(marker)) throw new Error(`v1.7 Saved rotation workspace missing: ${marker}`);
for (const marker of ["Continue with", "data-next-prayer-peid", "selectNextPrayerRotationEntry"]) if (!focusPage.includes(marker)) throw new Error(`v1.7 focused-prayer continuation missing: ${marker}`);
if (!main.includes('"./styles/v17.css"')) throw new Error("v1.7 stylesheet is not loaded.");

console.log("v1.7 prayer rotation checks passed: derived oldest-return ordering, eligibility filtering, guided continuation, schema-v2 reuse, and non-priority/non-performance guardrails.");
