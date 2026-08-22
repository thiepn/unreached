import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { buildCountryExplorerDataset } from "../../src/countries/derive.js";
import { countryExplorerAvailabilitySchema } from "../../src/countries/types.js";
import { loadFixtureDataset } from "../data/fixtures.js";

const { dataset } = await loadFixtureDataset();
const countries = buildCountryExplorerDataset(dataset, "2026-08-21T20:30:00Z");

if (!countries.fixture) throw new Error("Synthetic country dataset must remain marked as fixture.");
if (countries.countries.length !== 1) throw new Error(`Expected one synthetic country, received ${countries.countries.length}.`);

const country = countries.countries[0];
if (!country || country.iso3 !== "XZZ") throw new Error("Synthetic country XZZ was not generated.");
if (country.peopleGroups.length !== 1) throw new Error("Synthetic country people ranking is incomplete.");
if (country.peopleGroups[0]?.classification !== "unreached") throw new Error("Synthetic unreached classification was not retained.");
if (country.peopleGroups[0]?.frontier !== true) throw new Error("Synthetic frontier classification was not retained.");
if (country.languages[0]?.name !== "Example Language") throw new Error("Synthetic language aggregation failed.");
if (country.religions[0]?.name !== "Islam") throw new Error("Synthetic religion aggregation failed.");
if (country.scripture[0]?.status !== "portions") throw new Error("Synthetic Scripture aggregation failed.");
if (country.mission.unreachedShare !== 100) throw new Error("Country mission summary is inconsistent with U4 aggregation.");

const statusRaw = JSON.parse(await readFile(resolve(process.cwd(), "public/data/countries/status.json"), "utf8")) as unknown;
const status = countryExplorerAvailabilitySchema.parse(statusRaw);
const runtimeStatus = statusRaw as { mode?: unknown; sourceIds?: unknown };
if (!status.available) throw new Error("U12C production country runtime must be active.");
if (status.fixture) throw new Error("Production country status must not advertise fixture data.");
if (status.datasetUrl !== null) throw new Error("Runtime country publication must not expose a static dataset URL.");
if (runtimeStatus.mode !== "runtime-api") throw new Error("Production country status must declare runtime-api mode.");
if (!Array.isArray(runtimeStatus.sourceIds) || !runtimeStatus.sourceIds.includes("peoplegroups-org-api")) throw new Error("Production country runtime must identify PeopleGroups.org as its source.");

console.log("Country Explorer validation passed, including U12C runtime publication mode.");
