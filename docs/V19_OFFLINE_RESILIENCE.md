# v1.9 — Offline Resilience & Cached Return

## Purpose

v1.9 closes the remaining V1 reliability gap: Unreached should remain useful after a successful prior visit even when connectivity or PeopleGroups.org is temporarily unavailable.

This release does **not** bundle or redistribute the PeopleGroups.org corpus. It adds an offline-capable application shell around the existing validated browser-local PeopleGroups cache.

## Offline application shell

The production Vite build emits `/unreached/sw.js`.

The service worker precaches only same-origin Unreached-owned production assets:

- the application HTML shell;
- hashed JavaScript/CSS/font assets emitted by Vite;
- the web manifest and icon;
- Natural Earth geography shipped by Unreached;
- reviewed editorial context shards and their manifest;
- existing local status/methodology assets.

It does not intercept, proxy, precache, or runtime-cache cross-origin PeopleGroups.org API requests.

## Mission-data boundary

PeopleGroups.org / IMB Global Research remains authoritative for live people data.

Mission records continue to live only in the existing validated IndexedDB snapshot cache after a successful runtime load. A service-worker cache is never used as a second PeopleGroups datastore.

The normal online freshness policy remains:

- up to 24 hours: fresh validated cache may be used immediately;
- after 24 hours: attempt live refresh;
- if an online refresh fails, a validated cache up to seven days old may be used as stale fallback.

### Explicit offline exception

When the browser reports that it is offline, any **fully validated complete local snapshot** may be used even when older than seven days. It is always returned as stale once older than the 24-hour freshness window and carries an explicit offline/stale warning.

This exception exists for continuity only. It does not claim the old snapshot is current.

## First offline visit

If the application shell is available offline but the browser has never completed a valid PeopleGroups corpus load, Unreached fails closed for mission-data surfaces.

The interface states that no validated PeopleGroups cache is available and asks the user to reconnect once. It does not fabricate records, silently substitute editorial data for mission data, or reinterpret saved snapshots as authoritative source records.

## Visible data provenance

The application header exposes the current mission-data state when relevant:

- **Live mission data** — current runtime load came from PeopleGroups.org;
- **Cached mission data** — a recent validated IndexedDB snapshot is being used;
- **Stale cached mission data** — a validated snapshot is being used after live freshness could not be established;
- **Offline · no mission cache** — the app shell works, but no validated mission snapshot exists yet;
- loading/unavailable states where applicable.

The status includes the local snapshot retrieval time in its accessible description/title.

## Reconnection

The PeopleGroups runtime installs one browser `online` listener.

If the active mission dataset came from cache, is stale, or previously failed to load, reconnection triggers a forced PeopleGroups refresh. A successful refresh replaces the runtime snapshot with current validated network data and the visible provenance indicator returns to **Live mission data**.

No refresh is triggered merely because the app shell is opened when mission data has not yet been requested.

## PWA installation

`site.webmanifest` remains scoped to `/unreached/` and declares standalone display behavior. It includes shortcuts for:

- Explore peoples;
- Pray;
- Saved & prayer.

PWA installation remains optional. Browser use without installation remains the primary supported mode.

## Prayer and personalization

v1.9 does not change the personalization schema.

Saved peoples, the private prayer list, prayer rotation, and guided prayer sessions remain browser-local. When a validated PeopleGroups snapshot is available offline, those features can resolve their live/source identity references from that snapshot without adding prayer-history, performance, or synchronization fields.

No accounts or cloud synchronization are introduced.

## Release gates

`scripts/offline/v19-check.ts` verifies:

1. package version `1.9.0`;
2. offline use of a fully validated snapshot older than seven days without network access;
3. explicit stale/offline provenance for that snapshot;
4. fail-closed first-offline behavior with no mission cache;
5. service-worker generation and same-origin boundary;
6. absence of PeopleGroups.org routes from service-worker source;
7. service-worker registration and reconnect refresh wiring;
8. visible live/cached/stale/offline status UI;
9. installable manifest scope/start/display contract;
10. v1.8 prayer-session gate remains forward-compatible.

`scripts/offline/v19-dist-check.ts` verifies the actual production bundle contains:

- a bounded-size `sw.js`;
- the application shell, manifest, icon, geography, and reviewed editorial manifest in the precache list;
- no PeopleGroups.org API URL in the worker;
- runtime-only publication status for mission/country/people/prayer/language source domains.

## Browser certification

`tests/e2e/v19-offline-resilience.spec.ts` verifies:

- the owned app shell and reviewed editorial coverage reopen offline;
- a previously validated PeopleGroups snapshot powers an offline people-index return;
- an offline browser with no mission cache fails clearly and safely;
- reconnecting revalidates the failed mission-data surface and returns it to live data.

These journeys run through the existing Chromium, Firefox, WebKit, mobile Chromium, and mobile WebKit certification matrix.

## Non-goals

v1.9 does not add:

- a bundled PeopleGroups corpus;
- background synchronization of prayer state;
- cloud accounts;
- service-worker caching of PeopleGroups.org;
- silent indefinite claims of data freshness;
- prayer streaks, totals, rankings, or public activity;
- a second mission-data authority.

## Release boundary

v1.9 completes the intended local-first V1 architecture. The next planned major architectural boundary is v2.0: optional private accounts and cross-device continuity, while keeping anonymous/local operation fully supported.
