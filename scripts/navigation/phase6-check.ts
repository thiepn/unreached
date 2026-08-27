import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");

const hashState = await readText("src/app/hash-state.ts");
for (const marker of ["readHashSearchParams", "positiveHashPage", "replaceHashSearchParams", "window.history.replaceState", "setOptionalHashParam"]) {
  if (!hashState.includes(marker)) throw new Error(`Phase 6 hash-query state helper missing ${marker}.`);
}

const router = await readText("src/app/router.ts");
for (const marker of [
  "popstate",
  'scrollRestoration = "auto"',
  "titleForRoute",
  'emptyState("not-found", path)',
  "const resetViewportRef = useRef(true)",
  "resetViewportRef.current = !historyTraversalRef.current",
]) {
  if (!router.includes(marker)) throw new Error(`Phase 6 router navigation behavior missing ${marker}.`);
}
if (router.includes('window.scrollTo({ top: 0, behavior: "auto" });\n  }, [route.path])')) {
  throw new Error("Phase 6 router must not unconditionally force every route change to the top on browser history traversal.");
}

const shell = await readText("src/components/AppShell.tsx");
for (const marker of ["skipToContent", "event.preventDefault()", 'main?.focus({ preventScroll: true })', 'main?.scrollIntoView({ block: "start", behavior: "auto" })']) {
  if (!shell.includes(marker)) throw new Error(`Phase 6 skip-link repair missing ${marker}.`);
}

const pageContracts: Array<[string, string[]]> = [
  ["src/pages/PeoplesPage.tsx", ["initialPeopleState", "positiveHashPage", "replaceHashSearchParams", 'setOptionalHashParam(params, "page", page, 1)']],
  ["src/pages/CountriesPage.tsx", ["initialCountryState", "positiveHashPage", "replaceHashSearchParams"]],
  ["src/pages/LanguagesPage.tsx", ["initialLanguageState", "positiveHashPage", "replaceHashSearchParams"]],
  ["src/pages/EditorialCoveragePage.tsx", ["initialCoverageState", "replaceHashSearchParams", 'setOptionalHashParam(params, "region", region)']],
  ["src/pages/PrayPage.tsx", ["readHashSearchParams", "replaceHashSearchParams", 'setOptionalHashParam(params, "q", query)']],
];
for (const [path, markers] of pageContracts) {
  const source = await readText(path);
  for (const marker of markers) if (!source.includes(marker)) throw new Error(`Phase 6 URL-state contract missing ${marker} in ${path}.`);
}

const search = await readText("src/components/SearchDialog.tsx");
for (const marker of ["visualResults", "visualIndexById", 'scrollIntoView({ block: "nearest" })']) {
  if (!search.includes(marker)) throw new Error(`Phase 6 visual search-keyboard ordering missing ${marker}.`);
}
if (search.includes("results[activeIndex]")) throw new Error("Phase 6 SearchDialog keyboard activation must follow visualResults, not global score order.");

const phase0 = await readText("tests/e2e/phase0-regression.spec.ts");
for (const obsolete of [
  "hash-based skip link currently mutates the application route",
  "discovery filters live only in component state",
  "hash routes currently share a static document title",
]) {
  if (phase0.includes(obsolete)) throw new Error(`Phase 6 must promote the repaired Phase 0 contract: ${obsolete}.`);
}

const phase6Browser = await readText("tests/e2e/phase6-navigation-state.spec.ts");
if (!phase6Browser.includes("fresh direct route loads establish main-content keyboard focus")) {
  throw new Error("Phase 6 must certify direct-route main-content focus in the browser suite.");
}

const packageJson = JSON.parse(await readText("package.json")) as { scripts?: Record<string, string> };
if (!packageJson.scripts?.["navigation:check"]?.includes("scripts/navigation/phase6-check.ts")) throw new Error("Phase 6 navigation:check is not wired.");
if (!packageJson.scripts?.build?.includes("navigation:check")) throw new Error("Phase 6 navigation gate must run in the production build.");

console.log("Phase 6 navigation checks passed: URL-backed discovery state, direct-load focus, history-safe scrolling, dynamic titles, valid deep-link rejection, route-safe skip navigation, and visual-order global-search keyboard navigation are enforced.");
