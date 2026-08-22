import { type PeopleGroupsApiClient } from "../../../src/providers/peoplegroups/api.js";
import { createMemoryPeopleGroupsCache } from "../../../src/providers/peoplegroups/cache.js";
import { createPeopleGroupsCorpusLoader } from "../../../src/providers/peoplegroups/runtime.js";
import type { PeopleGroupsApiRecord } from "../../../src/providers/peoplegroups/types.js";

function record(pgid: string, peid: number): PeopleGroupsApiRecord {
  return {
    PGID: pgid,
    PEID: peid,
    NmDisp: `People ${peid}`,
    ISOalpha3: "BEN",
    Ctry: "Benin",
    GSEC: 2,
  };
}

const page1 = [record("PG000301", 301)];
const page2 = [record("PG000302", 302)];
let networkLoads = 0;
const client: PeopleGroupsApiClient = {
  fetchPage: async () => { throw new Error("not used"); },
  fetchByPgid: async () => { throw new Error("not used"); },
  fetchAll: async (options = {}) => {
    networkLoads += 1;
    options.onPage?.({ records: page1, page: 1, totalPages: 2, totalRecords: 2 });
    options.onPage?.({ records: page2, page: 2, totalPages: 2, totalRecords: 2 });
    return [...page1, ...page2];
  },
};

const mixed = createMemoryPeopleGroupsCache();
await mixed.write({ schemaVersion: 1, page: 1, totalPages: 2, totalRecords: 2, storedAt: "2026-08-22T20:00:00.000Z", records: page1 });
await mixed.write({ schemaVersion: 1, page: 2, totalPages: 2, totalRecords: 2, storedAt: "2026-08-21T20:00:00.000Z", records: page2 });

const mixedLoader = createPeopleGroupsCorpusLoader({
  client,
  cache: mixed,
  now: () => Date.parse("2026-08-22T20:30:00.000Z"),
});
const recovered = await mixedLoader.load();
if (recovered.source !== "network" || networkLoads !== 1) {
  throw new Error("Mixed-generation cache pages must be rejected and replaced by a validated network snapshot.");
}

const repaired = await mixedLoader.load();
if (repaired.source !== "cache-fresh") throw new Error("A fully validated replacement snapshot must become cache-eligible.");

const duplicate = createMemoryPeopleGroupsCache();
await duplicate.write({ schemaVersion: 1, page: 1, totalPages: 2, totalRecords: 2, storedAt: "2026-08-22T20:00:00.000Z", records: page1 });
await duplicate.write({ schemaVersion: 1, page: 2, totalPages: 2, totalRecords: 2, storedAt: "2026-08-22T20:00:00.000Z", records: page1 });
networkLoads = 0;
const duplicateLoader = createPeopleGroupsCorpusLoader({
  client,
  cache: duplicate,
  now: () => Date.parse("2026-08-22T20:30:00.000Z"),
});
const duplicateRecovered = await duplicateLoader.load();
if (duplicateRecovered.source !== "network" || networkLoads !== 1) {
  throw new Error("Duplicate PGIDs in cached pages must invalidate the cache snapshot.");
}

console.log("U12B PeopleGroups cache snapshot checks passed.");
