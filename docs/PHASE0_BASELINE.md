# Phase 0 — Baseline & Regression Harness

Phase 0 is intentionally observational. It adds measurement, stress fixtures, and regression contracts without changing Unreached product behavior.

## Purpose

Every later stabilization phase must be able to answer two questions with evidence:

1. Did the change fix the targeted problem?
2. Did it make another route, device class, offline state, or user-data state worse?

The Phase 0 harness therefore records current source/build characteristics and exercises both healthy behavior and already-confirmed defects.

## Commands

### Source/build baseline

```bash
npm run audit:baseline
```

This writes `artifacts/audit/phase0-baseline.json` and reports:

- TypeScript/TSX source-file count;
- CSS file count and total CSS bytes;
- historical version-specific CSS files;
- production `dist/` size when a build already exists;
- JS chunk sizes;
- CSS asset sizes;
- service-worker size;
- PeopleGroups page/concurrency/record safety budgets;
- private-sync body/mutation limits;
- prayer-list and People Explorer visible-page limits when discoverable from source.

For a production bundle baseline, run:

```bash
npm run build
npm run audit:baseline
```

### Browser baseline

```bash
npm run audit:phase0
```

The browser harness attaches navigation/resource timing snapshots and includes stress scenarios for:

- desktop shell startup;
- 300 locally saved people;
- a full 100-entry prayer-list boundary;
- slow/unavailable first-time PeopleGroups provider access;
- compact search-control geometry.

## Known-defect contracts

The Phase 0 Playwright file also records confirmed UX defects as `test.fail(...)` expected failures. They execute, but they do not make the baseline command red while the known defect still exists.

Current expected-failure contracts include:

- skip-to-content must not mutate the hash route;
- mobile bottom navigation must allocate exactly one grid column per rendered destination;
- Back navigation must restore People Explorer search state;
- the document title must identify the active route.

When a later phase fixes one of these defects, remove its expected-failure annotation. A fixed behavior that later regresses will then fail CI normally.

## Phase 0 fixture envelope

Later phases should preserve or extend these stress boundaries:

| Scenario | Baseline fixture |
| --- | ---: |
| Saved people | 300 |
| Prayer-list entries | 100 |
| Slow provider | 1.5 s delayed failure |
| People list visible batch | source-defined baseline |
| PeopleGroups provider | source-defined page, concurrency and maximum-record budgets |
| Private sync | source-defined body and mutation limits |

Additional Phase 1 sync/concurrency fixtures will model two devices, oversized merge sets, large mutation queues, account changes, and writes made while another sync is in flight.

## Measurement policy

Phase 0 does not hard-code timing budgets yet because CI wall-clock timing is environment-sensitive. It records timing/resource output first. Phase 16 will convert stable measurements into enforceable performance budgets after the architecture has been optimized.

Correctness and structural invariants may be enforced immediately; timing budgets should use representative desktop and throttled-mobile samples rather than one CI machine measurement.

## Exit criteria

Phase 0 is complete when:

- the baseline collector is runnable from `package.json`;
- production bundle metrics can be captured after `npm run build`;
- browser timing/resource snapshots are attached by Playwright;
- large personalization and slow-provider states are reproducible;
- confirmed UX defects exist as explicit expected-failure contracts;
- the existing search-box regression has a geometry guard;
- normal CI/build behavior remains unchanged except for the addition of the optional audit commands.

Phase 0 must not fix runtime behavior. That work begins in Phase 1.
