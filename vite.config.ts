import preact from "@preact/preset-vite";
import { existsSync, readdirSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { defineConfig, type Plugin } from "vite";

const APP_BASE = "/unreached/";
const OFFLINE_CACHE = "unreached-shell-v1.9.0";

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
    name: "unreached-v19-offline-shell",
    apply: "build",
    generateBundle(_options, bundle) {
      const publicFiles = listPublicFiles(resolve(process.cwd(), "public"));
      const bundleFiles = Object.keys(bundle)
        .filter((fileName) => !fileName.endsWith(".map") && fileName !== "sw.js")
        .map((fileName) => `./${fileName}`);
      const precache = Array.from(new Set(["./index.html", ...publicFiles, ...bundleFiles])).sort();
      const source = `const CACHE_NAME = ${JSON.stringify(OFFLINE_CACHE)};\nconst APP_BASE = ${JSON.stringify(APP_BASE)};\nconst PRECACHE = ${JSON.stringify(precache)};\n\nself.addEventListener("install", (event) => {\n  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));\n});\n\nself.addEventListener("activate", (event) => {\n  event.waitUntil(\n    caches.keys()\n      .then((names) => Promise.all(names.filter((name) => name.startsWith("unreached-shell-") && name !== CACHE_NAME).map((name) => caches.delete(name))))\n      .then(() => self.clients.claim())\n  );\n});\n\nself.addEventListener("fetch", (event) => {\n  const request = event.request;\n  if (request.method !== "GET") return;\n  const url = new URL(request.url);\n  if (url.origin !== self.location.origin || !url.pathname.startsWith(APP_BASE)) return;\n\n  if (request.mode === "navigate") {\n    event.respondWith(\n      fetch(request)\n        .then((response) => response.ok ? response : Promise.reject(new Error("navigation response was not successful")))\n        .catch(() => caches.match("./index.html").then((cached) => cached || Response.error()))\n    );\n    return;\n  }\n\n  event.respondWith(\n    caches.match(request).then((cached) => cached || fetch(request).then((response) => {\n      if (response.ok) {\n        const copy = response.clone();\n        void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));\n      }\n      return response;\n    }))\n  );\n});\n`;
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
