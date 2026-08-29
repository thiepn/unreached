import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFile(resolve(root, path), "utf8");
const readJson = async <T>(path: string): Promise<T> => JSON.parse(await read(path)) as T;
const FINAL_REVIEW_DATE = "2026-08-29";

function requireText(source: string, marker: string, label: string): void {
  if (!source.includes(marker)) throw new Error(`Phase 5: missing ${label}`);
}

function isoDay(value: string): number {
  const parsed = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(parsed)) throw new Error(`Phase 5: invalid ISO day ${value}`);
  return parsed;
}

interface EditorialClaim {
  id: string;
  text: string;
  citationIds: string[];
  temporalClass: string;
  reviewAfter: string | null;
  sensitivity: string;
  interpretationNote: string | null;
}

interface EditorialShard {
  schemaVersion: number;
  fixture: boolean;
  sources: Array<{ id: string; url: string; accessedAt: string }>;
  profile: {
    peopleEntityId: string;
    peid: number;
    identity: {
      provider: string;
      targetPeid: number;
      pgidAnchors: string[];
      countryIso3Anchors: string[];
      languageIso6393Anchors: string[];
      numericCoincidenceUsed: boolean;
    };
    whoTheyAre: { summary: string };
    religionAndCommunity: { summary: string };
    whyUnreachedIntro: string;
    whyUnreached: Array<{ summary: string; claimIds: string[] }>;
    claims: EditorialClaim[];
    sourceIds: string[];
    review: {
      status: string;
      qualityTier: number;
      aiAssisted: boolean;
      reviewedAt: string;
      reviewerRole: string;
      checklist: Record<string, boolean>;
    };
  };
}

const packageJson = await readJson<{ version: string; scripts?: Record<string, string> }>("package.json");
if (packageJson.version !== "2.1.2") throw new Error("Phase 5: maintenance release must be 2.1.2.");
if (!packageJson.scripts?.["phase5:check"]?.includes("scripts/release/phase5-check.ts")) throw new Error("Phase 5: phase5:check script is not wired.");
if (!packageJson.scripts?.build?.includes("npm run release:check && npm run phase5:check && vite build")) {
  throw new Error("Phase 5: final-release gate must block the production build after release truth checks.");
}

const manifest = await readJson<{ profileCount: number; profileUrls: string[] }>("public/data/context/manifest.v1.json");
const expectedProfiles = [
  "data/context/profiles/fon-benin.json",
  "data/context/profiles/hui-china.json",
  "data/context/profiles/uyghur-china.json",
  "data/context/profiles/somali-somalia.json",
  "data/context/profiles/southern-pashtun-afghanistan.json",
  "data/context/profiles/bengali-sunni-bangladesh.json",
  "data/context/profiles/kazakh-kazakhstan.json",
  "data/context/profiles/tajik-tajikistan.json",
  "data/context/profiles/rohingya-myanmar.json",
  "data/context/profiles/wolof-senegal.json",
  "data/context/profiles/kurmanji-kurds-turkiye.json",
  "data/context/profiles/javanese-transmigrants-indonesia.json",
].sort();
if (manifest.profileCount !== 12 || manifest.profileUrls.length !== 12) throw new Error("Phase 5: exactly 12 reviewed Tier-3 profiles must ship.");
if (JSON.stringify([...manifest.profileUrls].sort()) !== JSON.stringify(expectedProfiles)) throw new Error("Phase 5: editorial manifest profile set drifted.");

const prohibitedEditorial = [
  "primitive",
  "backward",
  "hostile religion",
  "spiritually resistant",
  "their culture rejects christianity",
  "they are muslim, therefore unreached",
  "no one has heard the gospel",
];
const releaseDay = isoDay(FINAL_REVIEW_DATE);
for (const publicUrl of manifest.profileUrls) {
  const path = `public/${publicUrl}`;
  const shard = await readJson<EditorialShard>(path);
  if (shard.schemaVersion !== 1 || shard.fixture) throw new Error(`Phase 5: invalid production editorial shard ${path}`);
  const profile = shard.profile;
  if (profile.peopleEntityId !== `people-entity:peoplegroups:${profile.peid}`) throw new Error(`Phase 5: PEID entity mismatch in ${path}`);
  if (profile.identity.provider !== "peoplegroups-org" || profile.identity.targetPeid !== profile.peid || profile.identity.numericCoincidenceUsed !== false) {
    throw new Error(`Phase 5: identity contract failed in ${path}`);
  }
  if (profile.identity.pgidAnchors.length < 1 || profile.identity.countryIso3Anchors.length < 1 || profile.identity.languageIso6393Anchors.length < 1) {
    throw new Error(`Phase 5: explicit PGID/country/language anchors missing in ${path}`);
  }
  if (profile.review.status !== "published" || profile.review.qualityTier !== 3 || profile.review.aiAssisted !== true || !profile.review.reviewedAt || !profile.review.reviewerRole) {
    throw new Error(`Phase 5: reviewed Tier-3 publication metadata failed in ${path}`);
  }
  const failedChecklist = Object.entries(profile.review.checklist).filter(([, passed]) => !passed).map(([name]) => name);
  if (failedChecklist.length) throw new Error(`Phase 5: incomplete editorial checklist in ${path}: ${failedChecklist.join(", ")}`);

  const sourceIds = new Set(shard.sources.map((source) => source.id));
  if (sourceIds.size !== shard.sources.length) throw new Error(`Phase 5: duplicate source IDs in ${path}`);
  for (const source of shard.sources) {
    if (!/^https:\/\//.test(source.url) || !source.accessedAt) throw new Error(`Phase 5: source provenance incomplete in ${path}: ${source.id}`);
  }
  for (const id of profile.sourceIds) if (!sourceIds.has(id)) throw new Error(`Phase 5: undeclared profile source ${id} in ${path}`);

  const claimIds = new Set(profile.claims.map((claim) => claim.id));
  if (claimIds.size !== profile.claims.length) throw new Error(`Phase 5: duplicate claim IDs in ${path}`);
  for (const claim of profile.claims) {
    if (claim.citationIds.length < 1) throw new Error(`Phase 5: uncited material claim ${claim.id} in ${path}`);
    for (const citationId of claim.citationIds) if (!sourceIds.has(citationId)) throw new Error(`Phase 5: claim ${claim.id} cites missing source ${citationId}`);
    if (claim.sensitivity === "restricted") throw new Error(`Phase 5: restricted claim is publicly shipped: ${claim.id}`);
    if (claim.temporalClass === "current") {
      if (!claim.reviewAfter) throw new Error(`Phase 5: current claim lacks reviewAfter: ${claim.id}`);
      if (isoDay(claim.reviewAfter) <= releaseDay) throw new Error(`Phase 5: current claim is stale at final review: ${claim.id}`);
    }
  }
  for (const block of profile.whyUnreached) for (const id of block.claimIds) if (!claimIds.has(id)) throw new Error(`Phase 5: why-unreached block references missing claim ${id}`);

  const editorialText = [
    profile.whoTheyAre.summary,
    profile.religionAndCommunity.summary,
    profile.whyUnreachedIntro,
    ...profile.whyUnreached.map((item) => item.summary),
    ...profile.claims.map((claim) => `${claim.text} ${claim.interpretationNote ?? ""}`),
  ].join("\n").toLocaleLowerCase("en");
  for (const phrase of prohibitedEditorial) if (editorialText.includes(phrase)) throw new Error(`Phase 5: prohibited editorial shortcut '${phrase}' found in ${path}`);
}

const prayerStatus = await readJson<{ templateVersion: string; templateReviewedAt: string }>("public/data/prayer/status.json");
if (prayerStatus.templateVersion !== "u12c-v1" || prayerStatus.templateReviewedAt !== FINAL_REVIEW_DATE) {
  throw new Error("Phase 5: prayer runtime publication metadata must record the 29 August 2026 final review.");
}
const livePrayer = await read("src/prayer/live.ts");
for (const marker of [
  'reviewedAt: "2026-08-29"',
  'scripture("Romans 10:14–15"',
  'scripture("Colossians 1:9–12"',
  'scripture("Acts 14:21–23"',
  'scripture("2 Timothy 3:15–17"',
  'scripture("Matthew 9:37–38"',
  'scripture("Jeremiah 29:7"',
  'scripture("1 Timothy 2:1–4"',
  "without coercion",
]) requireText(livePrayer, marker, `final prayer-template marker ${marker}`);
for (const forbidden of ["streak", "leaderboard", "score", "prayerCount", "sessionHistory"]) {
  if (livePrayer.includes(forbidden)) throw new Error(`Phase 5: prayer template unexpectedly contains persisted/performance concept ${forbidden}`);
}

const webmanifest = await readJson<{ id: string; start_url: string; scope: string; display: string; icons: Array<{ src: string; sizes: string; type: string; purpose?: string }> }>("public/site.webmanifest");
if (webmanifest.id !== "/unreached/" || webmanifest.start_url !== "/unreached/#/" || webmanifest.scope !== "/unreached/" || webmanifest.display !== "standalone") {
  throw new Error("Phase 5: PWA identity/scope contract failed.");
}
for (const required of [
  ["/unreached/icon.svg", "any", "image/svg+xml"],
  ["/unreached/icon-192.png", "192x192", "image/png"],
  ["/unreached/icon-512.png", "512x512", "image/png"],
] as const) {
  const [src, sizes, type] = required;
  if (!webmanifest.icons.some((icon) => icon.src === src && icon.sizes === sizes && icon.type === type)) throw new Error(`Phase 5: missing PWA icon ${src}`);
}
for (const path of ["public/icon.svg", "public/icon-192.png", "public/icon-512.png", "public/apple-touch-icon.png"]) {
  if (!existsSync(resolve(root, path))) throw new Error(`Phase 5: PWA icon asset missing: ${path}`);
}
const index = await read("index.html");
for (const marker of [
  'rel="apple-touch-icon" href="/unreached/apple-touch-icon.png"',
  'name="apple-mobile-web-app-capable" content="yes"',
  'name="apple-mobile-web-app-title" content="Unreached"',
  'name="mobile-web-app-capable" content="yes"',
]) requireText(index, marker, `PWA head marker ${marker}`);

const browserCert = await read("docs/BROWSER_CERTIFICATION.md");
for (const marker of ["Phase 5", "Pixel 7", "iPhone 15", "physical-hardware acceptance is not claimed", "200%-zoom-equivalent"]) {
  requireText(browserCert, marker, `browser certification topic ${marker}`);
}
const phase5Doc = await read("docs/PHASE5_FINAL_RELEASE.md");
for (const marker of ["29 August 2026", "All 12 Tier-3", "Physical-device boundary", "GitHub currently exposes `main` as unprotected"]) {
  requireText(phase5Doc, marker, `Phase 5 certification documentation ${marker}`);
}
const maintenance = await read("docs/MAINTENANCE_MODE.md");
for (const marker of ["Maintenance Mode", "security or privacy fixes", "scope is frozen", "CODEOWNERS", "branch protection"]) {
  requireText(maintenance, marker, `maintenance-mode topic ${marker}`);
}
const codeowners = await read(".github/CODEOWNERS");
requireText(codeowners, "* @thiepn", "repository CODEOWNERS owner");
const releaseNotes = await read("docs/releases/v2.1.2.md");
for (const marker of ["Unreached v2.1.2", "maintenance performance patch", "Release publication remains exact-SHA gated", "physical-hardware testing", "branch protection"]) {
  requireText(releaseNotes, marker, `v2.1.2 release-note topic ${marker}`);
}
const releaseWorkflow = await read(".github/workflows/publish-v2.1.2.yml");
for (const marker of ["workflow_run:", "Deploy Unreached to GitHub Pages", "v2.1.2", "unreached/pages-production", "unreached/peoplegroups-live", "unreached/worker-production", "POST", "/releases"]) {
  requireText(releaseWorkflow, marker, `exact-SHA v2.1.2 release workflow marker ${marker}`);
}
const phase5Spec = await read("tests/e2e/phase5-release-acceptance.spec.ts");
for (const marker of ["PWA manifest and install assets", "portrait and landscape", "200%-zoom-equivalent", "offline controlled shell relaunch"]) {
  requireText(phase5Spec, marker, `Phase 5 browser acceptance ${marker}`);
}

const profileDir = resolve(root, "public/data/context/profiles");
const profileFiles = (await readdir(profileDir)).filter((name) => name.endsWith(".json"));
if (profileFiles.length !== 12) throw new Error(`Phase 5: expected exactly 12 published profile shards, found ${profileFiles.length}.`);

console.log("Phase 5 final-release checks passed for v2.1.2: 12 reviewed profiles retain cited/nuanced current-safe content, prayer template review is current, PWA packaging is complete, device-class acceptance is wired, and exact-SHA release/maintenance governance is present.");
