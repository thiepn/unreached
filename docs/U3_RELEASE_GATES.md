# U3 — Release Gates

**Phase:** Global Map Foundation

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

## Validation before completion

- [ ] application TypeScript check passes
- [ ] script TypeScript check passes
- [ ] U2 data checks still pass
- [ ] Natural Earth build succeeds from the pinned source
- [ ] generated geography check passes
- [ ] Vite production build passes

## Deferred intentionally to U4

- unreached/reached choropleth
- frontier overlay
- evangelical percentage layer
- religion layer
- Scripture-status layer
- mission legends and data-driven color scales
- joins between U2 mission entities and map geometry

## Deployment-only checks

Desktop/mobile visual smoke testing and final Pages verification remain deployment gates once the stacked U0–U3 sequence is integrated to `main`.
