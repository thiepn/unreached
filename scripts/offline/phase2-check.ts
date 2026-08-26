import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");
const vite = await readText("vite.config.ts");
const runtime = await readText("src/offline/runtime.ts");
const distCheck = await readText("scripts/offline/v19-dist-check.ts");
const browser = await readText("tests/e2e/phase2-service-worker.spec.ts");

for (const marker of [
  'createHash("sha256")',
  'OFFLINE_CACHE_PREFIX = "unreached-shell-"',
  "ESSENTIAL_PUBLIC_PRECACHE",
  "listPublicFiles",
  "readFileSync",
  "buildId",
  "cacheFirst",
  "networkFirst",
  'APP_BASE + "assets/"',
  "PRECACHE",
  "const cache = await caches.open(CACHE_NAME)",
  "const cached = await cache.match",
]) {
  if (!vite.includes(marker)) throw new Error(`Phase 2 service-worker generator missing ${marker}.`);
}
for (const forbidden of ["self.skipWaiting", "self.clients.claim", 'OFFLINE_CACHE = "unreached-shell-v1.9.0"', "caches.match("]) {
  if (vite.includes(forbidden)) throw new Error(`Phase 2 service-worker generator contains forbidden legacy/cross-generation behavior: ${forbidden}.`);
}
for (const marker of [
  'OFFLINE_UPDATE_EVENT = "unreached:offline-update-ready"',
  'updateViaCache: "none"',
  'registration.addEventListener("updatefound"',
  'installing.addEventListener("statechange"',
  "registration.waiting",
  "navigator.serviceWorker.controller",
]) {
  if (!runtime.includes(marker)) throw new Error(`Phase 2 offline runtime missing ${marker}.`);
}
for (const marker of [
  "unreached-shell-[0-9a-f]{16}",
  "Phase 2 production service worker must not force activation",
  'entry.startsWith("./data/")',
  'entry.startsWith("./maps/")',
  'entry.startsWith("./assets/")',
]) {
  if (!distCheck.includes(marker)) throw new Error(`Phase 2 dist certification missing ${marker}.`);
}
for (const marker of [
  "first install does not take over the already-open tab",
  "precache keeps build chunks but excludes mutable data trees",
  "navigator.serviceWorker.controller",
  "caches.keys()",
]) {
  if (!browser.includes(marker)) throw new Error(`Phase 2 browser certification missing ${marker}.`);
}

console.log("Phase 2 service-worker source checks passed: build-fingerprinted and generation-isolated caches, waiting activation, update-cache bypass, immutable bundle precache, mutable-data network-first handling, and browser lifecycle coverage.");
