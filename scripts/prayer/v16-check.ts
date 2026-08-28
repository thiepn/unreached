import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { addPrayerPerson, normalizePersonalizationState, recordPrayerForPerson, removePrayerPerson } from "../../src/personalization/model.js";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");
const pkg = JSON.parse(await readText("package.json")) as { version?: string };
const match = pkg.version?.match(/^(\d+)\.(\d+)\.(\d+)$/);
if (!match || Number(match[1]) < 1 || (Number(match[1]) === 1 && Number(match[2]) < 6)) throw new Error(`v1.6 capability gate requires package >=1.6.0, got ${String(pkg.version)}`);

const migrated = normalizePersonalizationState({ version: 1, savedPeoples: [{ sourcePeopleId: 12319, peopleGroupId: "people-entity:peoplegroups:12319", name: "Fon", largestCountryName: "Benin", primaryLanguageName: "Fon", classification: "unreached-only", frontier: null, savedAt: "2026-08-24T18:00:00.000Z" }], recent: [{ kind: "people", key: "12319", label: "Fon", secondary: "Benin", href: "#/peoples/12319", visitedAt: "2026-08-24T18:05:00.000Z" }] });
if (migrated.version !== 2 || migrated.savedPeoples.length !== 1 || migrated.recent.length !== 1 || migrated.prayerList.length !== 0) throw new Error("v1.6 migration contract failed.");

const snapshot = { sourcePeopleId: 12319, peopleGroupId: "people-entity:peoplegroups:12319", name: "Fon", countryName: "Benin", languageName: "Fon" };
const added = addPrayerPerson(migrated, snapshot, new Date("2026-08-24T20:00:00.000Z"));
if (added.prayerList[0]?.lastPrayedAt !== null) throw new Error("Adding a prayer entry fabricated a prayer date.");
const recorded = recordPrayerForPerson(added, snapshot, new Date("2026-08-24T20:30:00.000Z"));
if (recorded.prayerList[0]?.lastPrayedAt !== "2026-08-24T20:30:00.000Z") throw new Error("Latest-only prayer timestamp contract failed.");
if (removePrayerPerson(recorded, 12319).prayerList.length !== 0) throw new Error("Prayer-list removal failed.");

const types = await readText("src/personalization/types.ts");
const model = await readText("src/personalization/model.ts");
const runtime = await readText("src/personalization/runtime.ts");
const prayPage = await readText("src/pages/PrayPage.tsx");
const focusPage = await readText("src/pages/PrayerFocusPage.tsx");
const savedPage = await readText("src/pages/SavedPage.tsx");
const main = await readText("src/main.tsx");
const localSource = `${types}\n${model}\n${runtime}`;
for (const forbidden of ["prayerCount", "totalPrayers", "prayerScore", "prayerStreak", "leaderboardRank"]) if (localSource.includes(forbidden)) throw new Error(`Forbidden prayer metric field: ${forbidden}`);
for (const network of ["fetch(", "XMLHttpRequest", "sendBeacon", "WebSocket("]) if (runtime.includes(network)) throw new Error(`Personalization runtime must remain browser-local: ${network}`);
if (!runtime.includes("unreached.personal.v2") || !runtime.includes("unreached.personal.v1")) throw new Error("v2 storage + v1 fallback contract missing.");
for (const [source, marker] of [[prayPage, "private prayer list"], [focusPage, "Record prayer today"], [focusPage, "recordPrayer(prayerSnapshot)"], [savedPage, "data-prayer-list-peid"], [main, '"./styles/prayer/practice.css"']] as const) if (!source.includes(marker)) throw new Error(`v1.6 retained capability missing: ${marker}`);

console.log("v1.6 private prayer practice capability gate passed on current release.");
