# U5 — Release Gates

**Phase:** Country Explorer  
**Status:** implementation pending CI validation

## Routing and navigation

- [x] `/countries` has a dedicated country index.
- [x] `/countries/:ISO3` has a stable country detail route.
- [x] Country detail routes keep Countries navigation active.
- [x] Country pages can link back to the corresponding map area.
- [x] Map selection can link into a country page when a standard ISO3 exists.

## Country intelligence

- [x] Country identity and geography are available independently of mission data.
- [x] Mission summary reuses U4 aggregation rather than recalculating it in the page.
- [x] Country population and represented people-group population are distinguished.
- [x] People groups are ranked deterministically by population, then name.
- [x] Largest unreached peoples can be presented from the ranked rows.
- [x] Language aggregation exists.
- [x] Religious aggregation exists and is labeled as derived from people-group records.
- [x] Scripture-status distribution exists.
- [x] Coverage indicators remain explicit.
- [x] Source IDs remain attached to country records.

## Legal and safety

- [x] No real source-derived country dataset is published by U5.
- [x] Production country status explicitly reports the release gate.
- [x] Production runtime blocks fixture country datasets.
- [x] U0/U2 redistribution policy remains unchanged.

## Validation required before U5 completion

- [ ] application TypeScript check passes
- [ ] script TypeScript check passes
- [ ] U2 data checks still pass
- [ ] U3 geography build/check still passes
- [ ] U4 visualization check still passes
- [ ] U5 country derivation check passes
- [ ] country status release gate check passes
- [ ] Vite production build passes

## Deferred to later phases

- full people-group profile routes (U6)
- editorial `Why unreached?` explanations (U7)
- country and people prayer content (U8)
- deeper language pages and resource integration (U9)
- global search and saved/local personalization (U10)

## Deployment-only gates

Desktop/mobile visual smoke tests remain required after the stacked phases are integrated and deployed. They do not block U6 development.
