import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFile(resolve(root, path), "utf8");

function requireText(source: string, marker: string, label: string): void {
  if (!source.includes(marker)) throw new Error(`V3 Phase 8: missing ${label}: ${marker}`);
}

for (const path of [
  "src/editorial/runtime.ts",
  "src/peoples/profile.ts",
  "src/components/DefinitiveEditorialProfile.tsx",
  "src/styles/atlas-foundation/people-profile.css",
  "docs/V3_PHASE8_DEFINITIVE_PEOPLE_PROFILE.md",
  "tests/e2e/v3-phase8-people-profile.spec.ts",
]) {
  if (!existsSync(resolve(root, path))) throw new Error(`V3 Phase 8 required file missing: ${path}`);
}

const page = await read("src/pages/PeoplePage.tsx");
for (const marker of [
  "v3-people-profile",
  "v3-people-breadcrumb",
  'hrefFor("/regions")',
  "atlasRegionForCountry",
  "useEditorialProfiles",
  "createSourceEditorialProfile",
  "<DefinitiveEditorialProfile profile={profile} />",
  '<ProfileLocalActions record={record} contextTier={profileTier} />',
  'data-editorial-tier={profileTier}',
  "Reviewed editorial context available",
  "Source context only",
  "Detailed data, sources & methodology",
]) requireText(page, marker, "definitive profile marker");
if (page.includes('from "../providers/peoplegroups"')) throw new Error("V3 Phase 8 PeoplePage must not import provider modules directly.");

const wrapper = await read("src/pages/PeopleContextualPage.tsx");
if (wrapper.includes("EditorialContextPanel")) throw new Error("V3 Phase 8 must not append the legacy editorial panel below the definitive profile.");
requireText(wrapper, "<PeoplePage sourcePeopleId={sourcePeopleId} />", "single definitive people route composition");

const peopleBoundary = await read("src/peoples/profile.ts");
for (const marker of ["useLivePeopleProfile", "usePeopleProfileCorpus", "PEOPLE_PROFILE_SOURCE", "peopleProfileProviderContext", "relatedPeopleProfileRecords"]) requireText(peopleBoundary, marker, "atlas people boundary");

const editorialRuntime = await read("src/editorial/runtime.ts");
for (const marker of ["editorialContextManifestSchema", "editorialContextProfilePackageSchema", "adaptLegacyContextPackageToV3Editorial", "profilesByPeid", "public/${path.replace", "reviewed-editorial"]) requireText(editorialRuntime, marker, "canonical editorial runtime");

const editorialComponent = await read("src/components/DefinitiveEditorialProfile.tsx");
for (const marker of [
  'data-editorial-tier="source"',
  "Reviewed editorial context is not yet published for this record.",
  "Evidence & sources",
  "evidenceLevel",
  "interpretationNote",
  "Pray from what is actually known.",
  "Editorial sources",
  "Research gaps",
]) requireText(editorialComponent, marker, "editorial article behavior");

const profileOrder = [
  page.lastIndexOf("<EssentialMetrics record={record} />"),
  page.lastIndexOf("<SourceContext record={record} />"),
  page.lastIndexOf("<ProviderContext record={record} />"),
  page.lastIndexOf("<DefinitiveEditorialProfile profile={profile} />"),
  page.lastIndexOf("<ProfileLocalActions record={record} contextTier={profileTier} />"),
  page.lastIndexOf('data-profile-stage="reference"'),
];
if (profileOrder.some((value) => value < 0) || profileOrder.some((value, index) => index > 0 && value <= profileOrder[index - 1]!)) {
  throw new Error("V3 Phase 8 profile order must remain facts -> source context -> editorial depth -> action -> research.");
}

const actions = await read("src/components/ProfileLocalActions.tsx");
if (actions.includes('from "../providers/peoplegroups"')) throw new Error("V3 Phase 8 profile actions must consume the people boundary type.");
for (const marker of ["contextTier", "Reviewed context read", "Curated context read", "Source context read"]) requireText(actions, marker, "editorial-depth-aware action state");

const styles = await read("src/styles/atlas-foundation/people-profile.css");
for (const marker of [
  ".v3-people-profile.people-profile",
  ".v3-people-hero.people-profile-hero",
  ".v3-people-fact-grid",
  ".v3-people-editorial",
  ".v3-people-article",
  ".v3-people-evidence",
  ".v3-people-prayer-context",
  ".v3-people-action-stage",
  ".v3-people-reference",
  "@media (max-width: 760px)",
]) requireText(styles, marker, "definitive profile style");

const main = await read("src/main.tsx");
const profileImport = 'import "./styles/atlas-foundation/people-profile.css";';
const accessibilityImport = 'import "./styles/foundation/accessibility.css";';
requireText(main, profileImport, "people profile stylesheet import");
if (main.indexOf(profileImport) > main.indexOf(accessibilityImport)) throw new Error("V3 Phase 8 profile styles must load before canonical accessibility ownership.");

const phase4 = await read("scripts/v3/phase4-check.ts");
requireText(phase4, '"PeoplePage.tsx"', "Phase 8 migration allowlist");

const browser = await read("tests/e2e/v3-phase8-people-profile.spec.ts");
for (const marker of [
  "source-only people profile labels its editorial depth instead of inventing narrative",
  "reviewed profile becomes one cohesive atlas article with evidence and prayer context",
  "profile preserves World to Region to Country to People continuity",
  "mission classification remains understandable and technical detail stays opt in",
  "prayer eligibility and source-only fallback remain truthful",
  "definitive profile remains readable without horizontal overflow on mobile",
]) requireText(browser, marker, "Phase 8 browser certification");

const docs = await read("docs/V3_PHASE8_DEFINITIVE_PEOPLE_PROFILE.md");
for (const marker of ["World → Region → Country → People → Context → Prayer", "### Source", "Canonical editorial runtime", "People source boundary", "Pray from what is actually known.", "Gate B", "Phase 9 — Search, Discovery & Collections"]) requireText(docs, marker, "Phase 8 documentation");

const packageJson = await read("package.json");
requireText(packageJson, '"v3:phase8-check": "tsx scripts/v3/phase8-check.ts"', "Phase 8 package script");
requireText(packageJson, "npm run v3:phase7-check && npm run v3:phase8-check", "blocking Phase 8 build integration");

console.log("V3 Phase 8 definitive people profile checks passed: geographic identity, explicit editorial depth, canonical reviewed content, source-only honesty, evidence, prayer continuation, provider boundaries and responsive atlas composition are enforced.");
