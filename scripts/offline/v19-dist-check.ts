import { readFile, stat } from "node:fs/promises";
import { resolve, sep } from "node:path";

const dist = resolve(process.cwd(), "dist");
const swPath = resolve(dist, "sw.js");
const sw = await readFile(swPath, "utf8");
const swInfo = await stat(swPath);
if (swInfo.size > 300 * 1024) throw new Error(`v1.9+ service worker unexpectedly exceeds 300 KiB (${swInfo.size} bytes).`);

const cacheMatch = /const CACHE_NAME = "(unreached-shell-[0-9a-f]{16})";/.exec(sw);
const buildMatch = /const BUILD_ID = "([0-9a-f]{16})";/.exec(sw);
if (!cacheMatch || !buildMatch || cacheMatch[1] !== `unreached-shell-${buildMatch[1]}`) throw new Error("Phase 2 production service worker must use a build-fingerprinted cache generation.");
for (const marker of ['const APP_BASE = "/unreached/"', "./index.html", "./site.webmanifest", "./icon.svg", "cacheFirst", "networkFirst"]) {
  if (!sw.includes(marker)) throw new Error(`v1.9+ production service worker missing offline marker: ${marker}`);
}
if (sw.includes("skipWaiting") || sw.includes("clients.claim")) throw new Error("Phase 2 production service worker must not force activation or claim old tabs.");
if (sw.includes("peoplegroups.org") || sw.includes("wp-json/pg/v1")) throw new Error("v1.9+ production service worker must not embed or cache PeopleGroups.org API routes.");

const precacheMatch = /const PRECACHE = (\[[^;]+\]);/.exec(sw);
if (!precacheMatch) throw new Error("Phase 2 production service worker is missing a parseable PRECACHE manifest.");
const precache = JSON.parse(precacheMatch[1]!) as string[];
if (!precache.includes("./index.html") || !precache.includes("./site.webmanifest") || !precache.includes("./icon.svg")) throw new Error("Phase 2 essential shell assets are missing from the install precache.");
if (!precache.some((entry) => entry.startsWith("./assets/"))) throw new Error("Phase 2 must precache versioned build assets for old-tab lazy-route compatibility.");
if (precache.some((entry) => entry.startsWith("./data/") || entry.startsWith("./maps/"))) throw new Error("Phase 2 must not eagerly precache mutable editorial/data or geography trees.");
if (new Set(precache).size !== precache.length) throw new Error("Phase 2 production service-worker precache contains duplicate entries.");

const missingPrecacheEntries: string[] = [];
for (const entry of precache) {
  if (!entry.startsWith("./")) throw new Error(`Phase 2 precache entry must be relative to the application root: ${entry}`);
  const target = resolve(dist, entry.slice(2));
  if (target !== dist && !target.startsWith(`${dist}${sep}`)) throw new Error(`Phase 2 precache entry escapes the production artifact: ${entry}`);
  try {
    const info = await stat(target);
    if (!info.isFile()) missingPrecacheEntries.push(entry);
  } catch {
    missingPrecacheEntries.push(entry);
  }
}
if (missingPrecacheEntries.length > 0) {
  throw new Error(`Phase 2 service-worker precache references files absent from dist: ${missingPrecacheEntries.join(", ")}`);
}

const manifest = JSON.parse(await readFile(resolve(dist, "site.webmanifest"), "utf8")) as { id?: string; start_url?: string; scope?: string; display?: string; icons?: unknown[] };
if (manifest.id !== "/unreached/" || manifest.start_url !== "/unreached/#/" || manifest.scope !== "/unreached/" || manifest.display !== "standalone") throw new Error("v1.9 production manifest is not installable under /unreached/.");
if (!Array.isArray(manifest.icons) || manifest.icons.length < 1) throw new Error("v1.9 production manifest has no application icon.");

const html = await readFile(resolve(dist, "index.html"), "utf8");
if (!html.includes('rel="manifest" href="/unreached/site.webmanifest"')) throw new Error("v1.9 production HTML no longer links the scoped web manifest.");

for (const domain of ["mission", "countries", "peoples", "prayer", "languages"]) {
  const status = JSON.parse(await readFile(resolve(dist, "data", domain, "status.json"), "utf8")) as { mode?: unknown; datasetUrl?: unknown; fixture?: unknown };
  if (status.mode !== "runtime-api" || status.datasetUrl !== null || status.fixture !== false) throw new Error(`v1.9 ${domain} must remain runtime-only and must not become a bundled PeopleGroups mirror.`);
}

console.log(`Phase 2 production offline checks passed: ${(swInfo.size / 1024).toFixed(1)} KiB worker, build-fingerprinted cache, complete on-disk precache, safe waiting activation, bundle-chunk precache, mutable-data network-first boundary, and no bundled PeopleGroups corpus.`);
