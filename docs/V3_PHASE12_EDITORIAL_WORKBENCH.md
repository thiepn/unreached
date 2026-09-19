# Phase 12 Editorial Workbench

Phase 12 separates **research-ready candidates** from the public reviewed publication so content expansion can move quickly without weakening the meaning of “reviewed.”

## Candidate workspace

Candidate packages live under:

`data/v3/editorial/candidates/`

They use the same profile-package schema as production editorial shards, but they must remain `review.status = "draft"` until a maintainer performs the evidence review and intentionally publishes them.

The workbench currently contains **16 Tier-3 drafts**. Batch 1 contains Nateni, Hausa, Anii and Weme of Benin. Batch 2 adds Afar of Ethiopia, Eastern Baloch and Brahui of Pakistan, Tamajeq of Mali, Fur of Sudan, Kabyle of Algeria, Uzbeks of Uzbekistan and Saho of Eritrea. Batch 3 promotes the completed Issue #97 research set: Dendi, Foodo, Gun and Aizo of Benin. All remain outside `public/data/context/manifest.v1.json`. Draft candidate material **does not count** toward the 100-profile Unreached 3.0 certification target until explicit human maintainer review and publication.

## Start a new research packet from a PGID

Run:

```bash
npm run v3:phase12-editorial-scaffold -- --pgid=PG012345
```

The scaffold fetches exactly one current PeopleGroups.org record, rejects records outside GSEC 0–3 and rejects PEIDs that are already in the public reviewed catalog. It writes a private workbench artifact under `artifacts/v3-phase12/workbench/` containing:

- `source-record.json` — the source snapshot and full provider fields;
- `review-packet.md` — identity facts, mission/source fields, independent-source slots, drafting guardrails and the maintainer publication checklist.

The scaffold never creates a public profile and never edits the publication manifest. It is deliberately a research starting point rather than an automatic profile generator.

The Phase 12 GitHub Actions workflow exposes the same tool through the optional `editorial_pgid` workflow-dispatch input and uploads the resulting packet as a private workflow artifact.

## Batch source scaffolding

For the next research batch, fetch several explicit PGIDs in one non-ranking operation:

```bash
npm run v3:phase12-editorial-scaffold-batch -- --pgids=PG012316,PG012320
```

The command accepts 1-25 explicit PGIDs, preserves input order, fetches each current PeopleGroups record, captures the actual PEID/PGID/name/country/language identity, skips already-reviewed profiles and records outside the Phase 12 GSEC 0-3 scope, and writes one source snapshot plus research packet per eligible record under `artifacts/v3-phase12/workbench/`.

It also writes `batch-scaffold-index.json` with every prepared/skipped record. It applies **no ranking or priority score** and creates neither candidate JSON nor public content. Use this instead of inferring a PEID from a PGID.
## Mechanical candidate gate

Run:

```bash
npm run v3:phase12-candidate-check
```

The gate verifies that each candidate:

- parses under the production editorial package schema;
- remains draft and does not claim review metadata;
- targets Tier 3 rather than a thin source-only card;
- does not duplicate a published PEID or another candidate;
- has at least three sources and at least one non-mission-research source;
- has at least four material claims;
- has internally resolvable citation/source identifiers;
- has exactly one indexed AI-assisted pre-review evidence audit under `data/v3/editorial/evidence-audits.json`;
- the mapped audit document explicitly remains **not maintainer approval** and **not publication**;
- can pass the full V3 reviewed-profile structural/evidence policy when evaluated as an in-memory shadow publication.

The in-memory shadow review exists only to test structure, freshness, citation integrity, prohibited language and section depth. It never writes review metadata back to the candidate and never increments the public reviewed-profile count.

## Pre-review evidence-audit index

Every Tier-3 draft is mapped in:

`data/v3/editorial/evidence-audits.json`

The index links each candidate to one AI-assisted evidence-audit document and labels every entry `pre-review-only`. The candidate gate requires an exact one-to-one mapping between current drafts and audit entries and verifies that every mapped document explicitly states that it is **not maintainer approval** and **not publication**.

The batch and single-candidate review packets surface the mapped audit path so maintainers can read the pre-review findings alongside the live source snapshot and cited evidence. This layer improves evidence preparation; it never completes any human checkbox or changes review status.

## Automatic live candidate diagnostic

Every Phase 12 pull request now runs a **non-blocking** live candidate audit:

```bash
npm run v3:phase12-live-candidate-audit
```

It re-fetches every draft's anchored PGID and records the live PEID, name, country, language, GSEC, mission fields, resource labels and provider update date. Each draft is classified as `pass`, `identity-mismatch`, `out-of-scope` or `provider-error`, with JSON and Markdown evidence under `artifacts/v3-phase12/`.

The workflow step deliberately uses `continue-on-error`: a PeopleGroups/network outage must not make the deterministic release build red. **Identity mismatches and GSEC scope drift remain publication blockers** and must be corrected before human review/promotion.

When the live diagnostic succeeds, the Phase 12 PR workflow automatically runs `v3:phase12-review-workbench` and includes the maintainer-ready JSON/Markdown review index in the normal Phase 12 artifact bundle. A separate workflow dispatch is still available for an explicit refresh, but routine PR review no longer requires it.

## Tracked research-batch registry

Research-only batches can now be registered under:

`data/v3/editorial/research-batches/`

The current registry contains Issue #97's explicit Benin batch. On every Phase 12 PR, this command runs as a **non-blocking live diagnostic**:

```bash
npm run v3:phase12-live-research-batches
```

For each tracked PGID it fetches the current PeopleGroups record and records the authoritative PEID, display name, country, language/code, GSEC, mission/resource fields and provider update date. It also identifies whether that live PEID is already published, already exists as a candidate, is still research-ready, or has moved outside the GSEC 0–3 scope.

The registry is explicitly **non-ranking** and has `publicationEffect: "none"`. It creates no candidate claims and changes no public content. Its purpose is to make the transition from an explicit research PGID list to a correctly anchored candidate possible without ever inferring PEID from PGID.

## Guarded review and publication command

Prepare a live-identity-checked, non-mutating review packet:

```bash
npm run v3:phase12-review-candidate -- --candidate=nateni-benin.json
```

The command re-fetches the anchored PeopleGroups record, verifies PEID/PGID/name/country/language identity, **fails closed if live GSEC is no longer 0–3**, captures the current GSEC/evangelical/engagement/church-planting/resource/update fields, runs the full reviewed-profile policy in shadow mode, and writes both JSON and a reviewer-friendly Markdown packet under `artifacts/v3-phase12/reviews/`. The Markdown packet contains direct evidence URLs/locators, every material claim and citation ID, the live source snapshot, and the eight human review checks in one place. It does **not publish by default**.

After a maintainer has opened every cited source and completed all eight review checks, publication can be performed deterministically:

```bash
npm run v3:phase12-review-candidate -- --candidate=nateni-benin.json --publish --reviewer-role="Release-maintainer evidence review" --attest-review-complete
```

Both an explicit human reviewer role and `--attest-review-complete` are required. Automated/mechanical/AI reviewer roles are rejected. The command writes the reviewed profile, updates the production manifest and public context count, then removes the draft candidate so duplicate identities fail closed.
## Batch maintainer review packet

To check every current draft against the live PeopleGroups identity boundary and generate one consolidated maintainer checklist, run:

```bash
npm run v3:phase12-review-workbench
```

This command is **non-mutating**. It produces `workbench-review-index.json` and `workbench-review-index.md` under `artifacts/v3-phase12/reviews/`. Every draft must pass live PEID/PGID/name/country/language checks, remain inside the live GSEC 0–3 Phase 12 scope, and pass the full reviewed-profile policy in shadow mode. The Markdown index includes each candidate's current source-native mission/resource snapshot plus direct evidence links and source locators, so a maintainer can review the batch without digging through candidate JSON.

Batch review never sets review metadata and never publishes. Final publication remains a deliberate one-candidate-at-a-time action through the guarded `v3:phase12-review-candidate -- --publish ... --attest-review-complete` path so each human attestation stays explicit and attributable.
## Maintainer publication boundary

A candidate becomes publishable only after a maintainer checks the actual evidence and records the normal review contract:

1. verify PEID/PGID/name/country/language identity and the live GSEC 0–3 scope against the current PeopleGroups.org record;
2. open every material citation and confirm the claim is supported by the cited locator;
3. verify current claims, `asOf` dates and `reviewAfter` dates;
4. check religion/community wording for aggregate-label overreach;
5. check sensitive material and geographic precision;
6. check source reuse/licensing and attribution;
7. confirm missing dimensions remain absent instead of being filled with generic prose;
8. set the completed checklist, review timestamp and reviewer role;
9. change status to `published` only after those checks;
10. move the final package into `public/data/context/profiles/`, add it to the manifest, update context status count, and run all Phase 12 gates.

AI-assisted research, writing and mechanical validation are allowed. They do not substitute for the explicit publication review above.

## Current content state

- Public substantial reviewed profiles: **12 / 100**.
- Review-ready Tier-3 draft candidates in the workbench: **16**.
- Batch 1 — Benin: Nateni, Hausa, Anii and Weme. Human evidence sign-off is tracked in **Issue #96**.
- Batch 2 — cross-region: Afar (Ethiopia), Eastern Baloch (Pakistan), Tamajeq (Mali), Fur (Sudan), Kabyle (Algeria), Brahui (Pakistan), Uzbek (Uzbekistan) and Saho (Eritrea). Human evidence sign-off is tracked in **Issue #98**.
- Batch 3 — Benin research promotions: Dendi, Foodo, Gun and Aizo. Research/provenance is closed in **Issue #97**; human evidence sign-off is tracked in **Issue #99**.
- All current draft packages pass the mechanical Tier-3 candidate integrity policy. Live identity revalidation and human evidence review remain mandatory before publication.
- Remaining public reviewed-profile gap: **88** until candidates are actually reviewed and published.

This workbench is a content-production accelerator, not a way to lower the Phase 12 release threshold.
