import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { assertContextDatasetIntegrity, assertContextMatchesRuntimePeople, isClaimStale } from "../../src/context/policy.js";
import {
  editorialContextAvailabilitySchema,
  editorialContextDatasetSchema,
  editorialContextManifestSchema,
  editorialContextProfilePackageSchema,
} from "../../src/context/types.js";
import { buildRuntimePeopleEntities } from "../../src/providers/peoplegroups/model.js";
import { peopleGroupsApiRecordSchema } from "../../src/providers/peoplegroups/types.js";

const root = process.cwd();
const readJson = async (path: string): Promise<unknown> => JSON.parse(await readFile(resolve(root, path), "utf8")) as unknown;

const fixtureRaw = await readJson("data/fixtures/context.synthetic.json");
const context = editorialContextDatasetSchema.parse(fixtureRaw);

const runtimePeople = buildRuntimePeopleEntities([
  peopleGroupsApiRecordSchema.parse({
    PEID: 910001, PGID: "PG910001", NmDisp: "Browser Test People", ISOalpha3: "BEN", Ctry: "Benin", Pop: 120000,
    ROL: "fon", Lang: "Fon", PplNm: "Browser Test People", Rlgn: "Traditional Religion", GSEC: 2,
    Bible: "Available", Jesus: "Not Available", UpdatedDate: "2026-08-22T00:00:00Z"
  }),
  peopleGroupsApiRecordSchema.parse({
    PEID: 910002, PGID: "PG910002", NmDisp: "Browser Test People", ISOalpha3: "NGA", Ctry: "Nigeria", Pop: null,
    ROL: "fon", Lang: "Fon", PplNm: "Browser Test People", Rlgn: "Traditional Religion", GSEC: 5,
    Bible: "Unknown", Jesus: "Available", UpdatedDate: "2026-08-23T00:00:00Z"
  })
]);

assertContextDatasetIntegrity(context, new Date("2026-08-24T22:00:00Z"));
assertContextMatchesRuntimePeople(context, runtimePeople);
if (!context.fixture) throw new Error("Synthetic editorial context must remain fixture data.");
const profile = context.profiles[0];
if (!profile || profile.peid !== 910001) throw new Error("Synthetic PEID contextual profile was not retained.");
if (profile.identity.legacySourcePeopleId !== 999001 || profile.identity.targetPeid !== 910001) throw new Error("Legacy-to-PEID migration provenance was not retained independently.");
if (profile.identity.numericCoincidenceUsed !== false) throw new Error("Numeric coincidence must never be accepted as identity evidence.");
if (profile.review.status !== "published" || profile.review.qualityTier !== 3 || !profile.review.checklist.identityMatchChecked) throw new Error("Synthetic profile review metadata is invalid.");
if (profile.whyUnreached.length !== 2) throw new Error("Synthetic Why Unreached dimensions are incomplete.");
const synthesis = profile.claims.find((claim) => claim.id === "claim:example-access");
if (!synthesis || synthesis.evidenceLevel !== "B" || synthesis.citationIds.length !== 2) throw new Error("Level B synthesis validation failed.");
const current = profile.claims.find((claim) => claim.id === "claim:example-language");
if (!current || isClaimStale(current, new Date("2026-08-24T22:00:00Z"))) throw new Error("Fresh current claim was incorrectly marked stale.");
if (!isClaimStale({ ...current, reviewAfter: "2026-08-01" }, new Date("2026-08-24T22:00:00Z"))) throw new Error("Stale-claim detection failed.");

let mismatchRejected = false;
try {
  assertContextMatchesRuntimePeople({ ...context, profiles: [{ ...profile, identity: { ...profile.identity, pgidAnchors: ["PG999999"] } }] }, runtimePeople);
} catch { mismatchRejected = true; }
if (!mismatchRejected) throw new Error("A mismatched PGID identity anchor was not rejected.");

const status = editorialContextAvailabilitySchema.parse(await readJson("public/data/context/status.json"));
if (!status.available || status.fixture || status.mode !== "reviewed-editorial") throw new Error("v1.3 editorial context must be active, reviewed and non-fixture.");
if (status.datasetUrl !== "data/context/manifest.v1.json") throw new Error("v1.3 editorial publication must use the canonical manifest.");
if (status.identityProvider !== "peoplegroups-org") throw new Error("Editorial identities must remain anchored to PeopleGroups.org.");

const manifest = editorialContextManifestSchema.parse(await readJson(`public/${status.datasetUrl}`));
if (manifest.fixture) throw new Error("Production editorial manifest must never be fixture data.");
if (manifest.profileCount !== manifest.profileUrls.length || manifest.profileCount !== status.profileCount) throw new Error("Editorial manifest/status profile counts disagree.");
if (new Set(manifest.profileUrls).size !== manifest.profileUrls.length) throw new Error("Editorial manifest contains duplicate shard URLs.");

const packages = await Promise.all(manifest.profileUrls.map(async (url) => editorialContextProfilePackageSchema.parse(await readJson(`public/${url}`))));
for (const item of packages) if (item.fixture) throw new Error(`Production editorial shard for PEID ${item.profile.peid} is marked fixture.`);
const production = editorialContextDatasetSchema.parse({
  schemaVersion: 2,
  fixture: false,
  generatedAt: manifest.generatedAt,
  sources: packages.flatMap((item) => item.sources),
  profiles: packages.map((item) => item.profile),
});
assertContextDatasetIntegrity(production, new Date("2026-08-24T22:00:00Z"));

const requiredPeids = new Set([12319, 7206, 24104, 11954, 24009, 1156]);
if (production.profiles.length < requiredPeids.size) throw new Error("v1.3 must publish at least six reviewed source-record profiles.");
const publishedPeids = new Set(production.profiles.map((item) => item.peid));
for (const peid of requiredPeids) if (!publishedPeids.has(peid)) throw new Error(`v1.3 required editorial PEID ${peid} is missing.`);
for (const published of production.profiles) {
  if (published.review.status !== "published" || published.review.qualityTier !== 3) throw new Error(`${published.peopleEntityId} is not Tier-3 publication-reviewed.`);
  if (published.identity.numericCoincidenceUsed !== false) throw new Error(`${published.peopleEntityId} relies on numeric coincidence.`);
}

console.log(`v1.3 contextual editorial validation passed: ${production.profiles.length} reviewed profile shards, ${production.sources.length} cited sources, explicit PEID/PGID identity evidence.`);
