# U8 — Release Gates

**Phase:** Prayer Experience  
**Status:** implementation pending CI validation

## Prayer model

- [x] Prayer content is stored separately from imported mission statistics.
- [x] Prayer profiles join to canonical U6 people groups.
- [x] Contextual prayer claims join to reviewed U7 context claims.
- [x] Guides contain 4–7 prompts and at least four categories.
- [x] Gospel plus believers/church coverage is required.
- [x] Biblical/contextual/mixed grounding rules are explicit.
- [x] Scripture references record application purpose without copying verse text.
- [x] Current prompts have freshness dates.
- [x] Restricted sensitive prompts cannot be published.
- [x] Published guides require complete review metadata/checklist.

## Product UI

- [x] `/pray` is a dedicated prayer hub.
- [x] `/pray/:sourcePeopleId` is a stable focused-prayer route.
- [x] People profiles expose Pray for this people when a reviewed guide exists.
- [x] Country pages link to country-scoped prayer-ready peoples.
- [x] People to Pray for Today is deterministic.
- [x] Focused mode supports 2/5/10-minute pacing.
- [x] Prompt navigation works without a completion score.
- [x] Scripture references accompany relevant prompts.
- [x] No XP, streaks, leaderboards or prayer scoring are implemented.

## Legal and safety

- [x] U8 publishes no real-world prayer dataset by default.
- [x] Synthetic prayer content is fixture-only.
- [x] Production runtime blocks fixture prayer datasets.
- [x] U0 sensitive-person/location rules remain unchanged.

## Validation required before U8 completion

- [ ] application TypeScript check passes
- [ ] script TypeScript check passes
- [ ] U2–U7 checks still pass
- [ ] U8 prayer schema/integrity check passes
- [ ] U8 people/context cross-references pass
- [ ] U8 deterministic daily selection check passes
- [ ] U8 2/5/10-minute flow checks pass
- [ ] U8 production status/release-gate check passes
- [ ] Vite production build passes

## Deferred

- deeper language and Scripture pages/resources (U9)
- unified search, local saved prayer list and recent exploration (U10)
- full release hardening and public data expansion (U11)

## Deployment-only gate

Desktop/mobile visual smoke tests remain required after the stacked phases are integrated and deployed. They do not block U9 development.
