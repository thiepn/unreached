import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { assertContextDatasetIntegrity } from "../../../src/context/policy.js";
import {
  editorialContextAvailabilitySchema,
  editorialContextDatasetSchema,
  editorialContextManifestSchema,
  editorialContextProfilePackageSchema,
} from "../../../src/context/types.js";
import { createPeopleGroupsApiClient } from "../../../src/providers/peoplegroups/api.js";

const root = process.cwd();
const readJson = async (path: string): Promise<unknown> => JSON.parse(await readFile(resolve(root, path), "utf8")) as unknown;
const status = editorialContextAvailabilitySchema.parse(await readJson("public/data/context/status.json"));
if (!status.available || status.mode !== "reviewed-editorial" || !status.datasetUrl) throw new Error("Reviewed editorial publication is unavailable.");

let editorial;
const raw = await readJson(`public/${status.datasetUrl}`);
const legacy = editorialContextDatasetSchema.safeParse(raw);
if (legacy.success) {
  editorial = legacy.data;
} else {
  const manifest = editorialContextManifestSchema.parse(raw);
  const packages = await Promise.all(manifest.profileUrls.map(async (url) => editorialContextProfilePackageSchema.parse(await readJson(`public/${url}`))));
  editorial = editorialContextDatasetSchema.parse({ schemaVersion: 2, fixture: false, generatedAt: manifest.generatedAt, sources: packages.flatMap((item) => item.sources), profiles: packages.map((item) => item.profile) });
}
assertContextDatasetIntegrity(editorial);
if (editorial.profiles.length !== status.profileCount) throw new Error("Editorial live preflight profile count does not match status metadata.");

const client = createPeopleGroupsApiClient({ timeoutMs: 15_000 });
for (const profile of editorial.profiles) {
  const records = await Promise.all(profile.identity.pgidAnchors.map((pgid) => client.fetchByPgid(pgid)));
  for (const record of records) {
    console.log(`Editorial identity preflight ${record.PGID}: PEID ${record.PEID}, ${record.NmDisp}, ${record.ISOalpha3}, language ${record.ROL ?? "unknown"}, ROP3 name ${record.PplNm ?? "unknown"}.`);
    if (record.PEID !== profile.peid) throw new Error(`${profile.peopleEntityId} targets PEID ${profile.peid}, but live ${record.PGID} currently reports PEID ${record.PEID}.`);
    if (!profile.identity.countryIso3Anchors.includes(record.ISOalpha3)) throw new Error(`${profile.peopleEntityId} does not declare live country anchor ${record.ISOalpha3} for ${record.PGID}.`);
    const language = record.ROL?.toLocaleLowerCase("en") ?? null;
    if (language && !profile.identity.languageIso6393Anchors.includes(language)) throw new Error(`${profile.peopleEntityId} does not declare live language anchor ${language} for ${record.PGID}.`);
    const expected = profile.identity.verifiedPeopleName.toLocaleLowerCase("en");
    const actual = record.NmDisp.toLocaleLowerCase("en");
    if (!(actual.includes(expected) || expected.includes(actual))) throw new Error(`${profile.peopleEntityId} verified name '${profile.identity.verifiedPeopleName}' does not match live name '${record.NmDisp}'.`);
  }
}

console.log(`v1.3 fast live editorial identity preflight passed for ${editorial.profiles.length} reviewed profile shard(s).`);
