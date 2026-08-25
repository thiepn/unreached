# v2.1 — Instant Data & Background Revalidation

**Phase:** P2.1  
**Status:** release candidate

## Goal

Make repeat mission-data visits feel immediate without weakening PeopleGroups.org validation, provenance, freshness, offline, or redistribution boundaries.

The runtime principle is:

> Render the last fully validated local snapshot first; revalidate afterward when freshness requires it.

## Prepared snapshot

The existing validated page cache remains the authoritative recovery cache. v2.1 adds a second, browser-local performance representation in the same IndexedDB database:

- database: `unreached-peoplegroups-v1`;
- page store: `pages`;
- prepared store: `prepared`;
- prepared key: `active`.

The prepared object is written only after a complete corpus has passed the existing provider schema/count/duplicate checks and after runtime contexts, entities, and country summaries have been materialized successfully.

It contains the already materialized browser representation needed by the main atlas surfaces. This avoids reopening dozens of page-cache records and rebuilding the same derived structures on every repeat visit.

The prepared snapshot is a local optimization only. It is not bundled into the application, uploaded to private sync, exposed as an API, or redistributed as a static PeopleGroups.org mirror.

## Freshness behavior

The existing freshness contract remains intact:

- up to 24 hours: prepared data may render immediately as fresh and no network refresh is required;
- 24 hours to 7 days while online: prepared data renders immediately as stale, while a full live revalidation runs in the background;
- older than 7 days while online: the prepared fast path is not accepted as the online fallback, preserving the existing maximum stale budget;
- explicitly offline: an older fully validated prepared snapshot may still support continuity with stale/offline provenance, consistent with v1.9.

A background refresh never switches a ready page back into blocking `loading` state. The runtime uses a separate `refreshing` state, so current content remains available while provider requests run.

If revalidation succeeds, the new fully materialized corpus replaces the old runtime snapshot atomically and is persisted as the next prepared snapshot. If revalidation fails while a valid snapshot is already displayed, the existing data stays usable with an explicit warning.

## Startup warming

The application shell renders first. Mission-data warming is scheduled afterward using `requestIdleCallback` when available, with a timer fallback for browsers without that API.

This means:

1. navigation and owned UI paint first;
2. the prepared local snapshot is hydrated before a corpus request when available;
3. a first-time visitor can begin background corpus preparation without blocking the shell;
4. later navigation to Peoples, Countries, Languages, Explore, Saved, or Prayer can reuse the already-warmed shared runtime.

Reconnect handling remains active and forces live revalidation after stale/offline/error states.

## Provider boundary

PeopleGroups.org API requests continue to use `cache: "no-store"`. Browser persistence happens only inside Unreached's explicit validated IndexedDB caches.

v2.1 does not introduce:

- a static PeopleGroups JSON/CSV file in the production build;
- a service-worker cache of the PeopleGroups corpus;
- a Cloudflare mirror/proxy of provider mission data;
- PEID-to-PGID inference;
- private-account synchronization of provider records or caches.

PeopleGroups.org currently documents a public comprehensive CSV download in addition to the paginated API. That file is not used by v2.1. A future cold-start optimization may evaluate it only after browser CORS, field-schema, freshness, and release-policy certification.

## Certification contract

`npm run instant-data:check` is part of the production build chain and requires:

- prepared IndexedDB storage;
- database migration from the existing page-cache schema;
- prepared snapshot validation;
- non-blocking stale-while-revalidate runtime state;
- idle startup warming;
- reconnect refresh;
- provider `no-store` semantics;
- preservation of the no-static-mirror boundary.

The browser suite additionally verifies that:

1. one validated load creates a prepared snapshot;
2. a fresh repeat visit renders from that snapshot without a PeopleGroups.org request;
3. a two-day-old snapshot remains visible while a deliberately delayed provider refresh is still unresolved.

## Expected UX

For users who already have a validated snapshot, mission-data surfaces should now feel effectively immediate. Freshness checks happen without replacing useful content with a loading screen.

A true first-ever global corpus load still depends on PeopleGroups.org's paginated API and therefore cannot be guaranteed instant in v2.1. That remaining cold-start cost is deliberately separated from the repeat-load problem so it can be optimized later without compromising the source and redistribution contract.
