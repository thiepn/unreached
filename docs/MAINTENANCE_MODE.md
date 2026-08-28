# Unreached — Maintenance Mode

## Effective baseline

Unreached enters maintenance mode when release `v2.1.1` is published from the Phase 5 certified `main` SHA.

The product scope is frozen around **Explore → Understand → Pray**. Maintenance work protects accuracy, privacy, availability, accessibility and compatibility; it does not reopen feature expansion by default.

## Changes allowed in maintenance mode

### Release-blocking / immediate

- security or privacy fixes;
- authentication, sync or D1 integrity fixes;
- broken production deployment or service-worker fixes;
- PeopleGroups.org schema/CORS/provider-compatibility fixes;
- factual editorial corrections;
- source/licensing or attribution corrections;
- accessibility regressions;
- browser/device compatibility regressions;
- data-loss or destructive-local-state fixes.

### Routine maintenance

- dependency/security updates;
- Node/toolchain updates after certification;
- source-policy and provider-terms review-date refreshes;
- editorial current-claim re-review when `reviewAfter` is reached;
- performance fixes that preserve product behavior;
- monitoring/recovery-documentation corrections;
- test-harness reliability fixes that do not weaken assertions.

## Changes not included without reopening product development

- analytics or advertising;
- social feeds, comments or sharing networks;
- prayer streaks, scores, rankings or leaderboards;
- gamification;
- account-first onboarding;
- prayer-history collection;
- static redistribution of the PeopleGroups.org corpus;
- ProgressBible or Ethnologue integration without new permission review;
- broad AI-generated editorial publication;
- new mission-priority algorithms;
- native mobile applications;
- major visual redesigns.

A new feature release must be explicitly scoped and versioned separately rather than smuggled into a maintenance patch.

## Maintenance release rule

Every production change should:

1. use a short-lived branch and pull request;
2. preserve the pinned/reproducible dependency model;
3. pass deterministic build and Phase 1–5 policy gates;
4. pass relevant private-sync/Worker certification when those paths change;
5. pass the complete browser matrix for user-facing/runtime changes;
6. pass PeopleGroups live certification when provider/data semantics are affected;
7. deploy to Pages and pass canonical production certification;
8. keep public privacy, source and licensing statements synchronized with behavior.

## Monitoring cadence

- `Unreached Operations Health`: every six hours.
- `PeopleGroups Live Certification`: weekly plus release-triggered runs.
- `Dependency Security and License Audit`: weekly plus dependency-change runs.
- Worker production certification: main/relevant deployment changes.
- Current editorial claims: re-review by their stored `reviewAfter` dates.
- Provider terms/source-policy review: before a release when the documented review window is due or provider terms materially change.

## Incident priorities

1. **Privacy/auth/data integrity** — isolate the affected path, preserve evidence and recovery state, then fix/restore before reopening.
2. **Availability/provider compatibility** — preserve safe local/offline behavior and restore the broken dependency path.
3. **Non-destructive UI/browser regression** — fix or revert and rerun browser + production certification.

See `docs/OPERATIONS_AND_RECOVERY.md` for D1 Time Travel, rollback and detailed incident procedure.

## Governance

`.github/CODEOWNERS` declares repository ownership. Release publication is automated and exact-SHA gated.

GitHub branch protection/rulesets are external repository-administration settings. The final Phase 5 audit must record their actual state; no document or CI script may falsely report branch protection as enabled when GitHub reports otherwise.

## Release numbering

- Security/factual/compatibility corrections with no material feature expansion: patch release.
- Material user-facing feature work after explicit scope reopening: minor release.
- Breaking data/protocol/product-contract change: major release or explicitly documented migration release.
