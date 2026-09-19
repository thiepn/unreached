import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { createPeopleGroupsApiClient } from "../../src/providers/peoplegroups/index.js";
import { loadPhase12EditorialCatalog } from "./phase12-content.js";

const root = process.cwd();
const pgidArg = process.argv.find((arg) => arg.startsWith("--pgid="))?.split("=", 2)[1]?.trim().toUpperCase() ?? "";
if (!/^PG[0-9]+$/.test(pgidArg)) {
  throw new Error("Usage: npm run v3:phase12-editorial-scaffold -- --pgid=PG012345");
}

function slug(value: string): string {
  return value
    .normalize("NFKD")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "people";
}

function text(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "Not reported";
}

function value(value: unknown): string {
  return value === null || value === undefined || value === "" ? "Not reported" : String(value);
}

const catalog = await loadPhase12EditorialCatalog();
const record = await createPeopleGroupsApiClient().fetchByPgid(pgidArg);

if (catalog.reviewedPeids.has(record.PEID)) {
  throw new Error(`${pgidArg} / PEID ${record.PEID} already has a published reviewed profile.`);
}
if (record.GSEC === null || record.GSEC === undefined || record.GSEC < 0 || record.GSEC > 3) {
  throw new Error(`${pgidArg} is outside the Phase 12 GSEC 0–3 editorial-expansion scope (current GSEC: ${value(record.GSEC)}).`);
}

const candidateSlug = `${slug(record.NmDisp)}-${slug(record.Ctry)}-${record.PEID}`;
const outputDir = resolve(root, "artifacts/v3-phase12/workbench", candidateSlug);
await mkdir(outputDir, { recursive: true });

const snapshot = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: "PeopleGroups.org / IMB Global Research runtime API",
  status: "research-input-only",
  publicationEffect: "none",
  notice: "This source snapshot is not an editorial profile, review, ranking, recommendation, or publication. Verify the live source again before final review.",
  record,
};
await writeFile(resolve(outputDir, "source-record.json"), `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

const sourceUrl = `https://peoplegroups.org/wp-json/pg/v1/people-groups/${record.PGID}`;
const packet = `# Phase 12 Editorial Review Packet — ${record.NmDisp} in ${record.Ctry}\n\n` +
`**Status:** research scaffold only — not reviewed, not published, not counted toward Unreached 3.0.\n\n` +
`## Source identity\n\n` +
`- PEID: ${record.PEID}\n` +
`- PGID: ${record.PGID}\n` +
`- Country: ${record.Ctry} (${record.ISOalpha3})\n` +
`- Provider region: ${text(record.Regn)}\n` +
`- Provider subregion: ${text(record.RegnSub)}\n` +
`- Display name: ${record.NmDisp}\n` +
`- Alternate name: ${text(record.NmAlt)}\n` +
`- Language: ${text(record.Lang)} (${text(record.ROL)})\n` +
`- Language family: ${text(record.LangFamily)}\n` +
`- Religion label: ${text(record.Rlgn)}\n` +
`- Population estimate: ${value(record.Pop)}\n` +
`- GSEC: ${value(record.GSEC)} — ${text(record.GSECbrf)}\n` +
`- Evangelical level: ${text(record.EvngLvl)}\n` +
`- Engagement: ${text(record.EngStat)}\n` +
`- Congregation exists: ${text(record.CongExst)}\n` +
`- Church planting: ${text(record.Plnting)}\n` +
`- Bible label: ${text(record.Bible)}\n` +
`- Jesus Film label: ${text(record.Jesus)}\n` +
`- Source updated: ${text(record.UpdatedDate)}\n` +
`- Source record: ${sourceUrl}\n\n` +
`## Evidence work required\n\n` +
`Use the source record for identity and source-native mission fields. Add independent/authoritative sources for human context before drafting a substantial profile. Do not infer character, receptivity, resistance, need, urgency, or spiritual condition from religion, ethnicity, geography, poverty, conflict, or mission status.\n\n` +
`### Identity confirmation\n\n` +
`- [ ] Re-fetch ${record.PGID} and verify PEID/PGID/name/country/language at review time.\n` +
`- [ ] Confirm the language code/name with a reputable linguistic reference when possible.\n` +
`- [ ] Resolve alternate names carefully; do not merge similarly named peoples without evidence.\n\n` +
`### Human context sources\n\n` +
`Add citations and locators for only the dimensions that can be supported well. Missing dimensions should remain research gaps.\n\n` +
`- [ ] Geography / settlement context — authoritative geographic, census or academic source.\n` +
`- [ ] Language / literacy context — linguistic or official education/literacy source.\n` +
`- [ ] Culture / history — academic, reference, cultural-heritage or institutional source.\n` +
`- [ ] Religion / community — nuanced aggregate evidence; avoid claims about every individual.\n` +
`- [ ] Scripture / Christian-resource context — source availability labels with explicit limits on what they prove.\n\n` +
`## Drafting contract\n\n` +
`A Phase 12 substantial profile must eventually satisfy the V3 editorial policy: overview + gospel-access context + at least one human-context section, at least three sourced sections, at least four material claims, contextual prayer prompts, complete citations, current-claim dates, sensitivity review, and explicit research gaps.\n\n` +
`AI assistance may help organize sources or draft candidate wording, but candidate material remains unreviewed until a maintainer verifies every material claim and intentionally publishes it.\n\n` +
`## Maintainer publication checklist\n\n` +
`- [ ] Naming and identity checked.\n` +
`- [ ] Every material claim supported by its cited locator.\n` +
`- [ ] Current claims have fresh asOf/reviewAfter dates.\n` +
`- [ ] No stereotype or causal shortcut language.\n` +
`- [ ] Religion wording is aggregate and nuanced.\n` +
`- [ ] Sensitive data/geographic precision checked.\n` +
`- [ ] Source licensing/reuse checked.\n` +
`- [ ] Missing dimensions remain explicit gaps.\n` +
`- [ ] Candidate package passes npm run v3:phase12-candidate-check.\n` +
`- [ ] Reviewer role and timestamp recorded only after evidence review.\n` +
`- [ ] Publication manifest/status updated intentionally.\n` +
`- [ ] Full Phase 12 readiness + strict certification rerun.\n`;

await writeFile(resolve(outputDir, "review-packet.md"), packet, "utf8");

console.log(`Prepared Phase 12 research scaffold for ${record.NmDisp} in ${record.Ctry} (${record.PGID} / PEID ${record.PEID}) at artifacts/v3-phase12/workbench/${candidateSlug}. No content was published.`);
