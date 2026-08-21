# U4 — Release Gates

**Phase:** Mission Visualization Engine  
**Status:** implementation pending CI validation

## Aggregation and semantics

- [x] Five mission layer IDs are stable and typed.
- [x] Unreached share excludes unknown classifications from its denominator.
- [x] Frontier share excludes unknown frontier flags from its denominator.
- [x] Evangelical percentage is population-weighted with explicit coverage.
- [x] Primary religion is population-weighted and described as a derived category.
- [x] Scripture map status uses a population-weighted median category.
- [x] Missing data remains distinct from zero.
- [x] Every layer has a neutral No-data state.
- [x] Country summaries retain source IDs and methodology version.

## Browser engine

- [x] Country mission summaries join to Natural Earth by ISO3/admin A3 without fuzzy matching.
- [x] All five layers have data-driven map colors.
- [x] Active layer is URL-persisted.
- [x] Legends exist for every layer.
- [x] Layer methodology is available in the interface.
- [x] Country hover readout exposes the active metric.
- [x] Selected-country panel exposes metric and coverage.
- [x] Searchable country list exposes textual layer values when data is available.
- [x] Mobile layer controls and legends exist.
- [x] Source attribution has a browser slot independent from Natural Earth attribution.

## Legal and safety gates

- [x] Production runtime refuses fixture mission datasets.
- [x] No real Joshua Project-derived browser dataset is committed by U4.
- [x] Current production status explicitly marks mission data unavailable.
- [x] U0/U2 public redistribution gate remains unchanged.

## Validation required before U4 completion

- [ ] application TypeScript check passes
- [ ] script TypeScript check passes
- [ ] U2 data checks still pass
- [ ] U3 geography build/check still passes
- [ ] synthetic visualization aggregation check passes
- [ ] all five synthetic layer checks pass
- [ ] geography join/no-data checks pass
- [ ] Vite production build passes

## Deferred to U5+

- full country intelligence pages
- country-level people-group rankings and narratives
- people-group profiles
- prayer content
- real mission-data publication pending source permission

## Deployment-only gates

Desktop/mobile visual smoke tests remain required after the stacked phases are integrated and deployed. They do not block U5 development.
