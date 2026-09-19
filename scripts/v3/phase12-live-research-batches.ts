import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { editorialContextProfilePackageSchema } from "../../src/context/types.js";
import { createPeopleGroupsApiClient } from "../../src/providers/peoplegroups/index.js";
import { loadPhase12EditorialCatalog } from "./phase12-content.js";

interface ResearchBatch {
  schemaVersion: 1;
  id: string;
  title: string;
  issue: number | null;
  publicationEffect: "none";
  selectionNote: string;
  pgids: string[];
}

const root = process.cwd();
const registryDir = resolve(root, "data/v3/editorial/research-batches");
const candidateDir = resolve(root, "data/v3/editorial/candidates");
const outputDir = resolve(root, "artifacts/v3-phase12/research-batches");

function parseBatch(raw: unknown, file: string): ResearchBatch {
  if (!raw || typeof raw !== "object") throw new Error(file + " is not an object.");
  const item = raw as Record<string, unknown>;
  if (item.schemaVersion !== 1) throw new Error(file + " must use schemaVersion 1.");
  if (typeof item.id !== "string" || !/^[a-z0-9][a-z0-9-]*$/.test(item.id)) throw new Error(file + " has an invalid id.");
  if (typeof item.title !== "string" || !item.title.trim()) throw new Error(file + " has no title.");
  if (item.issue !== null && (!Number.isInteger(item.issue) || Number(item.issue) <= 0)) throw new Error(file + " has an invalid issue.");
  if (item.publicationEffect !== "none") throw new Error(file + " must have publicationEffect=none.");
  if (typeof item.selectionNote !== "string" || !item.selectionNote.trim()) throw new Error(file + " has no selection note.");
  if (!Array.isArray(item.pgids) || item.pgids.length < 1 || item.pgids.length > 25) throw new Error(file + " must contain 1-25 PGIDs.");
  const pgids = item.pgids.map((value) => String(value).trim().toUpperCase());
  if (pgids.some((value) => !/^PG[0-9]+$/.test(value))) throw new Error(file + " contains an invalid PGID.");
  if (new Set(pgids).size !== pgids.length) throw new Error(file + " contains duplicate PGIDs.");
  return {
    schemaVersion: 1,
    id: item.id,
    title: item.title.trim(),
    issue: item.issue === null ? null : Number(item.issue),
    publicationEffect: "none",
    selectionNote: item.selectionNote.trim(),
    pgids,
  };
}

const files = (await readdir(registryDir)).filter((name) => name.endsWith(".json")).sort();
if (!files.length) throw new Error("Phase 12 research-batch registry is empty.");

const batches: ResearchBatch[] = [];
const globallySeenPgids = new Set<string>();
for (const file of files) {
  const batch = parseBatch(JSON.parse(await readFile(resolve(registryDir, file), "utf8")) as unknown, file);
  for (const pgid of batch.pgids) {
    if (globallySeenPgids.has(pgid)) throw new Error("Research-batch registry duplicates " + pgid + " across batches.");
    globallySeenPgids.add(pgid);
  }
  batches.push(batch);
}

const catalog = await loadPhase12EditorialCatalog();
const candidateFiles = (await readdir(candidateDir)).filter((name) => name.endsWith(".json")).sort();
const candidatePeids = new Map<number, string>();
for (const file of candidateFiles) {
  const candidate = editorialContextProfilePackageSchema.parse(
    JSON.parse(await readFile(resolve(candidateDir, file), "utf8")) as unknown,
  );
  candidatePeids.set(candidate.profile.peid, file);
}

const client = createPeopleGroupsApiClient();
const generatedAt = new Date().toISOString();
const batchReports: Array<Record<string, unknown>> = [];
let providerErrorCount = 0;
let researchReadyCount = 0;

await mkdir(outputDir, { recursive: true });

for (const batch of batches) {
  const records: Array<Record<string, unknown>> = [];
  for (const pgid of batch.pgids) {
    try {
      const live = await client.fetchByPgid(pgid);
      const gsec = live.GSEC ?? null;
      const published = catalog.reviewedPeids.has(live.PEID);
      const candidate = candidatePeids.get(live.PEID) ?? null;
      const inScope = gsec !== null && gsec >= 0 && gsec <= 3;
      const status = published
        ? "already-published"
        : candidate
          ? "candidate-exists"
          : inScope
            ? "research-ready"
            : "out-of-scope";

      if (status === "research-ready") researchReadyCount += 1;

      records.push({
        requestedPgid: pgid,
        status,
        candidateFile: candidate,
        live: {
          peid: live.PEID,
          pgid: live.PGID,
          name: live.NmDisp,
          alternateName: live.NmAlt ?? null,
          country: live.Ctry,
          countryIso3: live.ISOalpha3,
          region: live.Regn ?? null,
          subregion: live.RegnSub ?? null,
          language: live.Lang ?? null,
          languageIso6393: live.ROL ?? null,
          languageFamily: live.LangFamily ?? null,
          religion: live.Rlgn ?? null,
          population: live.Pop ?? null,
          gsec,
          gsecBrief: live.GSECbrf ?? null,
          evangelicalLevel: live.EvngLvl ?? null,
          engagementStatus: live.EngStat ?? null,
          congregationExists: live.CongExst ?? null,
          churchPlanting: live.Plnting ?? null,
          bibleAvailability: live.Bible ?? null,
          jesusFilmAvailability: live.Jesus ?? null,
          totalResources: live.ResTot ?? null,
          sourceUpdatedAt: live.UpdatedDate ?? null,
          sourceRecordUrl: "https://peoplegroups.org/wp-json/pg/v1/people-groups/" + live.PGID,
        },
      });
    } catch (error) {
      providerErrorCount += 1;
      records.push({
        requestedPgid: pgid,
        status: "provider-error",
        reason: error instanceof Error ? error.message : "unknown-provider-error",
      });
    }
  }

  const report = {
    schemaVersion: 1,
    generatedAt,
    batch: {
      id: batch.id,
      title: batch.title,
      issue: batch.issue,
      selectionNote: batch.selectionNote,
      publicationEffect: "none",
    },
    records,
  };
  batchReports.push(report);
  await writeFile(resolve(outputDir, batch.id + ".json"), JSON.stringify(report, null, 2) + "\n", "utf8");
}

const index = {
  schemaVersion: 1,
  generatedAt,
  mode: "non-ranking-live-research-registry",
  notice: "This registry only captures current source identity and research eligibility. It does not rank peoples, create candidate editorial claims, approve evidence, publish content or change the reviewed-profile count.",
  batchCount: batches.length,
  requestedRecordCount: globallySeenPgids.size,
  researchReadyCount,
  providerErrorCount,
  batches: batchReports,
};
await writeFile(resolve(outputDir, "index.json"), JSON.stringify(index, null, 2) + "\n", "utf8");

const markdown: string[] = [
  "# Phase 12 Live Research Batch Registry",
  "",
  "**Generated:** " + generatedAt,
  "",
  "- Batches: " + batches.length,
  "- Explicit PGIDs: " + globallySeenPgids.size,
  "- Research-ready records: " + researchReadyCount,
  "- Provider/network errors: " + providerErrorCount,
  "",
  "This is a non-ranking research aid only. It does not create candidate profiles or affect the public reviewed count.",
  "",
];

for (const report of batchReports) {
  const batch = report.batch as Record<string, unknown>;
  const records = report.records as Array<Record<string, unknown>>;
  markdown.push("## " + String(batch.title), "", String(batch.selectionNote), "");
  for (const record of records) {
    const live = record.live as Record<string, unknown> | undefined;
    markdown.push(
      "### " + String(live?.name ?? record.requestedPgid),
      "",
      "- Requested PGID: " + String(record.requestedPgid),
      "- Status: **" + String(record.status) + "**",
    );
    if (live) {
      markdown.push(
        "- Live PEID: " + String(live.peid),
        "- Live identity: " + [live.name, live.country, live.language].filter(Boolean).join(" · "),
        "- Language code: " + String(live.languageIso6393 ?? "Not reported"),
        "- GSEC: " + String(live.gsec ?? "unknown") + " — " + String(live.gsecBrief ?? "No label"),
        "- Source updated: " + String(live.sourceUpdatedAt ?? "Not reported"),
        "- Source record: " + String(live.sourceRecordUrl),
      );
    } else {
      markdown.push("- Reason: " + String(record.reason ?? "unknown"));
    }
    markdown.push("");
  }
}
await writeFile(resolve(outputDir, "index.md"), markdown.join("\n") + "\n", "utf8");

console.log(
  "Phase 12 live research registry: "
  + batches.length + " batch(es), "
  + globallySeenPgids.size + " explicit PGIDs, "
  + researchReadyCount + " research-ready, "
  + providerErrorCount + " provider/network error(s).",
);

if (providerErrorCount) {
  throw new Error("Phase 12 live research registry could not verify every tracked PGID because the provider/network was unavailable. This workflow step is intentionally non-blocking.");
}
