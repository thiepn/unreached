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

The production private service runs independently from GitHub Pages at:

- backend origin: `https://unreached-private-continuity.thiepn.workers.dev`
- public health: `/unreached-sync/health`
- authenticated API: `/unreached-sync/private/*`
- Access-protected sign-in bootstrap: `/unreached-sync/private/auth/start`

The existing `www.thiepn.dev` site is not moved behind Cloudflare and no DNS migration is required.

Cloudflare Access protects the top-level sign-in bootstrap and uses the account's One-time PIN email identity provider. After a successful top-level Access login, the Worker receives `Cf-Access-Jwt-Assertion`, verifies its signature, issuer and exact Access audience, and returns the verified Access JWT to the opener at exactly `https://www.thiepn.dev`.

The frontend keeps that identity token only in `sessionStorage` under `unreached.sync.access.v1`; it is not written to persistent local personalization storage. Subsequent cross-origin private API calls send the token as `Authorization: Bearer <Access JWT>`. The Worker performs the same Access JWT verification before touching D1, so API authorization does not depend on third-party cookies.

CORS is restricted to `https://www.thiepn.dev`, allows only the required methods/headers, and does not enable credentialed cross-origin cookies. The Worker never trusts a client-supplied user ID. The normalized authenticated email is SHA-256 hashed to form the D1 user key. The verified email is used transiently for the authenticated response but, after the Phase 4 migration, D1 persistent identity fields are hash-only; the legacy compatibility column is scrubbed/enforced to the same hash value.

The public GitHub Pages application remains accountless and outside Access.

## Backend

The private service is an ES-module Cloudflare Worker with D1, deployed on the account's `workers.dev` subdomain.

D1 tables:

- `sync_users` — hash-derived account identity and global revision; the verified plaintext email is not intentionally persisted after the Phase 4 migration;
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

Disconnecting or signing out does not erase local browser personalization. Signing out clears the session-only Access token and ends the Access session separately.

Deleting the private account deletes the D1 user row and cascades all server-held items/mutation IDs. It also disconnects sync on the current device but deliberately leaves local Saved/prayer data intact unless the user separately clears browser storage.

## Deployment

Production deployment is handled by `.github/workflows/deploy-sync-worker.yml` after relevant changes reach `main`.

Required GitHub repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The API token must be able to manage D1, Workers, the account's Workers subdomain, Zero Trust/Access applications and policies, and Access identity providers.

The deployment is idempotent in intent:

1. install Worker dependencies;
2. reuse or create `unreached-private-continuity` D1 through the Cloudflare REST API;
3. discover/enable the account's `workers.dev` subdomain;
4. ensure the Zero Trust organization exists;
5. reuse or create a One-time PIN Access identity provider;
6. reuse or create the `Unreached private continuity workers.dev` Access application for the sign-in bootstrap;
7. render the generated Wrangler config with D1 ID and Access AUD;
8. generate binding types and typecheck;
9. apply remote D1 migrations;
10. deploy the Worker to workers.dev;
11. health-check the live Worker and verify the sign-in bootstrap is not anonymously usable.

No Cloudflare token, account credential, Access JWT or D1 identifier is generated into the public frontend bundle.

## Certification

v2.0 is not releasable unless all existing release gates still pass plus:

- `scripts/sync/v20-check.ts` source-policy gate;
- the five-project Playwright account/sync journeys, including bearer authorization and session-only token storage;
- isolated Worker/Wrangler generated-binding TypeScript certification;
- v1.9 offline source/dist/browser gates;
- live PeopleGroups corpus/CORS/editorial identity gates;
- post-merge GitHub Pages deployment;
- private Worker health endpoint and Access/JWT enforcement.

The v2.0 certification explicitly rejects protocol/backend references to recent history, prayer performance fields, PeopleGroups.org corpus URLs, persistent Access-token storage, cross-site-cookie dependence, or a private API that bypasses Access JWT validation.
