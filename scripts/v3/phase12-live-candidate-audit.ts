import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { editorialContextProfilePackageSchema } from "../../src/context/types.js";
import { createPeopleGroupsApiClient } from "../../src/providers/peoplegroups/index.js";

const root = process.cwd();
const candidateDir = resolve(root, "data/v3/editorial/candidates");
const outputDir = resolve(root, "artifacts/v3-phase12");
const normalized = (value: string | null | undefined) =>
  (value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase("en");

const entries = (await readdir(candidateDir))
  .filter((name) => /^[a-z0-9][a-z0-9._-]*\.json$/.test(name))
  .sort();

if (!entries.length) throw new Error("Phase 12 candidate workbench is empty.");

const client = createPeopleGroupsApiClient();
const reports: Array<Record<string, unknown>> = [];

async function auditCandidate(name: string, attempt = 1): Promise<Record<string, unknown>> {
  const candidate = editorialContextProfilePackageSchema.parse(
    JSON.parse(await readFile(resolve(candidateDir, name), "utf8")) as unknown,
  );
  const pgid = candidate.profile.identity.pgidAnchors[0] ?? null;
  if (!pgid) {
    return {
      candidate: name,
      status: "candidate-invalid",
      reason: "missing-pgid-anchor",
      expected: { peid: candidate.profile.peid },
    };
  }

  try {
    const live = await client.fetchByPgid(pgid);
    const checks = {
      peid: live.PEID === candidate.profile.peid,
      pgid: live.PGID === pgid,
      name: normalized(live.NmDisp) === normalized(candidate.profile.identity.verifiedPeopleName),
      country: candidate.profile.identity.countryIso3Anchors.includes(live.ISOalpha3),
      language: Boolean(live.ROL && candidate.profile.identity.languageIso6393Anchors.includes(live.ROL)),
    };
    const mismatches = Object.entries(checks).filter(([, passed]) => !passed).map(([key]) => key);
    const gsec = live.GSEC ?? null;
    const inPhase12Scope = gsec !== null && gsec >= 0 && gsec <= 3;

    return {
      candidate: name,
      status: mismatches.length ? "identity-mismatch" : inPhase12Scope ? "pass" : "out-of-scope",
      checks,
      mismatches,
      inPhase12Scope,
      expected: {
        peid: candidate.profile.peid,
        pgid,
        name: candidate.profile.identity.verifiedPeopleName,
        countryIso3: candidate.profile.identity.countryIso3Anchors,
        languageIso6393: candidate.profile.identity.languageIso6393Anchors,
      },
      attempt,
      live: {
        peid: live.PEID,
        pgid: live.PGID,
        name: live.NmDisp,
        country: live.Ctry,
        countryIso3: live.ISOalpha3,
        language: live.Lang ?? null,
        languageIso6393: live.ROL ?? null,
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
      },
    };
  } catch (error) {
    return {
      candidate: name,
      status: "provider-error",
      expected: { peid: candidate.profile.peid, pgid },
      attempt,
      reason: error instanceof Error ? error.message : "unknown-provider-error",
    };
  }
}

const LIVE_FETCH_CONCURRENCY = 2;
for (let offset = 0; offset < entries.length; offset += LIVE_FETCH_CONCURRENCY) {
  const chunk = entries.slice(offset, offset + LIVE_FETCH_CONCURRENCY);
  reports.push(...await Promise.all(chunk.map((name) => auditCandidate(name, 1))));
}

// Retry only transient provider/network failures once, serially. Identity or
// scope mismatches are deterministic content failures and are never retried.
const byCandidate = new Map(reports.map((item) => [String(item.candidate), item]));
const retryNames = reports
  .filter((item) => item.status === "provider-error")
  .map((item) => String(item.candidate));
for (const name of retryNames) {
  byCandidate.set(name, await auditCandidate(name, 2));
}
reports.splice(0, reports.length, ...entries.map((name) => byCandidate.get(name)!));

const mismatchCount = reports.filter((item) => item.status === "identity-mismatch").length;
const outOfScopeCount = reports.filter((item) => item.status === "out-of-scope").length;
const providerErrorCount = reports.filter((item) => item.status === "provider-error").length;
const passedCount = reports.filter((item) => item.status === "pass").length;
const generatedAt = new Date().toISOString();

const report = {
  schemaVersion: 1,
  generatedAt,
  mode: "non-blocking-live-diagnostic",
  notice: "This audit never publishes content. It compares draft identity anchors and Phase 12 GSEC scope to current PeopleGroups records. Provider/network errors are reported separately from content mismatches.",
  candidateCount: entries.length,
  passedCount,
  mismatchCount,
  outOfScopeCount,
  providerErrorCount,
  fetchConcurrency: LIVE_FETCH_CONCURRENCY,
  retryPolicy: "one serial retry for provider/network errors only",
  reports,
};

await mkdir(outputDir, { recursive: true });
await writeFile(resolve(outputDir, "live-candidate-audit.json"), JSON.stringify(report, null, 2) + "\n", "utf8");

const markdown: string[] = [
  "# Phase 12 Live Candidate Diagnostic",
  "",
  "**Generated:** " + generatedAt,
  "",
  "- Candidates: " + entries.length,
  "- Passed live identity + scope: " + passedCount,
  "- Identity mismatches: " + mismatchCount,
  "- Outside GSEC 0–3 scope: " + outOfScopeCount,
  "- Fetch concurrency: " + LIVE_FETCH_CONCURRENCY,
  "- Retry policy: one serial retry for provider/network errors only",
  "- Provider/network errors after retry: " + providerErrorCount,
  "",
  "This report is diagnostic and non-publishing. A provider outage must not weaken the deterministic build gate, but identity/scope mismatches must be corrected before human publication review.",
  "",
];

for (const item of reports) {
  const expected = item.expected as Record<string, unknown> | undefined;
  const live = item.live as Record<string, unknown> | undefined;
  markdown.push(
    "## " + String(item.candidate),
    "",
    "- Status: **" + String(item.status) + "**",
    "- Expected PGID: " + String(expected?.pgid ?? "missing"),
    "- Expected PEID: " + String(expected?.peid ?? "missing"),
  );
  if (live) {
    markdown.push(
      "- Live PGID: " + String(live.pgid ?? "missing"),
      "- Live PEID: " + String(live.peid ?? "missing"),
      "- Live identity: " + [live.name, live.country, live.language].filter(Boolean).join(" · "),
      "- Live GSEC: " + String(live.gsec ?? "unknown") + " — " + String(live.gsecBrief ?? "No label"),
      "- Source updated: " + String(live.sourceUpdatedAt ?? "Not reported"),
    );
  } else {
    markdown.push("- Diagnostic reason: " + String(item.reason ?? "unknown"));
  }
  markdown.push("");
}

await writeFile(resolve(outputDir, "live-candidate-audit.md"), markdown.join("\n") + "\n", "utf8");

console.log(
  "Phase 12 live candidate diagnostic: "
  + passedCount + "/" + entries.length + " pass; "
  + mismatchCount + " identity mismatch; "
  + outOfScopeCount + " out of GSEC 0–3 scope; "
  + providerErrorCount + " provider/network error.",
);

if (mismatchCount || outOfScopeCount) {
  throw new Error("Phase 12 live candidate diagnostic found candidate identity/scope drift. Inspect artifacts/v3-phase12/live-candidate-audit.json.");
}
if (providerErrorCount) {
  throw new Error("Phase 12 live candidate diagnostic could not verify every candidate because the provider/network was unavailable. This workflow step is intentionally non-blocking.");
}
