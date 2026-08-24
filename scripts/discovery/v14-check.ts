import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");
const readJson = async <T>(path: string): Promise<T> => JSON.parse(await readText(path)) as T;

const pkg = await readJson<{ version?: string }>("package.json");
if (pkg.version !== "1.4.0") throw new Error(`v1.4 package version mismatch: ${String(pkg.version)}`);

const router = await readText("src/app/router.ts");
if (!router.includes('| "coverage"') || !router.includes('"/coverage": "coverage"')) throw new Error("v1.4 reviewed coverage route is not registered.");

const app = await readText("src/app/App.tsx");
if (!app.includes("EditorialCoveragePage") || !app.includes('case "coverage"')) throw new Error("v1.4 coverage page is not routed by the application shell.");

const shell = await readText("src/components/AppShell.tsx");
if (!shell.includes('label: "Reviewed coverage"') || !shell.includes('path: "/coverage"')) throw new Error("v1.4 reviewed coverage is missing from Browse navigation.");

const coverage = await readText("src/pages/EditorialCoveragePage.tsx");
for (const required of [
  "useEditorialContext",
  "useWorldGeography",
  "Coverage is an editorial-publication measure.",
  "more important, more urgent, or more unreached",
  "data-editorial-coverage-grid",
]) if (!coverage.includes(required)) throw new Error(`v1.4 coverage page is missing required contract text/code: ${required}`);
if (coverage.includes("useLivePeopleExplorer") || coverage.includes("peoplegroups.org")) throw new Error("v1.4 local-first coverage page must not activate or directly depend on the PeopleGroups runtime corpus.");

const peoples = await readText("src/pages/PeoplesPage.tsx");
for (const required of ["reviewedOnly", "Reviewed context only", "people-editorial-badge", 'hrefFor("/coverage")']) {
  if (!peoples.includes(required)) throw new Error(`v1.4 People Explorer coverage integration missing: ${required}`);
}

const country = await readText("src/components/CountryGuidedStart.tsx");
for (const required of ["countryIso3Anchors.includes(countryIso3)", "Deeper context published for", "publication coverage, not a ranking of mission importance"]) {
  if (!country.includes(required)) throw new Error(`v1.4 country editorial discovery integration missing: ${required}`);
}

const panel = await readText("src/components/EditorialContextPanel.tsx");
for (const required of ["context-coverage-nav", "Previous reviewed profile", "Next reviewed profile", 'hrefFor("/coverage")']) {
  if (!panel.includes(required)) throw new Error(`v1.4 reviewed-article navigation missing: ${required}`);
}

const main = await readText("src/main.tsx");
if (!main.includes('"./styles/v14.css"')) throw new Error("v1.4 discovery stylesheet is not loaded.");

const manifest = await readJson<{ fixture?: boolean; profileCount?: number; profileUrls?: string[] }>("public/data/context/manifest.v1.json");
if (manifest.fixture !== false || !manifest.profileCount || manifest.profileCount < 6 || manifest.profileUrls?.length !== manifest.profileCount) {
  throw new Error("v1.4 requires the certified six-plus reviewed editorial manifest inherited from v1.3.");
}

console.log(`v1.4 editorial-discovery checks passed: ${manifest.profileCount} reviewed profiles are discoverable through local-first coverage navigation without changing mission-priority semantics.`);
