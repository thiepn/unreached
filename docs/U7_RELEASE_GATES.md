# U7 — Release Gates

**Phase:** Context & Why Unreached?  
**Status:** code-complete and build-validated

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

## Validation

- [x] application TypeScript check passes
- [x] script TypeScript check passes
- [x] U2–U6 checks still pass
- [x] U7 editorial schema/integrity check passes
- [x] U7 stale-claim detection passes
- [x] U7 people-profile cross-reference check passes
- [x] U7 production status/release-gate check passes
- [x] Vite production build passes

GitHub Actions CI run #86 passed on 2026-08-21 after correcting two U7 validation-interface mismatches. The fixes aligned U7 cross-reference validation with the canonical U6 `peoples` collection and `peopleGroupId` field; validation was not weakened.

## Deferred

- prayer guides and focused prayer mode (U8)
- deeper language/Scripture pages (U9)
- unified search and local personalization (U10)

## Deployment-only gate

Desktop/mobile visual smoke tests remain required after the stacked phases are integrated and deployed. They do not block U8 development.
