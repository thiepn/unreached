import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";

const root = process.cwd();
const outDir = resolve(root, "artifacts", "audit");
const outPath = resolve(outDir, "phase0-baseline.json");

interface FileMetric {
  path: string;
  bytes: number;
}

interface BaselineReport {
  generatedAt: string;
  packageVersion: string | null;
  source: {
    tsTsxFiles: number;
    cssFiles: number;
    cssBytes: number;
    versionCssFiles: string[];
  };
  productionDist: null | {
    totalBytes: number;
    jsBytes: number;
    cssBytes: number;
    jsChunks: FileMetric[];
    cssAssets: FileMetric[];
    serviceWorkerBytes: number | null;
  };
  contracts: {
    peopleGroupsPageSize: number | null;
    peopleGroupsFetchConcurrency: number | null;
    peopleGroupsMaxRecords: number | null;
    privateSyncMaxMutations: number | null;
    privateSyncMaxBodyBytes: number | null;
    prayerListMaxItems: number | null;
    peopleListPageSize: number | null;
  };
  notes: string[];
}

async function exists(path: string): Promise<boolean> {
  try { await stat(path); return true; } catch { return false; }
}

async function walk(dir: string): Promise<string[]> {
  if (!(await exists(dir))) return [];
  const output: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) output.push(...await walk(path));
    else if (entry.isFile()) output.push(path);
  }
  return output;
}

function numberFrom(source: string, expression: RegExp): number | null {
  const match = expression.exec(source);
  if (!match?.[1]) return null;
  const value = Number(match[1].replaceAll("_", ""));
  return Number.isFinite(value) ? value : null;
}

async function fileMetric(path: string): Promise<FileMetric> {
  const info = await stat(path);
  return { path: relative(root, path).replaceAll("\\", "/"), bytes: info.size };
}

const pkg = JSON.parse(await readFile(resolve(root, "package.json"), "utf8")) as { version?: string };
const srcFiles = await walk(resolve(root, "src"));
const cssFiles = srcFiles.filter((path) => extname(path) === ".css");
const tsTsxFiles = srcFiles.filter((path) => path.endsWith(".ts") || path.endsWith(".tsx"));
const cssMetrics = await Promise.all(cssFiles.map(fileMetric));
const versionCssFiles = cssMetrics
  .map((item) => item.path)
  .filter((path) => /\/v(?:\d|\d{2,})[^/]*\.css$/i.test(path));

const peopleApi = await readFile(resolve(root, "src/providers/peoplegroups/api.ts"), "utf8");
const syncWorker = await readFile(resolve(root, "worker/src/index.ts"), "utf8");
const personalizationTypes = await readFile(resolve(root, "src/personalization/types.ts"), "utf8");
const peoplesPage = await readFile(resolve(root, "src/pages/PeoplesPage.tsx"), "utf8");

let productionDist: BaselineReport["productionDist"] = null;
const distDir = resolve(root, "dist");
if (await exists(distDir)) {
  const distFiles = await walk(distDir);
  const metrics = await Promise.all(distFiles.map(fileMetric));
  const jsChunks = metrics.filter((item) => item.path.endsWith(".js") && !item.path.endsWith("sw.js")).sort((a, b) => b.bytes - a.bytes);
  const cssAssets = metrics.filter((item) => item.path.endsWith(".css")).sort((a, b) => b.bytes - a.bytes);
  productionDist = {
    totalBytes: metrics.reduce((sum, item) => sum + item.bytes, 0),
    jsBytes: jsChunks.reduce((sum, item) => sum + item.bytes, 0),
    cssBytes: cssAssets.reduce((sum, item) => sum + item.bytes, 0),
    jsChunks,
    cssAssets,
    serviceWorkerBytes: metrics.find((item) => item.path.endsWith("/sw.js") || item.path === "dist/sw.js")?.bytes ?? null,
  };
}

const report: BaselineReport = {
  generatedAt: new Date().toISOString(),
  packageVersion: pkg.version ?? null,
  source: {
    tsTsxFiles: tsTsxFiles.length,
    cssFiles: cssFiles.length,
    cssBytes: cssMetrics.reduce((sum, item) => sum + item.bytes, 0),
    versionCssFiles,
  },
  productionDist,
  contracts: {
    peopleGroupsPageSize: numberFrom(peopleApi, /PEOPLE_GROUPS_PAGE_SIZE\s*=\s*([\d_]+)/),
    peopleGroupsFetchConcurrency: numberFrom(peopleApi, /PEOPLE_GROUPS_FETCH_CONCURRENCY\s*=\s*([\d_]+)/),
    peopleGroupsMaxRecords: numberFrom(peopleApi, /PEOPLE_GROUPS_MAX_RECORDS\s*=\s*([\d_]+)/),
    privateSyncMaxMutations: numberFrom(syncWorker, /MAX_MUTATIONS\s*=\s*([\d_]+)/),
    privateSyncMaxBodyBytes: numberFrom(syncWorker, /MAX_BODY_BYTES\s*=\s*([\d_]+)/),
    prayerListMaxItems: numberFrom(personalizationTypes, /MAX_PRAYER_LIST\s*=\s*([\d_]+)/),
    peopleListPageSize: numberFrom(peoplesPage, /PEOPLE_PAGE_SIZE\s*=\s*([\d_]+)/),
  },
  notes: [
    productionDist ? "Production dist metrics were captured from the existing dist directory." : "No dist directory existed. Run `npm run build && npm run audit:baseline` to capture production bundle metrics.",
    "Browser timing, storage-failure, slow-provider, navigation-state and large-list regressions are covered by tests/e2e/phase0-regression.spec.ts.",
    "Phase 0 is observational: it must not change product runtime behavior.",
  ],
};

await mkdir(outDir, { recursive: true });
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
console.log(`Phase 0 baseline written to ${relative(root, outPath).replaceAll("\\", "/")}`);
