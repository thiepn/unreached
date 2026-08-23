import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { buildLiveLanguageRecords, filterLiveLanguages, type LiveLanguageFilterState } from "../../src/languages/live.js";
import { languageExplorerAvailabilitySchema } from "../../src/languages/types.js";
import { toRuntimePeopleContext } from "../../src/providers/peoplegroups/model.js";
import type { PeopleGroupsApiRecord } from "../../src/providers/peoplegroups/types.js";

const records: PeopleGroupsApiRecord[] = [
  { PEID: 1001, PGID: "PG001001", NmDisp: "Test People", ISOalpha3: "BEN", Ctry: "Benin", Pop: 100000, ROL: "abc", Lang: "Test Language", LangFamily: "Test Family", PplNm: "Test People", GSEC: 2, Bible: "Available", Jesus: "Available", ResTot: 3, UpdatedDate: "2026-08-01T00:00:00Z" },
  { PEID: 1002, PGID: "PG001002", NmDisp: "Test People", ISOalpha3: "NGA", Ctry: "Nigeria", Pop: null, ROL: "abc", Lang: "Test Language", LangFamily: "Test Family", PplNm: "Test People", GSEC: 5, Bible: "Available", Jesus: "Not Available", ResTot: 3, UpdatedDate: "2026-08-02T00:00:00Z" },
  { PEID: 1003, PGID: "PG001003", NmDisp: "Second People", ISOalpha3: "BEN", Ctry: "Benin", Pop: 70000, ROL: "abc", Lang: "Test Language", LangFamily: "Test Family", PplNm: "Second People", GSEC: 1, Bible: "Not Available", Jesus: null, ResTot: 1, UpdatedDate: "2026-08-03T00:00:00Z" },
  { PEID: 1004, PGID: "PG001004", NmDisp: "Other People", ISOalpha3: "GHA", Ctry: "Ghana", Pop: 25000, ROL: "def", Lang: "Other Language", LangFamily: "Other Family", PplNm: "Other People", GSEC: null, Bible: null, Jesus: null, ResTot: null, UpdatedDate: "2026-07-01T00:00:00Z" },
];

const contexts = records.map(toRuntimePeopleContext);
const languages = buildLiveLanguageRecords(contexts);
if (languages.length !== 2) throw new Error(`Expected two ISO-coded live languages, received ${languages.length}.`);

const language = languages.find((item) => item.iso6393 === "abc");
if (!language) throw new Error("Live language identity was not retained.");
if (language.name !== "Test Language" || language.familyName !== "Test Family") throw new Error("Live language source name/family aggregation failed.");
if (language.contextCount !== 3 || language.peopleEntityCount !== 3 || language.countryCount !== 2) throw new Error("Live language source-record/country/context aggregation failed.");
if (language.knownPopulation !== 170000 || language.populationKnownContextCount !== 2 || language.populationCoverageComplete) throw new Error("Live language partial-population semantics failed.");
if (language.unreachedContextCount !== 2 || language.otherContextCount !== 1 || language.unknownContextCount !== 0) throw new Error("Live language GSEC context aggregation failed.");
if (language.bible.knownContextCount !== 3 || language.bible.breakdown.find((item) => item.label === "Available")?.contextCount !== 2 || language.bible.breakdown.find((item) => item.label === "Not Available")?.contextCount !== 1) throw new Error("Raw Bible availability labels were not preserved.");
if (language.jesusFilm.knownContextCount !== 2 || language.jesusFilm.breakdown.length !== 2) throw new Error("Raw Jesus Film availability labels were not preserved.");
if (language.resources.knownContextCount !== 3 || language.resources.values.length !== 2) throw new Error("Raw resource-total field distribution failed.");
if (!language.denominator.includes("PGID country-context")) throw new Error("Language denominator must remain explicit.");
if (language.sourceUpdatedAt !== "2026-08-03T00:00:00Z") throw new Error("Newest source update was not retained.");
if (language.peoples[0]?.peid !== 1001 || language.countries[0]?.iso3 !== "BEN") throw new Error("Language relationship summaries failed.");
if (new Set(language.peoples.map((people) => people.peid)).size !== 3) throw new Error("Language people summaries must preserve separate PEID/PGID source records rather than merge same-named records.");

const base: LiveLanguageFilterState = { query: "Test", reach: "has-unreached", bible: "Available", sort: "unreached-contexts-desc" };
if (filterLiveLanguages(languages, base).length !== 1) throw new Error("Live language filtering failed.");
if (filterLiveLanguages(languages, { ...base, reach: "unknown-only", bible: "all" }).length !== 0) throw new Error("Unknown-only language filtering failed.");
if (filterLiveLanguages(languages, { ...base, query: "Second People", bible: "all" }).length !== 1) throw new Error("Language people-name search failed.");

const serialized = JSON.stringify(language);
for (const forbidden of ["complete-bible", "new-testament", "translation-needed", "frontier", "JPScale"]) {
  if (serialized.includes(forbidden)) throw new Error(`U12E live language model leaked incompatible normalized semantics: ${forbidden}.`);
}

const statusRaw = JSON.parse(await readFile(resolve(process.cwd(), "public/data/languages/status.json"), "utf8")) as {
  available?: unknown;
  fixture?: unknown;
  mode?: unknown;
  datasetUrl?: unknown;
  sourceIds?: unknown;
};
languageExplorerAvailabilitySchema.parse(statusRaw);
if (statusRaw.available !== true || statusRaw.fixture !== false || statusRaw.mode !== "runtime-api" || statusRaw.datasetUrl !== null) throw new Error("U12E production language status must be runtime-api with no bundled dataset.");
if (!Array.isArray(statusRaw.sourceIds) || !statusRaw.sourceIds.includes("peoplegroups-org-api")) throw new Error("U12E language status must identify PeopleGroups.org.");

console.log("U12E/U12F Languages & Resources validation passed: live ISO aggregation over separate PGID/PEID records, raw source labels, explicit coverage, and no fabricated Scripture milestones.");
