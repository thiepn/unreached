# U3 — Release Gates

**Phase:** Global Map Foundation  
**Status:** code-complete and build-validated

## Geography pipeline

- [x] Natural Earth is registered and approved by source policy.
- [x] Natural Earth release is pinned to v5.1.1.
- [x] 1:110m Admin-0 geometry is generated at build time.
- [x] Browser geometry strips unused source attributes.
- [x] Generated map artifact is excluded from source control.
- [x] Geometry output records source/version/boundary metadata.
- [x] Geography validator checks feature count, IDs, geometry, metadata, and duplicates.
- [x] No external tile/basemap runtime dependency exists.

## Map engine

- [x] MapLibre GL JS is integrated.
- [x] World pan/zoom works through the map engine.
- [x] Country/area hover and click selection exist.
- [x] Selected area has a distinct visual state.
- [x] Selected area can be fit to bounds.
- [x] World-view reset exists.
- [x] World copies are disabled.
- [x] Camera motion respects reduced-motion preference.

## Routing and state

- [x] Hash routing remains static-host safe.
- [x] Hash query parameters no longer break route resolution.
- [x] Selected area can be encoded in URL state.
- [x] Camera longitude/latitude/zoom can be encoded in URL state.
- [x] Camera updates replace rather than flood browser history.

## Responsive and accessible alternatives

- [x] Desktop searchable area list exists.
- [x] Mobile expandable map sheet exists.
- [x] Area list uses the same geography as the map.
- [x] Selected area has textual metadata.
- [x] WebGL/render errors preserve non-map access.
- [x] Map and custom controls have keyboard/focus foundations.
- [x] Boundary presentation disclosure is visible.

## Build validation

- [x] application TypeScript check passes
- [x] script TypeScript check passes
- [x] U2 data checks still pass
- [x] Natural Earth build succeeds from the pinned source
- [x] generated geography check passes
- [x] Vite production build passes

GitHub Actions validated the complete U3 implementation on PR #4 on 2026-08-21. The initial runs exposed two MapLibre v6 API/type mismatches; both were corrected before this gate was marked passed.

## Deferred intentionally to U4

- unreached/reached choropleth
- frontier overlay
- evangelical percentage layer
- religion layer
- Scripture-status layer
- mission legends and data-driven color scales
- joins between U2 mission entities and map geometry

## Deployment-only checks

Desktop/mobile visual smoke testing and final Pages verification remain deployment gates once the stacked U0–U3 sequence is integrated to `main`. They do not block U4 development.
