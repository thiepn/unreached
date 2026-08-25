# v2.0 — Optional Private Accounts & Cross-Device Continuity

## Purpose

v2.0 adds an optional private continuity layer to Unreached without changing the browser-first product into an account-first application.

Anonymous use remains the default. Explore, Peoples, Countries, Languages, Reviewed coverage, Prayer, Saved, local prayer rotation, guided prayer sessions, the installable shell, and validated PeopleGroups offline return continue to work without signing in or contacting the private-sync backend.

## Sync boundary

Only the minimum continuity state is eligible for sync:

1. Saved-person membership and the already existing source-backed saved snapshot.
2. Private prayer-list membership and its already existing identity snapshot.
3. The single latest `lastPrayedAt` timestamp for a prayer-list entry.

The following are deliberately excluded from the protocol and backend:

- recent browsing/history;
- prayer history;
- prayer counts or totals;
- streaks;
- session history or completion state;
- scores, rankings, leaderboards, deadlines, overdue state, or spiritual-performance metrics;
- the PeopleGroups.org corpus;
- the PeopleGroups IndexedDB snapshot cache;
- Natural Earth or editorial publication data.

`unreached.personal.v2` therefore remains the local personalization schema. Sync metadata lives separately in `unreached.sync.v1`.

## Explicit first activation

Authentication alone does not enable synchronization. The Account page has a separate **Merge this device & enable sync** action.

On first activation:

1. the browser reads the private server snapshot;
2. current server tombstones are applied locally;
3. active server items are merged with current local Saved/prayer entries;
4. the resulting local-only differences are converted into explicit sync mutations;
5. only then is the merged state pushed.

This avoids the dangerous pattern where signing into an empty account silently overwrites a useful local library.

## Conflict and deletion semantics

Each remote item is keyed by `(user, kind, sourcePeopleId)` and carries an item revision. Deletes are stored as tombstones rather than erased immediately.

Each client mutation contains:

- cryptographically generated `mutationId`;
- `kind` (`saved` or `prayer` only);
- `sourcePeopleId`;
- action (`upsert` or `delete`);
- `baseItemRevision`;
- the allow-listed payload when active;
- latest `lastPrayedAt` only for prayer entries.

Server mutation IDs make retries idempotent.

A server tombstone newer than an offline upsert's `baseItemRevision` wins. This prevents an old disconnected device from silently resurrecting an item deleted elsewhere. After the client receives that tombstone, intentionally adding the person again is a new current upsert based on the tombstone revision and is allowed.

Concurrent active prayer updates keep the later explicit `lastPrayedAt`; no intermediate prayer events are retained.

## Offline behavior

Private sync is additive to local behavior, not a prerequisite for it.

While offline:

- local Saved/prayer operations work normally;
- differences are retained as local pending mutations;
- no operation blocks on the backend;
- reconnect or foreground return schedules another sync attempt.

If the backend is unavailable, the Account surface reports local-only degradation while the rest of Unreached remains usable.

This does not alter the v1.9 PeopleGroups offline/cache policy or cause the service worker to cache private API responses.

## Authentication and authorization

The production private API is mounted under the same site origin:

- public health: `/unreached-sync/health`
- authenticated data: `/unreached-sync/private/*`

Cloudflare Access protects the private path. The deployment provisions/reuses a One-time PIN email identity provider and an Access self-hosted application for that path.

The Worker independently verifies the `Cf-Access-Jwt-Assertion` signature and audience before touching D1. It does not trust a client-supplied user ID. The normalized authenticated email is SHA-256 hashed to form the D1 user key.

The public GitHub Pages application is not behind Access.

## Backend

The private service is an ES-module Cloudflare Worker with D1.

D1 tables:

- `sync_users` — authenticated account identity and global revision;
- `sync_items` — Saved/prayer current state plus tombstones and item revisions;
- `sync_mutations` — per-user mutation-id idempotency ledger.

Request bodies are bounded to 64 KiB and 200 mutations. Payloads are reconstructed from a strict allow-list rather than stored directly from arbitrary client JSON.

No Cloudflare REST API is called from the Worker; D1 is used through its binding.

## Data controls

The Account page exposes:

- explicit sync activation;
- manual Sync now;
- private-data JSON export;
- Disconnect this device;
- Sign out;
- Delete private account data.

Disconnecting or signing out does not erase local browser personalization.

Deleting the private account deletes the D1 user row and cascades all server-held items/mutation IDs. It also disconnects sync on the current device but deliberately leaves local Saved/prayer data intact unless the user separately clears browser storage.

## Deployment

Production deployment is handled by `.github/workflows/deploy-sync-worker.yml` after merge to `main`.

Required GitHub repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The API token must be able to manage the Worker route/script, D1, Access applications/policies, and Access identity providers for the account/zone.

The deployment is idempotent in intent:

1. install Worker dependencies;
2. reuse or create `unreached-private-continuity` D1;
3. reuse or create a One-time PIN Access identity provider;
4. reuse or create the `Unreached private continuity` Access application;
5. render the generated Wrangler config with D1 ID and Access AUD;
6. generate binding types and typecheck;
7. apply remote D1 migrations;
8. deploy the Worker;
9. health-check `https://www.thiepn.dev/unreached-sync/health`.

No Cloudflare token is stored in source or generated into the frontend.

## Certification

v2.0 is not releasable unless all existing release gates still pass plus:

- `scripts/sync/v20-check.ts` source-policy gate;
- the five-project Playwright account/sync journeys;
- isolated Worker/Wrangler generated-binding TypeScript certification;
- v1.9 offline source/dist/browser gates;
- live PeopleGroups corpus/CORS/editorial identity gates;
- post-merge GitHub Pages deployment;
- private Worker health endpoint and Access enforcement.

The v2.0 certification explicitly rejects protocol/backend references to recent history, prayer performance fields, PeopleGroups.org corpus URLs, or a private API that bypasses Access JWT validation.
