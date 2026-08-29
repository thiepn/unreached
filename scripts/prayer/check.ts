import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { loadFixtureDataset } from "../data/fixtures.js";
import { editorialContextDatasetSchema } from "../../src/context/types.js";
import { buildPeopleExplorerDataset } from "../../src/peoples/derive.js";
import { LIVE_PRAYER_TEMPLATE_REVIEW } from "../../src/prayer/live.js";
import { assertPrayerDatasetIntegrity, prayerFlow, selectDailyPrayerProfile } from "../../src/prayer/policy.js";
import { prayerAvailabilitySchema, prayerDatasetSchema } from "../../src/prayer/types.js";

const rawPrayer = JSON.parse(await readFile(resolve(process.cwd(), "data/fixtures/prayer.synthetic.json"), "utf8")) as unknown;
const prayer = prayerDatasetSchema.parse(rawPrayer);
const rawContext = JSON.parse(await readFile(resolve(process.cwd(), "data/fixtures/context.synthetic.json"), "utf8")) as unknown;
const context = editorialContextDatasetSchema.parse(rawContext);
const { dataset } = await loadFixtureDataset();
const people = buildPeopleExplorerDataset(dataset, "2026-08-21T22:20:00Z");

assertPrayerDatasetIntegrity(prayer, people.peoples, context, new Date("2026-08-22T00:00:00Z"));
if (!prayer.fixture) throw new Error("Synthetic prayer dataset must remain fixture data.");
const profile = prayer.profiles[0];
if (!profile || profile.sourcePeopleId !== 999001) throw new Error("Synthetic prayer profile missing.");
if (profile.prompts.length < 4 || profile.prompts.length > 7) throw new Error("Prayer prompt count rule failed.");
if (prayerFlow(profile, 2).length !== 3) throw new Error("Two-minute prayer flow must contain three prompts for this fixture.");
if (prayerFlow(profile, 5).length !== 5) throw new Error("Five-minute prayer flow must contain five prompts for this fixture.");
if (prayerFlow(profile, 10).length !== profile.prompts.length) throw new Error("Ten-minute prayer flow must contain all fixture prompts.");
const dailyA = selectDailyPrayerProfile(prayer.profiles, "2026-08-22");
const dailyB = selectDailyPrayerProfile(prayer.profiles, "2026-08-22");
if (!dailyA || dailyA.sourcePeopleId !== dailyB?.sourcePeopleId) throw new Error("Daily prayer selection is not deterministic.");
if (selectDailyPrayerProfile(prayer.profiles, "2026-08-22", "XZZ")?.sourcePeopleId !== 999001) throw new Error("Country-scoped daily prayer selection failed.");

if (LIVE_PRAYER_TEMPLATE_REVIEW.status !== "release-certified-template") throw new Error("U12C live prayer template must remain release-certified.");
if (LIVE_PRAYER_TEMPLATE_REVIEW.reviewedAt !== "2026-08-29") throw new Error("U12C prayer template must retain the Phase 5 final review date.");

const statusRaw = JSON.parse(await readFile(resolve(process.cwd(), "public/data/prayer/status.json"), "utf8")) as unknown;
const status = prayerAvailabilitySchema.parse(statusRaw);
const runtimeStatus = statusRaw as { mode?: unknown; sourceIds?: unknown; templateVersion?: unknown; templateReviewedAt?: unknown };
if (!status.available) throw new Error("U12C production prayer runtime must be active.");
if (status.fixture) throw new Error("Production prayer status must not advertise fixture data.");
if (status.datasetUrl !== null) throw new Error("Runtime prayer publication must not expose a static dataset URL.");
if (runtimeStatus.mode !== "runtime-api") throw new Error("Production prayer status must declare runtime-api mode.");
if (!Array.isArray(runtimeStatus.sourceIds) || !runtimeStatus.sourceIds.includes("peoplegroups-org-api")) throw new Error("Production prayer runtime must identify PeopleGroups.org as its source.");
if (runtimeStatus.templateVersion !== LIVE_PRAYER_TEMPLATE_REVIEW.version || runtimeStatus.templateReviewedAt !== LIVE_PRAYER_TEMPLATE_REVIEW.reviewedAt) throw new Error("Prayer status/template certification metadata is out of sync.");

console.log("U8 prayer validation passed, including U12C live template publication mode.");