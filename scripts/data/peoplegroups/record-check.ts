import { PeopleGroupsApiError, type PeopleGroupsApiClient } from "../../../src/providers/peoplegroups/api.js";
import { createMemoryPeopleGroupsRecordCache } from "../../../src/providers/peoplegroups/cache.js";
import { createPeopleGroupsRecordLoader, peopleGroupsPgidForRouteKey } from "../../../src/providers/peoplegroups/record-runtime.js";
import type { PeopleGroupsApiRecord } from "../../../src/providers/peoplegroups/types.js";

const fon: PeopleGroupsApiRecord = {
  PEID: 12319,
  PGID: "PG012319",
  NmDisp: "Fon",
  ISOalpha3: "BEN",
  Ctry: "Benin",
  Pop: 2_100_000,
  ROL: "fon",
  Lang: "Fon",
  GSEC: 2,
  UpdatedDate: "2026-08-23T00:00:00.000Z",
};

if (peopleGroupsPgidForRouteKey(12319) !== "PG012319") throw new Error("Phase 4 route keys must map to certified zero-padded six-digit PGIDs.");
if (peopleGroupsPgidForRouteKey(910001) !== "PG910001") throw new Error("Six-digit route keys must retain their digits in PGID form.");

const cache = createMemoryPeopleGroupsRecordCache();
let networkLoads = 0;
let lastRequestedPgid = "";
const client: PeopleGroupsApiClient = {
  fetchPage: async () => { throw new Error("not used"); },
  fetchAll: async () => { throw new Error("not used"); },
  fetchByPgid: async (pgid) => {
    networkLoads += 1;
    lastRequestedPgid = pgid;
    return fon;
  },
};

const loader = createPeopleGroupsRecordLoader({
  client,
  cache,
  now: () => Date.parse("2026-08-26T12:00:00.000Z"),
});

const first = await loader.load(12319);
if (first.source !== "network" || first.record.PEID !== 12319 || lastRequestedPgid !== "PG012319" || networkLoads !== 1) {
  throw new Error("A cold Phase 4 route load must fetch exactly the certified single PGID record.");
}

const second = await loader.load(12319);
if (second.source !== "cache-fresh" || networkLoads !== 1) throw new Error("A fresh route record must be reused from the record cache without another network request.");

const offlineLoader = createPeopleGroupsRecordLoader({
  client,
  cache,
  now: () => Date.parse("2026-08-27T18:00:00.000Z"),
  isOnline: () => false,
});
const offline = await offlineLoader.load(12319);
if (offline.source !== "cache-stale" || !offline.stale) throw new Error("A cached route record older than 24 hours must remain an explicit stale offline fallback.");

const mismatchClient: PeopleGroupsApiClient = {
  fetchPage: async () => { throw new Error("not used"); },
  fetchAll: async () => { throw new Error("not used"); },
  fetchByPgid: async () => ({ ...fon, PEID: 99999 }),
};
const mismatchLoader = createPeopleGroupsRecordLoader({
  client: mismatchClient,
  cache: createMemoryPeopleGroupsRecordCache(),
  now: () => Date.parse("2026-08-26T12:00:00.000Z"),
});
let mismatchRejected = false;
try {
  await mismatchLoader.load(12319);
} catch (error) {
  mismatchRejected = error instanceof PeopleGroupsApiError && error.code === "schema";
}
if (!mismatchRejected) throw new Error("Phase 4 must fail closed when the single-record response PEID does not match the route identity.");

console.log("Phase 4 route-record loader checks passed: certified PEID→PGID mapping, single-record fetch, fresh/stale cache behavior, and identity mismatch rejection are enforced.");
