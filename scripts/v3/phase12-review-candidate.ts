import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { editorialContextAvailabilitySchema, editorialContextManifestSchema, editorialContextProfilePackageSchema, type EditorialContextProfilePackage } from "../../src/context/types.js";
import { adaptLegacyContextPackageToV3Editorial, assertEditorialProfileIntegrity } from "../../src/editorial/index.js";
import { createPeopleGroupsApiClient } from "../../src/providers/peoplegroups/index.js";
import { loadPhase12EditorialCatalog } from "./phase12-content.js";
import { evidenceAuditMap, loadPhase12EvidenceAuditIndex } from "./phase12-evidence-audits.js";

const root = process.cwd();
const args = process.argv.slice(2);
const value = (name: string) => args.find((arg) => arg.startsWith(`--${name}=`))?.split("=", 2)[1]?.trim() || null;
const has = (name: string) => args.includes(`--${name}`);
const normalized = (input: string | null | undefined) => (input ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase("en");

function reviewed(pkg: EditorialContextProfilePackage, role: string, at: string): EditorialContextProfilePackage {
  return { ...pkg, profile: { ...pkg.profile, identity: { ...pkg.profile.identity, verifiedAt: at }, review: {
    ...pkg.profile.review, status: "published", qualityTier: 3, reviewedAt: at, reviewerRole: role,
    checklist: { namingChecked: true, materialClaimsCited: true, currentClaimsFresh: true, noStereotypeShortcuts: true, religionNuanced: true, sensitiveDataChecked: true, sourceLicensingChecked: true, identityMatchChecked: true },
  } } };
}

const name = value("candidate");
if (!name || basename(name) !== name || !/^[a-z0-9][a-z0-9._-]*\.json$/.test(name)) {
  throw new Error("Use --candidate=<candidate.json>.");
}
const candidatePath = resolve(root, "data/v3/editorial/candidates", name);
const candidate = editorialContextProfilePackageSchema.parse(JSON.parse(await readFile(candidatePath, "utf8")) as unknown);
if (candidate.fixture || candidate.profile.review.status !== "draft" || candidate.profile.review.qualityTier !== 3) {
  throw new Error(`${name} is not a publishable Tier-3 draft candidate.`);
}

const now = new Date();
const at = now.toISOString();
const catalog = await loadPhase12EditorialCatalog(now);
const auditIndex = await loadPhase12EvidenceAuditIndex();
const preReviewAudit = evidenceAuditMap(auditIndex).get(name);
if (!preReviewAudit) throw new Error(`${name} has no indexed AI-assisted pre-review evidence audit.`);
if (catalog.reviewedPeids.has(candidate.profile.peid)) throw new Error(`PEID ${candidate.profile.peid} is already published.`);
const pgid = candidate.profile.identity.pgidAnchors[0];
if (!pgid) throw new Error(`${name} has no PGID anchor.`);
const live = await createPeopleGroupsApiClient().fetchByPgid(pgid);
const identity = {
  peid: live.PEID === candidate.profile.peid,
  pgid: live.PGID === pgid,
  name: normalized(live.NmDisp) === normalized(candidate.profile.identity.verifiedPeopleName),
  country: candidate.profile.identity.countryIso3Anchors.includes(live.ISOalpha3),
  language: Boolean(live.ROL && candidate.profile.identity.languageIso6393Anchors.includes(live.ROL)),
};
const failed = Object.entries(identity).filter(([, ok]) => !ok).map(([key]) => key);
if (failed.length) throw new Error(`${name} failed live identity checks: ${failed.join(", ")}.`);

const liveGsec = live.GSEC ?? null;
if (liveGsec === null || liveGsec < 0 || liveGsec > 3) {
  throw new Error(`${name} moved outside the Phase 12 GSEC 0–3 scope (current GSEC: ${liveGsec ?? "unknown"}).`);
}
const liveMission = {
  gsec: liveGsec,
  gsecBrief: live.GSECbrf ?? null,
  evangelicalLevel: live.EvngLvl ?? null,
  engagementStatus: live.EngStat ?? null,
  congregationExists: live.CongExst ?? null,
  churchPlanting: live.Plnting ?? null,
  bibleAvailability: live.Bible ?? null,
  jesusFilmAvailability: live.Jesus ?? null,
  totalResources: live.ResTot ?? null,
  sourceUpdatedAt: live.UpdatedDate ?? null,
};

const shadow = reviewed(candidate, "Phase 12 review-preview shadow only", at);
assertEditorialProfileIntegrity(adaptLegacyContextPackageToV3Editorial(shadow, `data/v3/editorial/candidates/${name}`), now);

const reviewDir = resolve(root, "artifacts/v3-phase12/reviews");
await mkdir(reviewDir, { recursive: true });
await writeFile(resolve(reviewDir, `${name.replace(/\.json$/, "")}.json`), `${JSON.stringify({
  schemaVersion: 1, generatedAt: at, candidate: name, peid: candidate.profile.peid, pgid, identity,
  phase12Scope: { gsec0To3: true }, liveMission, preReviewAudit,
  sourceCount: candidate.sources.length, claimCount: candidate.profile.claims.length,
  sources: candidate.sources.map(({ id, title, publisher, url, locator, sourceType }) => ({ id, title, publisher, url, locator, sourceType })),
  claims: candidate.profile.claims.map(({ id, dimension, kind, temporalClass, text, citationIds, asOf, reviewAfter, sensitivity }) => ({ id, dimension, kind, temporalClass, text, citationIds, asOf, reviewAfter, sensitivity })),
  reviewedProfilePolicy: "pass", publicationRequested: has("publish"), maintainerAttestationRequired: true,
}, null, 2)}\n`, "utf8");

const markdown: string[] = [
  "# Phase 12 Maintainer Review — " + candidate.profile.identity.verifiedPeopleName,
  "",
  "**Generated:** " + at,
  "",
  "- Candidate: `" + name + "`",
  "- PEID: " + candidate.profile.peid,
  "- PGID: " + pgid,
  "- Live identity checks: pass",
  "- Live Phase 12 GSEC 0–3 scope: pass",
  "- Reviewed-profile structural policy: pass",
  "- AI-assisted pre-review audit: `" + preReviewAudit.document + "` (" + preReviewAudit.checkedAt + "; not maintainer approval)",
  "- Publication requested: " + (has("publish") ? "yes" : "no"),
  "",
  "## Live source snapshot",
  "",
  "- GSEC: " + liveMission.gsec + " — " + (liveMission.gsecBrief ?? "No brief label"),
  "- Evangelical level: " + (liveMission.evangelicalLevel ?? "Not reported"),
  "- Engagement: " + (liveMission.engagementStatus ?? "Not reported"),
  "- Congregation exists: " + (liveMission.congregationExists ?? "Not reported"),
  "- Church planting: " + (liveMission.churchPlanting ?? "Not reported"),
  "- Bible availability: " + (liveMission.bibleAvailability ?? "Not reported"),
  "- Jesus Film availability: " + (liveMission.jesusFilmAvailability ?? "Not reported"),
  "- Total resources: " + (liveMission.totalResources ?? "Not reported"),
  "- Source updated: " + (liveMission.sourceUpdatedAt ?? "Not reported"),
  "",
  "## Evidence sources",
  "",
];
for (const source of candidate.sources) {
  markdown.push(
    "### " + source.title,
    "",
    "- Type: " + source.sourceType,
    "- Publisher: " + (source.publisher ?? "Not reported"),
    "- URL: " + source.url,
    "- Locator: " + (source.locator ?? "No locator supplied"),
    "",
  );
}
markdown.push("## Material claims", "");
for (const claim of candidate.profile.claims) {
  markdown.push(
    "### " + claim.id,
    "",
    "- Dimension: " + claim.dimension,
    "- Kind: " + claim.kind + " / evidence " + claim.evidenceLevel + " / certainty " + claim.certainty,
    "- Temporal class: " + claim.temporalClass,
    "- As of: " + (claim.asOf ?? "stable/not dated"),
    "- Review after: " + (claim.reviewAfter ?? "not scheduled"),
    "- Sensitivity: " + claim.sensitivity,
    "- Citations: " + claim.citationIds.join(", "),
    "",
    claim.text,
    "",
    claim.interpretationNote ? "**Interpretation note:** " + claim.interpretationNote : "",
    "",
  );
}
markdown.push(
  "## Human maintainer checks",
  "",
  "- [ ] Naming and identity checked against the live record.",
  "- [ ] Every material claim opened and supported by its cited locator.",
  "- [ ] Current claims and review dates are fresh.",
  "- [ ] No stereotype or causal-shortcut language remains.",
  "- [ ] Religion/community wording is aggregate and nuanced.",
  "- [ ] Sensitive material and geographic precision are acceptable.",
  "- [ ] Source reuse/licensing and attribution are acceptable.",
  "- [ ] Missing dimensions remain explicit gaps rather than invented filler.",
  "",
  "**Publication boundary:** this packet is a review aid. It does not itself authorize publication.",
  "",
);
await writeFile(
  resolve(reviewDir, name.replace(/\.json$/, "") + ".md"),
  markdown.join("\n") + "\n",
  "utf8",
);

if (!has("publish")) {
  console.log(`Prepared non-mutating review packet for ${name}; live identity, GSEC 0–3 scope and reviewed-profile policy passed. Human evidence review is still required.`);
  process.exit(0);
}

const role = value("reviewer-role");
if (!has("attest-review-complete")) throw new Error("--publish requires --attest-review-complete after all eight maintainer checks.");
if (!role) throw new Error("--publish requires --reviewer-role=<human maintainer role>.");
if (/shadow|mechanical|automation|\bai\b|assistant/i.test(role)) throw new Error("reviewer-role must identify an accountable human maintainer role.");

const finalPackage = reviewed(candidate, role, at);
assertEditorialProfileIntegrity(adaptLegacyContextPackageToV3Editorial(finalPackage, `data/context/profiles/${name}`), now);

const manifestPath = resolve(root, "public/data/context/manifest.v1.json");
const statusPath = resolve(root, "public/data/context/status.json");
const manifest = editorialContextManifestSchema.parse(JSON.parse(await readFile(manifestPath, "utf8")) as unknown);
const status = editorialContextAvailabilitySchema.parse(JSON.parse(await readFile(statusPath, "utf8")) as unknown);
const profileUrl = `data/context/profiles/${name}`;
if (manifest.profileUrls.includes(profileUrl)) throw new Error(`${profileUrl} is already in the manifest.`);
const urls = [...manifest.profileUrls, profileUrl];
const nextManifest = editorialContextManifestSchema.parse({ ...manifest, generatedAt: at, profileCount: urls.length, profileUrls: urls });
const nextStatus = editorialContextAvailabilitySchema.parse({ ...status, profileCount: urls.length });

await writeFile(resolve(root, "public", profileUrl), `${JSON.stringify(finalPackage, null, 2)}\n`, "utf8");
await writeFile(manifestPath, `${JSON.stringify(nextManifest, null, 2)}\n`, "utf8");
await writeFile(statusPath, `${JSON.stringify(nextStatus, null, 2)}\n`, "utf8");
await unlink(candidatePath);
console.log(`Published ${name} as reviewed profile ${urls.length}/100 after explicit maintainer attestation. Re-run Phase 12 readiness, build and browser certification before committing.`);
