import { readdir, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";

const dist = resolve(process.cwd(), "dist");
const html = await readFile(resolve(dist, "index.html"), "utf8");
if (html.includes('src="/src/')) throw new Error("Production index still references source modules.");
if (!html.includes("/unreached/assets/")) throw new Error("Production asset URLs are not rooted at /unreached/.");

for (const path of ["site.webmanifest", "icon.svg", "robots.txt", "maps/world-countries.geojson"]) {
  await stat(resolve(dist, path));
}

for (const domain of ["countries", "peoples", "prayer"]) {
  const directory = resolve(dist, "data", domain);
  const entries = await readdir(directory);
  if (entries.length !== 1 || entries[0] !== "status.json") {
    throw new Error(`U12C ${domain} must publish only runtime status metadata; static source-derived dataset files are forbidden (${entries.join(", ")}).`);
  }
  const status = JSON.parse(await readFile(resolve(directory, "status.json"), "utf8")) as {
    available?: unknown;
    fixture?: unknown;
    mode?: unknown;
    datasetUrl?: unknown;
  };
  if (status.available !== true || status.fixture !== false || status.mode !== "runtime-api" || status.datasetUrl !== null) {
    throw new Error(`U12C ${domain} dist status does not declare runtime-api publication safely.`);
  }
}

async function size(path: string): Promise<number> {
  const info = await stat(path);
  if (info.isFile()) return info.size;
  return (await Promise.all((await readdir(path)).map((entry) => size(resolve(path, entry))))).reduce((sum, value) => sum + value, 0);
}

const assetsDir = resolve(dist, "assets");
const assetNames = await readdir(assetsDir);
if (!assetNames.some((name) => /maplibre-gl-csp-worker/i.test(name))) {
  throw new Error("Production dist is missing the dedicated MapLibre worker asset.");
}

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
console.log(`U12C production-dist checks passed: ${(total / 1024 / 1024).toFixed(2)} MiB total, runtime-only PeopleGroups status files, ${(largestJsGzip / 1024).toFixed(1)} KiB largest JS gzip, ${(largestCssGzip / 1024).toFixed(1)} KiB largest CSS gzip.`);
