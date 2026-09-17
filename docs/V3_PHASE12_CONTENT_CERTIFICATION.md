# Unreached 3.0 — Phase 12 Content Expansion & Certification

**Phase:** 12  
**Purpose:** finish the V3 rebuild, expand the reviewed editorial publication, close release blockers, and ship Unreached 3.0 without weakening the source/editorial contracts established in Phases 1–11.

## Release outcome

Phase 12 is complete only when **all** of the following are true:

1. the map-first Explore experience is understandable and usable on desktop and mobile;
2. World → Region → Country → People navigation remains coherent;
3. reviewed people profiles function as substantial mission-atlas articles rather than thin source cards;
4. Search, Prayer and Saved complete the Discover → Understand → See the need → Pray → Remember loop;
5. at least **100 substantial reviewed profiles** are published and pass the Phase 3 editorial standard;
6. important source claims remain attributable and unknown values stay unknown;
7. browser, accessibility, performance, offline/PWA, privacy, source-policy and security gates pass;
8. the production release is built and published from the exact certified commit.

A green automated-readiness workflow is not the same thing as Unreached 3.0 certification. The strict certification command is intentionally separate and must remain red until the editorial target and every release gate are actually satisfied.

## Current editorial baseline

The production editorial manifest currently contains **12** substantial reviewed profiles. The 3.0 target is **100**, leaving **88** additional profiles at the start of Phase 12.

The existing profiles are retained as the quality baseline. Every profile counted toward the target must continue to satisfy the Phase 3 V3 contract after legacy-package adaptation:

- published/reviewed status with review metadata;
- overview plus gospel-access context plus at least one human-context section;
- at least three sourced sections and four material claims;
- at least two contextual, non-manipulative prayer prompts;
- complete citation integrity;
- Level B synthesis supported by at least two sources;
- current claims with `asOf` and `reviewAfter` dates;
- no restricted material in public profiles;
- complete editorial checklist and explicit identity evidence;
- missing dimensions represented as research gaps rather than generated filler.

**AI-assisted candidate material does not count as reviewed.** A PeopleGroups source record, generated research queue entry, draft paragraph, or AI-assisted source summary only becomes part of the reviewed total after a maintainer completes the evidence review, verifies identity/citations/currentness/sensitivity/licensing, and intentionally publishes it under the existing editorial review contract.

## Editorial expansion workflow

Phase 12 adds a deterministic internal research-queue generator:

```bash
npm run v3:phase12-editorial-queue
```

The queue:

- reads the live PeopleGroups.org runtime API;
- excludes PEIDs that already have reviewed profiles;
- limits candidates to current source records in GSEC 0–3;
- round-robins across the provider's region labels and then uses country/name ordering;
- emits no urgency, importance, mission-priority, spiritual-need or population score;
- creates no editorial claim and publishes nothing automatically.

The queue exists only to make human research coverage systematic. Candidate selection must never be described as a ranking of peoples.

For each candidate, maintainers must research identity and human context using appropriate authoritative/independent sources, write claim-level citations, review sensitive language and uncertainty, verify the current PeopleGroups identity, and then publish through the existing profile package/manifest path.

## Automated readiness versus strict certification

### Automated readiness

```bash
npm run v3:phase12-readiness
```

This is safe to run during ongoing content expansion. It verifies:

- every currently published editorial shard parses and adapts successfully;
- every existing reviewed profile passes the V3 editorial integrity policy;
- the manifest count/URLs/PEIDs are internally consistent;
- the MapLibre security migration is present in both package and lockfile;
- the WebGL2/CSP worker integration and fallback boundary are present;
- Phase 12 scripts and documentation are wired.

It writes `artifacts/v3-phase12/readiness.json` and reports the exact reviewed-profile count and remaining gap. It exits successfully when the existing publication is internally valid even if the 100-profile release target has not yet been reached.

### Strict certification

```bash
npm run v3:phase12-certify
```

This is the content release gate. It fails until at least 100 substantial reviewed/published profiles satisfy the editorial policy. It must be run as part of the final Unreached 3.0 release-candidate certification.

Do not replace this gate with source-only profiles, generated placeholders, empty sections, copied provider prose, or unreviewed drafts.

## Security hardening — MapLibre

The previous application dependency was affected by `GHSA-jrc7-96c5-q579`, a critical MapLibre GL JS sanitizer-bypass advisory affecting releases through 6.4.0.

Phase 12 migrates the application to **MapLibre GL JS 6.4.1** rather than using an unreviewed forced dependency upgrade. The migration includes:

- the V6 ESM worker path through Vite's `?worker&url` pipeline;
- explicit `setWorkerUrl(...)` to preserve a same-origin worker under the existing CSP;
- WebGL2 rendering as required by MapLibre 6;
- explicit `GPUInitializationError` handling;
- retention of the non-WebGL country finder as the accessible functional fallback.

`npm audit --audit-level=high` remains release-blocking in the Phase 12 automated certification workflow.

## Browser certification

The repository-wide browser suite remains a release blocker. Phase 12 must certify:

- Chromium;
- Firefox;
- WebKit;
- mobile Chromium;
- mobile WebKit.

The prior broad suite was already overwhelmingly green, with the remaining failures concentrated in legacy Explore selected-country interactions. Phase 12 reconciles those tests with the current map-first desktop rail/mobile bottom-sheet information architecture rather than bypassing pointer or visibility checks.

A dedicated Phase 12 journey spec additionally exercises the product loop and mobile no-overflow behavior using deterministic PeopleGroups fixtures.

## Source and mission semantics

Phase 12 does not change the Phase 1 launch source decision.

- PeopleGroups.org / IMB remains the canonical 3.0 runtime mission source.
- GSEC 0–3 means unreached under the source's `<2% evangelical` boundary.
- GSEC 4–6 remains `not-unreached` in the V3 source-scoped classification model.
- missing mission status remains unknown.
- country map values remain population-weighted PeopleGroups country-context aggregates where population and GSEC are known.
- the UI must not describe those values as Joshua Project metrics or national census Christianity percentages.
- Joshua Project remains inactive for the 3.0 launch.

## Ship checklist

Before changing the product state from Phase 12 to Unreached 3.0 shipped:

- [ ] `npm run v3:phase12-readiness` passes.
- [ ] reviewed profile count is at least 100.
- [ ] `npm run v3:phase12-certify` passes.
- [ ] normal Unreached CI passes.
- [ ] dedicated Phase 12 desktop/mobile journey certification passes.
- [ ] full Browser Certification passes.
- [ ] Dependency Security and License Audit passes.
- [ ] Private Sync Certification passes.
- [ ] accessibility/CSS/offline/release gates pass inside the production build.
- [ ] visual QA finds no major overflow, clipping, hidden-control or hierarchy regression.
- [ ] public privacy/source/legal disclosures match production behavior.
- [ ] exact-SHA production publication succeeds and the deployed site is verified.

## Scope boundary and Phase 13

Phase 12 finishes and ships the PeopleGroups/IMB-first Unreached 3.0 product. It does **not** begin multi-source blending, historical datasets, deeper Scripture-provider integrations, a knowledge graph, advanced geographic inference, localization, or later experimental atlas systems.

Only after strict certification passes and Unreached 3.0 is shipped does work move to **Phase 13 — Multi-Source Mission Intelligence**.
