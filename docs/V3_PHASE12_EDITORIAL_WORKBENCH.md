# Phase 12 Editorial Workbench

Phase 12 separates **research-ready candidates** from the public reviewed publication so content expansion can move quickly without weakening the meaning of “reviewed.”

## Candidate workspace

Candidate packages live under:

`data/v3/editorial/candidates/`

They use the same profile-package schema as production editorial shards, but they must remain `review.status = "draft"` until a maintainer performs the evidence review and intentionally publishes them.

The workbench currently contains `nateni-benin.json` and `hausa-benin.json`. Both use claim-level citations and remain outside `public/data/context/manifest.v1.json`. Draft candidate material **does not count** toward the 100-profile Unreached 3.0 certification target until explicit maintainer review and publication.

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
- can pass the full V3 reviewed-profile structural/evidence policy when evaluated as an in-memory shadow publication.

The in-memory shadow review exists only to test structure, freshness, citation integrity, prohibited language and section depth. It never writes review metadata back to the candidate and never increments the public reviewed-profile count.

## Guarded review and publication command

Prepare a live-identity-checked, non-mutating review packet:

```bash
npm run v3:phase12-review-candidate -- --candidate=nateni-benin.json
```

The command re-fetches the anchored PeopleGroups record, verifies PEID/PGID/name/country/language identity, runs the full reviewed-profile policy in shadow mode, and writes an evidence packet under `artifacts/v3-phase12/reviews/`. It does **not publish by default**.

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

This command is **non-mutating**. It produces `workbench-review-index.json` and `workbench-review-index.md` under `artifacts/v3-phase12/reviews/`. Every draft must pass live PEID/PGID/name/country/language checks and the full reviewed-profile policy in shadow mode.

Batch review never sets review metadata and never publishes. Final publication remains a deliberate one-candidate-at-a-time action through the guarded `v3:phase12-review-candidate -- --publish ... --attest-review-complete` path so each human attestation stays explicit and attributable.
## Maintainer publication boundary

A candidate becomes publishable only after a maintainer checks the actual evidence and records the normal review contract:

1. verify PEID/PGID/name/country/language identity against the current PeopleGroups.org record;
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
- Review-ready draft candidates in the workbench: **4**.
- Nateni candidate: source audit refreshed on **19 September 2026**; no material contradiction found, but human maintainer attestation is still required.
- Hausa of Benin candidate: added **19 September 2026** with PeopleGroups.org, Glottolog and Cambridge evidence; human maintainer attestation is required.
- Anii of Benin candidate: added **19 September 2026** with PeopleGroups.org, Glottolog, SIL and Cambridge evidence; human maintainer attestation is required.
- Weme of Benin candidate: added **19 September 2026** with PeopleGroups.org, Glottolog and a dedicated SIL sociolinguistic survey; human maintainer attestation is required.
- Remaining public reviewed-profile gap: **88** until a candidate is actually reviewed and published.

This workbench is a content-production accelerator, not a way to lower the Phase 12 release threshold.
