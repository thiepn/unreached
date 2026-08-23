# U12 Final Certification — v1.0.0

## Decision

**Target:** Unreached v1.0.0  
**Scope:** U0–U12F plus final release-engineering closure  
**Release posture:** **RELEASE-READY once this closure candidate is green and deployed to main**

This certificate records the whole-system gate for the first production-ready Unreached release. It does not add new product semantics; it verifies that the implemented product, data contracts, external-provider assumptions and deployment path are internally consistent and reproducible.

## Certified production baseline

U12F PR #30 was merged to `main` as:

`80c38901e1bfcc0de1eb94fc369de474b07d9771`

That exact commit received:

- **success** — `unreached/pages-production`
- **success** — `unreached/peoplegroups-live`

Before merge, its final PR head passed deterministic production CI, the complete desktop/mobile Playwright matrix, live browser API/CORS validation, editorial identity preflight and the complete PeopleGroups live-corpus audit.

## Release candidate requirements

A v1.0.0 closure candidate must satisfy all of the following.

### Build and deterministic integrity

- [x] Node requirement is declared (`>=22.12.0`).
- [x] Package version is `1.0.0`.
- [x] TypeScript application and script typechecks are release gates.
- [x] Source-policy validation is a release gate.
- [x] PeopleGroups adapter/runtime/cache/visible-data checks are release gates.
- [x] Natural Earth geography build + validation are release gates.
- [x] Mission visualization deterministic + live-runtime semantic checks are release gates.
- [x] Country Explorer checks are release gates.
- [x] People Explorer checks are release gates.
- [x] Reviewed editorial context checks are release gates.
- [x] Prayer checks are release gates.
- [x] Language/resource checks are release gates.
- [x] Search/discovery/local-personalization checks are release gates.
- [x] Production publication-policy checks are release gates.
- [x] Built `dist` is checked for forbidden/static-provider content and size constraints.

### Browser product certification

- [x] Chromium desktop is covered.
- [x] Firefox desktop is covered.
- [x] WebKit desktop is covered.
- [x] Mobile Chromium is covered.
- [x] Mobile WebKit is covered.
- [x] Root shell/navigation is covered.
- [x] Map rendering/fallback and sidebar layout are covered.
- [x] Country Explorer is covered.
- [x] People Explorer and people profiles are covered.
- [x] Search → profile → save → prayer flow is covered.
- [x] Live mission visualization is covered.
- [x] Languages/resources and language search are covered.
- [x] Reviewed editorial context and missing-context behavior are covered.
- [x] Saved/local state and unknown-route behavior are covered.

### External-provider certification

- [x] Fast editorial PEID/PGID identity preflight exists.
- [x] Complete PeopleGroups live-corpus audit exists.
- [x] Every published editorial identity anchor is checked against current provider data.
- [x] Browser CORS/API behavior is certified independently from intercepted browser fixtures.
- [x] Release branches execute live-provider certification.
- [x] Provider failures remain fail-closed rather than silently changing semantics.

### Current identity contract

The 23 August 2026 complete-corpus certification established:

- 12,370 PGIDs,
- 12,370 PEIDs,
- no PEID with multiple PGIDs,
- no PEID spanning countries,
- every current PGID numeric suffix equal to its PEID.

The release therefore treats each current PEID/PGID pair as one people-group-in-country source record. PEID remains the compatibility route key but is not used as a cross-country aggregation key. Duplicate PEIDs fail closed.

### Editorial publication

- [x] Editorial context uses schema v2.
- [x] Identity requires explicit PEID + PGID + verified name + country + language evidence.
- [x] Numeric coincidence cannot establish identity.
- [x] Evidence-level, synthesis, interpretation, freshness, sensitivity and reviewer gates remain enforced.
- [x] Missing editorial context produces no fabricated filler.
- [x] First production profile is Fon of Benin: PEID 12319 / PG012319 / BEN / fon.

### Semantic and legal boundaries

- [x] PeopleGroups runtime read is separate from static redistribution rights.
- [x] No static PeopleGroups corpus is distributed.
- [x] `other` is not mislabeled as `reached`.
- [x] IMB values are not converted into Joshua Project JPScale/Frontier claims.
- [x] Generic Bible/resource fields are not converted into translation-completeness milestones.
- [x] ProgressBible remains permission-gated.
- [x] Ethnologue proprietary taxonomy remains permission-gated.
- [x] Third-party people-photo redistribution remains blocked without separate authorization.
- [x] Unknown data remains unknown.

### Privacy and product boundaries

- [x] No account system is required.
- [x] Saved/recent state is browser-local.
- [x] No analytics SDK is required for core operation.
- [x] No client-side API secret exists.
- [x] Prayer has no public activity feed, score, streak or leaderboard.
- [x] Product scope remains **Explore → Understand → Pray**.

### Deployment

- [x] GitHub Pages deployment workflow builds from the certified source.
- [x] Deployment validates production data publication modes.
- [x] Deployment validates reviewed editorial context contract.
- [x] Production status is published as `unreached/pages-production`.
- [x] Live-provider status is published as `unreached/peoplegroups-live`.
- [x] The canonical public path is `https://www.thiepn.dev/unreached/`.

## Release-engineering closure

The final closure adds no new data interpretation. It makes `release/**` branches first-class targets for:

- deterministic CI,
- full desktop/mobile Browser Certification,
- live PeopleGroups full-corpus/editorial certification,
- release-PR browser API/CORS certification.

This prevents the release path itself from being less strict than phase-development branches.

## Final release rule

The candidate is accepted as **v1.0.0 release-ready** only when the closure PR is green, merged, and the resulting main commit again reports successful production Pages and PeopleGroups live statuses.

Any later change to provider identity behavior, editorial schema, source-policy permissions, mission semantics or production deployment invalidates the relevant portion of this certificate and requires re-certification.
