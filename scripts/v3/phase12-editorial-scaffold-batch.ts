import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { createPeopleGroupsApiClient } from "../../src/providers/peoplegroups/index.js";
import { loadPhase12EditorialCatalog } from "./phase12-content.js";

const root = process.cwd();
const raw = process.argv.find((arg) => arg.startsWith("--pgids="))?.slice("--pgids=".length).trim() ?? "";
const pgids = [...new Set(raw.split(",").map((item) => item.trim().toUpperCase()).filter(Boolean))];

if (!pgids.length || pgids.length > 25 || pgids.some((pgid) => !/^PG[0-9]+$/.test(pgid))) {
  throw new Error("Usage: npm run v3:phase12-editorial-scaffold-batch -- --pgids=PG012316,PG012320 (1-25 valid PGIDs)");
}

function slug(value: string): string {
  return value.normalize("NFKD").toLocaleLowerCase("en").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 72) || "people";
}

function shown(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Not reported";
  return String(value);
}

const catalog = await loadPhase12EditorialCatalog();
const client = createPeopleGroupsApiClient();
const generatedAt = new Date().toISOString();
const outputRoot = resolve(root, "artifacts/v3-phase12/workbench");
await mkdir(outputRoot, { recursive: true });

const prepared: Array<Record<string, unknown>> = [];
const skipped: Array<Record<string, unknown>> = [];

for (const requestedPgid of pgids) {
  let record;
  try {
    record = await client.fetchByPgid(requestedPgid);
  } catch (error) {
    skipped.push({ requestedPgid, reason: error instanceof Error ? error.message : "provider-fetch-failed" });
    continue;
  }

  if (catalog.reviewedPeids.has(record.PEID)) {
    skipped.push({ requestedPgid, peid: record.PEID, pgid: record.PGID, name: record.NmDisp, country: record.Ctry, reason: "already-published-reviewed-profile" });
    continue;
  }

  if (record.GSEC === null || record.GSEC === undefined || record.GSEC < 0 || record.GSEC > 3) {
    skipped.push({ requestedPgid, peid: record.PEID, pgid: record.PGID, name: record.NmDisp, country: record.Ctry, gsec: record.GSEC ?? null, reason: "outside-phase12-gsec-0-3-scope" });
    continue;
  }

  const directoryName = slug(record.NmDisp) + "-" + slug(record.Ctry) + "-" + record.PEID;
  const outputDir = resolve(outputRoot, directoryName);
  await mkdir(outputDir, { recursive: true });

  await writeFile(resolve(outputDir, "source-record.json"), JSON.stringify({
    schemaVersion: 1,
    generatedAt,
    source: "PeopleGroups.org / IMB Global Research runtime API",
    status: "research-input-only",
    publicationEffect: "none",
    notice: "This source snapshot is not an editorial profile, review, ranking, recommendation, or publication. Verify the live source again before final review.",
    record,
  }, null, 2) + "\n", "utf8");

  const sourceUrl = "https://peoplegroups.org/wp-json/pg/v1/people-groups/" + record.PGID;
  const packet = [
    "# Phase 12 Editorial Research Packet - " + record.NmDisp + " in " + record.Ctry,
    "",
    "**Status:** research scaffold only - not reviewed, not published, not counted toward Unreached 3.0.",
    "",
    "## Verified provider identity",
    "",
    "- PEID: " + record.PEID,
    "- PGID: " + record.PGID,
    "- Country: " + record.Ctry + " (" + record.ISOalpha3 + ")",
    "- Display name: " + record.NmDisp,
    "- Language: " + shown(record.Lang) + " (" + shown(record.ROL) + ")",
    "- GSEC: " + shown(record.GSEC) + " - " + shown(record.GSECbrf),
    "- Evangelical level: " + shown(record.EvngLvl),
    "- Engagement: " + shown(record.EngStat),
    "- Bible label: " + shown(record.Bible),
    "- Jesus Film label: " + shown(record.Jesus),
    "- Source updated: " + shown(record.UpdatedDate),
    "- Source record: " + sourceUrl,
    "",
    "## Research boundary",
    "",
    "Use this record only for provider identity and source-native mission/resource fields. Add independent or authoritative evidence before drafting human-context claims.",
    "",
    "Do not infer character, receptivity, resistance, urgency, spiritual condition, or causality from religion, ethnicity, geography, poverty, conflict, population, or mission status.",
    "",
    "Missing dimensions must remain explicit research gaps rather than generated filler.",
    "",
  ].join("\n");
  await writeFile(resolve(outputDir, "review-packet.md"), packet, "utf8");

  prepared.push({
    requestedPgid,
    peid: record.PEID,
    pgid: record.PGID,
    name: record.NmDisp,
    country: record.Ctry,
    countryIso3: record.ISOalpha3,
    language: record.Lang ?? null,
    languageIso6393: record.ROL ?? null,
    gsec: record.GSEC ?? null,
    sourceUpdatedAt: record.UpdatedDate ?? null,
    outputDirectory: "artifacts/v3-phase12/workbench/" + directoryName,
  });
}

const index = {
  schemaVersion: 1,
  generatedAt,
  requestedPgids: pgids,
  preparedCount: prepared.length,
  skippedCount: skipped.length,
  nonRankingNotice: "Input order is preserved. This tool applies no urgency, importance, population, spiritual-need, funding, or mission-priority score.",
  publicationEffect: "none",
  prepared,
  skipped,
};
await writeFile(resolve(outputRoot, "batch-scaffold-index.json"), JSON.stringify(index, null, 2) + "\n", "utf8");

if (!prepared.length) throw new Error("No requested records were eligible for a Phase 12 research scaffold. See batch-scaffold-index.json.");
console.log("Prepared " + prepared.length + " Phase 12 research scaffolds from " + pgids.length + " requested PGIDs; " + skipped.length + " skipped. No candidate or publication content was created.");
