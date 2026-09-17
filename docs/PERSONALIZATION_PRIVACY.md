# Personalization & Privacy Architecture

**Reviewed:** 17 September 2026

Unreached is local-first. Optional private continuity exists for a deliberately small subset of Saved/prayer-list state, while the more personal Phase 11 memory surfaces remain device-local.

## Browser-local state

The browser is the primary source of truth for normal use. Depending on features used, local storage can contain:

- Saved-person membership and source-backed snapshots;
- private prayer-list membership and source-backed snapshots;
- the single latest `lastPrayedAt` timestamp explicitly recorded for a prayer entry;
- private person notes, bounded to 2,000 characters each;
- up to the latest 30 explicit prayer-memory entries;
- up to the bounded recent-route limit used for navigation convenience;
- optional sync configuration, revisions and pending mutations;
- a validated PeopleGroups.org IndexedDB snapshot used for offline resilience;
- a session-only Cloudflare Access token while signed in.

The historical storage key `unreached.personal.v2` remains in use while the validated personalization payload advances to schema version 3. This preserves existing browser data and private-sync installations during migration.

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

- private person notes;
- prayer memory / prayer-event history;
- recent browsing history;
- prayer counts, totals, streaks or scores;
- session history/completion state;
- mission-priority or spiritual-performance metrics;
- PeopleGroups.org corpus/cache;
- Natural Earth geography;
- reviewed editorial publication data.

Private notes are explicitly personal writing and are never treated as PeopleGroups.org/IMB facts or editorial claims.

## Telemetry

Unreached implements no first-party analytics events, advertising trackers, profiling pixels or prayer-performance telemetry. Infrastructure providers may maintain operational/security logs under their own policies.

## Deletion boundary

Deleting private account data removes server-held continuity records but does not silently erase browser-local Saved/prayer state, notes, prayer memory or recents. Local controls can remove Saved/prayer-list membership, delete a note by saving it empty, clear prayer memory, and clear recent browsing. Clearing browser site data removes local state independently.

If the final Saved or prayer-list relationship to a person is removed, that person's private note is also removed so hidden note data is not retained without a visible return point. Prayer memory remains a separate chronological local record until the reader clears it.

See the current public notice at [`../PRIVACY.md`](../PRIVACY.md), the Phase 11 contract in [`V3_PHASE11_PERSONAL_MISSION_MEMORY.md`](V3_PHASE11_PERSONAL_MISSION_MEMORY.md), and the private-sync protocol detail in [`V20_PRIVATE_CONTINUITY.md`](V20_PRIVATE_CONTINUITY.md).
