import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");
const readJson = async <T>(path: string): Promise<T> => JSON.parse(await readText(path)) as T;

const packageJson = await readJson<{ version: string }>("package.json");
if (packageJson.version !== "2.1.2") throw new Error("Maintenance release version must be 2.1.2.");

const readme = await readText("README.md");
for (const marker of [
  "**Current version:** **2.1.2**",
  "maintenance performance patch",
  "Public privacy notice",
  "LICENSE.md",
  "THIRD_PARTY_NOTICES.md",
  "PeopleGroups.org / IMB Global Research",
  "28 August 2026",
]) if (!readme.includes(marker)) throw new Error(`Release README truth missing: ${marker}`);
if (readme.includes("**Current version:** **2.1.1**") || readme.includes("**Version:** **2.0.0**")) throw new Error("README still advertises an obsolete release version.");

const privacy = await readText("PRIVACY.md");
for (const marker of [
  "Local-only use is the default",
  "Merge this device & enable sync",
  "latest `lastPrayedAt`",
  "does not currently implement its own analytics",
  "28 August 2026",
]) if (!privacy.includes(marker)) throw new Error(`Release privacy notice missing: ${marker}`);

const publicPrivacy = await readText("public/privacy.html");
for (const marker of ["Privacy notice", "28 August 2026", "Optional private continuity", "Analytics and advertising", "Your controls"]) {
  if (!publicPrivacy.includes(marker)) throw new Error(`Release public privacy page missing: ${marker}`);
}

const license = await readText("LICENSE.md");
if (!license.includes("All rights reserved") || !license.includes("no general license")) throw new Error("Project-authored licensing boundary is missing.");
const notices = await readText("THIRD_PARTY_NOTICES.md");
for (const marker of ["PeopleGroups.org / IMB Global Research", "Natural Earth", "ProgressBible", "Ethnologue", "Open-source packages"]) {
  if (!notices.includes(marker)) throw new Error(`Third-party notices missing: ${marker}`);
}

const index = await readText("index.html");
for (const required of [
  'rel="canonical" href="https://www.thiepn.dev/unreached/"',
  'rel="manifest" href="/unreached/site.webmanifest"',
  'name="robots"',
  'property="og:url" content="https://www.thiepn.dev/unreached/"',
]) if (!index.includes(required)) throw new Error(`Release metadata missing: ${required}`);

const manifest = await readJson<{ start_url: string; scope: string; icons: Array<{ src: string }> }>("public/site.webmanifest");
if (manifest.start_url !== "/unreached/#/" || manifest.scope !== "/unreached/") throw new Error("Web manifest is not scoped to /unreached/.");
if (!manifest.icons.some((icon) => icon.src === "/unreached/icon.svg")) throw new Error("Web manifest icon missing.");

interface PublicationStatus { available: boolean; fixture: boolean; datasetUrl: string | null; mode?: string; sourceIds?: string[]; templateVersion?: string; templateReviewedAt?: string; profileCount?: number; identityProvider?: string; }
const contextStatus = await readJson<PublicationStatus>("public/data/context/status.json");
if (!contextStatus.available || contextStatus.fixture) throw new Error("Context must publish reviewed non-fixture editorial content.");
if (contextStatus.mode !== "reviewed-editorial" || contextStatus.datasetUrl !== "data/context/manifest.v1.json") throw new Error("Context must use the certified sharded editorial manifest.");
if (!contextStatus.profileCount || contextStatus.profileCount < 6) throw new Error("Context must advertise at least six reviewed production profiles.");
if (contextStatus.identityProvider !== "peoplegroups-org") throw new Error("Context identities must be anchored to PeopleGroups.org PEIDs.");

for (const domain of ["mission", "countries", "peoples", "prayer", "languages"]) {
  const status = await readJson<PublicationStatus>(`public/data/${domain}/status.json`);
  if (!status.available || status.fixture || status.datasetUrl !== null) throw new Error(`${domain} must be active through runtime API mode without a bundled dataset.`);
  if (status.mode !== "runtime-api") throw new Error(`${domain} must declare runtime-api publication mode.`);
  if (!status.sourceIds?.includes("peoplegroups-org-api")) throw new Error(`${domain} must identify PeopleGroups.org as the runtime source.`);
}

const prayerStatus = await readJson<PublicationStatus>("public/data/prayer/status.json");
if (prayerStatus.templateVersion !== "u12c-v1" || prayerStatus.templateReviewedAt !== "2026-08-29") throw new Error("Prayer template certification metadata is missing or stale.");

interface RegistrySource {
  id: string;
  runtimeReadAllowed?: boolean;
  publicReleaseAllowed: boolean;
  browserRedistributionAllowed: boolean;
  termsReviewedAt: string;
}
const registry = await readJson<{ schemaVersion: number; reviewedAt: string; sources: RegistrySource[] }>("data/source-registry.json");
if (registry.schemaVersion !== 3 || registry.reviewedAt !== "2026-08-28") throw new Error("Source registry metadata is stale.");
const byId = new Map(registry.sources.map((source) => [source.id, source]));

const peopleGroups = byId.get("peoplegroups-org-api");
if (!peopleGroups?.runtimeReadAllowed || !peopleGroups.publicReleaseAllowed || peopleGroups.browserRedistributionAllowed) {
  throw new Error("PeopleGroups.org must be approved for public runtime use while static/browser corpus redistribution remains blocked.");
}
if (peopleGroups.termsReviewedAt !== "2026-08-28") throw new Error("PeopleGroups.org terms review date is stale.");

const naturalEarth = byId.get("natural-earth");
if (!naturalEarth?.publicReleaseAllowed || !naturalEarth.browserRedistributionAllowed || naturalEarth.termsReviewedAt !== "2026-08-28") {
  throw new Error("Natural Earth must remain public-domain approved with a current review date.");
}

for (const id of ["joshua-project-api", "progress-bible-registered-data", "ethnologue"]) {
  const source = byId.get(id);
  if (!source || source.runtimeReadAllowed || source.publicReleaseAllowed || source.browserRedistributionAllowed) throw new Error(`${id} must remain unavailable to the public runtime/static release.`);
  if (source.termsReviewedAt !== "2026-08-28") throw new Error(`${id} terms review date is stale.`);
}

const policy = await readText("docs/DATA_AND_LEGAL_POLICY.md");
for (const marker of ["production policy", "PeopleGroups.org / IMB Global Research", "APPROVED FOR PUBLIC RUNTIME ACCESS", "Project-authored code and content", "28 August 2026"]) {
  if (!policy.includes(marker)) throw new Error(`Data/legal policy missing: ${marker}`);
}
if (policy.includes("primary V1 source for people-group")) throw new Error("Obsolete Joshua Project primary-source policy remains in the current legal policy.");

const envExample = await readText(".env.example");
if (!envExample.includes("JOSHUA_PROJECT_API_KEY=")) throw new Error("Build-time API key example missing.");
if (index.includes("JOSHUA_PROJECT_API_KEY")) throw new Error("API key name leaked into client HTML.");

console.log("Release-truth checks passed: version 2.1.2, current privacy disclosure, PeopleGroups runtime permissions, attribution, project licensing and third-party notices agree with production behavior.");
