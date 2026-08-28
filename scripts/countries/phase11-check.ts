import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const [countryPage, languagePage, main] = await Promise.all([
  readFile(resolve(root, "src/pages/CountryPage.tsx"), "utf8"),
  readFile(resolve(root, "src/pages/LanguagePage.tsx"), "utf8"),
  readFile(resolve(root, "src/main.tsx"), "utf8"),
]);

if (/<main\b/.test(countryPage)) throw new Error("Phase 11: CountryPage must not add a nested <main> landmark inside the app shell.");
if (/<main\b/.test(languagePage)) throw new Error("Phase 11: LanguagePage must not add a nested <main> landmark inside the app shell.");

if (countryPage.includes("A PEID can appear in multiple countries")) {
  throw new Error("Phase 11: CountryPage still contains the obsolete cross-country PEID claim.");
}
if (!countryPage.includes("PEID and PGID as a one-to-one record identity")) {
  throw new Error("Phase 11: CountryPage must explain the certified PEID/PGID identity contract.");
}
if (!languagePage.includes("PEID and PGID as a one-to-one record identity")) {
  throw new Error("Phase 11: LanguagePage must use the same certified PEID/PGID identity contract.");
}

const countryBatch = countryPage.match(/const DETAIL_RECORD_BATCH_SIZE = (\d+);/)?.[1];
const languageBatch = languagePage.match(/const DETAIL_RECORD_BATCH_SIZE = (\d+);/)?.[1];
if (!countryBatch || countryBatch !== languageBatch) {
  throw new Error(`Phase 11: Country and Language detail batching must match; received ${countryBatch ?? "missing"} and ${languageBatch ?? "missing"}.`);
}

for (const required of ["visibleUnreachedPeople", "remainingUnreachedPeople", "detail-record-progress", "result-load-more--detail"]) {
  if (!countryPage.includes(required)) throw new Error(`Phase 11: CountryPage is missing progressive-record contract token: ${required}.`);
}
if (countryPage.includes("unreachedPeople.slice(0, 40).map")) {
  throw new Error("Phase 11: CountryPage must not silently truncate unreached records at 40.");
}

for (const required of ["visiblePeoples", "remainingPeoples", "detail-record-progress", "result-load-more--detail"]) {
  if (!languagePage.includes(required)) throw new Error(`Phase 11: LanguagePage is missing progressive-record contract token: ${required}.`);
}
if (/record\.peoples\.map\s*\(/.test(languagePage)) {
  throw new Error("Phase 11: LanguagePage must not render the complete people-record table in one pass.");
}

if (!countryPage.includes("Showing 12 of {record.languages.length}")) {
  throw new Error("Phase 11: CountryPage must disclose the capped major-language list when more source languages exist.");
}
if (!main.includes('"./styles/foundation/detail-records.css"')) {
  throw new Error("Phase 11: the country-language consistency stylesheet is not loaded.");
}

console.log(`Phase 11 country/language consistency validation passed with shared ${countryBatch}-record progressive disclosure, one main landmark, and aligned PEID/PGID semantics.`);
