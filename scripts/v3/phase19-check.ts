import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

import {
  catalogFor,
  localeFromUnknown,
  SUPPORTED_LOCALES,
  translate,
  type Locale,
} from "../../src/i18n";
import type { PrayerListEntry } from "../../src/personalization/types";
import {
  buildRuntimePeopleEntities,
  type PeopleGroupsApiRecord,
} from "../../src/providers/peoplegroups";
import {
  createSharedPrayerCollection,
  decodeSharedPrayerCollection,
  encodeSharedPrayerCollection,
  MAX_SHARED_PRAYER_PEOPLE,
  resolveSharedPrayerCollection,
  sharedPrayerCollectionSchema,
} from "../../src/sharing";

const root = process.cwd();
const read = (path: string) => readFile(resolve(root, path), "utf8");

function requireText(source: string, marker: string, label: string): void {
  if (!source.includes(marker)) throw new Error("V3 Phase 19: missing " + label + ": " + marker);
}

async function filesUnder(path: string): Promise<string[]> {
  const entries = await readdir(resolve(root, path), { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const child = path + "/" + entry.name;
    return entry.isDirectory() ? filesUnder(child) : [child];
  }));
  return nested.flat();
}

function placeholders(value: string): string[] {
  return [...value.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((match) => match[1]!).sort();
}

const english = catalogFor("en");
const german = catalogFor("de");
const englishKeys = Object.keys(english).sort();
const germanKeys = Object.keys(german).sort();
if (JSON.stringify(englishKeys) !== JSON.stringify(germanKeys)) {
  throw new Error("Phase 19 localization catalogs do not have exact key parity.");
}
for (const key of englishKeys) {
  const typedKey = key as keyof typeof english;
  if (JSON.stringify(placeholders(english[typedKey])) !== JSON.stringify(placeholders(german[typedKey]))) {
    throw new Error("Phase 19 localization placeholder mismatch for " + key);
  }
  for (const locale of SUPPORTED_LOCALES) {
    const value = catalogFor(locale)[typedKey];
    if (!value.trim()) throw new Error("Phase 19 empty translation: " + locale + ":" + key);
    if (/[<>]/.test(value)) throw new Error("Phase 19 translation catalogs must remain plain text: " + locale + ":" + key);
  }
}
if (localeFromUnknown("de-DE") !== "de" || localeFromUnknown("fr-FR") !== "en") {
  throw new Error("Phase 19 locale resolution/fallback failed.");
}
if (translate("de", "shared.heading", { title: "Gemeinde" }) !== "Gemeinsam beten: Gemeinde") {
  throw new Error("Phase 19 German placeholder interpolation failed.");
}

const prayerList: PrayerListEntry[] = [
  {
    sourcePeopleId: 990001,
    peopleGroupId: "people-entity:peoplegroups:990001",
    name: "PRIVATE-NAME-SHOULD-NOT-ENCODE",
    countryName: "PRIVATE-COUNTRY-SNAPSHOT",
    languageName: "PRIVATE-LANGUAGE-SNAPSHOT",
    addedAt: "2026-09-01T10:00:00.000Z",
    lastPrayedAt: "2026-09-19T20:00:00.000Z",
  },
  {
    sourcePeopleId: 990002,
    peopleGroupId: "people-entity:peoplegroups:990002",
    name: "Second private snapshot",
    countryName: "Second private country",
    languageName: null,
    addedAt: "2026-09-02T10:00:00.000Z",
    lastPrayedAt: null,
  },
  {
    sourcePeopleId: 990003,
    peopleGroupId: "people-entity:peoplegroups:990003",
    name: "Missing source snapshot",
    countryName: null,
    languageName: null,
    addedAt: "2026-09-03T10:00:00.000Z",
    lastPrayedAt: null,
  },
];

const collection = createSharedPrayerCollection({
  prayerList,
  selectedPeopleIds: [990001, 990002, 990003],
  title: "Church Prayer",
  locale: "de",
});
if (collection.peopleIds.join(",") !== "990001,990002,990003") throw new Error("Phase 19 share selection failed.");
if (Object.keys(collection).sort().join(",") !== "locale,peopleIds,title,version") {
  throw new Error("Phase 19 shared payload gained an unapproved field.");
}

const encoded = encodeSharedPrayerCollection(collection);
const decoded = decodeSharedPrayerCollection(encoded);
if (!decoded || JSON.stringify(decoded) !== JSON.stringify(collection)) throw new Error("Phase 19 share payload roundtrip failed.");
const decodedText = JSON.stringify(decoded);
for (const secret of [
  "PRIVATE-NAME-SHOULD-NOT-ENCODE",
  "PRIVATE-COUNTRY-SNAPSHOT",
  "PRIVATE-LANGUAGE-SNAPSHOT",
  "lastPrayedAt",
  "addedAt",
  "peopleGroupId",
  "personalNotes",
  "prayerMemory",
  "accountEmail",
  "sync",
]) {
  if (decodedText.includes(secret)) throw new Error("Phase 19 share payload leaked private field/value: " + secret);
}
if (decodeSharedPrayerCollection("not valid payload!") !== null) throw new Error("Phase 19 malformed payload must fail closed.");
if (decodeSharedPrayerCollection("a".repeat(5000)) !== null) throw new Error("Phase 19 oversized payload must fail closed.");

const duplicate = sharedPrayerCollectionSchema.safeParse({
  version: 1,
  title: "Duplicate",
  locale: "en",
  peopleIds: [990001, 990001],
});
if (duplicate.success) throw new Error("Phase 19 duplicate PEIDs must fail schema validation.");
const tooMany = sharedPrayerCollectionSchema.safeParse({
  version: 1,
  title: "Too many",
  locale: "en",
  peopleIds: Array.from({ length: MAX_SHARED_PRAYER_PEOPLE + 1 }, (_, index) => 991000 + index),
});
if (tooMany.success) throw new Error("Phase 19 oversized collection must fail schema validation.");

const records: PeopleGroupsApiRecord[] = [
  {
    PEID: 990001,
    PGID: "PG990001",
    NmDisp: "Current Eligible People",
    ISOalpha3: "BEN",
    Ctry: "Benin",
    GSEC: 2,
    GSECbrf: "Initial Church Planting",
    ROL: "fon",
    Lang: "Fon",
    UpdatedDate: "2026-09-20T00:00:00.000Z",
  },
  {
    PEID: 990002,
    PGID: "PG990002",
    NmDisp: "Changed Status People",
    ISOalpha3: "NGA",
    Ctry: "Nigeria",
    GSEC: 5,
    GSECbrf: "Established",
    ROL: "hau",
    Lang: "Hausa",
    UpdatedDate: "2026-09-20T00:00:00.000Z",
  },
];
const entities = buildRuntimePeopleEntities(records);
const resolved = resolveSharedPrayerCollection(
  collection,
  new Map(entities.map((entity) => [entity.peid, entity])),
);
if (resolved.available.map((item) => item.sourcePeopleId).join(",") !== "990001") {
  throw new Error("Phase 19 recipient resolution must expose only current Prayer 3.0 eligible records.");
}
if (resolved.unavailable.find((item) => item.sourcePeopleId === 990002)?.reason !== "not-prayer-eligible") {
  throw new Error("Phase 19 changed-status PEID must be marked unavailable.");
}
if (resolved.unavailable.find((item) => item.sourcePeopleId === 990003)?.reason !== "missing") {
  throw new Error("Phase 19 missing PEID must be marked unavailable.");
}

for (const path of [
  "src/i18n/catalog.ts",
  "src/sharing/model.ts",
  "src/components/ChurchPrayerSharePanel.tsx",
  "src/pages/SharedPrayerCollectionPage.tsx",
  "src/styles/sharing.css",
  "docs/V3_PHASE19_LOCALIZATION_CHURCH_SHARING.md",
  "tests/e2e/v3-phase19-localization-sharing.spec.ts",
  ".github/workflows/v3-phase19-localization-church-sharing.yml",
]) {
  if (!existsSync(resolve(root, path))) throw new Error("V3 Phase 19 required file is missing: " + path);
}

const sharingModel = await read("src/sharing/model.ts");
for (const marker of [
  "MAX_SHARED_PRAYER_PEOPLE = 12",
  "version: z.literal(1)",
  "title: safeTitleSchema",
  "locale: localeSchema",
  "peopleIds:",
  "not-prayer-eligible",
]) requireText(sharingModel, marker, "sharing model");
for (const forbidden of ["personalNotes", "prayerMemory", "lastPrayedAt", "accountEmail", "SyncItem", "localStorage", "indexedDB", "fetch("]) {
  if (sharingModel.includes(forbidden)) throw new Error("Phase 19 sharing model contains forbidden private/persistence mechanism: " + forbidden);
}

const catalog = await read("src/i18n/catalog.ts");
for (const marker of ["localeSchema", '"en"', '"de"', "translate", "catalogFor"]) requireText(catalog, marker, "localization catalog");
if (catalog.includes("dangerouslySetInnerHTML")) throw new Error("Phase 19 localization must not use raw HTML rendering.");

const builder = await read("src/components/ChurchPrayerSharePanel.tsx");
for (const marker of [
  "Create a privacy-safe prayer collection.",
  "Generate share link",
  "Exactly what is shared",
  "public PeopleGroups PEIDs",
]) requireText(builder, marker, "church share builder");

const sharedPage = await read("src/pages/SharedPrayerCollectionPage.tsx");
for (const marker of [
  "decodeSharedPrayerCollection",
  "resolveSharedPrayerCollection",
  'data-phase19-shared-prayer="ready"',
  "translate(locale",
]) requireText(sharedPage, marker, "shared prayer page");
if (sharedPage.includes("usePersonalization") || sharedPage.includes("togglePrayer") || sharedPage.includes("recordPrayer")) {
  throw new Error("Phase 19 shared recipient page must not automatically import or mutate private prayer state.");
}

const router = await read("src/app/router.ts");
for (const marker of ['| "shared-prayer"', '"/share/prayer": "shared-prayer"', '"Shared Prayer Collection | Unreached"']) requireText(router, marker, "shared route");

const savedPage = await read("src/pages/SavedPage.tsx");
requireText(savedPage, "<ChurchPrayerSharePanel prayerList={state.prayerList} />", "Saved sharing integration");

const docs = await read("docs/V3_PHASE19_LOCALIZATION_CHURCH_SHARING.md");
for (const marker of [
  "Gate D",
  "English",
  "German",
  "public PeopleGroups PEIDs",
  "No automatic import",
  "not encrypted",
]) requireText(docs, marker, "Phase 19 documentation");

const legal = await read("docs/DATA_AND_LEGAL_POLICY.md");
for (const marker of [
  "Phase 19 localization & church sharing",
  "PUBLIC-IDENTIFIER SHARE LINKS ONLY",
  "personal notes",
  "current runtime data",
]) requireText(legal, marker, "Phase 19 legal policy");

for (const directory of ["src/sync", "worker/src"]) {
  const files = await filesUnder(directory);
  for (const path of files.filter((item) => /\.(ts|tsx)$/.test(item))) {
    const source = await read(path);
    if (source.includes("SharedPrayerCollection") || source.includes("shared-prayer") || source.includes("church-prayer-share")) {
      throw new Error("Phase 19 public sharing must not enter private sync/server storage: " + path);
    }
  }
}

const pkg = await read("package.json");
requireText(pkg, '"v3:phase19-check": "tsx scripts/v3/phase19-check.ts"', "Phase 19 package gate");
requireText(pkg, "npm run v3:phase18-check && npm run v3:phase19-check", "blocking Phase 19 build integration");
requireText(pkg, '"v3:phase19-visual": "playwright test tests/e2e/v3-phase19-localization-sharing.spec.ts --project=chromium --project=mobile-chromium --workers=1"', "Phase 19 visual gate");

console.log("V3 Phase 19 Localization & Church Sharing checks passed: English/German catalogs have exact key/placeholder parity and plain-text messages; shared links contain only version/title/locale/public PEIDs; private prayer memory/account/sync fields are excluded; recipients re-resolve current Prayer 3.0 eligibility; and sharing adds no server, sync, persistence or automatic-import surface.");
