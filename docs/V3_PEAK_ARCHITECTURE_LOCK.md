# Unreached V3 — Peak Architecture Lock

**Status:** Phase 20 long-term architecture contract  
**Lock manifest:** `data/v3-architecture-lock.json`  
**Established:** 2026-09-20

## Purpose

Phase 20 ends the numbered V3 expansion roadmap.

The architecture lock exists to keep Unreached maintainable after the feature-build sequence ends. It is not a ban on future improvement. It is a requirement that future changes preserve explicit product, source, privacy, performance and accessibility contracts unless an intentional architecture decision updates them.

The machine-readable manifest and `npm run v3:phase20-check` must agree.

## Roadmap closure

The public V3 roadmap is exactly:

**Phase 0 through Phase 20**

There is no Phase 21 in the V3 roadmap.

Future work belongs to one of these categories:

1. maintenance;
2. bug/security/privacy/accessibility fixes;
3. source/editorial refreshes;
4. performance improvements;
5. content expansion within the certified models;
6. an explicitly reviewed architecture decision for a genuinely new product capability.

Do not convert ordinary maintenance into an endless numbered roadmap.

## Product lock

The primary user loop remains:

**Discover → Understand → See the need → Pray → Remember**

Primary destinations remain:

- Explore
- Peoples
- Pray
- Search
- Saved

The normal geographic learning path remains:

**World → Region → Country → People → Context → Prayer**

Secondary/research/account routes may exist, but they do not replace this primary structure.

## Route lock

The router's current public and internal routes are enumerated in the architecture-lock manifest.

Adding a new route is allowed only when its product purpose is explicit and the lock is deliberately updated.

A new feature may not smuggle itself into the primary navigation simply because a route exists.

## Source lock

### PeopleGroups.org / IMB

Role: **canonical runtime mission source**

Requirements remain:

- runtime read, not a static public corpus mirror;
- provider attribution and provenance;
- source-native GSEC/resource semantics;
- device-local resilience cache only;
- no public bulk redistribution.

### Natural Earth

Role: **canonical product geography**

Natural Earth supplies geography and boundary presentation, not mission assertions.

### Joshua Project

Role: **optional no-store comparison**

It remains:

- manually crosswalked;
- on-demand;
- source-separated;
- non-averaged;
- non-persistent;
- visibly attributed.

### Permission-gated sources

ProgressBible registered data and Ethnologue remain blocked until compatible permission/license review explicitly changes that status.

## Mission-semantic lock

Unreached must continue to preserve these distinctions:

- identity/context;
- gospel-access evidence;
- provider classification.

The product must not create:

- a synthetic universal mission score;
- a hidden priority score;
- source averaging across incompatible methodologies;
- a ranked list of which people matter most;
- fake certainty from missing values.

Unknown remains unknown.

## Prayer lock

Prayer remains Christian, biblical and non-competitive.

Do not add:

- prayer scores;
- XP;
- streak pressure;
- leaderboards;
- public devotion metrics;
- spiritual completion percentages;
- mission urgency rankings derived from prayer behavior.

Personal prayer continuity exists to help users remember, not measure faithfulness.

## Geographic lock

Geographic precision may not exceed source precision.

Country-level evidence may not become a city pin.

Cross-country source relationships may not become a diaspora/migration claim without compatible evidence.

Sensitive ministry/worker locations are never a product target.

## Privacy lock

### Local-only

These remain device-local:

- personal notes;
- prayer memory/history;
- recent browsing.

### Optional private sync

Private sync remains limited to:

- Saved membership/supported snapshot;
- prayer-list membership/supported snapshot;
- latest supported prayer timestamp.

### Public church sharing

The public share payload remains limited to:

- version;
- intentional title;
- locale;
- public PeopleGroups PEIDs.

No personal note, prayer history, account identity or sync metadata enters a shared link.

## Localization lock

Phase 19 established English/German catalog parity for the shared-prayer domain.

The architecture lock explicitly records that **the whole application is not yet claimed to be localized**.

Future localization work must:

- preserve key parity;
- preserve placeholder parity;
- render catalog strings as text, not raw HTML;
- avoid silently translating source/provider data.

## Dependency lock

The approved runtime dependency set is recorded in the manifest.

A new runtime dependency requires:

1. an intentional architecture-lock update;
2. normal security audit;
3. license audit;
4. performance impact review.

This prevents accidental framework, analytics and SDK creep.

## Accessibility lock

Accessibility remains release-blocking.

The final accessibility stylesheet remains the last application cascade layer.

Core navigation and journeys must remain keyboard-operable and work across the certified desktop/mobile browser matrix.

## Browser lock

`npm run e2e` remains release-blocking and covers:

- Chromium desktop
- Firefox desktop
- WebKit desktop
- mobile Chromium
- mobile WebKit

Historical browser tests remain diagnostic and must not force obsolete V1/V2 UI back into V3.

Visual evidence screenshots should target the relevant component/viewport rather than ever-growing full pages when possible.

## Performance lock

Phase 20 records measured performance budgets with headroom for:

- initial entry JavaScript;
- global CSS;
- initial shell gzip;
- Explore lazy bundle;
- MapLibre CSS/worker;
- other lazy JavaScript chunks.

MapLibre/Explore remains route-lazy.

Performance budgets are guardrails against accidental regression, not goals to minify meaningful product capability away.

## Change-control procedure

When a future change intentionally needs to violate a locked field:

1. state which lock is changing;
2. explain the user/product reason;
3. update the machine-readable manifest;
4. update this document when the architecture meaning changes;
5. update deterministic/browser certification;
6. re-run security/privacy/source/licensing review when applicable.

Silent drift is not acceptable.

## Lock principle

**Maintenance may evolve the implementation. The product's factual honesty, privacy boundaries, human-first navigation and non-gamified prayer model may not erode by accident.**
