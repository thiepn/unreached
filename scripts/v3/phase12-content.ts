import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  editorialContextManifestSchema,
  editorialContextProfilePackageSchema,
  type EditorialContextManifest,
  type EditorialContextProfilePackage,
} from "../../src/context/types.js";
import {
  adaptLegacyContextPackageToV3Editorial,
  assertEditorialProfileIntegrity,
  type EditorialProfile,
} from "../../src/editorial/index.js";

export const PHASE12_REVIEWED_PROFILE_TARGET = 100;

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");
const readJson = async (path: string): Promise<unknown> => JSON.parse(await readText(path));

export interface Phase12EditorialCatalog {
  manifest: EditorialContextManifest;
  packages: EditorialContextProfilePackage[];
  profiles: EditorialProfile[];
  reviewedProfiles: EditorialProfile[];
  reviewedPeids: Set<number>;
  remaining: number;
}

function diskPath(profileUrl: string): string {
  return `public/${profileUrl}`;
}

export async function loadPhase12EditorialCatalog(now = new Date()): Promise<Phase12EditorialCatalog> {
  const manifest = editorialContextManifestSchema.parse(await readJson("public/data/context/manifest.v1.json"));
  if (manifest.fixture) throw new Error("Phase 12 requires the production editorial manifest, not fixture content.");
  if (manifest.profileCount !== manifest.profileUrls.length) {
    throw new Error(`Editorial manifest advertises ${manifest.profileCount} profiles but lists ${manifest.profileUrls.length} URLs.`);
  }
  if (new Set(manifest.profileUrls).size !== manifest.profileUrls.length) {
    throw new Error("Editorial manifest contains duplicate profile URLs.");
  }

  const packages: EditorialContextProfilePackage[] = [];
  const profiles: EditorialProfile[] = [];
  const peids = new Set<number>();

  for (const profileUrl of manifest.profileUrls) {
    const pkg = editorialContextProfilePackageSchema.parse(await readJson(diskPath(profileUrl)));
    if (pkg.fixture) throw new Error(`${profileUrl} is marked as fixture content and cannot count toward Phase 12.`);
    if (peids.has(pkg.profile.peid)) throw new Error(`Duplicate reviewed PEID ${pkg.profile.peid} in editorial publication.`);
    peids.add(pkg.profile.peid);

    const adapted = adaptLegacyContextPackageToV3Editorial(pkg, profileUrl);
    assertEditorialProfileIntegrity(adapted, now);
    packages.push(pkg);
    profiles.push(adapted);
  }

  const reviewedProfiles = profiles.filter((profile) => profile.tier === "reviewed" && profile.review.status === "published");
  const reviewedPeids = new Set(reviewedProfiles.map((profile) => Number(profile.peopleId.split(":").at(-1))));
  if (reviewedPeids.size !== reviewedProfiles.length) throw new Error("Reviewed V3 editorial catalog contains duplicate people identities.");

  return {
    manifest,
    packages,
    profiles,
    reviewedProfiles,
    reviewedPeids,
    remaining: Math.max(0, PHASE12_REVIEWED_PROFILE_TARGET - reviewedProfiles.length),
  };
}
