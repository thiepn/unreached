# V3 Phase 13 — Multi-Source Mission Intelligence

**Status:** implemented on a post-3.0 stacked branch; production activation remains blocked by V3 Gate D.  
**Reviewed:** 2026-09-19

## Goal

Phase 13 adds responsible source comparison without collapsing independent mission-research methodologies into one synthetic score or provider-independent verdict.

PeopleGroups.org / IMB remains the canonical atlas runtime inherited from Unreached 3.0. Joshua Project is introduced only as an optional secondary comparison for explicitly reviewed people-group-in-country identity links.

## Gate D remains binding

The V3 roadmap places Phase 13 after the focused Unreached 3.0 atlas release. This branch therefore does **not** certify, merge around, or weaken Phase 12. Phase 12 still requires the full 100 substantial reviewed-profile threshold and the existing Unreached 3.0 ship gate.

Phase 13 may be engineered and reviewed in parallel, but it must remain stacked/draft until Gate D is satisfied.

The branch inherits the repaired V3 browser-certification contract from Phase 12. Browser release gating targets the active V3 product surface while retaining the complete older suite as a non-blocking historical diagnostic. This does not relax the editorial Gate D requirement.

## Source semantics

### PeopleGroups.org / IMB

The existing source-scoped assertion is retained:

- GSEC 0–3 → product label `unreached`;
- GSEC 4–6 → product label `not-unreached` at the comparison layer;
- missing GSEC → `unknown`;
- GSEC remains IMB / PeopleGroups.org semantics.

### Joshua Project

Phase 13 retains Joshua Project's source-native `LeastReached` result and displays `JPScale`, `PercentAdherents`, `PercentEvangelical` and `Frontier` only as provider values.

Unreached does **not** recompute `LeastReached` from displayed percentages. Joshua Project documents its unreached methodology using Christian-adherent and evangelical thresholds, but its percentage fields are estimates and displayed zero values can be rounded or unknown. The provider classification therefore remains the authoritative source field for the comparison.

## Comparison states

The comparison engine has exactly three states:

- **agreement** — both non-unknown source assertions map to the same narrow product classification;
- **disagreement** — both sources provide classifications and those classifications differ;
- **incomplete** — at least one source assertion is unknown.

These states are descriptive only. There is no blended mission score, source ranking, automatic tie-breaker or hidden preferred-provider rule.

Agreement does not imply identical definitions, estimates, segmentation or update cadence. Disagreement is not treated as corruption by default.

## Identity crosswalk

No provider identities are matched by fuzzy name search or coincident numbers.

The initial Phase 13 manual crosswalk contains three reviewed PGIC links:

| PeopleGroups.org | Joshua Project | Review basis |
|---|---|---|
| Hui of China — PEID 7206 / PG007206 / CHN | PeopleID3 12140 / ROG3 CH | country + people name + language context |
| Uyghur of China — PEID 24104 / PG024104 / CHN | PeopleID3 15755 / ROG3 CH | country + people name + language context |
| Southern Pashtun of Afghanistan — PEID 24009 / PG024009 / AFG | PeopleID3 14327 / ROG3 AF | country + people name + language context |

Every crosswalk stores its review date and evidence. Adding another link requires another explicit identity review and corresponding server allowlist update.

## Runtime architecture

Joshua Project comparison is opt-in at the profile level:

1. the normal people profile loads from PeopleGroups.org as before;
2. if a reviewed crosswalk exists, the page offers **Compare mission sources**;
3. only after the user invokes the comparison does the browser call the Unreached Worker;
4. the Worker accepts only allowlisted `PeopleID3ROG3` identifiers;
5. the Worker reads `JOSHUA_PROJECT_API_KEY` from a server-side secret;
6. the Worker performs one narrow Joshua Project API request;
7. it validates the returned identity and reduces the response to the small comparison schema;
8. the response is returned with `Cache-Control: no-store`;
9. the app does not add the record to IndexedDB, localStorage, sessionStorage, the service-worker cache, D1 or the Unreached corpus.

The Worker is intentionally not a generic Joshua Project proxy and exposes no search or bulk endpoint.

## Attribution and legal posture

The Joshua Project terms were re-reviewed on 2026-09-17. The integration is designed around the current obligations relevant to this use:

- non-commercial use;
- visible linked **Data provided by Joshua Project** attribution on pages displaying Joshua Project data;
- value-added use rather than a direct/high-overlap replication;
- no exposed API credentials;
- revocable access;
- deletion of downloaded/cached data if access terminates.

Phase 13 avoids a termination-data problem by not persisting API responses in the first place.

Joshua Project photos, maps and narrative profile text are outside this Phase 13 integration and retain their separate rights gates.

## Failure behavior

The profile remains fully usable if Joshua Project is unavailable, the Worker is unavailable, the API contract changes, or the secret is not configured. The secondary panel shows an explicit unavailable state and never substitutes fabricated values.

The browser validates the reduced response again and rejects identity mismatches.

## Deployment prerequisite

Production activation requires configuring the existing Worker with the secret:

```bash
cd worker
npx wrangler secret put JOSHUA_PROJECT_API_KEY
```

Do not place the key in `wrangler.template.jsonc`, repository secrets committed to source, client environment variables, JavaScript bundles or documentation examples.

## Certification

Run:

```bash
npm run v3:phase13-check
npm run build
npm run e2e
```

`npm run e2e` is the release-blocking **active V3 browser matrix**. It runs current V3 contracts across Chromium, Firefox, WebKit, mobile Chromium and mobile WebKit, and automatically includes `v3-phase13-multi-source.spec.ts`. The pre-V3 suite remains available separately through `npm run e2e:historical` for diagnostic regression archaeology; superseded V1/V2 DOM and copy contracts do not redefine the V3 product.

The dedicated Phase 13 workflow also typechecks the Worker separately. It does not require a live Joshua Project key because CI certifies the policy/model/edge boundaries without downloading live provider data.

## Explicit non-goals

Phase 13 does not:

- replace PeopleGroups.org as the canonical atlas runtime;
- merge source definitions;
- rank providers;
- create a universal mission score;
- bulk ingest Joshua Project;
- use Joshua Project photos;
- implement historical trend storage.

Historical mission-data timelines belong to **Phase 14** and must not be pulled into this phase.
