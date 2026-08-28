import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");

const page = await readText("src/pages/PeoplePage.tsx");
for (const marker of [
  'people-profile--phase9',
  'class="people-profile-overview"',
  'data-profile-stage="understand"',
  'data-profile-stage="act"',
  'data-profile-stage="reference"',
  '<SourceRecord record={record} />',
  '<ProviderContext record={record} />',
  '<ProfileLocalActions record={record} />',
  'No provider description is available for this record.',
]) {
  if (!page.includes(marker)) throw new Error(`Phase 9 people profile missing ${marker}.`);
}

const sourceIndex = page.lastIndexOf('<SourceRecord record={record} />');
const providerIndex = page.lastIndexOf('<ProviderContext record={record} />');
const actionIndex = page.lastIndexOf('<ProfileLocalActions record={record} />');
const referenceIndex = page.lastIndexOf('data-profile-stage="reference"');
if (sourceIndex < 0 || providerIndex < 0 || actionIndex < 0 || referenceIndex < 0) {
  throw new Error("Phase 9 profile journey markers could not be located.");
}
if (!(sourceIndex < providerIndex && providerIndex < actionIndex && actionIndex < referenceIndex)) {
  throw new Error("Phase 9 must keep source facts and provider context before prayer/save actions, with provenance after actions.");
}

const actions = await readText("src/components/ProfileLocalActions.tsx");
for (const marker of [
  'profile-local-actions--phase9',
  '2 · Act from context',
  'Source context reviewed',
  'Pray with this context',
  'Not in GSEC 0–3 flow',
]) {
  if (!actions.includes(marker)) throw new Error(`Phase 9 profile action flow missing ${marker}.`);
}

const styles = await readText("src/styles/people/profile.css");
for (const marker of [
  ".people-profile-overview",
  ".people-profile-context",
  ".people-profile-action-stage",
  ".profile-action-heading",
  ".profile-local-actions--phase9 .profile-journey__step.is-next",
  ".people-profile-reference-stage",
  "@media (max-width: 760px)",
]) {
  if (!styles.includes(marker)) throw new Error(`Phase 9 people profile styling missing ${marker}.`);
}

const main = await readText("src/main.tsx");
if (!main.includes('import "./styles/people/profile.css"')) {
  throw new Error("Phase 9 people profile stylesheet is not loaded.");
}

const browserSpec = await readText("tests/e2e/phase9-people-profile.spec.ts");
for (const marker of [
  "source context appears before prayer actions",
  "prayer eligible profile offers contextual next step",
  "non prayer eligible profile keeps save path without prayer CTA",
  "mobile profile journey has no horizontal overflow",
]) {
  if (!browserSpec.includes(marker)) throw new Error(`Phase 9 browser certification missing: ${marker}.`);
}

console.log("Phase 9 people profile checks passed: source context precedes action, provider absence is explicit, prayer eligibility is preserved, deeper provenance stays secondary, and responsive journey contracts are enforced.");
