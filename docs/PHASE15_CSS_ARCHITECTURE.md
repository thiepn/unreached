# Phase 15 — CSS Architecture Closure

## Goal

Replace historical release/update-number CSS layering with semantic ownership while preserving the rendered behavior certified through Phase 14 and the production-gate repair merged in Finalization Phase 1.

This phase is an architecture migration, not a visual redesign. It does not intentionally change selectors, declarations, breakpoints, responsive behavior, accessibility behavior, product semantics, persistence, sync, prayer behavior, data interpretation or offline behavior.

## Certified baseline and integration point

Phase 15 began from the fully certified Phase 14 SHA:

`d0dd3f405956a74d03977a4622b9c60d4f6f7af1`

Before closure, current `main` was merged into the Phase 15 branch so the final branch also contains the canonical production-certification repair from:

`005db0b89dce43b15939541fd7769bc8aa425844`

## Completed migration stages

### Stage 1 — Phase 7–14 semantic relocation

The former `v21`–`v28` files were moved byte-for-byte into semantic shell, people, Explore, foundation, prayer and account paths. Their import order remained unchanged.

Certified Stage 1 SHA: `2858ebeeafe7ded58aec31bce334e2fba2e4c3bc`.

### Stage 2 — single-domain `v14`–`v20` relocation

The editorial, prayer, data-state and account layers were moved byte-for-byte into semantic directories while preserving their exact sequence.

Certified Stage 2 SHA: `704eba65af229b340d691f12917033b64e76889a`.

### Stage 3 — mixed `v101-hotfix.css` split

The mixed hotfix layer was replaced at its original cascade slot by nine semantic fragments. Fragment order reproduces the source order of the removed file, including the mobile-pagination tail and reduced-motion override.

### Stage 4 — mixed `v11.css` split

`v11.css` is reconstructed exactly from these ordered fragments:

1. `shell/browse-actions.css`
2. `explore/layer-controls.css`
3. `foundation/catalog-search.css`
4. `foundation/catalog-cards.css`
5. `country/catalog-cards.css`
6. `people/profile-flow.css`
7. `foundation/catalog-responsive.css`

The blocking architecture gate reconstructs the former file and requires SHA-256:

`b3ed266506c4abdf50f64776dd1618f954dfcad6f0cd270d7ca1291e42beaa56`

### Stage 5 — mixed `v12.css` split

`v12.css` is reconstructed exactly from these ordered fragments:

1. `discovery/guided-start.css`
2. `people/profile-journey.css`
3. `country/guided-start.css`
4. `people/empty-state.css`
5. `foundation/guided-responsive.css`

The blocking architecture gate reconstructs the former file and requires SHA-256:

`c44a4a61abaa74ad7535b061bce2c33b8f151a1c324235c4be65d843b295eded`

## Language ownership migration

`u12e-languages.css` has been moved byte-for-byte to:

`language/resource-breakdown.css`

It remains immediately after `languages.css`, preserving the previous overlay position. The gate requires the original content hash:

`33253211cdd98a0c5deedf5e701ae45448be82fcc956399dca82b09f60154073`

## Dormant u5 resolution

`u5-integration.css` was present on disk but was not imported by the certified application entrypoint. Its selectors still occur in Explore markup, but its declarations were dormant and therefore not part of the certified computed-style contract.

The file is deleted rather than activated or merged. Moving its dormant declarations into an imported semantic file would introduce a new visual change under the label of architecture cleanup. Current Explore rendering is therefore preserved.

## Shared country/language detail review

`foundation/detail-records.css` remains a shared layer. Its progress disclosure, load-more control, constrained main columns and table-wrapping rules are deliberately used by both country and language detail surfaces. Splitting them would duplicate the same responsive contract without improving ownership clarity.

The small country-specific intro rule remains adjacent because it is part of the same detail-record disclosure block and does not create cascade ambiguity.

## MapLibre route loading

MapLibre CSS is no longer imported by `src/main.tsx`. The lazy Explore boundary now resolves the MapLibre stylesheet and `ExplorePage` together.

A full-browser regression test verifies:

- the About route initially contains no `.maplibregl-map` stylesheet rule;
- navigating to Explore loads the MapLibre stylesheet;
- the Explore heading and searchable area list remain usable;
- browser back/forward navigation continues to resolve both routes;
- the map’s searchable fallback remains available independently of interactive rendering.

## Final semantic import graph

The application entrypoint now imports only semantic application stylesheets. Every CSS file under `src/styles/` is imported exactly once, except MapLibre’s third-party stylesheet, which belongs to the lazy Explore boundary.

The final cascade remains ordered by behavior rather than alphabetically:

1. tokens, base and global application foundations;
2. map, country, people, context, prayer and language bases;
3. language resource overlay;
4. discovery and About;
5. preserved `v101` semantic fragments;
6. preserved `v11` semantic fragments;
7. preserved `v12` semantic fragments;
8. editorial, prayer, data-state and account layers;
9. Phase 7–13 semantic layers;
10. Phase 14 accessibility ownership last.

`foundation/accessibility.css` remains the final application stylesheet because it intentionally owns global target sizing, focus behavior, form text sizing, contrast corrections and reduced-motion overrides.

## Blocking architecture gate

`scripts/styles/phase15-check.ts` is executed by `npm run css:check` inside the production build. It blocks release when any of the following occurs:

- a `v*` or `u*` release/update-number CSS filename remains;
- source code imports a numbered stylesheet;
- a CSS file is unimported, imported twice or missing on disk;
- accessibility is no longer the final application layer;
- the language overlay moves away from its certified position;
- the former `v11` or `v12` content cannot be reconstructed exactly;
- the language-resource content changes during migration;
- MapLibre returns to the global entrypoint or leaves the Explore lazy boundary;
- the shared country/language detail contract disappears;
- the browser route-loading regression test or phase documentation is missing.

## Exit criterion

Phase 15 is complete when one exact PR head SHA satisfies all of the following:

- no release/update-number CSS file or import remains;
- every application stylesheet has documented semantic ownership;
- legacy mixed layers reconstruct to their certified hashes;
- MapLibre CSS is loaded through the lazy Explore boundary;
- `npm run build` passes with the blocking CSS architecture gate;
- the complete desktop/mobile Browser Certification passes;
- all applicable Phase 1–14 and Private Sync gates remain green;
- the PR is reviewed before any explicit merge into `main`.
