import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { buildPrayerSessionPlan, prayerSessionSizeFromValue } from "../../src/personalization/session.js";
import type { PrayerListEntry } from "../../src/personalization/types.js";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");
const pkg = JSON.parse(await readText("package.json")) as { version?: string };
if (pkg.version !== "1.8.0") throw new Error(`v1.8 package version mismatch: ${String(pkg.version)}`);

const entries: PrayerListEntry[] = [
  { sourcePeopleId: 24277, peopleGroupId: "people-entity:peoplegroups:24277", name: "Kazakh", countryName: "Kazakhstan", languageName: "Kazakh", addedAt: "2026-08-21T10:00:00.000Z", lastPrayedAt: "2026-08-23T20:00:00.000Z" },
  { sourcePeopleId: 12319, peopleGroupId: "people-entity:peoplegroups:12319", name: "Fon", countryName: "Benin", languageName: "Fon", addedAt: "2026-08-22T10:00:00.000Z", lastPrayedAt: null },
  { sourcePeopleId: 11954, peopleGroupId: "people-entity:peoplegroups:11954", name: "Somali", countryName: "Somalia", languageName: "Somali", addedAt: "2026-08-20T10:00:00.000Z", lastPrayedAt: null },
  { sourcePeopleId: 24529, peopleGroupId: "people-entity:peoplegroups:24529", name: "Tajiks", countryName: "Tajikistan", languageName: "Tajik", addedAt: "2026-08-19T10:00:00.000Z", lastPrayedAt: "2026-08-24T20:00:00.000Z" },
];

const eligible = new Set([11954, 12319, 24277, 24529]);
const three = buildPrayerSessionPlan(entries, { eligibleSourcePeopleIds: eligible, size: 3 });
if (three.map((entry) => entry.sourcePeopleId).join(",") !== "11954,12319,24277") throw new Error(`v1.8 3-person plan order mismatch: ${three.map((entry) => entry.sourcePeopleId).join(",")}`);
if (entries.map((entry) => entry.sourcePeopleId).join(",") !== "24277,12319,11954,24529") throw new Error("v1.8 session planning must not mutate persisted prayer-list order.");
const five = buildPrayerSessionPlan(entries, { eligibleSourcePeopleIds: eligible, size: 5 });
if (five.length !== 4) throw new Error("v1.8 5-person plan must gracefully use the available eligible list when fewer than five exist.");
const all = buildPrayerSessionPlan(entries, { eligibleSourcePeopleIds: new Set([12319, 24529]), size: "all" });
if (all.map((entry) => entry.sourcePeopleId).join(",") !== "12319,24529") throw new Error("v1.8 full-session plan must preserve rotation order after eligibility filtering.");
if (prayerSessionSizeFromValue("5") !== 5 || prayerSessionSizeFromValue("all") !== "all" || prayerSessionSizeFromValue("bad") !== 3) throw new Error("v1.8 session-size parsing contract failed.");

const types = await readText("src/personalization/types.ts");
const model = await readText("src/personalization/model.ts");
const runtime = await readText("src/personalization/runtime.ts");
if (!types.includes("version: z.literal(2)")) throw new Error("v1.8 must reuse personalization schema v2.");
const persistentSource = `${types}\n${model}\n${runtime}`;
for (const forbidden of ["sessionHistory", "sessionCount", "completionRate", "completionPercent", "sessionScore", "sessionStreak", "sessionCompletedAt", "prayerMinutesTotal"]) {
  if (persistentSource.includes(forbidden)) throw new Error(`v1.8 must not persist session/performance field ${forbidden}.`);
}

const sessionHelper = await readText("src/personalization/session.ts");
for (const marker of ["frozen prayer-session plan", "must not reorder", "continuity aid only", "buildPrayerSessionPlan"]) if (!sessionHelper.includes(marker)) throw new Error(`v1.8 session helper missing contract marker: ${marker}`);

const router = await readText("src/app/router.ts");
const app = await readText("src/app/App.tsx");
if (!router.includes('"/pray/session": "pray"')) throw new Error("v1.8 router does not recognize /pray/session.");
if (!app.includes("PrayerSessionPage") || !app.includes('route.path === "/pray/session"')) throw new Error("v1.8 app shell does not materialize the prayer-session route.");

const savedPage = await readText("src/pages/SavedPage.tsx");
for (const marker of ["Guided prayer session", "data-prayer-session-size", "Full eligible list", "session history"]) if (!savedPage.includes(marker)) throw new Error(`v1.8 Saved session launcher missing: ${marker}`);

const sessionPage = await readText("src/pages/PrayerSessionPage.tsx");
for (const marker of ["data-prayer-session-plan", "was frozen when this session opened", "Three prayer prompts", "Record prayer today", "stores no session history", "page state"]) if (!sessionPage.includes(marker)) throw new Error(`v1.8 prayer-session surface missing: ${marker}`);

const main = await readText("src/main.tsx");
if (!main.includes('"./styles/v18.css"')) throw new Error("v1.8 stylesheet is not loaded.");

console.log("v1.8 guided prayer-session checks passed: frozen rotation plan, 3/5/full sizing, eligibility filtering, schema-v2 reuse, latest-only recording, and zero persisted session/performance state.");
