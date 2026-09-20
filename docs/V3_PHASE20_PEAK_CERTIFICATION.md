# V3 Phase 20 — Peak Certification

**Status:** implementation complete on the final stacked V3 roadmap branch; exact-head certification is release-blocking  
**Reviewed:** 2026-09-20

## Scope

Phase 20 is the final public V3 roadmap phase.

It adds no new mission, prayer, geographic, social or sharing feature family.

Its job is to:

- simplify development-era residue;
- certify the complete data/source model;
- certify privacy/storage boundaries;
- certify visual/browser/accessibility behavior;
- certify performance budgets;
- lock approved runtime dependencies;
- close the numbered roadmap;
- define the long-term maintenance/change-control contract.

## Simplification pass

Phase 20 removes stale roadmap language from public/reference UI, including copy that described already-completed work as a future phase.

The final product should explain the atlas as a finished system, not expose the implementation roadmap to ordinary users.

## Machine-readable architecture lock

`data/v3-architecture-lock.json` freezes:

- roadmap closure;
- primary product loop/destinations;
- public/internal routes;
- source roles;
- local/private/public privacy boundaries;
- mission and prayer semantic constraints;
- localization truth;
- browser/accessibility policy;
- runtime dependency sets;
- distribution performance budgets.

`npm run v3:phase20-check` cross-checks that manifest against the actual repository.

## Data/source audit

Peak certification re-validates:

- PeopleGroups.org as canonical runtime source;
- Natural Earth as canonical geography;
- Joshua Project as optional, manually crosswalked, no-store comparison;
- ProgressBible/Ethnologue as permission/license gated;
- no static PeopleGroups corpus redistribution;
- source disagreement not averaged;
- unknown values not fabricated.

## Privacy audit

Peak certification re-validates:

- personal notes are local-only;
- prayer memory is local-only;
- recent browsing is local-only;
- private sync contains only Saved/prayer supported state;
- public church sharing contains only version/title/locale/public PEIDs;
- shared collections have no server-side persistence;
- no analytics/telemetry layer is added by Phase 20.

## Prayer/mission integrity audit

The architecture lock keeps prohibited:

- mission scores;
- priority rankings;
- prayer scores;
- prayer streaks;
- XP;
- leaderboards;
- public prayer-performance metrics.

## Accessibility/browser audit

Release-blocking browser certification remains the five-project matrix:

1. Chromium desktop;
2. Firefox desktop;
3. WebKit desktop;
4. mobile Chromium;
5. mobile WebKit.

Phase 20 adds a final browser smoke spec over:

- shell/navigation;
- World/Region/Country/People/Prayer continuity;
- Saved/private continuity;
- public shared-prayer route;
- stale roadmap-copy removal;
- representative mobile overflow/focus behavior.

Accessibility remains a build gate and the accessibility stylesheet remains the final cascade layer.

## Performance audit

Phase 20 measures the built distribution and fails on budget regression.

Baseline before the lock:

- entry JS: about 71 kB raw / 24 kB gzip;
- global CSS: about 285 kB raw / 44 kB gzip;
- route-lazy Explore bundle: about 964 kB raw / 252 kB gzip;
- MapLibre worker: about 470 kB raw.

The lock gives measured headroom without allowing MapLibre to move into the initial shell.

## Dependency audit

Runtime dependencies are explicitly enumerated in the architecture manifest.

Adding a dependency requires a lock update plus security/license/performance review.

Existing repository dependency-security workflow remains independently release-relevant.

## Roadmap closure

The public roadmap remains exactly **0–20**.

After Phase 20, do not create Phase 21/22/... for ordinary feature iteration.

Future architecture-level product additions require an explicit reviewed architecture decision.

## Gate D

Gate D remains historically binding to the stacked post-3.0 branches.

Phase 20 engineering completion does not rewrite the historical release requirement or silently promote draft stacked work.

Production/release promotion remains a separate exact-SHA decision after all applicable gates are satisfied.

## Certification commands

Phase 20 adds:

- `npm run v3:phase20-check`
- `npm run v3:phase20-dist-check`
- `npm run v3:phase20-visual`
- dedicated Peak Certification workflow
- full `npm run e2e` five-browser run in the dedicated workflow

The standard `npm run build` blocks on the Phase 20 source lock and post-Vite distribution budget.

## Exit condition

Phase 20 is complete only when the exact head passes:

- deterministic Phase 1–20/build gates;
- distribution performance budgets;
- dedicated Peak Certification;
- Unreached CI;
- dependency security/license audit;
- full repository V3 browser certification.

At that point V3 enters maintenance/architecture-lock mode rather than another numbered expansion phase.
