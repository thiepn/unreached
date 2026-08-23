import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { assertContextDatasetIntegrity } from "../../../src/context/policy.js";
import { editorialContextDatasetSchema } from "../../../src/context/types.js";
import { createPeopleGroupsApiClient } from "../../../src/providers/peoplegroups/api.js";

const editorialRaw = JSON.parse(await readFile(resolve(process.cwd(), "public/data/context/editorial.v2.json"), "utf8")) as unknown;
const editorial = editorialContextDatasetSchema.parse(editorialRaw);
assertContextDatasetIntegrity(editorial);

const client = createPeopleGroupsApiClient({ timeoutMs: 15_000 });

for (const profile of editorial.profiles) {
  const records = await Promise.all(profile.identity.pgidAnchors.map((pgid) => client.fetchByPgid(pgid)));
  for (const record of records) {
    console.log(`Editorial identity preflight ${record.PGID}: PEID ${record.PEID}, ${record.NmDisp}, ${record.ISOalpha3}, language ${record.ROL ?? "unknown"}, ROP3 name ${record.PplNm ?? "unknown"}.`);
    if (record.PEID !== profile.peid) {
      throw new Error(`${profile.peopleEntityId} targets PEID ${profile.peid}, but live ${record.PGID} currently reports PEID ${record.PEID}.`);
    }
    if (!profile.identity.countryIso3Anchors.includes(record.ISOalpha3)) {
      throw new Error(`${profile.peopleEntityId} does not declare live country anchor ${record.ISOalpha3} for ${record.PGID}.`);
    }
    const language = record.ROL?.toLocaleLowerCase("en") ?? null;
    if (language && !profile.identity.languageIso6393Anchors.includes(language)) {
      throw new Error(`${profile.peopleEntityId} does not declare live language anchor ${language} for ${record.PGID}.`);
    }
  }
}

console.log(`U12F fast live editorial identity preflight passed for ${editorial.profiles.length} profile(s).`);
