import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { editorialContextProfilePackageSchema, type EditorialContextProfilePackage } from "../../src/context/types.js";
import { adaptLegacyContextPackageToV3Editorial, assertEditorialProfileIntegrity } from "../../src/editorial/index.js";
import { loadPhase12EditorialCatalog } from "./phase12-content.js";
import { evidenceAuditMap, loadPhase12EvidenceAuditIndex } from "./phase12-evidence-audits.js";
import { loadPhase12ReviewBatchIndex, reviewAssignmentMap } from "./phase12-review-batches.js";

const root = process.cwd();
const candidateDir = resolve(root, "data/v3/editorial/candidates");

function shadowPublishedPackage(pkg: EditorialContextProfilePackage): EditorialContextProfilePackage {
  return {
    ...pkg,
    profile: {
      ...pkg.profile,
      review: {
        ...pkg.profile.review,
        status: "published",
        qualityTier: 3,
        reviewedAt: new Date().toISOString(),
        reviewerRole: "Phase 12 mechanical candidate validation only",
        checklist: {
          namingChecked: true,
          materialClaimsCited: true,
          currentClaimsFresh: true,
          noStereotypeShortcuts: true,
          religionNuanced: true,
          sensitiveDataChecked: true,
          sourceLicensingChecked: true,
          identityMatchChecked: true,
        },
      },
    },
  };
}

const catalog = await loadPhase12EditorialCatalog();
const entries = (await readdir(candidateDir)).filter((name) => name.endsWith(".json")).sort();
if (!entries.length) throw new Error("Phase 12 candidate workspace is empty.");

const auditIndex = await loadPhase12EvidenceAuditIndex();
const auditsByCandidate = evidenceAuditMap(auditIndex);
if (auditIndex.entries.length !== entries.length) {
  throw new Error(`Phase 12 evidence-audit index has ${auditIndex.entries.length} entries for ${entries.length} candidates.`);
}

const reviewBatchIndex = await loadPhase12ReviewBatchIndex();
const reviewAssignments = reviewAssignmentMap(reviewBatchIndex);
if (reviewAssignments.size !== entries.length) {
  throw new Error(`Phase 12 review-batch registry assigns ${reviewAssignments.size} candidates for ${entries.length} current drafts.`);
}
for (const assigned of reviewAssignments.keys()) {
  if (!entries.includes(assigned)) throw new Error(`Phase 12 review-batch registry assigns stale/nonexistent candidate ${assigned}.`);
}

const seenPeids = new Set<number>();
for (const name of entries) {
  const raw = JSON.parse(await readFile(resolve(candidateDir, name), "utf8"));
  const pkg = editorialContextProfilePackageSchema.parse(raw);
  const profile = pkg.profile;
  const audit = auditsByCandidate.get(name);
  if (!audit) throw new Error(`${name} has no indexed AI-assisted pre-review evidence audit.`);
  const reviewAssignment = reviewAssignments.get(name);
  if (!reviewAssignment) throw new Error(`${name} has no accountable human review-batch assignment.`);
  if (!reviewAssignment.title.includes("Editorial Review")) {
    throw new Error(`${name} review batch #${reviewAssignment.issue} is not clearly labeled as an editorial review batch.`);
  }
  const auditDocument = await readFile(resolve(root, audit.document), "utf8");
  const auditLower = auditDocument.toLocaleLowerCase("en");
  if (!auditLower.includes("not maintainer approval") || !auditLower.includes("not publication")) {
    throw new Error(`${audit.document} must explicitly remain a pre-review aid, not maintainer approval/publication.`);
  }

  if (pkg.fixture) throw new Error(`${name} is fixture content and cannot be a Phase 12 editorial candidate.`);
  if (profile.review.status !== "draft") throw new Error(`${name} must remain draft until an intentional maintainer evidence review publishes it.`);
  if (profile.review.qualityTier !== 3) throw new Error(`${name} must target the substantial Tier-3 reviewed-profile contract.`);
  if (profile.review.reviewedAt !== null || profile.review.reviewerRole !== null) {
    throw new Error(`${name} is a draft but already claims review metadata.`);
  }
  if (catalog.reviewedPeids.has(profile.peid)) throw new Error(`${name} duplicates already-published PEID ${profile.peid}.`);
  if (seenPeids.has(profile.peid)) throw new Error(`Duplicate candidate PEID ${profile.peid}.`);
  seenPeids.add(profile.peid);

  if (pkg.sources.length < 3) throw new Error(`${name} needs at least three cited sources before maintainer review.`);
  if (!pkg.sources.some((source) => source.sourceType !== "mission-research")) {
    throw new Error(`${name} needs independent/authoritative human-context evidence beyond mission-research sources.`);
  }
  if (profile.claims.length < 4) throw new Error(`${name} is too thin for the Phase 12 substantial-profile target.`);

  const sourceIds = new Set(pkg.sources.map((source) => source.id));
  const cited = new Set(profile.claims.flatMap((claim) => claim.citationIds));
  for (const id of cited) if (!sourceIds.has(id)) throw new Error(`${name} cites missing source ${id}.`);
  for (const id of profile.sourceIds) if (!sourceIds.has(id)) throw new Error(`${name} declares missing profile source ${id}.`);

  // Run the full reviewed-profile policy on an in-memory shadow publication.
  // This proves structural/evidence readiness only. The persisted candidate
  // stays draft and does not acquire review metadata or count toward 3.0.
  const shadow = shadowPublishedPackage(pkg);
  const adapted = adaptLegacyContextPackageToV3Editorial(shadow, `data/v3/editorial/candidates/${name}`);
  assertEditorialProfileIntegrity(adapted, new Date());
}

console.log(`V3 Phase 12 candidate checks passed for ${entries.length} review-ready draft${entries.length === 1 ? "" : "s"} with one indexed AI-assisted pre-review evidence audit and exactly one accountable human review-batch assignment per draft. Drafts remain excluded from the ${catalog.reviewedProfiles.length}/100 published reviewed-profile count until maintainer evidence review.`);
