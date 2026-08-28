# Phase 15 — CSS Architecture Cleanup

## Goal

Replace historical release-number CSS layering with semantic ownership while preserving the exact rendered behavior certified through Phase 14.

Phase 15 is an architecture cleanup, not a visual redesign. Selector semantics, computed styles, responsive behavior, accessibility guarantees, offline behavior, data semantics, prayer behavior and Private Sync behavior must remain unchanged unless a regression test proves an existing defect requires correction.

## Certified baseline

Phase 15 branches from the fully certified Phase 14 merge:

`d0dd3f405956a74d03977a4622b9c60d4f6f7af1`

## Pre-audit inventory

At the Phase 15 baseline, `src/styles/` contains 33 CSS files. `src/main.tsx` globally imports MapLibre CSS plus 32 application stylesheets. One historical file, `u5-integration.css`, exists on disk but is not imported by the current main entrypoint and is therefore an orphan candidate pending markup verification.

### Semantic baseline files already present

- `tokens.css`
- `base.css`
- `app.css`
- `map.css`
- `mission-map.css`
- `map-layout.css`
- `countries.css`
- `peoples.css`
- `context.css`
- `prayer.css`
- `languages.css`
- `discovery.css`
- `about.css`

### Historical release/update layers at baseline

Imported:

- `u12e-languages.css`
- `v101-hotfix.css`
- `v11.css`
- `v12.css`
- `v14.css`
- `v15.css`
- `v16.css`
- `v17.css`
- `v18.css`
- `v19.css`
- `v20.css`
- `v21-navigation.css`
- `v22-peoples-explorer.css`
- `v23-people-profile.css`
- `v24-explore-map.css`
- `v25-countries-languages.css`
- `v26-prayer-saved.css`
- `v27-account-ux.css`
- `v28-accessibility.css`

Present but not imported:

- `u5-integration.css`

## Cascade dependency map

The historical files are not independent. Their import order encodes behavior:

1. `u12e-languages.css` overlays `languages.css`.
2. `v101-hotfix.css` contains cross-domain shell, loading, list, language and responsive fixes that override earlier semantic files.
3. `v11.css` is a mixed shell/explore/people/country/language bundle and depends on the earlier base/domain styles.
4. `v12.css` extends the guided discovery and profile journey introduced by `v11.css`.
5. `v14.css` creates editorial-discovery/coverage styling; `v15.css` extends it with regional distribution and four-metric layouts.
6. `v16.css`, `v17.css` and `v18.css` form a sequential prayer-list → rotation → session stack.
7. `v19.css` owns global mission-data provenance state; the later navigation layer hides that state at mobile widths.
8. `v20.css` establishes Account layout; the later Account UX layer intentionally overrides it.
9. Phase 7–14 layers (`v21` through `v28`) are semantically narrow but still rely on earlier layers and on their exact relative order.
10. The Phase 14 accessibility layer must remain last because it intentionally overrides the muted-text token, minimum target sizing, mobile form sizing and reduced-motion behavior globally.

Moving a historical file earlier in the cascade, merging it into a pre-existing file without preserving rule order, or route-loading a rule that affects shared shell state can change computed behavior even when the CSS text itself is unchanged.

## Safe migration map

| Historical file | Semantic destination / action |
| --- | --- |
| `u5-integration.css` | verify current selector usage; move to `country/` only if still live, otherwise delete as orphan |
| `u12e-languages.css` | merge into `language/` after selector-order audit |
| `v101-hotfix.css` | split across `shell/`, `foundation/`, `people/` and `language/` while preserving original fragment order |
| `v11.css` | split across `shell/`, `explore/`, `people/`, `country/`, `language/` |
| `v12.css` | split across `people/` and `country/` guided-journey ownership |
| `v14.css` | `editorial/coverage.css` |
| `v15.css` | `editorial/coverage-expansion.css`, kept immediately after the coverage base layer |
| `v16.css` | `prayer/practice.css` |
| `v17.css` | `prayer/rotation.css`, kept immediately after prayer practice |
| `v18.css` | `prayer/session.css`, kept immediately after prayer rotation |
| `v19.css` | `shell/data-state.css` |
| `v20.css` | `account/base.css` |
| `v21-navigation.css` | `shell/navigation.css` |
| `v22-peoples-explorer.css` | `people/explorer.css` |
| `v23-people-profile.css` | `people/profile.css` |
| `v24-explore-map.css` | `explore/map-workspace.css` |
| `v25-countries-languages.css` | `foundation/detail-records.css` pending later country/language split |
| `v26-prayer-saved.css` | `prayer/guides-and-lists.css` |
| `v27-account-ux.css` | `account/ux.css` |
| `v28-accessibility.css` | `foundation/accessibility.css`, kept last globally |

## Stage 1 — narrow Phase 7–14 relocation

The first migration slice moves `v21` through `v28` byte-for-byte into semantic paths. Their position in `src/main.tsx` remains exactly where the historical files were imported, so cascade precedence is unchanged. Existing Phase 7–14 static certification is updated to assert the semantic path rather than the historical filename.

No rule declaration is intentionally changed in this stage.

Stage 1 is certified on `2858ebeeafe7ded58aec31bce334e2fba2e4c3bc`: Unreached CI #1196, Browser Certification #594 and Private Sync Certification #43 all passed on that exact SHA.

## Stage 2 — single-domain v14–v20 relocation

Stage 2 relocates `v14` through `v20` byte-for-byte while retaining all seven files as separate cascade layers. Keeping the editorial expansion and prayer progression files separate avoids changing intra-stack precedence during the rename-only stage.

The preserved order is:

1. `editorial/coverage.css`
2. `editorial/coverage-expansion.css`
3. `prayer/practice.css`
4. `prayer/rotation.css`
5. `prayer/session.css`
6. `shell/data-state.css`
7. `account/base.css`

These imports occupy the exact positions previously held by `v14.css` through `v20.css`. Capability gates that asserted the historical filenames are updated only to the corresponding semantic path. The `v19-data-spin` keyframe name remains unchanged because Stage 2 does not alter CSS rule text.

Stage 2 is certified on `704eba65af229b340d691f12917033b64e76889a`: Unreached CI #1202, Browser Certification #597 and Private Sync Certification #46 all passed on that exact SHA. Two browser-test readiness corrections were required while certifying this stage; both were limited to Phase 14 test synchronization and did not change production CSS, runtime behavior or application markup.

## Stage 3A — split mixed v101 hotfix ownership

Stage 3A removes `v101-hotfix.css` by replacing it at the exact same cascade slot with nine semantic fragments. The fragments are intentionally imported in the historical source order instead of being grouped by domain, because later media-query rules in the original file must retain their precedence relative to earlier base rules.

The preserved fragment order is:

1. `shell/overflow-guard.css`
2. `foundation/loading-state.css`
3. `people/index-loading.css`
4. `foundation/result-pagination.css`
5. `foundation/content-wrapping.css`
6. `language/card-alignment.css`
7. `shell/compact-navigation.css`
8. `foundation/result-pagination-mobile.css`
9. `foundation/loading-motion.css`

No selector, declaration, keyframe name, breakpoint or responsive behavior is intentionally changed. The mobile pagination tail remains after the mobile shell-navigation rules, and the reduced-motion loading override remains last, matching the original `v101-hotfix.css` source order. `v11.css` and `v12.css` remain untouched until this split passes the full applicable certification suite on one exact SHA.

## Later stages

1. After Stage 3A certification, split `v11.css` by selector ownership and certify it before touching `v12.css`; then split and certify `v12.css`.
2. Verify and resolve `u5-integration.css`; merge `u12e-languages.css` into the language domain.
3. Move MapLibre CSS from the global entrypoint into the Explore/map lazy route only after route-loading tests prove first navigation, back/forward navigation, offline shell and map rendering remain stable.
4. Add the final blocking Phase 15 architecture gate and require no release/update-number CSS filenames or imports to remain.

## Exit criterion

Phase 15 is complete only when:

- no release/update-number CSS files remain;
- no global import refers to a release/update-number stylesheet;
- semantic ownership is documented and enforced;
- MapLibre CSS is route-loaded with Explore/map where practical and certified;
- production build and the complete desktop/mobile Browser Certification pass on the same final SHA;
- all existing Phase 1–14 gates still pass without weakening their behavioral contracts.
