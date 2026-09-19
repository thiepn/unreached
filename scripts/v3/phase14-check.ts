import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

import {
  compareMissionHistoryObservations,
  mergeMissionHistoryObservations,
  missionHistoryObservationSchema,
  type MissionHistoryObservation,
} from "../../src/mission/history";
import {
  MISSION_HISTORY_DB,
  MISSION_HISTORY_LIMIT_PER_RECORD,
  MISSION_HISTORY_STORE,
} from "../../src/mission/history-store";
import { sourceRegistrySchema } from "../data/source-policy";

const root = process.cwd();
const read = (path: string) => readFile(resolve(root, path), "utf8");

function requireText(source: string, marker: string, label: string): void {
  if (!source.includes(marker)) throw new Error(`V3 Phase 14: missing ${label}: ${marker}`);
}

async function filesUnder(path: string): Promise<string[]> {
  const absolute = resolve(root, path);
  const entries = await readdir(absolute, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const child = `${path}/${entry.name}`;
    return entry.isDirectory() ? filesUnder(child) : [child];
  }));
  return nested.flat();
}

function observation(
  signature: string,
  overrides: Partial<MissionHistoryObservation> = {},
): MissionHistoryObservation {
  return missionHistoryObservationSchema.parse({
    schemaVersion: 1,
    id: `PG007206:${signature}`,
    provider: "peoplegroups-org",
    peid: 7206,
    pgid: "PG007206",
    countryIso3: "CHN",
    peopleName: "Hui",
    sourceUpdatedAt: "2026-09-16T00:00:00.000Z",
    latestSourceUpdatedAt: "2026-09-16T00:00:00.000Z",
    firstObservedAt: "2026-09-19T18:00:00.000Z",
    lastObservedAt: "2026-09-19T18:00:00.000Z",
    signature,
    metrics: {
      classification: "unreached",
      gsec: 1,
      evangelicalLevel: "Less than 2%",
      engagementStatus: "Engaged",
      congregationExists: "Yes",
      churchPlanting: "No Active CP Activity",
      population: 13_800_000,
      bibleAvailability: "Available",
      jesusFilmAvailability: "Available",
    },
    ...overrides,
  });
}

for (const path of [
  "src/mission/history.ts",
  "src/mission/history-store.ts",
  "src/components/MissionHistoryPanel.tsx",
  "src/styles/people/history.css",
  "docs/V3_PHASE14_HISTORICAL_MISSION_INTELLIGENCE.md",
  "scripts/v3/phase14-check.ts",
  "tests/e2e/v3-phase14-history.spec.ts",
  ".github/workflows/v3-phase14-historical-mission-intelligence.yml",
  "public/privacy.html",
]) {
  if (!existsSync(resolve(root, path))) throw new Error(`V3 Phase 14 required file is missing: ${path}`);
}

if (MISSION_HISTORY_DB !== "unreached-mission-history-v1") throw new Error("Phase 14 history DB identity drifted.");
if (MISSION_HISTORY_STORE !== "peoplegroups-observations") throw new Error("Phase 14 history store identity drifted.");
if (MISSION_HISTORY_LIMIT_PER_RECORD !== 24) throw new Error("Phase 14 must retain at most 24 timeline points per PGID.");

const base = observation("11111111");
const same = observation("11111111", {
  sourceUpdatedAt: "2026-09-16T00:00:00.000Z",
  latestSourceUpdatedAt: "2026-09-19T00:00:00.000Z",
  firstObservedAt: "2026-09-19T20:00:00.000Z",
  lastObservedAt: "2026-09-19T20:00:00.000Z",
});
const deduplicated = mergeMissionHistoryObservations([base], same);
if (deduplicated.length !== 1) throw new Error("Phase 14 repeated identical source states must de-duplicate.");
if (deduplicated[0]?.firstObservedAt !== base.firstObservedAt) throw new Error("Phase 14 de-duplication must preserve the earliest local observation.");
if (deduplicated[0]?.lastObservedAt !== same.lastObservedAt) throw new Error("Phase 14 de-duplication must advance the latest local observation.");
if (deduplicated[0]?.latestSourceUpdatedAt !== same.latestSourceUpdatedAt) throw new Error("Phase 14 must retain a later provider update date even when tracked fields are unchanged.");

const changed = observation("22222222", {
  id: "PG007206:22222222",
  sourceUpdatedAt: "2026-09-20T00:00:00.000Z",
  latestSourceUpdatedAt: "2026-09-20T00:00:00.000Z",
  firstObservedAt: "2026-09-20T12:00:00.000Z",
  lastObservedAt: "2026-09-20T12:00:00.000Z",
  metrics: {
    ...base.metrics,
    classification: "not-unreached",
    gsec: 4,
    population: 13_900_000,
  },
});
const distinct = mergeMissionHistoryObservations(deduplicated, changed);
if (distinct.length !== 2 || distinct[0]?.signature !== "22222222") throw new Error("Phase 14 tracked source changes must create a newer distinct timeline state.");
const changes = compareMissionHistoryObservations(base, changed);
for (const field of ["classification", "gsec", "population"] as const) {
  if (!changes.some((change) => change.field === field)) throw new Error(`Phase 14 change comparison missed ${field}.`);
}
if (changes.length !== 3) throw new Error(`Phase 14 synthetic change comparison expected 3 fields, received ${changes.length}.`);

const reverted = observation("11111111", {
  id: "PG007206:2026-09-21T12:00:00.000Z:11111111",
  sourceUpdatedAt: "2026-09-21T00:00:00.000Z",
  latestSourceUpdatedAt: "2026-09-21T00:00:00.000Z",
  firstObservedAt: "2026-09-21T12:00:00.000Z",
  lastObservedAt: "2026-09-21T12:00:00.000Z",
  metrics: { ...base.metrics },
});
const withReversion = mergeMissionHistoryObservations(distinct, reverted);
if (withReversion.length !== 3 || withReversion[0]?.signature !== "11111111") {
  throw new Error("Phase 14 must preserve A → B → A as three timeline points rather than collapsing the reversion.");
}
const reversionChanges = compareMissionHistoryObservations(changed, reverted);
for (const field of ["classification", "gsec", "population"] as const) {
  if (!reversionChanges.some((change) => change.field === field)) throw new Error(`Phase 14 reversion comparison missed ${field}.`);
}

let capped: MissionHistoryObservation[] = [];
for (let index = 0; index < 30; index += 1) {
  const signature = (index + 1).toString(16).padStart(8, "0");
  capped = mergeMissionHistoryObservations(capped, observation(signature, {
    id: `PG007206:${signature}`,
    sourceUpdatedAt: new Date(Date.UTC(2026, 8, index + 1)).toISOString(),
    latestSourceUpdatedAt: new Date(Date.UTC(2026, 8, index + 1)).toISOString(),
    firstObservedAt: new Date(Date.UTC(2026, 8, index + 1, 12)).toISOString(),
    lastObservedAt: new Date(Date.UTC(2026, 8, index + 1, 12)).toISOString(),
    metrics: { ...base.metrics, population: 13_800_000 + index },
  }), MISSION_HISTORY_LIMIT_PER_RECORD);
}
if (capped.length !== 24) throw new Error(`Phase 14 history cap failed: expected 24 states, received ${capped.length}.`);

const historyModel = await read("src/mission/history.ts");
for (const marker of [
  "sourceUpdatedAt",
  "firstObservedAt",
  "lastObservedAt",
  "mergeMissionHistoryObservations",
  "later return",
]) requireText(historyModel, marker, "observed-history model");

const historyStore = await read("src/mission/history-store.ts");
for (const marker of [
  "unreached-mission-history-v1",
  "peoplegroups-observations",
  "MISSION_HISTORY_LIMIT_PER_RECORD = 24",
  "indexedDB",
  "recordPeopleGroupsObservation",
  "resetPeopleGroupsHistory",
]) requireText(historyStore, marker, "device-private history store");
for (const forbidden of ["fetch(", "JOSHUA_PROJECT", "localStorage", "sessionStorage"]) {
  if (historyStore.includes(forbidden)) throw new Error(`Phase 14 history storage must remain provider-local and isolated: ${forbidden}`);
}

const panel = await read("src/components/MissionHistoryPanel.tsx");
for (const marker of [
  "Historical mission intelligence",
  "Source history on this device",
  "Observed history, not reconstructed history.",
  "excluded from account sync, server storage and exports",
  "data-phase14-history",
  "Reset local history to current state",
]) requireText(panel, marker, "historical mission UI");
if (panel.includes("Phase 14")) throw new Error("Public Phase 14 UI must not expose internal roadmap numbering.");

const page = await read("src/pages/PeoplePage.tsx");
requireText(page, "<MissionHistoryPanel record={record} />", "people-profile history integration");

const main = await read("src/main.tsx");
requireText(main, 'import "./styles/people/history.css";', "history stylesheet import");

const about = await read("src/pages/AboutPage.tsx");
for (const marker of [
  "Source history",
  "History is observed, never backfilled.",
  "Historical mission-source observations are bounded and private to this device.",
  "Source and licensing records were most recently reviewed on",
]) requireText(about, marker, "public methodology disclosure");

const privacy = await read("public/privacy.html");
for (const marker of [
  "Effective and reviewed 19 September 2026",
  "bounded history of PeopleGroups.org mission-source state transitions",
  "not synced",
  "Clearing browser site data removes it",
]) requireText(privacy, marker, "privacy disclosure");

const registry = sourceRegistrySchema.parse(JSON.parse(await read("data/source-registry.json")) as unknown);
const peopleGroups = registry.sources.find((source) => source.id === "peoplegroups-org-api");
if (!peopleGroups || Date.parse(peopleGroups.termsReviewedAt) < Date.parse("2026-09-19") || peopleGroups.browserRedistributionAllowed) {
  throw new Error("Phase 14 PeopleGroups source policy must be freshly reviewed while public redistribution remains blocked.");
}
for (const phrase of ["on-device", "backfill", "de-duplicate"]) {
  if (!peopleGroups.requirements.some((requirement) => requirement.toLowerCase().includes(phrase))) {
    throw new Error(`Phase 14 PeopleGroups policy is missing requirement: ${phrase}`);
  }
}
const joshua = registry.sources.find((source) => source.id === "joshua-project-api");
if (!joshua || !joshua.cacheStatus.toLowerCase().includes("no-store") || joshua.termsReviewedAt !== "2026-09-17") {
  throw new Error("Phase 14 must preserve the Phase 13 Joshua Project no-store boundary and provider review date.");
}

const syncFiles = await filesUnder("src/sync");
for (const path of syncFiles.filter((item) => /\.(ts|tsx)$/.test(item))) {
  const source = await read(path);
  for (const forbidden of [MISSION_HISTORY_DB, "peoplegroups-observations", "recordPeopleGroupsObservation"]) {
    if (source.includes(forbidden)) throw new Error(`Phase 14 history must not enter private sync: ${path} contains ${forbidden}`);
  }
}
const workerFiles = await filesUnder("worker/src");
for (const path of workerFiles.filter((item) => /\.ts$/.test(item))) {
  const source = await read(path);
  for (const forbidden of [MISSION_HISTORY_DB, "peoplegroups-observations"]) {
    if (source.includes(forbidden)) throw new Error(`Phase 14 history must not enter Worker storage: ${path} contains ${forbidden}`);
  }
}

const docs = await read("docs/V3_PHASE14_HISTORICAL_MISSION_INTELLIGENCE.md");
for (const marker of [
  "Gate D",
  "observed",
  "backfill",
  "24 retained timeline points",
  "Joshua Project",
  "excluded from private continuity sync",
]) requireText(docs, marker, "Phase 14 documentation");

const legal = await read("docs/DATA_AND_LEGAL_POLICY.md");
for (const marker of [
  "Phase 14 historical mission intelligence",
  "DEVICE-PRIVATE OBSERVATION HISTORY ONLY",
  "backfilling",
  "server-side history storage",
]) requireText(legal, marker, "Phase 14 legal policy");

const pkg = await read("package.json");
requireText(pkg, '"v3:phase14-check": "tsx scripts/v3/phase14-check.ts"', "Phase 14 package gate");
requireText(pkg, "npm run v3:phase13-check && npm run v3:phase14-check", "blocking Phase 14 build integration");
requireText(pkg, '"v3:phase14-visual": "playwright test tests/e2e/v3-phase14-history.spec.ts --project=chromium --project=mobile-chromium --workers=1"', "Phase 14 visual gate");

const browserConfig = await read("playwright.v3.config.ts");
requireText(browserConfig, "1[0-9]", "active V3 browser matrix inclusion for Phase 14");

console.log("V3 Phase 14 Historical Mission Intelligence checks passed: history is source-observed rather than backfilled, consecutive identical tracked states de-duplicate, A-to-B-to-A reversions remain visible, real field changes form bounded timeline points, the 24-point per-PGID cap is enforced, PeopleGroups history remains device-private and excluded from sync/Worker/server export, Joshua Project remains no-store, and public methodology/privacy disclosures describe the actual boundary.");
