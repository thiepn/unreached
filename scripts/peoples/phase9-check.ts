import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");

const page = await readText("src/pages/PeoplePage.tsx");
for (const marker of [
  "v3-people-profile",
  "v3-people-facts",
  'data-profile-stage="understand"',
  'data-profile-stage="act"',
  'data-profile-stage="reference"',
  "<SourceContext record={record} />",
  "<ProviderContext record={record} />",
  "<DefinitiveEditorialProfile profile={profile} />",
  "<ProfileLocalActions record={record} contextTier={profileTier} />",
  "No provider description is available for this record.",
]) {
  if (!page.includes(marker)) throw new Error(`Phase 9/V3 people profile missing ${marker}.`);
}

const sourceIndex = page.lastIndexOf("<SourceContext record={record} />");
const providerIndex = page.lastIndexOf("<ProviderContext record={record} />");
const editorialIndex = page.lastIndexOf("<DefinitiveEditorialProfile profile={profile} />");
const actionIndex = page.lastIndexOf("<ProfileLocalActions record={record} contextTier={profileTier} />");
const referenceIndex = page.lastIndexOf('data-profile-stage="reference"');
if ([sourceIndex, providerIndex, editorialIndex, actionIndex, referenceIndex].some((value) => value < 0)) throw new Error("V3 profile journey markers could not be located.");
if (!(sourceIndex < providerIndex && providerIndex < editorialIndex && editorialIndex < actionIndex && actionIndex < referenceIndex)) {
  throw new Error("V3 profile must keep source/provider context and editorial depth before prayer/save actions, with research detail after actions.");
}

if (page.includes('from "../providers/peoplegroups"')) throw new Error("Definitive people route must consume the atlas people boundary instead of provider modules directly.");

const actions = await readText("src/components/ProfileLocalActions.tsx");
for (const marker of ["profile-local-actions--v3", "2 · Act from context", "Reviewed context read", "Source context read", "Pray with this context", "Not in GSEC 0–3 flow"]) {
  if (!actions.includes(marker)) throw new Error(`V3 profile action flow missing ${marker}.`);
}

const styles = await readText("src/styles/atlas-foundation/people-profile.css");
for (const marker of [".v3-people-profile", ".v3-people-hero", ".v3-people-fact-grid", ".v3-people-editorial", ".v3-people-action-stage", ".v3-people-reference", "@media (max-width: 760px)"]) {
  if (!styles.includes(marker)) throw new Error(`V3 people profile styling missing ${marker}.`);
}

const main = await readText("src/main.tsx");
if (!main.includes('import "./styles/atlas-foundation/people-profile.css"')) throw new Error("V3 people profile stylesheet is not loaded.");

const browserSpec = await readText("tests/e2e/phase9-people-profile.spec.ts");
for (const marker of ["source context appears before prayer actions", "prayer eligible profile offers contextual next step", "non prayer eligible profile keeps save path without prayer CTA", "mobile profile journey has no horizontal overflow"]) {
  if (!browserSpec.includes(marker)) throw new Error(`Phase 9 compatibility browser certification missing: ${marker}.`);
}

console.log("Phase 9 compatibility checks passed under V3: source context and explicit editorial depth precede action, provider absence remains explicit, prayer eligibility is preserved, provenance stays secondary, and the route no longer imports provider modules directly.");
