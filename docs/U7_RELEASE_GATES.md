# U7 — Release Gates

**Phase:** Context & Why Unreached?  
**Status:** implementation pending CI validation

## Editorial model

- [x] Context is stored separately from imported mission data.
- [x] Every material claim has evidence level, kind, certainty and citations.
- [x] Level B synthesis requires multiple sources.
- [x] Level C interpretation is explicitly constrained and labeled.
- [x] Current claims require `asOf` and `reviewAfter` dates.
- [x] Restricted sensitive claims cannot be published.
- [x] Published profiles require completed review metadata/checklist.
- [x] Stale current claims block published-profile validation.
- [x] Context profiles cross-check against canonical U6 people records.

## Product UI

- [x] Who are they? has a dedicated contextual section.
- [x] Religion/community context is separated from individual-belief assumptions.
- [x] Why Unreached? is dimension-based rather than monocausal boilerplate.
- [x] Claims expose fact/synthesis/interpretation labels.
- [x] Current claims expose freshness/review dates.
- [x] Editorial sources are visible separately from statistical provenance.
- [x] Editorial review tier/status is visible.
- [x] The UI includes an explicit anti-stereotype guardrail.

## Legal and safety

- [x] U7 publishes no real-world contextual profiles by default.
- [x] Synthetic editorial content is clearly fictional fixture data.
- [x] Production runtime blocks fixture context datasets.
- [x] Raw precise people coordinates remain outside the editorial display.
- [x] U0 sensitive-data and image rules remain unchanged.

## Validation required before U7 completion

- [ ] application TypeScript check passes
- [ ] script TypeScript check passes
- [ ] U2–U6 checks still pass
- [ ] U7 editorial schema/integrity check passes
- [ ] U7 stale-claim detection passes
- [ ] U7 people-profile cross-reference check passes
- [ ] U7 production status/release-gate check passes
- [ ] Vite production build passes

## Deferred

- prayer guides and focused prayer mode (U8)
- deeper language/Scripture pages (U9)
- unified search and local personalization (U10)

## Deployment-only gate

Desktop/mobile visual smoke tests remain required after the stacked phases are integrated and deployed. They do not block U8 development.
