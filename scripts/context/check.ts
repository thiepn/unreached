import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { assertContextDatasetIntegrity, assertContextMatchesRuntimePeople, isClaimStale } from "../../src/context/policy.js";
import { editorialContextAvailabilitySchema, editorialContextDatasetSchema } from "../../src/context/types.js";
import { buildRuntimePeopleEntities } from "../../src/providers/peoplegroups/model.js";
import { peopleGroupsApiRecordSchema } from "../../src/providers/peoplegroups/types.js";

const fixtureRaw = JSON.parse(await readFile(resolve(process.cwd(), "data/fixtures/context.synthetic.json"), "utf8")) as unknown;
const context = editorialContextDatasetSchema.parse(fixtureRaw);

const runtimePeople = buildRuntimePeopleEntities([
  peopleGroupsApiRecordSchema.parse({
    PEID: 910001,
    PGID: "PG910001",
    NmDisp: "Browser Test People",
    ISOalpha3: "BEN",
    Ctry: "Benin",
    Pop: 120000,
    ROL: "fon",
    Lang: "Fon",
    PplNm: "Browser Test People",
    Rlgn: "Traditional Religion",
    GSEC: 2,
    Bible: "Available",
    Jesus: "Not Available",
    UpdatedDate: "2026-08-22T00:00:00Z"
  }),
  peopleGroupsApiRecordSchema.parse({
    PEID: 910002,
    PGID: "PG910002",
    NmDisp: "Browser Test People",
    ISOalpha3: "NGA",
    Ctry: "Nigeria",
    Pop: null,
    ROL: "fon",
    Lang: "Fon",
    PplNm: "Browser Test People",
    Rlgn: "Traditional Religion",
    GSEC: 5,
    Bible: "Unknown",
    Jesus: "Available",
    UpdatedDate: "2026-08-23T00:00:00Z"
  })
]);

assertContextDatasetIntegrity(context, new Date("2026-08-23T22:00:00Z"));
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
if (!current || isClaimStale(current, new Date("2026-08-23T22:00:00Z"))) throw new Error("Fresh current claim was incorrectly marked stale.");
if (!isClaimStale({ ...current, reviewAfter: "2026-08-01" }, new Date("2026-08-23T22:00:00Z"))) throw new Error("Stale-claim detection failed.");

let mismatchRejected = false;
try {
  assertContextMatchesRuntimePeople({
    ...context,
    profiles: [{ ...profile, identity: { ...profile.identity, pgidAnchors: ["PG999999"] } }]
  }, runtimePeople);
} catch {
  mismatchRejected = true;
}
if (!mismatchRejected) throw new Error("A mismatched PGID identity anchor was not rejected.");

const productionRaw = JSON.parse(await readFile(resolve(process.cwd(), "public/data/context/editorial.v2.json"), "utf8")) as unknown;
const production = editorialContextDatasetSchema.parse(productionRaw);
assertContextDatasetIntegrity(production, new Date("2026-08-23T22:00:00Z"));
if (production.fixture) throw new Error("Production editorial context must never be fixture data.");
if (production.profiles.length < 1) throw new Error("U12F must publish at least one reviewed source-record editorial profile.");
for (const published of production.profiles) {
  if (published.review.status !== "published") throw new Error(`${published.peopleEntityId} is not publication-reviewed.`);
  if (published.identity.numericCoincidenceUsed !== false) throw new Error(`${published.peopleEntityId} relies on numeric coincidence.`);
}

const statusRaw = JSON.parse(await readFile(resolve(process.cwd(), "public/data/context/status.json"), "utf8")) as unknown;
const status = editorialContextAvailabilitySchema.parse(statusRaw);
if (!status.available || status.fixture) throw new Error("U12F production editorial context must be active and non-fixture.");
if (status.mode !== "reviewed-editorial") throw new Error("U12F production editorial context must use reviewed-editorial mode.");
if (status.datasetUrl !== "data/context/editorial.v2.json") throw new Error("U12F editorial dataset URL is not canonical.");
if (status.profileCount !== production.profiles.length) throw new Error("U12F status profile count does not match the publication dataset.");
if (status.identityProvider !== "peoplegroups-org") throw new Error("U12F editorial identities must be anchored to current PeopleGroups.org PEID/PGID records.");

console.log(`U12F contextual editorial validation passed: ${production.profiles.length} reviewed source-record profile(s), explicit PEID/PGID identity evidence, no numeric-coincidence migration.`);
