import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { buildPeopleExplorerDataset } from "../../src/peoples/derive.js";
import { filterPeopleProfiles, type PeopleFilterState } from "../../src/peoples/filter.js";
import { peopleExplorerAvailabilitySchema } from "../../src/peoples/types.js";
import { loadFixtureDataset } from "../data/fixtures.js";

const { dataset } = await loadFixtureDataset();
const peoples = buildPeopleExplorerDataset(dataset, "2026-08-21T21:05:00Z");

if (!peoples.fixture) throw new Error("Synthetic people dataset must remain marked as fixture.");
if (peoples.peoples.length !== 1) throw new Error(`Expected one synthetic people profile, received ${peoples.peoples.length}.`);

const people = peoples.peoples[0];
if (!people || people.sourcePeopleId !== 999001) throw new Error("Synthetic people profile 999001 was not generated.");
if (people.name !== "Example People") throw new Error("Synthetic people name was not retained.");
if (people.globalPopulation.value !== 1500000) throw new Error("Global population must come from the PGAC/global record.");
if (people.mission.classification !== "unreached" || people.mission.frontier !== true) throw new Error("Mission classification was not retained.");
if (people.primaryLanguage?.name !== "Example Language") throw new Error("Primary language resolution failed.");
if (people.primaryReligion?.name !== "Islam") throw new Error("Primary religion resolution failed.");
if (people.scripture.basis !== "primary-language" || people.scripture.bibleStatus !== "portions") throw new Error("Scripture summary must prefer the primary-language record.");
if (people.countryCount !== 1 || people.countries[0]?.iso3 !== "XZZ") throw new Error("People country contexts were not generated correctly.");
if (people.countries[0]?.locationText !== "Synthetic fixture location used only for schema validation.") throw new Error("Country location context was lost.");
if (people.countries[0]?.hasCoordinates !== true) throw new Error("Coordinate availability metadata was not retained.");
if (people.relatedPeople.length !== 0) throw new Error("Single-profile fixture must not invent related peoples.");
if (!people.provenance.length || !people.sourceIds.length) throw new Error("People provenance/source IDs were not retained.");

const base: PeopleFilterState = {
  query: "Example",
  status: "frontier",
  countryIso3: "XZZ",
  languageId: "language:qaa",
  religionId: "religion:6",
  scriptureStatus: "portions",
  minimumPopulation: 1000000,
  sort: "population-desc",
};
if (filterPeopleProfiles(peoples.peoples, base).length !== 1) throw new Error("People filtering failed for the synthetic profile.");
if (filterPeopleProfiles(peoples.peoples, { ...base, minimumPopulation: 2000000 }).length !== 0) throw new Error("Minimum population filtering failed.");
if (filterPeopleProfiles(peoples.peoples, { ...base, query: "missing" }).length !== 0) throw new Error("People query filtering failed.");

const statusRaw = JSON.parse(await readFile(resolve(process.cwd(), "public/data/peoples/status.json"), "utf8")) as unknown;
const status = peopleExplorerAvailabilitySchema.parse(statusRaw);
const runtimeStatus = statusRaw as { mode?: unknown; sourceIds?: unknown };
if (!status.available) throw new Error("U12C production people runtime must be active.");
if (status.fixture) throw new Error("Production people status must not advertise fixture data.");
if (status.datasetUrl !== null) throw new Error("Runtime people publication must not expose a static dataset URL.");
if (runtimeStatus.mode !== "runtime-api") throw new Error("Production people status must declare runtime-api mode.");
if (!Array.isArray(runtimeStatus.sourceIds) || !runtimeStatus.sourceIds.includes("peoplegroups-org-api")) throw new Error("Production people runtime must identify PeopleGroups.org as its source.");

console.log("People Group Explorer validation passed, including U12C runtime publication mode.");
