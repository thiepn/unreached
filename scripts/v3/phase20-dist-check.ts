import { existsSync } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";

const root = process.cwd();
const dist = resolve(root, "dist");
const assetsDir = resolve(dist, "assets");

interface ArchitectureLock {
  performanceBudgets: {
    entryJsRawBytes: number;
    entryJsGzipBytes: number;
    globalCssRawBytes: number;
    globalCssGzipBytes: number;
    exploreJsRawBytes: number;
    exploreJsGzipBytes: number;
    otherJsChunkRawBytes: number;
    otherJsChunkGzipBytes: number;
    maplibreCssRawBytes: number;
    maplibreWorkerRawBytes: number;
    initialShellGzipBytes: number;
  };
}

if (!existsSync(resolve(dist, "index.html"))) {
  throw new Error("V3 Phase 20 dist certification requires dist/index.html; run Vite build first.");
}

const lock = JSON.parse(
  await readFile(resolve(root, "data/v3-architecture-lock.json"), "utf8"),
) as ArchitectureLock;
const budgets = lock.performanceBudgets;
const indexHtml = await readFile(resolve(dist, "index.html"), "utf8");
const assetNames = await readdir(assetsDir);

async function measure(name: string): Promise<{ raw: number; gzip: number }> {
  const path = resolve(assetsDir, name);
  const raw = (await stat(path)).size;
  const bytes = await readFile(path);
  return { raw, gzip: gzipSync(bytes).length };
}

function initialAsset(kind: "js" | "css"): string {
  const expression = kind === "js"
    ? /<script[^>]+src="[^"]*\/assets\/([^"]+\.js)"/
    : /<link[^>]+href="[^"]*\/assets\/([^"]+\.css)"[^>]*>/;
  const name = indexHtml.match(expression)?.[1];
  if (!name) throw new Error("V3 Phase 20 could not identify initial " + kind + " asset.");
  return name;
}

function within(actual: number, limit: number, label: string): void {
  if (actual > limit) {
    throw new Error(
      "V3 Phase 20 performance budget exceeded: " + label + " " + actual + " bytes > " + limit + " bytes.",
    );
  }
}

const entryJs = initialAsset("js");
const globalCss = initialAsset("css");
const exploreJs = assetNames.find((name) => /^ExplorePage-.*\.js$/.test(name));
const mapCss = assetNames.find((name) => /^maplibre-gl-.*\.css$/.test(name));
const mapWorker = assetNames.find((name) => /^maplibre-gl-worker-.*\.js$/.test(name));

if (!exploreJs || !mapCss || !mapWorker) {
  throw new Error("V3 Phase 20 expected route-lazy Explore/MapLibre assets are missing.");
}

const entry = await measure(entryJs);
const css = await measure(globalCss);
const explore = await measure(exploreJs);
const mapStyles = await measure(mapCss);
const worker = await measure(mapWorker);

within(entry.raw, budgets.entryJsRawBytes, "initial JS raw");
within(entry.gzip, budgets.entryJsGzipBytes, "initial JS gzip");
within(css.raw, budgets.globalCssRawBytes, "global CSS raw");
within(css.gzip, budgets.globalCssGzipBytes, "global CSS gzip");
within(entry.gzip + css.gzip, budgets.initialShellGzipBytes, "initial shell JS+CSS gzip");
within(explore.raw, budgets.exploreJsRawBytes, "Explore lazy chunk raw");
within(explore.gzip, budgets.exploreJsGzipBytes, "Explore lazy chunk gzip");
within(mapStyles.raw, budgets.maplibreCssRawBytes, "MapLibre CSS raw");
within(worker.raw, budgets.maplibreWorkerRawBytes, "MapLibre worker raw");

for (const name of assetNames.filter((value) => value.endsWith(".js"))) {
  if (name === entryJs || name === exploreJs || name === mapWorker) continue;
  const chunk = await measure(name);
  within(chunk.raw, budgets.otherJsChunkRawBytes, "lazy JS raw " + name);
  within(chunk.gzip, budgets.otherJsChunkGzipBytes, "lazy JS gzip " + name);
}

if (indexHtml.includes(exploreJs) || indexHtml.includes(mapWorker)) {
  throw new Error("V3 Phase 20 Explore/MapLibre assets must remain absent from initial HTML.");
}

console.log(
  "V3 Phase 20 distribution budgets passed: "
  + "entry=" + entry.raw + "/" + entry.gzip
  + " css=" + css.raw + "/" + css.gzip
  + " initial-gzip=" + (entry.gzip + css.gzip)
  + " explore=" + explore.raw + "/" + explore.gzip
  + " map-worker=" + worker.raw,
);
