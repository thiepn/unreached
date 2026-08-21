import { readdir, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const dist = resolve(process.cwd(), "dist");
const html = await readFile(resolve(dist, "index.html"), "utf8");
if (html.includes('src="/src/')) throw new Error("Production index still references source modules.");
if (!html.includes("/unreached/assets/")) throw new Error("Production asset URLs are not rooted at /unreached/.");

for (const path of ["site.webmanifest", "icon.svg", "robots.txt", "maps/world-countries.geojson"]) {
  await stat(resolve(dist, path));
}

async function size(path: string): Promise<number> {
  const info = await stat(path);
  if (info.isFile()) return info.size;
  return (await Promise.all((await readdir(path)).map((entry) => size(resolve(path, entry))))).reduce((sum, value) => sum + value, 0);
}
const total = await size(dist);
if (total > 20 * 1024 * 1024) throw new Error(`Production dist unexpectedly exceeds 20 MiB (${total} bytes).`);
console.log(`U11 production-dist checks passed (${(total / 1024 / 1024).toFixed(2)} MiB).`);
