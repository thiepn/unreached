import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { loadFixtureDataset } from "../data/fixtures.js";
import { buildLanguageExplorerDataset } from "../../src/languages/derive.js";
import { filterLanguages, type LanguageFilterState } from "../../src/languages/filter.js";
import { languageExplorerAvailabilitySchema } from "../../src/languages/types.js";

const { dataset } = await loadFixtureDataset();
const languages = buildLanguageExplorerDataset(dataset, "2026-08-22T00:30:00Z");
if (!languages.fixture) throw new Error("Synthetic language dataset must remain fixture data.");
if (languages.languages.length !== 1) throw new Error(`Expected one fixture language, received ${languages.languages.length}.`);

const language = languages.languages[0];
if (!language || language.iso6393 !== "qaa" || language.name !== "Example Language") throw new Error("Synthetic language identity was not retained.");
if (language.peopleGroupCount !== 1 || language.unreachedPeopleGroupCount !== 1 || language.frontierPeopleGroupCount !== 1) throw new Error("Language-to-people aggregation failed.");
if (language.countryCount !== 1 || language.countries[0]?.iso3 !== "XZZ") throw new Error("Language-to-country aggregation failed.");
if (language.knownRepresentedPopulation !== 1250000) throw new Error("Represented population must derive from country-specific people records.");
if (language.scripture.bibleStatus !== "portions" || language.scripture.hasAudioRecordings !== true || language.scripture.hasJesusFilm !== false) throw new Error("Language Scripture/resource normalization failed.");
if (language.familyName !== null || language.branchName !== null || language.taxonomySourceId !== null) throw new Error("U9 must not invent language family taxonomy.");
if (!language.peoples[0] || language.peoples[0].sourcePeopleId !== 999001) throw new Error("Canonical people relationship failed.");

const base: LanguageFilterState = { query: "Example", status: "living", scripture: "portions", focus: "no-complete-bible", sort: "scripture-need-first" };
if (filterLanguages(languages.languages, base).length !== 1) throw new Error("Language filtering failed for the fixture.");
if (filterLanguages(languages.languages, { ...base, focus: "translation-needed" }).length !== 0) throw new Error("Translation-needed filtering failed.");
if (filterLanguages(languages.languages, { ...base, query: "missing" }).length !== 0) throw new Error("Language query filtering failed.");

const statusRaw = JSON.parse(await readFile(resolve(process.cwd(), "public/data/languages/status.json"), "utf8")) as unknown;
const status = languageExplorerAvailabilitySchema.parse(statusRaw);
if (status.available) throw new Error("U9 production language data must remain unavailable until publication permission is intentionally enabled.");
if (status.fixture) throw new Error("Production language status must not advertise fixture data.");
if (status.datasetUrl !== null) throw new Error("Unavailable language status must not expose a dataset URL.");

console.log("Languages & Scripture validation passed.");
