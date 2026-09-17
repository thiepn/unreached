# Unreached Privacy Notice

**Effective / reviewed:** 17 September 2026  
**Applies to:** https://www.thiepn.dev/unreached/

Unreached is designed to work without an account. Local-only use is the default.

## What Unreached stores in your browser

Depending on the features you use, browser storage can contain:

- people you save;
- membership in your private prayer list;
- the latest `lastPrayedAt` timestamp you explicitly record for a prayer-list entry;
- private notes you write for people you have Saved or placed on your prayer list, up to 2,000 characters per note;
- up to the latest 30 prayer-memory entries created by an explicit **Record prayer today** action;
- a bounded recent-route list used for local navigation convenience;
- local sync metadata and pending mutations if you enable private continuity;
- a validated PeopleGroups.org data snapshot in IndexedDB for offline/resilience behavior;
- a session-only Cloudflare Access token in `sessionStorage` while signed in.

Clearing site data in your browser removes device-local state. Signing out or deleting server-held account data does not automatically erase local Saved/prayer data, private notes, prayer memory or recent browsing.

## Optional private continuity

Private cross-device continuity is optional. Authentication alone does not enable synchronization. The Account page requires a separate **Merge this device & enable sync** action.

When enabled, the private service may store:

- Saved-person membership and its source-backed snapshot;
- private prayer-list membership and its source-backed snapshot;
- the single latest `lastPrayedAt` value;
- item revisions and deletion tombstones;
- mutation identifiers used for safe retry/idempotency;
- an account key derived from the authenticated email by SHA-256 hashing.

The verified email claim is used transiently for authentication and account display/export responses. After the Phase 4 migration, Unreached does not intentionally persist the plaintext email address in D1; persistent identity fields contain the hash-derived user key.

The service is designed **not** to store:

- private person notes;
- prayer memory / prayer-event history;
- recent browsing history;
- prayer counts, totals, streaks, scores, rankings or completion metrics;
- guided-session history;
- the PeopleGroups.org corpus or its browser cache;
- Natural Earth geography or reviewed editorial publication data.

Private notes are personal writing. Unreached does not treat them as PeopleGroups.org/IMB facts or editorial claims.

## Authentication and service providers

Optional sign-in uses Cloudflare Access. Cloudflare processes the authentication flow under its own privacy and service terms. The Unreached Worker verifies the Access JWT before private data is read or changed. The frontend keeps the token only for the browser session rather than in persistent personalization storage.

The public application is hosted through GitHub Pages. PeopleGroups.org is contacted directly by the browser when live mission data is requested. Those external services receive normal network information such as IP address and request metadata according to their own policies.

## Analytics, advertising and tracking

Unreached does not currently implement its own analytics, advertising, profiling pixels, cross-site behavioral tracking, or prayer-performance telemetry.

This statement does not override infrastructure-level logs or security processing performed by hosting, CDN, authentication, or upstream data providers under their own policies.

## Data controls

The Account page provides controls to:

- activate or disconnect private sync;
- synchronize manually;
- export server-held private account data;
- sign out;
- delete server-held private account data.

The Saved page provides local controls to remove Saved/prayer-list membership, delete a private note, clear prayer memory, and clear recent browsing. Removing the final Saved or prayer-list relationship to a person also removes that person's private note so hidden note data is not retained without a visible return point.

Deleting the private account removes the D1 user record and associated server-held continuity records. Local browser data remains until separately cleared.

## Mission-data cache

The PeopleGroups.org snapshot cache is device-local resilience data. It is not uploaded to the private continuity service and is not exposed by Unreached as a public dataset download or API.

## Children and sensitive information

Unreached does not ask users to submit sensitive personal information about people groups or mission workers. Do not place confidential field information, personal data about identifiable people, or information that could endanger individuals or communities in private notes, repository issues, or other free-form systems.

## Changes

Material privacy changes must update this notice, the in-repository privacy architecture, and the blocking release-policy checks before deployment.

## Related documents

- [`docs/V3_PHASE11_PERSONAL_MISSION_MEMORY.md`](docs/V3_PHASE11_PERSONAL_MISSION_MEMORY.md)
- [`docs/V20_PRIVATE_CONTINUITY.md`](docs/V20_PRIVATE_CONTINUITY.md)
- [`docs/PERSONALIZATION_PRIVACY.md`](docs/PERSONALIZATION_PRIVACY.md)
- [`docs/DATA_AND_LEGAL_POLICY.md`](docs/DATA_AND_LEGAL_POLICY.md)
