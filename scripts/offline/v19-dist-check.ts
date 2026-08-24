import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const dist = resolve(process.cwd(), "dist");
const swPath = resolve(dist, "sw.js");
const sw = await readFile(swPath, "utf8");
const swInfo = await stat(swPath);
if (swInfo.size > 300 * 1024) throw new Error(`v1.9 service worker unexpectedly exceeds 300 KiB (${swInfo.size} bytes).`);
for (const marker of ["unreached-shell-v1.9.0", 'const APP_BASE = "/unreached/"', "./index.html", "./site.webmanifest", "./icon.svg", "./maps/world-countries.geojson", "./data/context/manifest.v1.json"]) {
  if (!sw.includes(marker)) throw new Error(`v1.9 production service worker missing precache marker: ${marker}`);
}
if (sw.includes("peoplegroups.org") || sw.includes("wp-json/pg/v1")) throw new Error("v1.9 production service worker must not embed or cache PeopleGroups.org API routes.");

const manifest = JSON.parse(await readFile(resolve(dist, "site.webmanifest"), "utf8")) as { id?: string; start_url?: string; scope?: string; display?: string; icons?: unknown[] };
if (manifest.id !== "/unreached/" || manifest.start_url !== "/unreached/#/" || manifest.scope !== "/unreached/" || manifest.display !== "standalone") throw new Error("v1.9 production manifest is not installable under /unreached/.");
if (!Array.isArray(manifest.icons) || manifest.icons.length < 1) throw new Error("v1.9 production manifest has no application icon.");

const html = await readFile(resolve(dist, "index.html"), "utf8");
if (!html.includes('rel="manifest" href="/unreached/site.webmanifest"')) throw new Error("v1.9 production HTML no longer links the scoped web manifest.");

for (const domain of ["mission", "countries", "peoples", "prayer", "languages"]) {
  const status = JSON.parse(await readFile(resolve(dist, "data", domain, "status.json"), "utf8")) as { mode?: unknown; datasetUrl?: unknown; fixture?: unknown };
  if (status.mode !== "runtime-api" || status.datasetUrl !== null || status.fixture !== false) throw new Error(`v1.9 ${domain} must remain runtime-only and must not become a bundled PeopleGroups mirror.`);
}

console.log(`v1.9 production offline checks passed: ${(swInfo.size / 1024).toFixed(1)} KiB service worker, scoped installable manifest, owned offline assets, and no bundled PeopleGroups corpus.`);
