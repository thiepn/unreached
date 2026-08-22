import {
  PEOPLE_GROUPS_CACHE_FRESH_MS,
  createMemoryPeopleGroupsCache,
  type PeopleGroupsPageCache,
} from "../../../src/providers/peoplegroups/cache.js";
import { createPeopleGroupsApiClient, PeopleGroupsApiError } from "../../../src/providers/peoplegroups/api.js";
import { buildRuntimeCountrySummaries, buildRuntimePeopleEntities } from "../../../src/providers/peoplegroups/model.js";
import { createPeopleGroupsCorpusLoader } from "../../../src/providers/peoplegroups/runtime.js";
import type { PeopleGroupsApiRecord } from "../../../src/providers/peoplegroups/types.js";

function record(overrides: Partial<PeopleGroupsApiRecord> = {}): PeopleGroupsApiRecord {
  return {
    PEID: 100,
    PGID: "PG000100",
    NmDisp: "Example People",
    NmAlt: null,
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
    RlgnDiv: null,
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
    LPIdesc: "0.1% to 0.5% Evangelical",
    Affbloc: "Example Bloc",
    PplClstr: "Example Cluster",
    PplNm: "Example People",
    Ethne: "Example Ethne",
    Bible: "Available",
    Jesus: "Not Available",
    ResTot: 2,
    PeopleDesc: "Source description",
    LocationDesc: "Source location",
    UpdatedDate: "2026-07-17T00:00:00.000Z",
    ...overrides,
  };
}

const page1 = [record(), record({ PEID: 200, PGID: "PG000200", NmDisp: "Second People", Pop: null, EvngLvl: null })];
const page2 = [record({ PGID: "PG000101", ISOalpha3: "NGA", Ctry: "Nigeria", Pop: 500, EvngLvl: "2% or more", UpdatedDate: "2026-08-01T00:00:00.000Z" })];

const fakeFetch: typeof fetch = async (input) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input : input.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const body = page === 1 ? page1 : page === 2 ? page2 : [];
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "X-WP-Total": "3",
      "X-WP-TotalPages": "2",
    },
  });
};

const client = createPeopleGroupsApiClient({ fetchImpl: fakeFetch, timeoutMs: 1000 });
const all = await client.fetchAll();
if (all.length !== 3) throw new Error(`Expected three runtime records, received ${all.length}.`);

const entities = buildRuntimePeopleEntities(all);
if (entities.length !== 2) throw new Error(`Expected PEID aggregation to produce two entities, received ${entities.length}.`);
const first = entities.find((entity) => entity.peid === 100);
if (!first) throw new Error("PEID 100 entity missing.");
if (first.contexts.length !== 2) throw new Error("PGID country contexts were not preserved beneath PEID identity.");
if (first.population.knownValue !== 1500 || !first.population.complete) throw new Error("Known country-context population rollup is incorrect.");
if (first.reach.classification !== "mixed") throw new Error(`Expected mixed reach rollup, received ${first.reach.classification}.`);
if (first.routeKey !== 100 || first.id !== "people-entity:peoplegroups:100") throw new Error("Provider-qualified identity or route key changed.");
if (first.sourceUpdatedAt !== "2026-08-01T00:00:00.000Z") throw new Error("Entity freshness must retain the newest source context timestamp.");

const second = entities.find((entity) => entity.peid === 200);
if (!second || second.population.complete || second.population.knownContextCount !== 0) throw new Error("Unknown population coverage must remain incomplete rather than becoming zero.");

const countries = buildRuntimeCountrySummaries(all);
const benin = countries.find((country) => country.iso3 === "BEN");
if (!benin || benin.peopleContextCount !== 2 || benin.unreachedContextCount !== 1 || benin.unknownContextCount !== 1) throw new Error("Country denominator/reach aggregation is incorrect.");
if (benin.populationCoverageComplete) throw new Error("Country population coverage must report incomplete when one context is unknown.");
if (!benin.denominator.includes("people-group-in-country")) throw new Error("Country summary denominator must remain explicit.");

const cache = createMemoryPeopleGroupsCache();
let now = Date.parse("2026-08-22T20:00:00.000Z");
const loader = createPeopleGroupsCorpusLoader({ client, cache, now: () => now });
const network = await loader.load();
if (network.source !== "network" || network.records.length !== 3) throw new Error("Initial corpus load must come from the live client.");
const fresh = await loader.load();
if (fresh.source !== "cache-fresh" || fresh.stale) throw new Error("Immediate second load must use the validated fresh cache.");

now += PEOPLE_GROUPS_CACHE_FRESH_MS + 1;
const failingClient = {
  fetchPage: async () => { throw new PeopleGroupsApiError("offline", "network"); },
  fetchByPgid: async () => { throw new PeopleGroupsApiError("offline", "network"); },
  fetchAll: async () => { throw new PeopleGroupsApiError("offline", "network"); },
};
const staleLoader = createPeopleGroupsCorpusLoader({ client: failingClient, cache, now: () => now });
const stale = await staleLoader.load();
if (stale.source !== "cache-stale" || !stale.stale || !stale.warning) throw new Error("A recent validated cache must provide an explicit stale fallback during API failure.");

const brokenCache: PeopleGroupsPageCache = {
  read: async () => { throw new Error("storage unavailable"); },
  write: async () => { throw new Error("storage unavailable"); },
  clear: async () => { throw new Error("storage unavailable"); },
};
const storageIndependentLoader = createPeopleGroupsCorpusLoader({ client, cache: brokenCache, now: () => now });
const storageIndependent = await storageIndependentLoader.load();
if (storageIndependent.source !== "network" || storageIndependent.records.length !== 3) throw new Error("Healthy network data must remain usable when browser storage is unavailable.");
await storageIndependentLoader.clearCache();

const schemaDriftFetch: typeof fetch = async () => new Response(JSON.stringify([{ PGID: "BROKEN" }]), {
  status: 200,
  headers: { "Content-Type": "application/json", "X-WP-Total": "1", "X-WP-TotalPages": "1" },
});
let driftBlocked = false;
try {
  await createPeopleGroupsApiClient({ fetchImpl: schemaDriftFetch }).fetchAll();
} catch (error) {
  driftBlocked = error instanceof PeopleGroupsApiError && error.code === "schema";
}
if (!driftBlocked) throw new Error("PeopleGroups API schema drift must fail closed.");

const duplicateFetch: typeof fetch = async (input) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input : input.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const body = page === 1 ? [record()] : [record()];
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json", "X-WP-Total": "2", "X-WP-TotalPages": "2" },
  });
};
let duplicateBlocked = false;
try {
  await createPeopleGroupsApiClient({ fetchImpl: duplicateFetch }).fetchAll();
} catch (error) {
  duplicateBlocked = error instanceof PeopleGroupsApiError && error.code === "schema";
}
if (!duplicateBlocked) throw new Error("Duplicate PGIDs across provider pages must fail closed.");

console.log("U12B PeopleGroups runtime architecture checks passed.");
