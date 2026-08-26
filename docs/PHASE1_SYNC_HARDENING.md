# Phase 1 — Data-loss & Private Sync hardening

Phase 1 converts Private Sync from a best-effort continuity feature into a system with explicit data-integrity invariants. Browser-local personalization remains the primary user-facing state; remote continuity is optional and must never silently discard a newer explicit user choice.

## Non-negotiable invariants

1. **No capacity truncation.** If first activation or a later remote snapshot would make the local prayer list exceed 100 entries, sync stops with a visible error before persisting an invalid state. Entries are never silently dropped to make the schema fit.
2. **Local changes made during an in-flight request survive.** A response is reconciled against both the previous server mirror and the exact mutation batch that was sent. A newer local action is protected and rebased on the returned revision.
3. **Remote-only changes converge.** If local state still equals the previous mirror, a newer remote value is authoritative. The client must not mistake an unchanged local copy for a new mutation and accidentally resurrect remote deletions.
4. **Opposing stale server mutations lose symmetrically.** A newer tombstone blocks a stale upsert; a newer present record blocks a stale delete. Acting again after receiving the newer state uses its current revision and is treated as an intentional new action.
5. **Mutation application is atomic and idempotent.** Mutation claim, account revision, item write and ledger outcome are committed in one D1 batch transaction. Concurrent requests with the same mutation ID cannot both own the claim.
6. **Authenticated identity is checked before upload.** A device bound to one account may read the current authenticated account only to verify identity; it must send zero pending mutations when the identity differs.
7. **Authentication and device binding are separate.** The Access token remains session-only. Opening a new tab or signing out pauses a previously bound device rather than pretending sync is active or discarding the binding. Disconnecting is the explicit action that removes the binding.
8. **Queues are bounded by the real server request limits.** Every POST contains at most 200 mutations and at most 64 KiB of encoded JSON. Larger queues drain through multiple ordered batches.
9. **Storage failure does not corrupt the active session.** If localStorage is disabled or quota-limited, personalization and sync metadata use an in-memory fallback for the current tab and still publish local change events.
10. **Private protocol scope stays narrow.** Recent browsing history, prayer history/counts/streaks/scores, the PeopleGroups.org corpus, provider cache and performance telemetry never enter the sync protocol.

## Certification

`npm run sync:check` is blocking and runs both the architecture gate and deterministic Phase 1 integrity scenarios. The scenarios cover:

- a 120-person first-activation prayer union being rejected without mutation;
- an exact 100-person union succeeding;
- remote-only deletion convergence;
- a local delete made while an older pull is in flight;
- a re-add made after a delete was sent but before its response returns;
- the symmetric sent-upsert/newer-local-delete case;
- a 450-mutation queue draining through bounded batches;
- byte-constrained batching for schema-sized payloads.

Playwright additionally verifies that a differently authenticated account receives zero pending uploads and that a new tab without its session token presents a paused re-authentication state.

The dedicated Worker certification regenerates Cloudflare bindings and typechecks the Worker implementation before merge.

## Deployment order

Phase 1 is developed and certified as one branch because its browser runtime, D1 migration and Worker are a compatible unit. On merge to `main`, the Worker deployment workflow applies migrations before deploying the new Worker. The additional migration columns are nullable so the previously deployed Worker remains compatible if a deployment stops after migration but before the new Worker is published.
