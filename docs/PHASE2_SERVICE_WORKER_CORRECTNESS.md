# Phase 2 — Service-worker correctness

Phase 2 makes offline support deployment-safe. A service worker may improve resilience, but it must never pin online users to stale editorial data or break an already-open tab when a new deployment replaces hashed application chunks.

## Non-negotiable invariants

1. **Every deployment gets a content fingerprint.** The shell cache is named `unreached-shell-<16 hex>` from the emitted application bundle plus public-file contents. Editorial/geography changes therefore produce a new generation even when those files are not install-precached.
2. **No forced activation.** A newly installed worker waits while an older worker still controls open tabs. The application never calls `skipWaiting()` automatically.
3. **No forced takeover.** Activation never calls `clients.claim()`. The page that registered a first worker remains uncontrolled until the next navigation/reload.
4. **Old tabs retain their complete build.** Every emitted non-map build asset is install-precached. An old tab can therefore lazy-load an old hashed route chunk after a newer deployment has landed.
5. **Mutable public data is not install-pinned.** `data/**` and `maps/**` are excluded from the eager precache. When requested they use network-first behavior and a successful response becomes an offline fallback.
6. **Navigation is network-first.** Online navigation receives the current deployment; offline navigation falls back to the generation's cached `index.html`.
7. **Hashed assets are cache-first.** `/unreached/assets/**` is immutable for a build and can be served from its generation without revalidation.
8. **Worker-update checks bypass browser HTTP cache.** Registration uses `updateViaCache: "none"`.
9. **A waiting update is observable but not forced.** The runtime emits `unreached:offline-update-ready` when a new worker is waiting while the current page remains controlled by the old generation.
10. **External PeopleGroups data remains outside shell caching.** The service worker only handles same-origin `/unreached/` requests.

## Certification

`npm run offline:check` runs the v1.9 resilience contract plus the Phase 2 architecture gate. `npm run offline:dist` validates the actual generated `dist/sw.js`, including the fingerprinted cache name, immutable bundle precache, exclusion of `data/**` and `maps/**`, and absence of forced-activation APIs.

Playwright verifies that a first service-worker installation does not take over the already-open page and that the initial cache contains versioned build assets without eagerly loading mutable data/geography trees. Existing v1.9 browser tests continue to certify offline shell and cached runtime-data behavior.
