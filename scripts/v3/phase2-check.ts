import { readFile } from "node:fs/promises";
import {
  assertMissionModelInvariants,
  normalizedMissionModelSchema,
  validateMissionModelInvariants,
  type NormalizedMissionModel,
} from "../../src/mission-model/index.js";
import { buildPeopleGroupsMissionModel } from "../../src/providers/peoplegroups/mission-model.js";
import type { PeopleGroupsApiRecord } from "../../src/providers/peoplegroups/types.js";

const retrievedAt = "2026-09-16T19:45:00.000Z";

function record(overrides: Partial<PeopleGroupsApiRecord> = {}): PeopleGroupsApiRecord {
  return {
    PEID: 100,
    PGID: "PG000100",
    NmDisp: "Example People",
    NmAlt: "Example Alternate Name",
    ISOalpha3: "BEN",
    Ctry: "Benin",
    Regn: "Africa",
    RegnSub: "Western Africa",
    Pop: 1000,
    Latitude: 8,
    Longitude: 2,
    ROL: "abc",
    Lang: "Example Language",
    LangFamily: "Example Family",
    ROR: "R1",
    Rlgn: "Example Religion",
    RlgnDiv: "Example Tradition",
    EvngLvl: "Less than 2%",
    CongExst: "Yes",
    Plnting: "Active",
    EngStat: "Engaged",
    GSEC: 2,
    GSECbrf: "Example GSEC",
    GSEClng: "Example GSEC description",
    SPI: 2,
    SPIdesc: "Example SPI",
    LPI: 1,
    LPIname: "Pioneer Unreached People Group",
    LPIdesc: "Example LPI description",
    Affbloc: "Example Bloc",
    PplClstr: "Example Cluster",
    PplNm: "Example Source People",
    Ethne: "Example Ethnographic Group",
    Bible: "Available",
    Jesus: "Not Available",
    ResTot: 2,
    PeopleDesc: "Source people description",
    LocationDesc: "Source location description",
    UpdatedDate: "2026-07-17T00:00:00.000Z",
    ...overrides,
  };
}

const records = [
  record(),
  record({
    PEID: 101,
    PGID: "PG000101",
    NmDisp: "Second People",
    ISOalpha3: "NGA",
    Ctry: "Nigeria",
    Pop: 500,
    GSEC: 5,
    GSECbrf: "Outside unreached range",
    EvngLvl: "2% or more",
  }),
  record({
    PEID: 200,
    PGID: "PG000200",
    NmDisp: "Unknown Data People",
    NmAlt: null,
    Pop: null,
    Latitude: 999,
    Longitude: 999,
    ROL: null,
    Lang: "Language without stable code",
    LangFamily: null,
    ROR: null,
    Rlgn: "Religion without stable code",
    RlgnDiv: null,
    GSEC: null,
    GSECbrf: null,
    GSEClng: null,
    EvngLvl: null,
    Bible: null,
    Jesus: null,
    ResTot: null,
  }),
];

const model = buildPeopleGroupsMissionModel(records, retrievedAt);
normalizedMissionModelSchema.parse(model);
assertMissionModelInvariants(model);

if (model.modelId !== "unreached-v3-mission-model" || model.schemaVersion !== 1) {
  throw new Error("Phase 2: normalized model identity/version is incorrect.");
}
if (model.people.length !== 3 || model.peopleContexts.length !== 3) {
  throw new Error("Phase 2: current PeopleGroups identity contract must preserve one people/context pair per certified PGID/PEID record.");
}
if (model.sourceSnapshots.length !== 1 || model.sourceSnapshots[0]?.recordCount !== 3) {
  throw new Error("Phase 2: source snapshot metadata must retain the normalized record count.");
}

const first = model.peopleContexts.find((context) => context.id === "people-context:peoplegroups:pg000100");
if (!first || first.peopleId !== "people:peoplegroups:100" || first.countryId !== "country:BEN") {
  throw new Error("Phase 2: stable provider-qualified identity/reference mapping failed.");
}
if (first.sourceRecord.recordId !== "PG000100" || first.sourceRecord.sourceId !== "peoplegroups-org-api") {
  throw new Error("Phase 2: source record identity was not retained.");
}
if (first.mission.classification.assertion.classification !== "unreached") {
  throw new Error("Phase 2: GSEC 0-3 classification must remain source-scoped unreached.");
}
if (first.mission.classification.assertion.sourceCode !== 2 || first.mission.classification.provenance.sourceFields[0] !== "GSEC") {
  throw new Error("Phase 2: mission classification lost raw source code/provenance.");
}
if (first.population.value !== 1000 || first.population.quality !== "estimated") {
  throw new Error("Phase 2: population estimate semantics drifted.");
}
if (first.resources.bibleAvailability.value !== "Available" || first.resources.jesusFilmAvailability.value !== "Not Available") {
  throw new Error("Phase 2: provider resource availability must remain source-native rather than becoming an invented completeness status.");
}
if (first.language.languageId !== "language:abc" || first.language.name.value !== "Example Language") {
  throw new Error("Phase 2: language relationship/observation failed.");
}
if (!model.languages.some((language) => language.id === "language:abc")) {
  throw new Error("Phase 2: referenced language entity missing.");
}
if (!model.religions.some((religion) => religion.code === "R1")) {
  throw new Error("Phase 2: referenced source-scoped religion entity missing.");
}

const second = model.peopleContexts.find((context) => context.id === "people-context:peoplegroups:pg000101");
if (!second || second.mission.classification.assertion.classification !== "not-unreached") {
  throw new Error("Phase 2: GSEC 4-6 must normalize to not-unreached, never generic reached.");
}

const unknown = model.peopleContexts.find((context) => context.id === "people-context:peoplegroups:pg000200");
if (!unknown) throw new Error("Phase 2: unknown-data fixture missing.");
if (unknown.population.value !== null || unknown.population.quality !== "unknown") {
  throw new Error("Phase 2: missing population must remain unknown rather than becoming zero.");
}
if (unknown.mission.classification.assertion.classification !== "unknown" || unknown.mission.classification.assertion.sourceCode !== null) {
  throw new Error("Phase 2: missing classification must remain first-class unknown.");
}
if (unknown.coordinates.value !== null || unknown.coordinates.precision !== "unknown") {
  throw new Error("Phase 2: invalid source coordinates must be omitted rather than clamped or fabricated.");
}
if (!unknown.coordinates.provenance.transformation?.includes("omitted")) {
  throw new Error("Phase 2: coordinate omission must be explained in provenance.");
}
if (unknown.language.languageId !== null || unknown.language.name.value !== "Language without stable code") {
  throw new Error("Phase 2: an unresolved language identity must retain the source label without inventing an entity ID.");
}
if (unknown.religion.religionId !== null || unknown.religion.name.value !== "Religion without stable code") {
  throw new Error("Phase 2: an unresolved religion identity must retain the source label without inventing an entity ID.");
}

for (const context of model.peopleContexts) {
  if (!model.people.some((people) => people.id === context.peopleId)) throw new Error(`Phase 2: unresolved people reference ${context.peopleId}.`);
  if (!model.countries.some((country) => country.id === context.countryId)) throw new Error(`Phase 2: unresolved country reference ${context.countryId}.`);
}

let duplicatePeidBlocked = false;
try {
  buildPeopleGroupsMissionModel([record(), record({ PGID: "PG000999", PEID: 100 })], retrievedAt);
} catch {
  duplicatePeidBlocked = true;
}
if (!duplicatePeidBlocked) throw new Error("Phase 2: duplicate PEIDs must fail closed rather than create an uncertified people rollup.");

let duplicatePgidBlocked = false;
try {
  buildPeopleGroupsMissionModel([record(), record({ PEID: 999, PGID: "PG000100" })], retrievedAt);
} catch {
  duplicatePgidBlocked = true;
}
if (!duplicatePgidBlocked) throw new Error("Phase 2: duplicate PGIDs must fail closed.");

const broken = structuredClone(model) as NormalizedMissionModel;
broken.peopleContexts[0]!.countryId = "country:ZZZ";
const brokenIssues = validateMissionModelInvariants(broken);
if (!brokenIssues.some((issue) => issue.code === "missing-country-reference")) {
  throw new Error("Phase 2: normalized relationship invariants must detect unresolved references.");
}

const coreFiles = [
  "src/mission-model/schemas.ts",
  "src/mission-model/invariants.ts",
  "src/mission-model/index.ts",
];
for (const path of coreFiles) {
  const source = await readFile(path, "utf8");
  for (const forbidden of ["providers/peoplegroups", "PeopleGroupsApiRecord", "jpScale", "PercentChristian", "PercentEvangelical"]) {
    if (source.includes(forbidden)) throw new Error(`Phase 2: provider/legacy concept '${forbidden}' leaked into canonical core file ${path}.`);
  }
}

const serialized = JSON.stringify(model);
for (const forbidden of ["\"jpScale\"", "\"frontier\"", "\"classification\":\"reached\""]) {
  if (serialized.includes(forbidden)) throw new Error(`Phase 2: canonical runtime model contains forbidden legacy/universalized field ${forbidden}.`);
}

console.log("V3 Phase 2 mission-model checks passed: provider-qualified identities, resolvable relationships, source-scoped mission assertions, explicit provenance, unknown preservation, and provider-independent core schemas are enforced.");
