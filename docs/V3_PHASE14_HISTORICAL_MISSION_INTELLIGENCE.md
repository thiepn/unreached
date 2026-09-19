# V3 Phase 14 — Historical Mission Intelligence

**Status:** implemented on a post-3.0 stacked branch above Phase 13; production activation remains blocked by V3 Gate D.  
**Reviewed:** 2026-09-19

## Goal

Phase 14 adds trustworthy historical context to mission-source records without pretending that Unreached possesses a historical provider archive that does not exist.

The first historical layer is a bounded, device-private observation history for the canonical PeopleGroups.org / IMB people-group-in-country record. It records distinct source states this browser actually observes over time. It does not backfill, interpolate, predict or infer earlier source values from the current record.

## Gate D remains binding

Phase 14 is stacked on Phase 13 and therefore inherits all prior V3 release gates. Engineering this capability does not certify Unreached 3.0, does not weaken the Phase 12 100-profile editorial threshold, and does not make Phase 13 or Phase 14 production-eligible before Gate D is satisfied.

## Historical evidence model

A historical observation has three independent time concepts:

- **source updated** — PeopleGroups.org `UpdatedDate`, when supplied by the provider;
- **first observed** — when this browser first saw this distinct tracked state;
- **last observed** — when this browser most recently saw the same tracked state.

These timestamps are not interchangeable.

PeopleGroups.org currently supplies `UpdatedDate` on source records, but Phase 14 does not assume the API exposes prior revisions. Consequently:

- the current source record must never be presented as evidence of an earlier state;
- a provider update date does not prove which individual field changed;
- an unchanged tracked state across a later provider update may be noted, but no hidden intermediate state is invented;
- causal explanations for changes are outside the data model unless a future separately reviewed source explicitly supplies them.

## Tracked fields

The local historical signature covers only source-backed fields already used by the canonical profile:

- product-level classification derived from source-native GSEC;
- GSEC;
- evangelical-level label;
- engagement status;
- congregation-exists label;
- church-planting label;
- population estimate;
- Bible-availability label;
- Jesus Film availability label.

Narrative descriptions, coordinates, taxonomy, editorial text, prayer state and cross-source provider data are not copied into the history ledger.

## De-duplication

Repeated page visits must not manufacture a time series.

A stable signature is calculated from the tracked fields. When the same PGID is seen again with the same signature:

- no new timeline point is created;
- `lastObservedAt` advances;
- `latestSourceUpdatedAt` may advance if the provider reports a later update date;
- the oldest source-update timestamp attached to that distinct state is retained when known.

A new timeline point exists only when at least one tracked field changes.

## Storage boundary

Phase 14 uses a separate IndexedDB database:

- database: `unreached-mission-history-v1`;
- store: `peoplegroups-observations`;
- maximum: 24 distinct states per PGID.

The ledger is:

- local to the current browser/device;
- excluded from private continuity sync;
- excluded from D1 and Worker storage;
- excluded from server-held account export;
- excluded from service-worker caches;
- not exposed through a public Unreached download or API.

Clearing browser site data removes it. The profile also exposes a reset action that discards earlier local states and retains only the current observed source state.

## PeopleGroups.org boundary

The current PeopleGroups.org API documentation was re-reviewed on 2026-09-19. The API remains the canonical public read-only runtime source and documents `UpdatedDate` for records.

Phase 14 does not create a public provider snapshot archive. The local historical ledger is a private continuity aid derived from ordinary runtime records already requested for the profile.

## Joshua Project boundary

Phase 13's Joshua Project no-store rule is unchanged.

Joshua Project comparison responses are **not** written to the Phase 14 history database, IndexedDB, localStorage, sessionStorage, D1, the service worker or the application corpus. Phase 14 therefore does not create Joshua Project historical timelines.

Any future provider-history feature would require a fresh rights/API review and must preserve source identity rather than merging providers into one series.

## User interface

The people profile gains **Source history on this device** after the canonical mission-source context and before optional cross-source comparison.

The panel explicitly communicates:

- observed history, not reconstructed history;
- current local history coverage;
- source update dates versus browser observation dates;
- exact tracked field changes between adjacent stored states;
- when a later provider update left tracked fields unchanged;
- the local reset control.

The panel does not claim direction, progress, deterioration, causality or ministry effectiveness merely because values changed.

## Certification

Phase 14 adds:

- `npm run v3:phase14-check`;
- blocking integration into `npm run build`;
- `npm run v3:phase14-visual`;
- dedicated Phase 14 GitHub Actions certification;
- desktop/mobile browser tests.

Certification verifies:

- identical observations de-duplicate;
- tracked changes create a distinct state;
- comparison reports concrete changed fields;
- the per-record cap is enforced;
- the public profile explains the observation boundary;
- local reset works;
- Joshua Project data never enters the historical ledger;
- Phase 14 storage is absent from sync and Worker code;
- the timeline remains usable without horizontal overflow on mobile.

## Explicit non-goals

Phase 14 does not:

- manufacture a pre-Phase-14 historical archive;
- run a server-side historical data warehouse;
- publish PeopleGroups.org snapshots;
- provide bulk historical export;
- persist Joshua Project responses;
- merge PeopleGroups.org and Joshua Project into one historical series;
- infer missing intermediate values;
- claim causal explanations for source changes;
- calculate a universal mission-progress score;
- weaken Phase 12, Phase 13 or Gate D requirements.
