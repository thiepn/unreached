import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  editorialContextProfilePackageSchema,
  type EditorialContextProfilePackage,
} from "../../src/context/types.js";
import {
  adaptLegacyContextPackageToV3Editorial,
  assertEditorialProfileIntegrity,
} from "../../src/editorial/index.js";
import { createPeopleGroupsApiClient } from "../../src/providers/peoplegroups/index.js";
import { loadPhase12EditorialCatalog } from "./phase12-content.js";

const root = process.cwd();
const candidateDir = resolve(root, "data/v3/editorial/candidates");
const outputDir = resolve(root, "artifacts/v3-phase12/reviews");

function normalized(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
}

function shadowPublished(
  pkg: EditorialContextProfilePackage,
  reviewedAt: string,
): EditorialContextProfilePackage {
  return {
    ...pkg,
    profile: {
      ...pkg.profile,
      identity: {
        ...pkg.profile.identity,
        verifiedAt: reviewedAt,
      },
      review: {
        ...pkg.profile.review,
        status: "published",
        qualityTier: 3,
        reviewedAt,
        reviewerRole: "Phase 12 batch review-preview shadow only",
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

const entries = (await readdir(candidateDir))
  .filter((name) => /^[a-z0-9][a-z0-9._-]*\.json$/.test(name))
  .sort();

if (!entries.length) throw new Error("Phase 12 candidate workbench is empty.");

const now = new Date();
const checkedAt = now.toISOString();
const catalog = await loadPhase12EditorialCatalog(now);
const client = createPeopleGroupsApiClient();
const reports: Array<Record<string, unknown>> = [];

for (const name of entries) {
  const candidate = editorialContextProfilePackageSchema.parse(
    JSON.parse(await readFile(resolve(candidateDir, name), "utf8")) as unknown,
  );

  if (candidate.fixture) throw new Error(name + " is fixture content.");
  if (candidate.profile.review.status !== "draft" || candidate.profile.review.qualityTier !== 3) {
    throw new Error(name + " must remain a Tier-3 draft before maintainer review.");
  }
  if (catalog.reviewedPeids.has(candidate.profile.peid)) {
    throw new Error(name + " duplicates published PEID " + candidate.profile.peid + ".");
  }

  const pgid = candidate.profile.identity.pgidAnchors[0];
  if (!pgid) throw new Error(name + " has no PGID identity anchor.");

  const live = await client.fetchByPgid(pgid);
  const identityChecks = {
    peid: live.PEID === candidate.profile.peid,
    pgid: live.PGID === pgid,
    peopleName: normalized(live.NmDisp) === normalized(candidate.profile.identity.verifiedPeopleName),
    country: candidate.profile.identity.countryIso3Anchors.includes(live.ISOalpha3),
    language: Boolean(live.ROL && candidate.profile.identity.languageIso6393Anchors.includes(live.ROL)),
  };
  const failed = Object.entries(identityChecks)
    .filter(([, passed]) => !passed)
    .map(([key]) => key);
  if (failed.length) {
    throw new Error(name + " failed live identity checks: " + failed.join(", ") + ".");
  }

  const liveGsec = live.GSEC ?? null;
  if (liveGsec === null || liveGsec < 0 || liveGsec > 3) {
    throw new Error(name + " moved outside the Phase 12 GSEC 0–3 scope (current GSEC: " + (liveGsec ?? "unknown") + ").");
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

  const shadow = shadowPublished(candidate, checkedAt);
  assertEditorialProfileIntegrity(
    adaptLegacyContextPackageToV3Editorial(
      shadow,
      "data/v3/editorial/candidates/" + name,
    ),
    now,
  );

  reports.push({
    candidate: name,
    peid: candidate.profile.peid,
    pgid,
    peopleName: candidate.profile.identity.verifiedPeopleName,
    sourceCount: candidate.sources.length,
    claimCount: candidate.profile.claims.length,
    identityChecks,
    phase12Scope: { gsec0To3: true },
    liveMission,
    liveIdentity: {
      name: live.NmDisp,
      country: live.Ctry,
      countryIso3: live.ISOalpha3,
      language: live.Lang ?? null,
      languageIso6393: live.ROL ?? null,
      sourceUpdatedAt: live.UpdatedDate ?? null,
    },
    sources: candidate.sources.map((source) => ({
      id: source.id,
      title: source.title,
      publisher: source.publisher,
      url: source.url,
      locator: source.locator,
      sourceType: source.sourceType,
    })),
    claims: candidate.profile.claims.map((claim) => ({
      id: claim.id,
      dimension: claim.dimension,
      kind: claim.kind,
      text: claim.text,
      citationIds: claim.citationIds,
      temporalClass: claim.temporalClass,
      asOf: claim.asOf,
      reviewAfter: claim.reviewAfter,
      sensitivity: claim.sensitivity,
    })),
    structuralReviewedProfilePolicy: "pass",
    humanMaintainerReview: "required",
  });
}

await mkdir(outputDir, { recursive: true });

const index = {
  schemaVersion: 1,
  generatedAt: checkedAt,
  publicReviewedProfileCount: catalog.reviewedProfiles.length,
  reviewedProfileTarget: 100,
  draftCandidateCount: reports.length,
  notice: "This is a non-mutating review aid. Passing live identity and structural policy does not publish or count a candidate as reviewed.",
  candidates: reports,
};

await writeFile(
  resolve(outputDir, "workbench-review-index.json"),
  JSON.stringify(index, null, 2) + "\n",
  "utf8",
);

const markdown: string[] = [
  "# Phase 12 Candidate Workbench — Maintainer Review Index",
  "",
  "**Generated:** " + checkedAt,
  "",
  "**Public reviewed profiles:** " + catalog.reviewedProfiles.length + "/100",
  "",
  "**Draft candidates checked:** " + reports.length,
  "",
  "Every candidate below passed current PeopleGroups identity checks and the full reviewed-profile policy in shadow mode. None is published or counted until a human maintainer completes the evidence checklist and explicitly attests publication.",
  "",
];

for (const report of reports) {
  const liveMission = report.liveMission as {
    gsec?: unknown;
    gsecBrief?: unknown;
    evangelicalLevel?: unknown;
    engagementStatus?: unknown;
    congregationExists?: unknown;
    churchPlanting?: unknown;
    bibleAvailability?: unknown;
    jesusFilmAvailability?: unknown;
    totalResources?: unknown;
    sourceUpdatedAt?: unknown;
  };
  const sources = report.sources as Array<{ title?: unknown; url?: unknown; sourceType?: unknown; publisher?: unknown; locator?: unknown }>;
  markdown.push(
    "## " + String(report.peopleName),
    "",
    "- Candidate: `" + String(report.candidate) + "`",
    "- PEID: " + String(report.peid),
    "- PGID: " + String(report.pgid),
    "- Sources: " + String(report.sourceCount),
    "- Material claims: " + String(report.claimCount),
    "- Live identity: pass",
    "- Live Phase 12 GSEC 0–3 scope: pass",
    "- Reviewed-profile structural policy: pass",
    "",
    "### Live source snapshot",
    "",
    "- GSEC: " + String(liveMission.gsec ?? "unknown") + " — " + String(liveMission.gsecBrief ?? "No brief label"),
    "- Evangelical level: " + String(liveMission.evangelicalLevel ?? "Not reported"),
    "- Engagement: " + String(liveMission.engagementStatus ?? "Not reported"),
    "- Congregation exists: " + String(liveMission.congregationExists ?? "Not reported"),
    "- Church planting: " + String(liveMission.churchPlanting ?? "Not reported"),
    "- Bible availability: " + String(liveMission.bibleAvailability ?? "Not reported"),
    "- Jesus Film availability: " + String(liveMission.jesusFilmAvailability ?? "Not reported"),
    "- Total resources: " + String(liveMission.totalResources ?? "Not reported"),
    "- Source updated: " + String(liveMission.sourceUpdatedAt ?? "Not reported"),
    "",
    "### Evidence sources",
    "",
  );
  for (const source of sources) {
    markdown.push(
      "- [" + String(source.title ?? "Untitled source") + "](" + String(source.url ?? "") + ") — "
      + String(source.sourceType ?? "other") + "; "
      + String(source.locator ?? "No locator supplied"),
    );
  }
  markdown.push(
    "",
    "### Maintainer checks",
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
    "After those checks, use the guarded single-candidate publication command documented in the Phase 12 Editorial Workbench.",
    "",
  );
}

await writeFile(
  resolve(outputDir, "workbench-review-index.md"),
  markdown.join("\n") + "\n",
  "utf8",
);

console.log(
  "Phase 12 batch review packet prepared for " + reports.length
  + " candidates. All passed live identity, GSEC 0–3 scope and shadow-reviewed policy checks; human maintainer review is still required.",
);
