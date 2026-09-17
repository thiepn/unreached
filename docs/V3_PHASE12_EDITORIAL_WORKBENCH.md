# Phase 12 Editorial Workbench

Phase 12 now separates **research-ready candidates** from the public reviewed publication so content expansion can move quickly without weakening the meaning of “reviewed.”

## Candidate workspace

Candidate packages live under:

`data/v3/editorial/candidates/`

They use the same profile-package schema as production editorial shards, but they must remain `review.status = "draft"` until a maintainer performs the evidence review and intentionally publishes them.

The first review-ready candidate is `nateni-benin.json`. It contains claim-level citations from PeopleGroups.org / IMB, Glottolog, SIL Togo-Bénin and the Government of Benin. It is **not** part of `public/data/context/manifest.v1.json` and therefore does not count toward the 100-profile Unreached 3.0 certification target.

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
- Review-ready draft candidates in the workbench: **1**.
- Remaining public reviewed-profile gap: **88** until a candidate is actually reviewed and published.

This workbench is a content-production accelerator, not a way to lower the Phase 12 release threshold.
