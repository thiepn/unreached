# Personalization & Privacy Architecture

**Reviewed:** 28 August 2026

Unreached remains local-first, but the old statement that no account or cloud synchronization state exists is no longer true after optional private continuity was introduced.

## Browser-local state

The browser is the primary source of truth for normal use. Depending on features used, local storage can contain:

- Saved-person membership and source-backed snapshots;
- private prayer-list membership and source-backed snapshots;
- the single latest `lastPrayedAt` timestamp explicitly recorded for a prayer entry;
- up to the bounded recent-route limit used for navigation convenience;
- optional sync configuration, revisions and pending mutations;
- a validated PeopleGroups.org IndexedDB snapshot used for offline resilience;
- a session-only Cloudflare Access token while signed in.

## Optional private continuity

Private sync is opt-in and requires an explicit **Merge this device & enable sync** action after authentication.

Eligible server-held continuity is limited to:

- Saved membership/snapshots;
- prayer-list membership/snapshots;
- latest `lastPrayedAt`;
- revisions, deletion tombstones and idempotency mutation IDs;
- a SHA-256-derived account key based on the authenticated email.

The verified email is used transiently for authentication but is not intentionally persisted as plaintext in D1 after the Phase 4 hash-only identity migration.

Not synced:

- recent browsing history;
- prayer-event history;
- prayer counts, totals, streaks or scores;
- session history/completion state;
- mission-priority or spiritual-performance metrics;
- PeopleGroups.org corpus/cache;
- Natural Earth geography;
- reviewed editorial publication data.

## Telemetry

Unreached implements no first-party analytics events, advertising trackers, profiling pixels or prayer-performance telemetry. Infrastructure providers may maintain operational/security logs under their own policies.

## Deletion boundary

Deleting private account data removes server-held continuity records but does not silently erase browser-local Saved/prayer state. Clearing browser site data removes local state independently.

See the current public notice at [`../PRIVACY.md`](../PRIVACY.md) and the protocol detail in [`V20_PRIVATE_CONTINUITY.md`](V20_PRIVATE_CONTINUITY.md).
