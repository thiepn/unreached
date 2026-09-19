import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { createPeopleGroupsApiClient, type PeopleGroupsApiRecord } from "../../src/providers/peoplegroups/index.js";
import { loadPhase12EditorialCatalog } from "./phase12-content.js";

const root = process.cwd();
const requested = Number(process.argv.find((arg) => arg.startsWith("--count="))?.split("=", 2)[1] ?? "120");
const count = Number.isInteger(requested) && requested > 0 && requested <= 500 ? requested : 120;
const output = process.env.PHASE12_QUEUE_PATH ?? "artifacts/v3-phase12/editorial-coverage-queue.json";

const catalog = await loadPhase12EditorialCatalog();
const records = await createPeopleGroupsApiClient().fetchAll();

function label(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function stableCompare(a: PeopleGroupsApiRecord, b: PeopleGroupsApiRecord): number {
  return a.Ctry.localeCompare(b.Ctry, "en")
    || a.NmDisp.localeCompare(b.NmDisp, "en")
    || a.PEID - b.PEID;
}

const eligible = records.filter((record) =>
  record.GSEC !== null
  && record.GSEC !== undefined
  && record.GSEC >= 0
  && record.GSEC <= 3
  && !catalog.reviewedPeids.has(record.PEID),
);

const byRegion = new Map<string, PeopleGroupsApiRecord[]>();
for (const record of eligible) {
  const region = label(record.Regn, "Unspecified provider region");
  const bucket = byRegion.get(region) ?? [];
  bucket.push(record);
  byRegion.set(region, bucket);
}
for (const bucket of byRegion.values()) bucket.sort(stableCompare);

const regionNames = [...byRegion.keys()].sort((a, b) => a.localeCompare(b, "en"));
const selected: PeopleGroupsApiRecord[] = [];
let cursor = 0;
while (selected.length < Math.min(count, eligible.length)) {
  let added = false;
  for (const region of regionNames) {
    const record = byRegion.get(region)?.[cursor];
    if (!record) continue;
    selected.push(record);
    added = true;
    if (selected.length >= count) break;
  }
  if (!added) break;
  cursor += 1;
}

const queue = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: "PeopleGroups.org / IMB Global Research runtime API",
  purpose: "Maintainer research queue for expanding substantial reviewed editorial coverage toward the Unreached 3.0 Phase 12 target.",
  nonRankingNotice: "This queue is not a mission-priority, urgency, importance, spiritual-need, population, or funding ranking. It uses deterministic round-robin coverage across the provider's region labels, followed by country/name ordering. Inclusion creates no editorial claim and does not make a record reviewed.",
  reviewedProfilesExcluded: catalog.reviewedProfiles.length,
  eligibleUnreachedSourceRecords: eligible.length,
  candidateCount: selected.length,
  candidates: selected.map((record) => ({
    peid: record.PEID,
    pgid: record.PGID,
    name: record.NmDisp,
    country: record.Ctry,
    iso3: record.ISOalpha3,
    providerRegion: record.Regn ?? null,
    providerSubregion: record.RegnSub ?? null,
    language: record.Lang ?? null,
    iso6393: record.ROL ?? null,
    religionLabel: record.Rlgn ?? null,
    populationEstimate: record.Pop ?? null,
    gsec: record.GSEC ?? null,
    sourceUpdatedAt: record.UpdatedDate ?? null,
    sourceRecordUrl: `https://peoplegroups.org/wp-json/pg/v1/people-groups/${record.PGID}`,
    nextStep: "Research identity and human context from appropriate independent/authoritative sources, draft cited claims, then complete maintainer evidence review before publication.",
  })),
};

await mkdir(resolve(root, output).replace(/\/[^/]+$/, ""), { recursive: true });
await writeFile(resolve(root, output), `${JSON.stringify(queue, null, 2)}\n`, "utf8");
console.log(`Wrote ${selected.length} non-ranking Phase 12 editorial research candidates to ${output}. None count as reviewed until the normal editorial review contract is completed.`);
