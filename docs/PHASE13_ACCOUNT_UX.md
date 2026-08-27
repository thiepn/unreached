# Phase 13 — Account UX

## Goal

Make optional Private Sync understandable without presenting infrastructure and maintenance controls as if they were required for ordinary use.

Unreached remains local-first. The Account page should answer three questions in order:

1. What is my current sync state?
2. Is there anything I need to do now?
3. Where are the advanced privacy, device and account controls if I need them?

## Scope

Phase 13 changes presentation, copy and interaction hierarchy only.

It does **not** change:

- the sync protocol;
- Cloudflare Access authentication;
- Worker or D1 behavior;
- mutation batching;
- reconciliation or conflict semantics;
- account binding;
- local persistence schemas;
- first-merge capacity rules.

## Account hierarchy

### 1. Local-first hero

The page now states directly that Private Sync is optional and that Unreached works locally without an account.

### 2. One status card

The existing safety-significant states remain explicit:

- Local-only mode
- Local-only by default
- Signed in · sync not enabled
- Private sync enabled
- Sync paused · sign in again
- Sync paused · different account

Pending changes, runtime errors and action notices remain visible in the status area.

### 3. One primary next step

The primary surface is state-dependent:

- service unavailable → recheck service;
- account mismatch → sign out/switch account or disconnect the device;
- linked device with no tab token → sign in again;
- signed out → optionally sign in privately;
- signed in but not enabled → explicitly merge this device and enable sync;
- enabled and authenticated → no action required; automatic sync is active.

Manual sync is no longer presented as a routine primary action.

## Progressive advanced controls

Secondary mechanics are grouped in native disclosure controls:

### What private sync includes

Shows the exact synchronization boundary:

- saved people membership and supported source-backed snapshot;
- private prayer-list membership;
- latest `lastPrayedAt` value only.

It also states what never syncs:

- Recent browsing history;
- prayer history/counts/streaks/scores/completion metrics;
- PeopleGroups.org corpus and offline provider cache.

### Account & device controls

Contains low-frequency actions such as:

- check sign-in status;
- Sync now;
- export private data;
- disconnect this device;
- sign out.

These controls are available when relevant but no longer compete with the primary state decision.

### How first merge and conflicts work

The existing capacity-safe merge and stale-conflict explanation remains available without occupying the default page hierarchy.

### Delete private account data

Deletion remains available only to the correctly authenticated account and is isolated in its own destructive disclosure. Existing confirmation and local-data-retention behavior is unchanged.

## Cross-app privacy-copy correction

Prayer and My lists previously contained browser-only wording that became inaccurate after optional Private Sync was introduced.

Phase 13 now states consistently that:

- supported Saved/prayer data is local by default;
- explicitly enabling Private Sync can copy only the supported private fields to the user's account;
- Recent browsing never syncs;
- no prayer performance or mission-priority metrics are created.

## Safety invariants retained

The existing Phase 1 sync tests and architecture gates remain authoritative. In particular:

- a mismatched authenticated account receives no pending uploads;
- a new tab without its session token pauses the existing binding rather than pretending sync is active;
- export and deletion are unavailable during account mismatch;
- first activation remains an explicit merge;
- disconnect/sign-out/delete never silently erase browser-local Saved or prayer data.

## Certification

### Static production gate

`scripts/sync/phase13-account-check.ts` verifies:

- state-dependent next-step hierarchy exists;
- advanced controls are disclosure-based;
- mismatch/reauth/merge/export/disconnect/delete actions are retained;
- the duplicate “I finished signing in” primary action is gone;
- the old equal-weight Account grid is gone from the page;
- sync-aware Prayer and My lists privacy copy is present;
- Phase 13 styling is loaded.

The gate is wired into `npm run sync:check` and therefore the blocking production build.

### Browser certification

`tests/e2e/phase13-account-ux.spec.ts` verifies:

1. Local-only mode presents one primary optional sign-in action and keeps technical detail closed.
2. A signed-in but unsynced account makes explicit first merge primary while export/sign-out/delete stay secondary.
3. Enabled sync presents automatic sync as the normal state while manual controls remain available in disclosure.
4. The Account page has no horizontal overflow at a 390px viewport.

The existing Phase 1 browser suite continues to certify account mismatch and missing-session-token behavior.

## Exit criterion

Phase 13 is complete when the Phase 12 base is merged, Phase 13 production CI and browser certification pass, and the Phase 13 PR is merged to `main` without changing sync protocol or persistence semantics.
