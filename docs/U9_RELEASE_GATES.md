# U9 — Release Gates

**Phase:** Languages & Scripture Integration  
**Status:** code-complete and build-validated

## Language model

- [x] Stable ISO 639-3 language routes and domain IDs exist.
- [x] Language profiles retain source language status, mission metrics, Scripture resources and provenance.
- [x] Language-to-people relationships use canonical U6 people records.
- [x] Language-to-country relationships derive from country-specific people records.
- [x] Represented population is explicitly distinct from speaker population.
- [x] Family/branch fields are nullable and cannot be inferred without an approved source.

## Scripture and resources

- [x] Translation-needed / started / portions / NT / complete-Bible states are distinct.
- [x] Milestone years are preserved only when sourced.
- [x] Audio availability retains true / false / unknown semantics.
- [x] Jesus Film availability retains true / false / unknown semantics.
- [x] UI explains that reported resource availability is not the same as practical access or use.
- [x] No unverified media/download URLs are generated.

## Product UI

- [x] `#/languages` language explorer exists.
- [x] `#/languages/:iso6393` profiles exist.
- [x] Search/filter/sort supports Scripture-need discovery.
- [x] Language pages link to related people groups and countries.
- [x] People pages surface primary-language profile links contextually.
- [x] Country pages surface related language profiles contextually.
- [x] Languages remains contextual rather than being added to the primary top-level navigation.

## Legal and source safety

- [x] U9 publishes no real source-derived language dataset by default.
- [x] Production runtime blocks fixture datasets.
- [x] ProgressBible registered data remains permission-required and unbundled.
- [x] Proprietary linguistic datasets remain unbundled.
- [x] U0 Joshua Project release gate remains unchanged.

## Validation

- [x] application TypeScript check passes
- [x] script TypeScript check passes
- [x] U2–U8 checks still pass
- [x] U9 language derivation check passes
- [x] U9 people/country relationship checks pass
- [x] U9 Scripture/resource semantics checks pass
- [x] U9 no-inferred-taxonomy check passes
- [x] U9 filtering checks pass
- [x] U9 production status/release-gate check passes
- [x] Vite production build passes

GitHub Actions CI run #122 passed on 2026-08-22 for the complete U9 implementation head.

## Deferred

- unified cross-domain search index (U10)
- local saved prayer peoples and recent exploration (U10)
- production-scale public data expansion and final legal audit (U11)

## Deployment-only gate

Desktop/mobile visual smoke tests remain required after the stacked phases are integrated and deployed. They do not block U10 development.
