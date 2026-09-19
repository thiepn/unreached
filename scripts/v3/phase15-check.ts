import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  coRepresentedLanguages,
  languageEvidenceStateLabel,
  languageResourceCombinations,
  languageResourceEvidence,
  relatedFamilyLanguages,
} from "../../src/languages/intelligence";
import type { LiveLanguageRecord } from "../../src/languages/live";
import { sourceRegistrySchema } from "../data/source-policy";

const root = process.cwd();
const read = (path: string) => readFile(resolve(root, path), "utf8");

function requireText(source: string, marker: string, label: string): void {
  if (!source.includes(marker)) throw new Error(`V3 Phase 15: missing ${label}: ${marker}`);
}

function context(
  peid: number,
  pgid: string,
  peopleName: string,
  countryIso3: string,
  countryName: string,
  bibleAvailability: string | null,
  jesusFilmAvailability: string | null,
  totalResources: number | null,
) {
  return {
    peid,
    pgid,
    peopleName,
    countryIso3,
    countryName,
    population: 100_000,
    reachClassification: "unreached" as const,
    bibleAvailability,
    jesusFilmAvailability,
    totalResources,
    sourceUpdatedAt: "2026-09-20T00:00:00.000Z",
  };
}

function language(input: Partial<LiveLanguageRecord> & Pick<LiveLanguageRecord, "iso6393" | "name">): LiveLanguageRecord {
  const contexts = input.contexts ?? [];
  const countries = input.countries ?? [];
  return {
    id: `language:peoplegroups:${input.iso6393}`,
    iso6393: input.iso6393,
    name: input.name,
    familyName: input.familyName ?? null,
    contextCount: input.contextCount ?? contexts.length,
    peopleEntityCount: input.peopleEntityCount ?? contexts.length,
    countryCount: input.countryCount ?? countries.length,
    knownPopulation: input.knownPopulation ?? contexts.reduce((sum, item) => sum + (item.population ?? 0), 0),
    populationKnownContextCount: input.populationKnownContextCount ?? contexts.filter((item) => item.population !== null).length,
    populationCoverageComplete: input.populationCoverageComplete ?? true,
    unreachedContextCount: input.unreachedContextCount ?? contexts.length,
    otherContextCount: input.otherContextCount ?? 0,
    unknownContextCount: input.unknownContextCount ?? 0,
    bible: input.bible ?? { knownContextCount: contexts.filter((item) => item.bibleAvailability !== null).length, breakdown: [] },
    jesusFilm: input.jesusFilm ?? { knownContextCount: contexts.filter((item) => item.jesusFilmAvailability !== null).length, breakdown: [] },
    resources: input.resources ?? { knownContextCount: contexts.filter((item) => item.totalResources !== null).length, values: [] },
    family: input.family ?? { knownContextCount: 0, breakdown: [] },
    contexts,
    countries,
    peoples: input.peoples ?? [],
    sourceUpdatedAt: input.sourceUpdatedAt ?? "2026-09-20T00:00:00.000Z",
    denominator: "PeopleGroups.org PGID country-context records reporting this ISO 639-3 language",
  };
}

const fonContexts = [
  context(1001, "PG001001", "Fon A", "BEN", "Benin", "Available", "Not Available", 2),
  context(1002, "PG001002", "Fon B", "NGA", "Nigeria", "Unknown", "Available", null),
];

const fon = language({
  iso6393: "fon",
  name: "Fon",
  familyName: "Niger-Congo",
  contexts: fonContexts,
  countries: [
    { iso3: "BEN", name: "Benin", contextCount: 1, unreachedContextCount: 1, knownPopulation: 100_000 },
    { iso3: "NGA", name: "Nigeria", contextCount: 1, unreachedContextCount: 1, knownPopulation: 100_000 },
  ],
  bible: {
    knownContextCount: 2,
    breakdown: [{ label: "Available", contextCount: 1 }, { label: "Unknown", contextCount: 1 }],
  },
  jesusFilm: {
    knownContextCount: 2,
    breakdown: [{ label: "Available", contextCount: 1 }, { label: "Not Available", contextCount: 1 }],
  },
  resources: {
    knownContextCount: 1,
    values: [{ label: "2", contextCount: 1 }],
  },
  family: {
    knownContextCount: 2,
    breakdown: [{ label: "Niger-Congo", contextCount: 2 }],
  },
});

const yor = language({
  iso6393: "yor",
  name: "Yoruba",
  familyName: "Niger-Congo",
  contexts: [context(2001, "PG002001", "Yoruba A", "BEN", "Benin", "Available", "Available", 3)],
  countries: [{ iso3: "BEN", name: "Benin", contextCount: 1, unreachedContextCount: 0, knownPopulation: 100_000 }],
  family: { knownContextCount: 1, breakdown: [{ label: "Niger-Congo", contextCount: 1 }] },
});

const ewe = language({
  iso6393: "ewe",
  name: "Ewe",
  familyName: "Niger-Congo",
  contexts: [context(3001, "PG003001", "Ewe A", "GHA", "Ghana", "Available", "Available", 3)],
  countries: [{ iso3: "GHA", name: "Ghana", contextCount: 1, unreachedContextCount: 0, knownPopulation: 100_000 }],
  family: { knownContextCount: 1, breakdown: [{ label: "Niger-Congo", contextCount: 1 }] },
});

const fra = language({
  iso6393: "fra",
  name: "French",
  familyName: "Indo-European",
  contexts: [context(4001, "PG004001", "French A", "BEN", "Benin", "Available", "Available", 5)],
  countries: [{ iso3: "BEN", name: "Benin", contextCount: 1, unreachedContextCount: 0, knownPopulation: 100_000 }],
  family: { knownContextCount: 1, breakdown: [{ label: "Indo-European", contextCount: 1 }] },
});

const evidence = languageResourceEvidence(fon);
if (evidence.bible.coverage !== "complete" || evidence.bible.consistency !== "mixed") {
  throw new Error("Phase 15 must preserve complete-but-mixed Bible source evidence.");
}
if (evidence.totalResources.coverage !== "partial" || evidence.totalResources.consistency !== "uniform") {
  throw new Error("Phase 15 must distinguish partial resource-count coverage from label consistency.");
}
if (!languageEvidenceStateLabel(evidence.bible).includes("mixed reported labels")) {
  throw new Error("Phase 15 evidence label must disclose mixed source labels.");
}

const combinations = languageResourceCombinations(fon);
if (combinations.length !== 2 || combinations.some((item) => item.contextCount !== 1)) {
  throw new Error("Phase 15 must group resource fields by observed PGID combinations without collapsing disagreement.");
}

const family = relatedFamilyLanguages(fon, [fon, yor, ewe, fra]);
if (family.map((item) => item.iso6393).sort().join(",") !== "ewe,yor") {
  throw new Error("Phase 15 family relationships must use shared provider family labels only.");
}
if (family.some((item) => item.iso6393 === "fra")) throw new Error("Phase 15 family relation leaked unrelated language.");

const country = coRepresentedLanguages(fon, [fon, yor, ewe, fra]);
const countryCodes = country.map((item) => item.iso6393).sort();
if (countryCodes.join(",") !== "fra,yor") {
  throw new Error(`Phase 15 same-country relationship failed: ${countryCodes.join(",")}`);
}
if (country.some((item) => item.iso6393 === "ewe")) throw new Error("Phase 15 same-country relation leaked a language with no shared country.");

for (const path of [
  "src/languages/intelligence.ts",
  "src/components/LanguageIntelligencePanel.tsx",
  "src/styles/language/intelligence.css",
  "docs/V3_PHASE15_SCRIPTURE_LANGUAGE_INTELLIGENCE.md",
  "tests/e2e/v3-phase15-scripture-language.spec.ts",
  ".github/workflows/v3-phase15-scripture-language-intelligence.yml",
]) {
  if (!existsSync(resolve(root, path))) throw new Error(`V3 Phase 15 required file is missing: ${path}`);
}

const live = await read("src/languages/live.ts");
for (const marker of [
  "LiveLanguageContextEvidence",
  "bibleAvailability",
  "jesusFilmAvailability",
  "totalResources",
  "family:",
  "contexts: contextEvidence(items)",
]) requireText(live, marker, "source evidence model");

const panel = await read("src/components/LanguageIntelligencePanel.tsx");
for (const marker of [
  "Scripture & language intelligence",
  "Source evidence, not a translation-status database.",
  "Observed combinations",
  "does not establish mutual intelligibility",
  "does not mean the people represented here are bilingual",
  "PGID evidence behind these statements",
  "data-phase15-language-intelligence",
]) requireText(panel, marker, "language intelligence UI");
if (panel.includes("Phase 15")) throw new Error("Public language UI must not expose internal roadmap numbering.");

const page = await read("src/pages/LanguagePage.tsx");
requireText(page, "<LanguageIntelligencePanel record={record} languages={explorer.languages} />", "language profile integration");

const about = await read("src/pages/AboutPage.tsx");
for (const marker of [
  "Scripture/resource evidence",
  "Language relationships stay narrow.",
  "mutual intelligibility",
  "20 September 2026",
]) requireText(about, marker, "public methodology disclosure");

const registry = sourceRegistrySchema.parse(JSON.parse(await read("data/source-registry.json")) as unknown);
if (registry.reviewedAt !== "2026-09-20") throw new Error("Phase 15 source-registry review date is stale.");
const peopleGroups = registry.sources.find((source) => source.id === "peoplegroups-org-api");
if (!peopleGroups || peopleGroups.termsReviewedAt !== "2026-09-20" || peopleGroups.browserRedistributionAllowed) {
  throw new Error("Phase 15 PeopleGroups source policy must be current while public corpus redistribution remains blocked.");
}
for (const phrase of ["stronger Scripture-completeness", "mutual intelligibility", "bilingualism", "ProgressBible"]) {
  if (!peopleGroups.requirements.some((requirement) => requirement.toLowerCase().includes(phrase.toLowerCase()))) {
    throw new Error(`Phase 15 PeopleGroups policy is missing requirement: ${phrase}`);
  }
}

for (const sourceId of ["progress-bible-registered-data", "ethnologue"]) {
  const source = registry.sources.find((item) => item.id === sourceId);
  if (!source || source.runtimeReadAllowed || source.publicReleaseAllowed || source.browserRedistributionAllowed || source.developmentIngestionAllowed) {
    throw new Error(`Phase 15 must keep ${sourceId} unavailable for direct integration.`);
  }
}

const docs = await read("docs/V3_PHASE15_SCRIPTURE_LANGUAGE_INTELLIGENCE.md");
for (const marker of [
  "Gate D",
  "ProgressBible and Ethnologue remain excluded",
  "mutual intelligibility",
  "Same-country language context",
  "Phase 16 — Mission Knowledge Graph",
]) requireText(docs, marker, "Phase 15 documentation");

const legal = await read("docs/DATA_AND_LEGAL_POLICY.md");
for (const marker of [
  "Phase 15 Scripture & language intelligence",
  "SOURCE-EVIDENCE RELATIONSHIPS ONLY",
  "direct ProgressBible",
  "country co-presence",
]) requireText(legal, marker, "Phase 15 legal policy");

const pkg = await read("package.json");
requireText(pkg, '"v3:phase15-check": "tsx scripts/v3/phase15-check.ts"', "Phase 15 package gate");
requireText(pkg, "npm run v3:phase14-check && npm run v3:phase15-check", "blocking Phase 15 build integration");
requireText(pkg, '"v3:phase15-visual": "playwright test tests/e2e/v3-phase15-scripture-language.spec.ts --project=chromium --project=mobile-chromium --workers=1"', "Phase 15 visual gate");

console.log("V3 Phase 15 Scripture & Language Intelligence checks passed: exact PeopleGroups resource evidence retains PGID denominators, coverage and mixed-label semantics; resource combinations are descriptive only; family/country relationships stay narrow; ProgressBible and Ethnologue remain blocked; and public UI/policy prohibit fabricated translation, intelligibility, bilingualism and resource-transfer claims.");
