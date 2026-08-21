import { buildSearchDocuments, searchDocuments } from "../../src/discovery/search.js";
import {
  emptyPersonalizationState,
  isPersonSaved,
  recordRecentVisit,
  removeSavedPerson,
  savePersonSnapshot,
} from "../../src/personalization/model.js";

const documents = buildSearchDocuments({
  peoples: [{ sourcePeopleId: 999001, name: "Example People", primaryLanguageName: "Example Language", primaryReligionName: "Islam", largestCountryName: "Exampleland", cluster: "Fixture Cluster", affinityBloc: "Fixture Bloc" }],
  countries: [{ iso3: "XZZ", name: "Exampleland", regionName: "Synthetic Region" }],
  languages: [{ iso6393: "qaa", name: "Example Language", familyName: null, branchName: null, countryNames: ["Exampleland"], peopleNames: ["Example People"] }],
});

if (documents.length !== 3) throw new Error("Cross-domain search index did not produce all three fixture documents.");
if (searchDocuments(documents, "Example People")[0]?.domain !== "people") throw new Error("Exact people search ranking failed.");
if (searchDocuments(documents, "XZZ")[0]?.domain !== "country") throw new Error("ISO3 country search failed.");
if (searchDocuments(documents, "qaa")[0]?.domain !== "language") throw new Error("ISO 639-3 language search failed.");
if (searchDocuments(documents, "Exmple People")[0]?.domain !== "people") throw new Error("Subsequence typo-tolerant search failed.");

let state = emptyPersonalizationState();
state = savePersonSnapshot(state, {
  sourcePeopleId: 999001,
  peopleGroupId: "people:999001",
  name: "Example People",
  largestCountryName: "Exampleland",
  primaryLanguageName: "Example Language",
  classification: "unreached",
  frontier: true,
}, new Date("2026-08-22T00:00:00Z"));
if (!isPersonSaved(state, 999001) || state.savedPeoples.length !== 1) throw new Error("Saving a people snapshot failed.");
state = removeSavedPerson(state, 999001);
if (isPersonSaved(state, 999001) || state.savedPeoples.length !== 0) throw new Error("Removing a saved people snapshot failed.");

for (let index = 0; index < 14; index += 1) {
  state = recordRecentVisit(state, {
    kind: index % 2 === 0 ? "country" : "language",
    key: `fixture-${index}`,
    label: `Fixture ${index}`,
    secondary: null,
    href: index % 2 === 0 ? "#/countries/XZZ" : "#/languages/qaa",
  }, new Date(`2026-08-22T00:${String(index).padStart(2, "0")}:00Z`));
}
if (state.recent.length !== 12) throw new Error("Recent exploration must be capped at twelve entries.");

state = recordRecentVisit(state, { kind: "language", key: "fixture-13", label: "Updated Fixture", secondary: null, href: "#/languages/qaa" }, new Date("2026-08-22T01:00:00Z"));
if (state.recent[0]?.label !== "Updated Fixture" || state.recent.filter((item) => item.kind === "language" && item.key === "fixture-13").length !== 1) throw new Error("Recent exploration deduplication failed.");

console.log("Search, discovery & local personalization validation passed.");
