import preact from "@preact/preset-vite";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { defineConfig, type Plugin } from "vite";

const APP_BASE = "/unreached/";
const OFFLINE_CACHE_PREFIX = "unreached-shell-";
const ESSENTIAL_PUBLIC_PRECACHE = ["./site.webmanifest", "./icon.svg"];

function listPublicFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  const files: string[] = [];
  const visit = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) files.push(`./${relative(root, absolute).split(sep).join("/")}`);
    }
  };
  visit(root);
  return files;
}

function offlineBundlePlugin(): Plugin {
  return {
    name: "unreached-phase2-deployment-safe-offline-shell",
    apply: "build",
    generateBundle(_options, bundle) {
      const publicRoot = resolve(process.cwd(), "public");
      const publicFiles = listPublicFiles(publicRoot).sort();
      const bundleEntries = Object.entries(bundle)
        .filter(([fileName]) => !fileName.endsWith(".map") && fileName !== "sw.js")
        .sort(([a], [b]) => a.localeCompare(b));

      const hash = createHash("sha256");
      for (const [fileName, output] of bundleEntries) {
        hash.update(fileName);
        hash.update("\0");
        if (output.type === "chunk") hash.update(output.code);
        else if (typeof output.source === "string") hash.update(output.source);
        else hash.update(output.source);
        hash.update("\0");
      }
      // Public editorial/geography changes must create a new cache generation even
      // though those mutable files are not eagerly precached.
      for (const publicFile of publicFiles) {
        hash.update(publicFile);
        hash.update("\0");
        hash.update(readFileSync(resolve(publicRoot, publicFile.slice(2))));
        hash.update("\0");
      }

      const buildId = hash.digest("hex").slice(0, 16);
      const cacheName = `${OFFLINE_CACHE_PREFIX}${buildId}`;
      const bundleFiles = bundleEntries.map(([fileName]) => `./${fileName}`);
      const precache = Array.from(new Set(["./index.html", ...ESSENTIAL_PUBLIC_PRECACHE, ...bundleFiles])).sort();

      const source = `const BUILD_ID = ${JSON.stringify(buildId)};\nconst CACHE_NAME = ${JSON.stringify(cacheName)};\nconst CACHE_PREFIX = ${JSON.stringify(OFFLINE_CACHE_PREFIX)};\nconst APP_BASE = ${JSON.stringify(APP_BASE)};\nconst PRECACHE = ${JSON.stringify(precache)};\n\nasync function cacheSuccessful(request, response) {\n  if (!response || !response.ok || response.type === "opaque") return response;\n  const cache = await caches.open(CACHE_NAME);\n  await cache.put(request, response.clone());\n  return response;\n}\n\nasync function cacheFirst(request) {\n  const cache = await caches.open(CACHE_NAME);\n  const cached = await cache.match(request, { ignoreVary: true });\n  if (cached) return cached;\n  return cacheSuccessful(request, await fetch(request));\n}\n\nasync function networkFirst(request, fallbackRequest = request) {\n  try {\n    const response = await fetch(request);\n    if (!response.ok) throw new Error("network response was not successful");\n    return cacheSuccessful(request, response);\n  } catch {\n    const cache = await caches.open(CACHE_NAME);\n    const cached = await cache.match(fallbackRequest, { ignoreVary: true });\n    return cached || Response.error();\n  }\n}\n\nself.addEventListener("install", (event) => {\n  // Do not force activation. A newly deployed worker waits until tabs controlled by\n  // the previous generation are gone, keeping their old lazy chunks available.\n  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)));\n});\n\nself.addEventListener("activate", (event) => {\n  // Activation only occurs once the previous worker is no longer controlling tabs.\n  // At that point older cache generations can be removed safely.\n  event.waitUntil(\n    caches.keys().then((names) => Promise.all(\n      names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name))\n    ))\n  );\n});\n\nself.addEventListener("fetch", (event) => {\n  const request = event.request;\n  if (request.method !== "GET" || request.headers.has("range")) return;\n  const url = new URL(request.url);\n  if (url.origin !== self.location.origin || !url.pathname.startsWith(APP_BASE)) return;\n  if (url.pathname === APP_BASE + "sw.js") return;\n\n  if (request.mode === "navigate") {\n    event.respondWith(networkFirst(request, "./index.html"));\n    return;\n  }\n\n  // Hashed build assets are immutable and every build chunk is precached so an\n  // older still-open tab can lazy-load a route after a newer deployment lands.\n  if (url.pathname.startsWith(APP_BASE + "assets/")) {\n    event.respondWith(cacheFirst(request));\n    return;\n  }\n\n  // Mutable owned editorial, geography and metadata are network-first. They are\n  // cached after a successful visit and remain available as an offline fallback.\n  event.respondWith(networkFirst(request));\n});\n`;
      this.emitFile({ type: "asset", fileName: "sw.js", source });
    },
  };
}

export default defineConfig({
  base: APP_BASE,
  plugins: [preact(), offlineBundlePlugin()],
  build: {
    target: "es2022",
    sourcemap: true,
    cssCodeSplit: true,
    reportCompressedSize: true
  }
});
