import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { loadFixtureDataset } from "../data/fixtures.js";
import { assertContextDatasetIntegrity, assertContextMatchesPeople, isClaimStale } from "../../src/context/policy.js";
import { editorialContextAvailabilitySchema, editorialContextDatasetSchema } from "../../src/context/types.js";
import { buildPeopleExplorerDataset } from "../../src/peoples/derive.js";

const fixtureRaw = JSON.parse(await readFile(resolve(process.cwd(), "data/fixtures/context.synthetic.json"), "utf8")) as unknown;
const context = editorialContextDatasetSchema.parse(fixtureRaw);
const { dataset } = await loadFixtureDataset();
const people = buildPeopleExplorerDataset(dataset, "2026-08-21T22:00:00Z");

assertContextDatasetIntegrity(context, new Date("2026-08-22T00:00:00Z"));
assertContextMatchesPeople(context, people.people);

if (!context.fixture) throw new Error("Synthetic editorial context must remain fixture data.");
const profile = context.profiles[0];
if (!profile || profile.sourcePeopleId !== 999001) throw new Error("Synthetic contextual profile was not retained.");
if (profile.review.status !== "published" || profile.review.qualityTier !== 3) throw new Error("Synthetic profile review metadata is invalid.");
if (profile.whyUnreached.length !== 2) throw new Error("Synthetic Why Unreached dimensions are incomplete.");
const synthesis = profile.claims.find((claim) => claim.id === "claim:example-access");
if (!synthesis || synthesis.evidenceLevel !== "B" || synthesis.citationIds.length !== 2) throw new Error("Level B synthesis validation failed.");
const current = profile.claims.find((claim) => claim.id === "claim:example-language");
if (!current || isClaimStale(current, new Date("2026-08-22T00:00:00Z"))) throw new Error("Fresh current claim was incorrectly marked stale.");
if (!isClaimStale({ ...current, reviewAfter: "2026-08-01" }, new Date("2026-08-22T00:00:00Z"))) throw new Error("Stale-claim detection failed.");

const statusRaw = JSON.parse(await readFile(resolve(process.cwd(), "public/data/context/status.json"), "utf8")) as unknown;
const status = editorialContextAvailabilitySchema.parse(statusRaw);
if (status.available) throw new Error("U7 production editorial context must remain unavailable until reviewed real-world profiles are intentionally published.");
if (status.fixture) throw new Error("Production editorial status must not advertise fixture data.");
if (status.datasetUrl !== null) throw new Error("Unavailable editorial status must not expose a dataset URL.");

console.log("U7 contextual editorial validation passed.");
