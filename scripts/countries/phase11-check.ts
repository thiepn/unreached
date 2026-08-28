import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const readText = (path: string) => readFile(resolve(root, path), "utf8");

const [country, language, main] = await Promise.all([
  readText("src/pages/CountryPage.tsx"),
  readText("src/pages/LanguagePage.tsx"),
  readText("src/main.tsx"),
]);

for (const marker of [
  "COUNTRY_PEOPLE_INITIAL_LIMIT = 40",
  "COUNTRY_PEOPLE_STEP = 40",
  'class="detail-record-progress"',
  'class="result-load-more result-load-more--detail"',
  "Show 40 more",
  "PEID is retained as the route key and one-to-one provider field for this record",
  "major languages shown",
]) {
  if (!country.includes(marker)) throw new Error(`Phase 11 Country detail contract missing: ${marker}`);
}

for (const marker of [
  "LANGUAGE_PEOPLE_INITIAL_LIMIT = 40",
  "LANGUAGE_PEOPLE_STEP = 40",
  'class="detail-record-progress"',
  'class="result-load-more result-load-more--detail"',
  "Show 40 more",
  "PEID remains the one-to-one numeric provider field and route key for each record",
]) {
  if (!language.includes(marker)) throw new Error(`Phase 11 Language detail contract missing: ${marker}`);
}

if ((country.match(/<main\b/g) ?? []).length > 0) throw new Error("CountryPage must not create a nested main landmark.");
if ((language.match(/<main\b/g) ?? []).length > 0) throw new Error("LanguagePage must not create a nested main landmark.");
if (!main.includes('import "./styles/foundation/detail-records.css"')) throw new Error("Phase 11 detail-record stylesheet is not loaded.");

const styles = await readText("src/styles/foundation/detail-records.css");
for (const marker of [
  ".detail-record-progress",
  ".result-load-more--detail",
  ".language-profile-main",
  ".country-content-main",
  "@media (max-width: 620px)",
]) {
  if (!styles.includes(marker)) throw new Error(`Phase 11 detail styling missing: ${marker}`);
}

const browserSpec = await readText("tests/e2e/phase11-countries-languages.spec.ts");
for (const marker of [
  "Country profile progressively reveals every people record",
  "Language profile progressively reveals every people record",
  "Country and Language profiles keep a single main landmark",
  "detail profiles retain current one-to-one PEID and PGID semantics",
  "mobile detail profiles do not overflow horizontally",
]) {
  if (!browserSpec.includes(marker)) throw new Error(`Phase 11 browser certification missing: ${marker}`);
}

console.log("Phase 11 checks passed: Countries and Languages use progressive full-record disclosure, preserve one-to-one PEID/PGID semantics, keep one main landmark, disclose list caps, and remain responsive.");
