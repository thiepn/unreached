import { readdir, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";

const dist = resolve(process.cwd(), "dist");
const html = await readFile(resolve(dist, "index.html"), "utf8");
if (html.includes('src="/src/')) throw new Error("Production index still references source modules.");
if (!html.includes("/unreached/assets/")) throw new Error("Production asset URLs are not rooted at /unreached/.");
for (const path of ["site.webmanifest", "icon.svg", "robots.txt", "maps/world-countries.geojson"]) await stat(resolve(dist, path));

for (const domain of ["mission", "countries", "peoples", "prayer", "languages"]) {
  const directory = resolve(dist, "data", domain);
  const entries = await readdir(directory);
  const forbidden = entries.filter((entry) => entry !== "status.json" && entry !== "README.txt");
  if (forbidden.length) throw new Error(`v1.3 ${domain} must not ship a static source-derived dataset (${forbidden.join(", ")}).`);
  if (!entries.includes("status.json")) throw new Error(`v1.3 ${domain} runtime status metadata is missing from dist.`);
  const status = JSON.parse(await readFile(resolve(directory, "status.json"), "utf8")) as { available?: unknown; fixture?: unknown; mode?: unknown; datasetUrl?: unknown };
  if (status.available !== true || status.fixture !== false || status.mode !== "runtime-api" || status.datasetUrl !== null) throw new Error(`v1.3 ${domain} dist status does not declare runtime-api publication safely.`);
}

const contextDirectory = resolve(dist, "data", "context");
const contextEntries = await readdir(contextDirectory);
const allowedContextEntries = new Set(["status.json", "manifest.v1.json", "profiles", "README.txt"]);
const unexpectedContext = contextEntries.filter((entry) => !allowedContextEntries.has(entry));
if (unexpectedContext.length) throw new Error(`v1.3 context dist contains uncertified entries (${unexpectedContext.join(", ")}).`);
if (!contextEntries.includes("status.json") || !contextEntries.includes("manifest.v1.json") || !contextEntries.includes("profiles")) throw new Error("v1.3 reviewed context publication files are missing from dist.");

const contextStatus = JSON.parse(await readFile(resolve(contextDirectory, "status.json"), "utf8")) as { available?: unknown; fixture?: unknown; mode?: unknown; datasetUrl?: unknown; profileCount?: unknown };
if (contextStatus.available !== true || contextStatus.fixture !== false || contextStatus.mode !== "reviewed-editorial" || contextStatus.datasetUrl !== "data/context/manifest.v1.json" || typeof contextStatus.profileCount !== "number" || contextStatus.profileCount < 6) throw new Error("v1.3 context dist status does not declare the reviewed sharded publication safely.");

const editorialManifest = JSON.parse(await readFile(resolve(contextDirectory, "manifest.v1.json"), "utf8")) as { schemaVersion?: unknown; fixture?: unknown; profileCount?: unknown; profileUrls?: unknown };
if (editorialManifest.schemaVersion !== 1 || editorialManifest.fixture !== false || editorialManifest.profileCount !== contextStatus.profileCount || !Array.isArray(editorialManifest.profileUrls) || editorialManifest.profileUrls.length !== contextStatus.profileCount) throw new Error("v1.3 editorial manifest does not match status metadata.");
const profileUrls = editorialManifest.profileUrls as string[];
if (new Set(profileUrls).size !== profileUrls.length) throw new Error("v1.3 editorial manifest contains duplicate profile URLs.");
const requiredPeids = new Set([12319, 7206, 24104, 11954, 24009, 1156]);
const publishedPeids = new Set<number>();
for (const url of profileUrls) {
  if (!/^data\/context\/profiles\/[a-z0-9][a-z0-9._-]*\.json$/.test(url)) throw new Error(`Invalid editorial shard URL in dist manifest: ${url}`);
  const relative = url.replace(/^data\/context\//, "");
  const pkg = JSON.parse(await readFile(resolve(contextDirectory, relative), "utf8")) as { schemaVersion?: unknown; fixture?: unknown; profile?: { peid?: unknown; peopleEntityId?: unknown; review?: { status?: unknown; qualityTier?: unknown } }; sources?: unknown[] };
  if (pkg.schemaVersion !== 1 || pkg.fixture !== false || !pkg.profile || !Array.isArray(pkg.sources) || pkg.sources.length < 1) throw new Error(`Invalid production editorial shard: ${url}`);
  const peid = pkg.profile.peid;
  if (typeof peid !== "number" || pkg.profile.peopleEntityId !== `people-entity:peoplegroups:${peid}` || pkg.profile.review?.status !== "published" || pkg.profile.review?.qualityTier !== 3) throw new Error(`Uncertified editorial profile package: ${url}`);
  if (publishedPeids.has(peid)) throw new Error(`Duplicate editorial PEID ${peid} in dist.`);
  publishedPeids.add(peid);
}
for (const peid of requiredPeids) if (!publishedPeids.has(peid)) throw new Error(`Required v1.3 editorial PEID ${peid} is missing from dist.`);

async function size(path: string): Promise<number> {
  const info = await stat(path);
  if (info.isFile()) return info.size;
  return (await Promise.all((await readdir(path)).map((entry) => size(resolve(path, entry))))).reduce((sum, value) => sum + value, 0);
}

const assetsDir = resolve(dist, "assets");
const assetNames = await readdir(assetsDir);
if (!assetNames.some((name) => /maplibre-gl-csp-worker/i.test(name))) throw new Error("Production dist is missing the dedicated MapLibre worker asset.");
let largestJsGzip = 0;
let largestCssGzip = 0;
for (const name of assetNames) {
  if (!name.endsWith(".js") && !name.endsWith(".css")) continue;
  const compressed = gzipSync(await readFile(resolve(assetsDir, name))).byteLength;
  if (name.endsWith(".js")) largestJsGzip = Math.max(largestJsGzip, compressed);
  if (name.endsWith(".css")) largestCssGzip = Math.max(largestCssGzip, compressed);
}
if (largestJsGzip > 375 * 1024) throw new Error(`Largest JS chunk exceeds 375 KiB gzip (${largestJsGzip} bytes).`);
if (largestCssGzip > 60 * 1024) throw new Error(`Largest CSS chunk exceeds 60 KiB gzip (${largestCssGzip} bytes).`);
const geographyBytes = (await stat(resolve(dist, "maps/world-countries.geojson"))).size;
if (geographyBytes > 5 * 1024 * 1024) throw new Error(`World geography unexpectedly exceeds 5 MiB (${geographyBytes} bytes).`);
const total = await size(dist);
if (total > 20 * 1024 * 1024) throw new Error(`Production dist unexpectedly exceeds 20 MiB (${total} bytes).`);
console.log(`v1.3 production-dist checks passed: ${(total / 1024 / 1024).toFixed(2)} MiB total, runtime-only PeopleGroups domains plus ${publishedPeids.size} reviewed editorial profile shards, ${(largestJsGzip / 1024).toFixed(1)} KiB largest JS gzip, ${(largestCssGzip / 1024).toFixed(1)} KiB largest CSS gzip.`);
