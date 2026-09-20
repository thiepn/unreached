# V3 Browser Certification Contract

**Status:** release-blocking for Unreached 3.0 and later V3 roadmap phases  
**Established:** 2026-09-19

## Why this exists

The repository contains browser tests from several product generations. During the V3 rebuild, many V1/V2 tests continued to execute even after their UI contracts were intentionally replaced. The result was a misleading release signal: current V3 journeys passed while historical tests failed on removed copy, selectors and navigation structures.

Browser certification must test the product that is actually intended to ship. It must not force production UI regressions merely to preserve historical DOM contracts.

## Blocking matrix

`npm run e2e` runs `playwright.v3.config.ts` across the five projects defined in the canonical Playwright configuration:

1. Chromium desktop;
2. Firefox desktop;
3. WebKit desktop;
4. Pixel-class mobile Chromium;
5. iPhone-class mobile WebKit.

The V3 config discovers browser specs from Phase 4 onward. Phase 4 is the first browser-facing V3 phase; Phases 1–3 are source/model/editorial architecture and remain covered by deterministic build-time gates.

For the Phase 12 release candidate, the blocking browser set covers:

- V3 design-system and viewport behavior;
- shell, primary navigation, keyboard menu behavior and mobile navigation;
- Explore map/fallback behavior and desktop/mobile country selection;
- World → Region → Country → People continuity;
- source-only and reviewed people profiles;
- unified search, people discovery and guided collections;
- Prayer 3.0, focused prayer and guided sessions;
- Saved, private notes, prayer memory and mobile behavior;
- the integrated Explore → People → Pray → Saved release journey.

Later V3 phase specs are picked up automatically by the same filename contract.

## Historical diagnostic matrix

`npm run e2e:historical` still runs the complete repository test directory with the canonical Playwright configuration.

It is intentionally **diagnostic**. It exists to preserve regression archaeology and to make removed contracts visible during maintenance. It is not a release gate because it contains assertions for product structures V3 intentionally replaced, including examples such as:

- old Explore/sidebar selectors and copy;
- the pre-V3 Browse navigation model;
- the old global-search accessible name;
- the former “My lists” Saved heading;
- removed editorial wrapper classes and legacy profile copy;
- older prayer/session presentation contracts.

Historical failures must not be “fixed” by reintroducing obsolete UI into V3.

## No-coverage-loss rule

Moving an old assertion out of the release-blocking matrix is allowed only when one of these is true:

1. the behavior is intentionally removed by an approved V3 phase and the current V3 spec verifies the replacement behavior; or
2. the invariant is implementation/data-policy behavior already enforced by a deterministic build-time check.

If an old test exposes a still-valid behavior that has no current replacement coverage, add or strengthen a V3 test before treating the old assertion as historical.

## Failure policy

A failure in `npm run e2e` is release-blocking.

A failure in `npm run e2e:historical` is triaged into one of three categories:

- **obsolete contract** — expected historical mismatch; do not change production UI;
- **still-valid invariant** — migrate the assertion into a current V3 spec and fix the product if needed;
- **shared infrastructure defect** — fix the underlying product/test infrastructure and verify the V3 matrix again.

The historical suite must never be used as a reason to weaken source correctness, accessibility, privacy, mission semantics, or the final V3 information architecture.


## Phase 20 peak-lock guidance

Phase 20 closes the numbered V3 roadmap but does not reduce browser coverage. The blocking V3 filename contract continues through Phase 20, and future maintenance specs should extend the current product contract rather than create Phase 21+ naming.

Visual evidence should prefer a relevant component or bounded viewport capture over an ever-growing full-page screenshot. This avoids browser-engine image-dimension limits becoming false product failures as long-form people profiles grow, while preserving useful evidence for the surface under test.

The five-project matrix remains release-blocking after Peak Certification.
