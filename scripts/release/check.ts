import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");
const readJson = async <T>(path: string): Promise<T> => JSON.parse(await readText(path)) as T;

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
if (contextStatus.mode !== "reviewed-editorial" || contextStatus.datasetUrl !== "data/context/manifest.v1.json") throw new Error("v1.3 context must use the certified sharded editorial manifest.");
if (!contextStatus.profileCount || contextStatus.profileCount < 6) throw new Error("v1.3 context must advertise at least six reviewed production profiles.");
if (contextStatus.identityProvider !== "peoplegroups-org") throw new Error("Context identities must be anchored to PeopleGroups.org PEIDs.");

for (const domain of ["mission", "countries", "peoples", "prayer", "languages"]) {
  const status = await readJson<PublicationStatus>(`public/data/${domain}/status.json`);
  if (!status.available || status.fixture || status.datasetUrl !== null) throw new Error(`${domain} must be active through runtime API mode without a bundled dataset.`);
  if (status.mode !== "runtime-api") throw new Error(`${domain} must declare runtime-api publication mode.`);
  if (!status.sourceIds?.includes("peoplegroups-org-api")) throw new Error(`${domain} must identify PeopleGroups.org as the runtime source.`);
}

const prayerStatus = await readJson<PublicationStatus>("public/data/prayer/status.json");
if (prayerStatus.templateVersion !== "u12c-v1" || prayerStatus.templateReviewedAt !== "2026-08-22") throw new Error("Prayer template certification metadata is missing or stale.");

const registry = await readJson<{ reviewedAt: string; sources: Array<{ id: string; runtimeReadAllowed?: boolean; publicReleaseAllowed: boolean; browserRedistributionAllowed: boolean }> }>("data/source-registry.json");
if (registry.reviewedAt !== "2026-08-22") throw new Error("Source registry must carry the current release review date.");
const byId = new Map(registry.sources.map((source) => [source.id, source]));
for (const id of ["joshua-project-api", "progress-bible-registered-data", "ethnologue"]) {
  const source = byId.get(id);
  if (!source || source.runtimeReadAllowed || source.publicReleaseAllowed || source.browserRedistributionAllowed) throw new Error(`${id} must remain unavailable to the public runtime and static release.`);
}
const peopleGroups = byId.get("peoplegroups-org-api");
if (!peopleGroups?.runtimeReadAllowed) throw new Error("PeopleGroups.org runtime reads must remain approved.");
if (peopleGroups.publicReleaseAllowed || peopleGroups.browserRedistributionAllowed) throw new Error("PeopleGroups.org static database release/redistribution must remain blocked; v1.3 publishes only reviewed authored editorial claims and source links.");
const naturalEarth = byId.get("natural-earth");
if (!naturalEarth?.publicReleaseAllowed || !naturalEarth.browserRedistributionAllowed) throw new Error("Natural Earth must remain approved for public geographic distribution.");

const envExample = await readText(".env.example");
if (!envExample.includes("JOSHUA_PROJECT_API_KEY=")) throw new Error("Build-time API key example missing.");
if (index.includes("JOSHUA_PROJECT_API_KEY")) throw new Error("API key name leaked into client HTML.");

console.log("v1.3 release-policy checks passed: runtime PeopleGroups domains remain non-redistributed; Context publishes six-plus reviewed PEID-native editorial shards through the certified manifest.");
