# U6 — Release Gates

**Phase:** People Group Explorer  
**Status:** implementation pending CI validation

## Domain and derivation

- [x] Global people group is the canonical profile entity.
- [x] Country contexts remain separate PGIC-derived records.
- [x] Global and country populations are not conflated.
- [x] Primary language and religion resolve from normalized entities.
- [x] Profile Scripture status records an explicit basis.
- [x] Related groups use source cluster/affinity taxonomy with explicit limitations.
- [x] Field-level provenance is retained for global, language, religion and country contexts.
- [x] Raw coordinates are not exposed in the profile UI.

## Routing and discovery

- [x] `/peoples` has a dedicated browser.
- [x] `/peoples/:sourcePeopleId` has a stable profile route.
- [x] People detail routes keep Peoples navigation active.
- [x] Country tables link into global people profiles.
- [x] People profiles link back to country and map context.
- [x] Search/filter/sort logic is deterministic and typed.
- [x] Filters include status, country, religion, language, Scripture and minimum population.

## Profile UI

- [x] Identity, population, mission classification and gospel-access metrics are present.
- [x] Primary religion and language are present.
- [x] Scripture/resource status is present with basis disclosure.
- [x] Country contexts are presented as a table.
- [x] Related people are explicitly taxonomy-based.
- [x] Full field-provenance disclosure is available.
- [x] Unknown values remain visibly distinct from zero.
- [x] Mobile responsive layouts exist.

## Legal and safety

- [x] No real source-derived people dataset is published by U6.
- [x] Production people status explicitly reports the release gate.
- [x] Production runtime blocks fixture people datasets.
- [x] U0/U2 redistribution policy remains unchanged.

## Validation required before U6 completion

- [ ] application TypeScript check passes
- [ ] script TypeScript check passes
- [ ] U2 data checks still pass
- [ ] U3 geography build/check still passes
- [ ] U4 visualization check still passes
- [ ] U5 country check still passes
- [ ] U6 people derivation/filter check passes
- [ ] people status release-gate check passes
- [ ] Vite production build passes

## Deferred to later phases

- contextual/editorial `Why unreached?` analysis (U7)
- prayer guides and focused prayer mode (U8)
- deeper language and Scripture pages (U9)
- unified search, related discovery and local saved state (U10)

## Deployment-only gates

Desktop/mobile visual smoke tests remain required after the stacked phases are integrated and deployed. They do not block U7 development.
