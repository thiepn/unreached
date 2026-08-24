import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { assertContextDatasetIntegrity, assertContextMatchesRuntimePeople } from "../../../src/context/policy.js";
import { editorialContextAvailabilitySchema, editorialContextDatasetSchema, editorialContextManifestSchema, editorialContextProfilePackageSchema } from "../../../src/context/types.js";
import { createPeopleGroupsApiClient } from "../../../src/providers/peoplegroups/api.js";
import { buildRuntimeCountrySummaries, buildRuntimePeopleEntities } from "../../../src/providers/peoplegroups/model.js";

const root = process.cwd();
const readJson = async (path: string): Promise<unknown> => JSON.parse(await readFile(resolve(root, path), "utf8")) as unknown;
const client = createPeopleGroupsApiClient({ timeoutMs: 15_000 });
let lastPage = 0;
let advertisedPages = 0;
const records = await client.fetchAll({ onPage: (page) => { lastPage = page.page; advertisedPages = page.totalPages; console.log(`PeopleGroups.org live corpus: page ${page.page}/${page.totalPages}, ${page.records.length} validated records.`); } });
if (records.length < 10_000) throw new Error(`Live PeopleGroups.org corpus unexpectedly contains only ${records.length} records.`);
if (lastPage !== advertisedPages || advertisedPages < 2) throw new Error(`Live PeopleGroups.org pagination did not complete (${lastPage}/${advertisedPages}).`);
const pgids = new Set(records.map((record) => record.PGID));
if (pgids.size !== records.length) throw new Error("Live PeopleGroups.org corpus contains duplicate PGIDs after validation.");

const entities = buildRuntimePeopleEntities(records);
const countries = buildRuntimeCountrySummaries(records);
if (entities.length < 1_000) throw new Error(`Live corpus unexpectedly produced only ${entities.length} PEID entities.`);
if (countries.length < 100) throw new Error(`Live corpus unexpectedly produced only ${countries.length} country summaries.`);
const unreachedContexts = records.filter((record) => record.GSEC !== null && record.GSEC !== undefined && record.GSEC <= 3).length;
if (unreachedContexts < 1_000) throw new Error(`Live corpus unexpectedly contains only ${unreachedContexts} GSEC 0–3 contexts.`);
const multiContextEntities = entities.filter((entity) => entity.contexts.length > 1);
const multiCountryEntities = entities.filter((entity) => new Set(entity.contexts.map((context) => context.country.iso3)).size > 1);
const suffixMatchesPeid = records.filter((record) => Number(record.PGID.replace(/^PG0*/, "")) === record.PEID).length;
console.log(`Live identity audit: ${entities.length} PEIDs from ${records.length} PGIDs; ${multiContextEntities.length} PEIDs have >1 PGID and ${multiCountryEntities.length} span >1 country; ${suffixMatchesPeid}/${records.length} PGIDs have a numeric suffix equal to PEID.`);
const newestSourceUpdate = records.map((record) => record.UpdatedDate).filter((value): value is string => Boolean(value)).sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;

const status = editorialContextAvailabilitySchema.parse(await readJson("public/data/context/status.json"));
if (!status.available || status.mode !== "reviewed-editorial" || !status.datasetUrl) throw new Error("Reviewed editorial publication is unavailable for live-corpus certification.");
const publication = await readJson(`public/${status.datasetUrl}`);
const legacy = editorialContextDatasetSchema.safeParse(publication);
let editorial;
if (legacy.success) editorial = legacy.data;
else {
  const manifest = editorialContextManifestSchema.parse(publication);
  const packages = await Promise.all(manifest.profileUrls.map(async (url) => editorialContextProfilePackageSchema.parse(await readJson(`public/${url}`))));
  editorial = editorialContextDatasetSchema.parse({ schemaVersion: 2, fixture: false, generatedAt: manifest.generatedAt, sources: packages.flatMap((item) => item.sources), profiles: packages.map((item) => item.profile) });
}
assertContextDatasetIntegrity(editorial);
assertContextMatchesRuntimePeople(editorial, entities);
if (editorial.profiles.length !== status.profileCount || editorial.profiles.length < 6) throw new Error("v1.3 live-corpus editorial profile count is incomplete.");

console.log(`Full live PeopleGroups.org corpus certified: ${records.length} PGIDs, ${entities.length} PEIDs, ${countries.length} countries, ${unreachedContexts} GSEC 0–3 contexts, newest source update ${newestSourceUpdate ?? "unknown"}.`);
console.log(`v1.3 live editorial identity certification passed for ${editorial.profiles.length} published PEID profile shard(s).`);
