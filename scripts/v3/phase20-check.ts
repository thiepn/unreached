import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

import { SUPPORTED_LOCALES } from "../../src/i18n";
import {
  MAX_SHARED_PRAYER_PEOPLE,
  sharedPrayerCollectionSchema,
} from "../../src/sharing";

const root = process.cwd();
const read = (path: string) => readFile(resolve(root, path), "utf8");
const json = async <T>(path: string): Promise<T> => JSON.parse(await read(path)) as T;

function requireText(source: string, marker: string, label: string): void {
  if (!source.includes(marker)) throw new Error("V3 Phase 20: missing " + label + ": " + marker);
}

function sameStrings(actual: string[], expected: string[], label: string): void {
  const a = [...actual].sort();
  const e = [...expected].sort();
  if (JSON.stringify(a) !== JSON.stringify(e)) {
    throw new Error(`V3 Phase 20: ${label} drifted. expected=${e.join(",")} actual=${a.join(",")}`);
  }
}

async function filesUnder(path: string): Promise<string[]> {
  const entries = await readdir(resolve(root, path), { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const child = path + "/" + entry.name;
    return entry.isDirectory() ? filesUnder(child) : [child];
  }));
  return nested.flat();
}

interface ArchitectureLock {
  schemaVersion: 1;
  program: string;
  roadmap: {
    finalPhase: number;
    phaseCount: number;
    status: string;
    extensionPolicy: string;
  };
  product: {
    primaryLoop: string[];
    primaryDestinations: string[];
    normalJourney: string[];
    nonGoals: string[];
  };
  routes: {
    publicStatic: string[];
    dynamic: string[];
    internal: string[];
  };
  sources: Record<string, string>;
  privacy: {
    localOnly: string[];
    privateSyncKinds: string[];
    publicShareFields: string[];
    publicShareMaxPeople: number;
    publicShareStorage: string;
  };
  semantics: Record<string, boolean>;
  localization: {
    certifiedLocales: string[];
    wholeAppLocalized: boolean;
    catalogParityRequired: boolean;
    rawHtmlTranslationsAllowed: boolean;
  };
  release: {
    browserProjects: string[];
    historicalBrowserSuiteBlocking: boolean;
    dependencyAuditLevel: string;
    accessibilityStylesMustLoadLast: boolean;
  };
  performanceBudgets: Record<string, number>;
  dependencies: {
    applicationRuntime: string[];
    workerRuntime: string[];
    policy: string;
  };
}

const lock = await json<ArchitectureLock>("data/v3-architecture-lock.json");
if (lock.schemaVersion !== 1 || lock.program !== "Unreached V3") throw new Error("V3 Phase 20 architecture lock identity is invalid.");
if (lock.roadmap.finalPhase !== 20 || lock.roadmap.phaseCount !== 21 || lock.roadmap.status !== "closed-after-peak-certification") {
  throw new Error("V3 Phase 20 roadmap lock must close at phases 0–20.");
}
if (lock.roadmap.extensionPolicy.includes("append public roadmap micro-phases") === false) {
  throw new Error("V3 Phase 20 architecture lock must explicitly prevent roadmap micro-phase expansion.");
}

const roadmap = await read("docs/V3_ROADMAP.md");
const phaseNumbers = [...roadmap.matchAll(/\| \*\*(\d+)\*\* \|/g)].map((match) => Number(match[1]));
if (phaseNumbers.length !== 21 || phaseNumbers.some((phase, index) => phase !== index)) {
  throw new Error("V3 Phase 20 roadmap must contain exactly the ordered public phases 0 through 20.");
}
if (!roadmap.includes("| **20** | Peak Certification |")) throw new Error("V3 Phase 20 roadmap final row is missing.");
if (!roadmap.includes("roadmap remains these 21 phases (`0` through `20`)")) {
  throw new Error("V3 Phase 20 roadmap finite-scope rule is missing.");
}

const productContract = await read("docs/V3_PRODUCT_CONTRACT.md");
for (const marker of [
  "Discover → Understand → See the need → Pray → Remember",
  "World → Region → Country → People → Context → Prayer",
  "The V3 roadmap is intentionally finite.",
  "Phases 13–20 are post-3.0 peak-system expansion.",
]) requireText(productContract, marker, "product contract architecture");
sameStrings(lock.product.primaryLoop, ["Discover", "Understand", "See the need", "Pray", "Remember"], "primary product loop");
sameStrings(lock.product.primaryDestinations, ["Explore", "Peoples", "Pray", "Search", "Saved"], "primary destinations");

const router = await read("src/app/router.ts");
const routeBlock = router.match(/const ROUTES:[\s\S]*?= \{([\s\S]*?)\n\};/)?.[1] ?? "";
const staticRoutes = [...routeBlock.matchAll(/"([^"]+)":/g)].map((match) => match[1]!);
sameStrings(staticRoutes, [...lock.routes.publicStatic, ...lock.routes.internal], "static route map");
for (const marker of [
  'path.match(/^\\/regions\\/([a-z0-9-]+)$/i)',
  'path.match(/^\\/countries\\/([A-Za-z]{3})$/)',
  'path.match(/^\\/peoples\\/([0-9]+)$/)',
  'path.match(/^\\/languages\\/([A-Za-z]{3})$/)',
  'path.match(/^\\/pray\\/([0-9]+)$/)',
]) requireText(router, marker, "dynamic route lock");

const shell = await read("src/components/AppShell.tsx");
for (const marker of [
  '{ id: "explore", label: "Explore", path: "/", icon: Map }',
  '{ id: "peoples", label: "Peoples", path: "/peoples", icon: UsersRound }',
  '{ id: "pray", label: "Pray", path: "/pray", icon: Compass }',
  'label: "Saved"',
  "<Search",
]) requireText(shell, marker, "primary shell");
if (shell.includes('path: "/coverage"') || shell.includes('path: "/share/prayer"')) {
  throw new Error("V3 Phase 20 internal/share destinations must not enter primary navigation.");
}

const registry = await json<any>("data/source-registry.json");
const sources = new Map(registry.sources.map((source: any) => [source.id, source]));
const peoplegroups = sources.get("peoplegroups-org-api");
const naturalEarth = sources.get("natural-earth");
const joshua = sources.get("joshua-project-api");
const progressBible = sources.get("progress-bible-registered-data");
const ethnologue = sources.get("ethnologue");
if (!peoplegroups?.runtimeReadAllowed || !peoplegroups?.publicReleaseAllowed || peoplegroups?.browserRedistributionAllowed) {
  throw new Error("V3 Phase 20 PeopleGroups source role drifted.");
}
if (!naturalEarth?.publicReleaseAllowed || !naturalEarth?.browserRedistributionAllowed) {
  throw new Error("V3 Phase 20 Natural Earth source role drifted.");
}
if (!joshua?.runtimeReadAllowed || joshua?.browserRedistributionAllowed || !String(joshua?.cacheStatus).includes("no-store")) {
  throw new Error("V3 Phase 20 Joshua Project comparison boundary drifted.");
}
for (const blocked of [progressBible, ethnologue]) {
  if (!blocked || blocked.runtimeReadAllowed || blocked.publicReleaseAllowed || blocked.browserRedistributionAllowed) {
    throw new Error("V3 Phase 20 permission-gated source unexpectedly became product-readable.");
  }
}
if (lock.sources["peoplegroups-org-api"] !== "canonical-runtime"
  || lock.sources["natural-earth"] !== "canonical-geography"
  || lock.sources["joshua-project-api"] !== "optional-no-store-comparison") {
  throw new Error("V3 Phase 20 source-role manifest drifted.");
}

const personalization = await read("src/personalization/types.ts");
for (const field of ["savedPeoples", "prayerList", "recent", "personalNotes", "prayerMemory"]) requireText(personalization, field, "personalization schema field");
const syncTypes = await read("src/sync/types.ts");
requireText(syncTypes, 'export type SyncKind = "saved" | "prayer";', "private sync kind lock");
for (const forbidden of ["PersonalNote", "PrayerMemoryEntry", "RecentVisit", "personalNotes", "prayerMemory"]) {
  if (syncTypes.includes(forbidden)) throw new Error("V3 Phase 20 local-only memory entered private sync: " + forbidden);
}
sameStrings(lock.privacy.localOnly, ["personalNotes", "prayerMemory", "recent"], "local-only privacy fields");
sameStrings(lock.privacy.privateSyncKinds, ["saved", "prayer"], "private sync kinds");

const shareSample = sharedPrayerCollectionSchema.parse({
  version: 1,
  title: "Architecture lock",
  locale: "en",
  peopleIds: [1001],
});
sameStrings(Object.keys(shareSample), lock.privacy.publicShareFields, "public share payload fields");
if (MAX_SHARED_PRAYER_PEOPLE !== lock.privacy.publicShareMaxPeople || lock.privacy.publicShareStorage !== "none") {
  throw new Error("V3 Phase 20 public share bounds/storage drifted.");
}

const sourceFiles = (await filesUnder("src")).filter((path) => /\.(ts|tsx)$/.test(path));
const sourceText = (await Promise.all(sourceFiles.map(read))).join("\n");
for (const forbiddenIdentifier of [
  "missionScore",
  "priorityScore",
  "prayerScore",
  "prayerStreak",
  "leaderboardStore",
  "xpPoints",
]) {
  if (new RegExp("\\b" + forbiddenIdentifier + "\\b").test(sourceText)) {
    throw new Error("V3 Phase 20 prohibited ranking/gamification identifier exists: " + forbiddenIdentifier);
  }
}
for (const marker of [
  "sourceAssertionsRemainScoped",
  "sourceDisagreementIsNotAveraged",
  "noCompositeMissionScore",
  "noMissionPriorityRanking",
  "noPrayerScore",
  "noPrayerStreak",
  "noLeaderboard",
  "geographicPrecisionMayNotExceedSourcePrecision",
  "diasporaIsNotInferredFromDistribution",
]) {
  if (lock.semantics[marker] !== true) throw new Error("V3 Phase 20 semantic lock disabled: " + marker);
}

sameStrings([...SUPPORTED_LOCALES], lock.localization.certifiedLocales, "certified locales");
if (lock.localization.wholeAppLocalized || !lock.localization.catalogParityRequired || lock.localization.rawHtmlTranslationsAllowed) {
  throw new Error("V3 Phase 20 localization truth drifted.");
}

const packageJson = await json<any>("package.json");
const workerPackage = await json<any>("worker/package.json");
sameStrings(Object.keys(packageJson.dependencies ?? {}), lock.dependencies.applicationRuntime, "application runtime dependencies");
sameStrings(Object.keys(workerPackage.dependencies ?? {}), lock.dependencies.workerRuntime, "worker runtime dependencies");

const playwright = await read("playwright.config.ts");
for (const project of lock.release.browserProjects) requireText(playwright, `name: "${project}"`, "browser project " + project);
if (lock.release.historicalBrowserSuiteBlocking) throw new Error("V3 Phase 20 historical browser suite must remain diagnostic.");
const browserContract = await read("docs/V3_BROWSER_CERTIFICATION.md");
requireText(browserContract, "A failure in `npm run e2e` is release-blocking.", "blocking browser policy");
requireText(browserContract, "`npm run e2e:historical`", "historical diagnostic policy");

const main = await read("src/main.tsx");
if (lock.release.accessibilityStylesMustLoadLast && !main.trimEnd().includes('import "./styles/foundation/accessibility.css";\n\nwarmPeopleGroupsRuntime();')) {
  throw new Error("V3 Phase 20 accessibility stylesheet is not the final application cascade layer.");
}

const dependencyWorkflow = await read(".github/workflows/dependency-audit.yml");
for (const marker of ["npm audit --audit-level=high", "npm run audit:licenses", "npm sbom --sbom-format cyclonedx"]) {
  requireText(dependencyWorkflow, marker, "dependency security workflow");
}
const browserWorkflow = await read(".github/workflows/browser-cert.yml");
for (const marker of ["npm run build", "playwright install --with-deps chromium firefox webkit", "npm run e2e"]) {
  requireText(browserWorkflow, marker, "browser certification workflow");
}

for (const path of ["src/pages/RegionPage.tsx", "src/pages/RegionsPage.tsx", "src/pages/DesignSystemPage.tsx"]) {
  const source = await read(path);
  for (const stale of ["Phase 7 uses", "Phase 8 will rebuild", "Unreached 3.0 · Phase 4", "Phase 6 will own"]) {
    if (source.includes(stale)) throw new Error("V3 Phase 20 stale roadmap copy remains in " + path + ": " + stale);
  }
}

const v3Scripts = Object.keys(packageJson.scripts ?? {})
  .flatMap((key) => [...key.matchAll(/^v3:phase(\d+)(?::|-|$)/g)].map((match) => Number(match[1])));
if (v3Scripts.some((phase) => phase > 20)) throw new Error("V3 Phase 20 public roadmap scripts must not extend beyond Phase 20.");

for (const path of [
  "data/v3-architecture-lock.json",
  "docs/V3_PHASE20_PEAK_CERTIFICATION.md",
  "docs/V3_PEAK_ARCHITECTURE_LOCK.md",
  "scripts/v3/phase20-check.ts",
  "scripts/v3/phase20-dist-check.ts",
  "tests/e2e/v3-phase20-peak-certification.spec.ts",
  ".github/workflows/v3-phase20-peak-certification.yml",
]) {
  if (!existsSync(resolve(root, path))) throw new Error("V3 Phase 20 required file is missing: " + path);
}

const pkg = await read("package.json");
requireText(pkg, '"v3:phase20-check": "tsx scripts/v3/phase20-check.ts"', "Phase 20 package gate");
requireText(pkg, '"v3:phase20-dist-check": "tsx scripts/v3/phase20-dist-check.ts"', "Phase 20 dist gate");
requireText(pkg, '"v3:phase20-visual": "playwright test tests/e2e/v3-phase20-peak-certification.spec.ts --project=chromium --project=mobile-chromium --workers=1"', "Phase 20 visual gate");
requireText(pkg, "npm run v3:phase19-check && npm run v3:phase20-check", "blocking Phase 20 source integration");
requireText(pkg, "vite build && npm run v3:phase20-dist-check", "blocking Phase 20 dist integration");

console.log("V3 Phase 20 Peak Certification checks passed: the roadmap closes at 0–20; product routes/navigation, source roles, privacy/sync/share boundaries, mission/prayer semantics, localization truth, runtime dependencies, browser/accessibility/security gates and architecture-lock manifest agree; stale roadmap UI copy is removed; and no post-20 public roadmap expansion is present.");
