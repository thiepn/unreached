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
]) {
  if (!index.includes(required)) throw new Error(`Release metadata missing: ${required}`);
}

const manifest = await readJson<{ start_url: string; scope: string; icons: Array<{ src: string }> }>("public/site.webmanifest");
if (manifest.start_url !== "/unreached/#/" || manifest.scope !== "/unreached/") throw new Error("Web manifest is not scoped to /unreached/.");
if (!manifest.icons.some((icon) => icon.src === "/unreached/icon.svg")) throw new Error("Web manifest icon missing.");

const gatedStatusFiles = [
  "public/data/mission/status.json",
  "public/data/countries/status.json",
  "public/data/peoples/status.json",
  "public/data/context/status.json",
  "public/data/prayer/status.json",
  "public/data/languages/status.json",
];
for (const path of gatedStatusFiles) {
  const status = await readJson<{ available: boolean; fixture: boolean; datasetUrl: string | null }>(path);
  if (status.available || status.fixture || status.datasetUrl !== null) throw new Error(`${path} violates the production publication gate.`);
}

const registry = await readJson<{ reviewedAt: string; sources: Array<{ id: string; publicReleaseAllowed: boolean; browserRedistributionAllowed: boolean }> }>("data/source-registry.json");
if (registry.reviewedAt !== "2026-08-22") throw new Error("Source registry must carry the U11 release review date.");
const byId = new Map(registry.sources.map((source) => [source.id, source]));
for (const id of ["joshua-project-api", "progress-bible-registered-data", "ethnologue"]) {
  const source = byId.get(id);
  if (!source || source.publicReleaseAllowed || source.browserRedistributionAllowed) throw new Error(`${id} must remain release-gated.`);
}
const naturalEarth = byId.get("natural-earth");
if (!naturalEarth?.publicReleaseAllowed || !naturalEarth.browserRedistributionAllowed) throw new Error("Natural Earth must remain approved for public geographic distribution.");

const envExample = await readText(".env.example");
if (!envExample.includes("JOSHUA_PROJECT_API_KEY=")) throw new Error("Build-time API key example missing.");
if (index.includes("JOSHUA_PROJECT_API_KEY")) throw new Error("API key name leaked into client HTML.");

console.log("U11 release-policy and metadata checks passed.");
