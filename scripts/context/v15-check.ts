import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { editorialCoverageRegionFor } from "../../src/context/coverage.js";
import { editorialContextAvailabilitySchema, editorialContextManifestSchema, editorialContextProfilePackageSchema } from "../../src/context/types.js";

const root = process.cwd();
const readJson = async <T>(path: string): Promise<T> => JSON.parse(await readFile(resolve(root, path), "utf8")) as T;

const pkg = await readJson<{ version?: string }>("package.json");
const [major = 0, minor = 0] = String(pkg.version ?? "0.0.0").split(".").map(Number);
if (major < 1 || (major === 1 && minor < 5)) throw new Error(`v1.5 capability gate requires package >=1.5.0, got ${String(pkg.version)}`);

const status = editorialContextAvailabilitySchema.parse(await readJson<unknown>("public/data/context/status.json"));
const manifest = editorialContextManifestSchema.parse(await readJson<unknown>("public/data/context/manifest.v1.json"));
if (status.profileCount !== 12 || manifest.profileCount !== 12 || manifest.profileUrls.length !== 12) throw new Error("v1.5 must preserve exactly twelve reviewed editorial profile shards.");

const required = new Map<number, { pgid: string; country: string; language: string }>([
  [12319, { pgid: "PG012319", country: "BEN", language: "fon" }],
  [7206, { pgid: "PG007206", country: "CHN", language: "cmn" }],
  [24104, { pgid: "PG024104", country: "CHN", language: "uig" }],
  [11954, { pgid: "PG011954", country: "SOM", language: "som" }],
  [24009, { pgid: "PG024009", country: "AFG", language: "pbt" }],
  [1156, { pgid: "PG001156", country: "BGD", language: "ben" }],
  [24277, { pgid: "PG024277", country: "KAZ", language: "kaz" }],
  [24529, { pgid: "PG024529", country: "TJK", language: "tgk" }],
  [22052, { pgid: "PG022052", country: "MMR", language: "ben" }],
  [14267, { pgid: "PG014267", country: "SEN", language: "wol" }],
  [24567, { pgid: "PG024567", country: "TUR", language: "kmr" }],
  [46650, { pgid: "PG046650", country: "IDN", language: "jav" }],
]);

const packages = await Promise.all(manifest.profileUrls.map(async (url) => editorialContextProfilePackageSchema.parse(await readJson<unknown>(`public/${url}`))));
const profiles = new Map(packages.map((item) => [item.profile.peid, item.profile]));
if (profiles.size !== 12) throw new Error("v1.5 editorial profiles contain duplicate PEIDs.");

for (const [peid, expected] of required) {
  const profile = profiles.get(peid);
  if (!profile) throw new Error(`v1.5 required editorial PEID ${peid} is missing.`);
  if (!profile.identity.pgidAnchors.includes(expected.pgid)) throw new Error(`PEID ${peid} is missing PGID anchor ${expected.pgid}.`);
  if (!profile.identity.countryIso3Anchors.includes(expected.country)) throw new Error(`PEID ${peid} is missing country anchor ${expected.country}.`);
  if (!profile.identity.languageIso6393Anchors.includes(expected.language)) throw new Error(`PEID ${peid} is missing language anchor ${expected.language}.`);
  if (profile.identity.numericCoincidenceUsed !== false || !profile.identity.matchEvidence.includes("provider-peid") || !profile.identity.matchEvidence.includes("provider-pgid")) throw new Error(`PEID ${peid} does not preserve explicit provider identity evidence.`);
  if (profile.review.status !== "published" || profile.review.qualityTier !== 3 || !profile.review.checklist.identityMatchChecked) throw new Error(`PEID ${peid} is not a published Tier-3 identity-reviewed profile.`);
}

const newPeids = [24277, 24529, 22052, 14267, 24567, 46650];
for (const peid of newPeids) {
  const item = packages.find((candidate) => candidate.profile.peid === peid)!;
  if (item.sources.length < 2) throw new Error(`v1.5 added PEID ${peid} without a second contextual source.`);
  if (item.profile.claims.length < 5) throw new Error(`v1.5 added PEID ${peid} without publication-depth claim coverage.`);
  if (item.profile.whyUnreached.length < 2) throw new Error(`v1.5 added PEID ${peid} without multiple evidence dimensions.`);
  if (!item.profile.claims.some((claim) => claim.kind === "synthesis" && claim.evidenceLevel === "B" && claim.citationIds.length >= 2)) throw new Error(`v1.5 added PEID ${peid} without cross-source Level-B synthesis.`);
}

const regions = new Set(packages.flatMap((item) => item.profile.identity.countryIso3Anchors.map(editorialCoverageRegionFor)));
if (regions.has("Other") || regions.size < 7) throw new Error(`v1.5 regional coverage gate expected at least seven explicit editorial regions, got ${[...regions].join(", ")}.`);

const coveragePage = await readFile(resolve(root, "src/pages/EditorialCoveragePage.tsx"), "utf8");
for (const requiredText of ["Coverage distribution", "Broader, still intentionally partial.", "All editorial regions", "not a quota, a ranking"]) {
  if (!coveragePage.includes(requiredText)) throw new Error(`v1.5 coverage browser is missing regional-balance guardrail: ${requiredText}`);
}

console.log(`v1.5 capability checks passed on package ${pkg.version}: ${profiles.size} Tier-3 profiles across ${regions.size} explicit editorial regions remain intact.`);
