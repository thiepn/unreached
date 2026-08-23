import { filterLivePeople, type LivePeopleFilterState } from "../../../src/peoples/live.js";
import { buildLivePrayerProfile, isLivePrayerEligible, livePrayerFlow } from "../../../src/prayer/live.js";
import { buildRuntimeCountrySummaries, buildRuntimePeopleEntities, toRuntimePeopleContext } from "../../../src/providers/peoplegroups/model.js";
import { buildVisibleCountryRecords, entityGsecRange, entityResourceBreakdown, entityTaxonomy, relatedRuntimePeople } from "../../../src/providers/peoplegroups/visible.js";
import type { PeopleGroupsApiRecord } from "../../../src/providers/peoplegroups/types.js";

function record(overrides: Partial<PeopleGroupsApiRecord> = {}): PeopleGroupsApiRecord {
  return {
    PEID: 7001,
    PGID: "PG007001",
    NmDisp: "Visible Example People",
    NmAlt: null,
    ISOalpha3: "BEN",
    Ctry: "Benin",
    Regn: "Africa",
    RegnSub: "Western Africa",
    Pop: 120000,
    Latitude: 9,
    Longitude: 2,
    ROL: "abc",
    Lang: "Example Language",
    LangFamily: "Example Family",
    ROR: "R1",
    Rlgn: "Example Religion",
    RlgnDiv: "Example Division",
    EvngLvl: "Less than 2%",
    CongExst: "Yes",
    Plnting: "Active",
    EngStat: "Engaged",
    GSEC: 2,
    GSECbrf: "Initial Church Planting",
    GSEClng: "Synthetic GSEC description",
    SPI: 1,
    SPIdesc: "Synthetic SPI",
    LPI: 1,
    LPIname: "Synthetic LPI",
    LPIdesc: "Synthetic LPI description",
    Affbloc: "Example Bloc",
    PplClstr: "Example Cluster",
    PplNm: "Visible Example People",
    Ethne: "Example Ethne",
    Bible: "Available",
    Jesus: "Not Available",
    ResTot: 2,
    PeopleDesc: "Synthetic provider description used only for U12C validation.",
    LocationDesc: "Synthetic provider location used only for U12C validation.",
    UpdatedDate: "2026-08-20T00:00:00.000Z",
    ...overrides,
  };
}

const records = [
  record(),
  record({
    PEID: 7002,
    PGID: "PG007002",
    ISOalpha3: "NGA",
    Ctry: "Nigeria",
    Pop: null,
    GSEC: 5,
    EvngLvl: "5% to 10%",
    Bible: "Unknown",
    Jesus: "Available",
    UpdatedDate: "2026-08-21T00:00:00.000Z",
  }),
  record({
    PEID: 7003,
    PGID: "PG007003",
    NmDisp: "Second Visible People",
    ISOalpha3: "BEN",
    Ctry: "Benin",
    Pop: 50000,
    GSEC: 1,
    ROL: "def",
    Lang: "Second Language",
    ROR: "R2",
    Rlgn: "Second Religion",
    PplNm: "Second Visible People",
    Affbloc: "Example Bloc",
    PplClstr: "Second Cluster",
    Bible: "Not Available",
  }),
];

const contexts = records.map(toRuntimePeopleContext);
const entities = buildRuntimePeopleEntities(records);
const summaries = buildRuntimeCountrySummaries(records);
const countries = buildVisibleCountryRecords(contexts, summaries);

const first = entities.find((entity) => entity.peid === 7001);
if (!first) throw new Error("U12C visible PEID 7001 missing.");
if (first.contexts.length !== 1 || first.contexts[0]?.pgid !== "PG007001") throw new Error("Visible PEID must preserve one PGID source record.");
if (first.reach.classification !== "unreached-only") throw new Error("GSEC 2 source record must retain unreached-only compatibility status.");
if (first.population.knownValue !== 120000 || !first.population.complete || first.population.aggregation !== "single-pgid-population-estimate") throw new Error("Visible PEID population must remain the single PGID estimate.");
const range = entityGsecRange(first);
if (!range || range.min !== 2 || range.max !== 2 || range.knownContexts !== 1) throw new Error("Visible GSEC value did not preserve the source record.");
const taxonomy = entityTaxonomy(first);
if (taxonomy.peopleName !== "Visible Example People" || taxonomy.peopleCluster !== "Example Cluster" || taxonomy.affinityBloc !== "Example Bloc") throw new Error("Visible source taxonomy resolution failed.");
const resources = entityResourceBreakdown(first);
if (!resources.bible.some((item) => item.status === "Available")) throw new Error("Raw Bible availability labels must remain visible.");
if (JSON.stringify(resources).includes("complete-bible")) throw new Error("U12C must not manufacture normalized Scripture-completeness labels.");

const nigeria = entities.find((entity) => entity.peid === 7002);
if (!nigeria || nigeria.contexts[0]?.country.iso3 !== "NGA" || nigeria.reach.classification !== "other-only") throw new Error("Nigeria record must remain an independent PGID/PEID entity.");
const related = relatedRuntimePeople(first, entities);
if (!related.some((item) => item.entity.peid === 7002 && item.relationship === "same-rop3-people")) throw new Error("Source PplNm/ROP3 people-name relationship must connect same-named records across countries without PEID aggregation.");

const benin = countries.find((country) => country.iso3 === "BEN");
if (!benin) throw new Error("Visible Benin record missing.");
if (benin.summary.peopleContextCount !== 2 || benin.summary.unreachedContextCount !== 2) throw new Error("Country source-context counts are incorrect.");
if (!benin.summary.populationCoverageComplete || benin.summary.knownPopulation !== 170000) throw new Error("Country represented-population coverage is incorrect.");
if (benin.religions.length !== 2 || benin.languages.length !== 2) throw new Error("Country source-backed language/religion breakdown failed.");
if (!benin.summary.denominator.includes("people-group-in-country")) throw new Error("Country denominator must remain explicit.");

const baseFilter: LivePeopleFilterState = {
  query: "",
  status: "all",
  countryIso3: "",
  language: "",
  religion: "",
  bibleAvailability: "",
  minimumPopulation: 0,
  sort: "population-desc",
};
if (filterLivePeople(entities, { ...baseFilter, countryIso3: "NGA" }).map((entity) => entity.peid).join() !== "7002") throw new Error("Live country filter failed.");
if (filterLivePeople(entities, { ...baseFilter, query: "PG007003" }).map((entity) => entity.peid).join() !== "7003") throw new Error("Live PGID search failed.");
if (filterLivePeople(entities, { ...baseFilter, status: "unreached-only" }).map((entity) => entity.peid).sort().join() !== "7001,7003") throw new Error("Live GSEC record filter failed.");
if (filterLivePeople(entities, { ...baseFilter, bibleAvailability: "Available" }).map((entity) => entity.peid).join() !== "7001") throw new Error("Raw Bible availability filtering failed.");

if (!isLivePrayerEligible(first)) throw new Error("A GSEC 0–3 PGID/PEID record must be prayer-eligible.");
const prayer = buildLivePrayerProfile(first);
if (prayer.sourcePeopleId !== 7001 || prayer.templateVersion !== "u12c-v1") throw new Error("Live prayer profile identity/template version failed.");
if (prayer.countryIso3s.join() !== "BEN" || prayer.countryNames.join() !== "Benin") throw new Error("Live prayer profile must remain scoped to the source record country.");
if (prayer.prompts.length !== 7 || livePrayerFlow(prayer, 2).length !== 3 || livePrayerFlow(prayer, 5).length !== 5 || livePrayerFlow(prayer, 10).length !== 7) throw new Error("Live prayer flow lengths are incorrect.");
if (!prayer.prompts.some((prompt) => prompt.category === "gospel") || !prayer.prompts.some((prompt) => prompt.category === "church")) throw new Error("Live prayer template lost required biblical categories.");
if (!prayer.whyPray.includes("GSEC 0–3") || !prayer.whyPray.includes("Benin")) throw new Error("Live prayer context must be grounded in source-backed GSEC/country data.");
if (prayer.prompts.some((prompt) => prompt.text.includes("Frontier") || prompt.text.includes("JP scale"))) throw new Error("Live prayer templates must not leak Joshua-specific methodology.");

console.log(`U12C/U12F visible real-data checks passed: ${entities.length} one-record PEID/PGID entities, ${countries.length} countries, source-native taxonomy/GSEC/resources, certified prayer templates.`);
