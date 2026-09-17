# Unreached 3.0 — Phase 11 Personal Mission Memory

Phase 11 completes the final step of the core V3 loop:

**Discover → Understand → See the need → Pray → Remember**

The product role of Saved is **Remember**. It is a private return layer for people a reader wants to revisit, not an engagement dashboard and not a measure of spiritual activity.

## Product contract

The `#/saved` surface contains four distinct forms of personal continuity:

1. **Saved peoples** — deliberate bookmarks for profiles the reader wants to return to.
2. **Prayer list** — people the reader personally chose as prayer return points.
3. **Prayer memory** — a small chronological record created only when the reader explicitly uses **Record prayer today**.
4. **Recently viewed** — short local navigation history for people, countries and languages.

**Saved is not Prayer.** Saving a profile does not imply prayer intent. Adding a person to the prayer list does not imply that the profile is bookmarked. These meanings remain separate in storage and UI.

## Private notes

A reader can attach a private note to a person who is currently Saved or in the prayer list.

- Notes are **device-local**.
- A note is personal writing, never part of the sourced people profile or editorial corpus.
- The maximum note length is **2,000 characters**.
- Saving an empty note deletes it.
- If the final Saved/prayer-list relationship to a person is removed, that person's note is deleted rather than leaving hidden note data behind.
- Notes do not enter Private Sync in Phase 11.

This boundary prevents personal observations from being confused with PeopleGroups.org/IMB source claims.

## Prayer memory

Prayer memory is deliberately small and non-competitive.

- It records only an explicit **Record prayer today** action.
- It retains at most the latest **30** recorded moments on the device.
- Each entry keeps only the small people snapshot needed to identify the return point and the recorded time.
- The reader can clear the complete prayer-memory list from Saved.
- It is not synchronized by Private Sync.
- It does not calculate totals, streaks, completion rates, scores, targets, urgency, rankings, or public activity.

The existing prayer-list `lastPrayedAt` value remains useful for rotation ordering and may optionally sync. That single latest timestamp is not treated as prayer analytics.

## Recently viewed

Recent browsing remains a bounded local navigation aid. It is not uploaded by Private Sync. The reader can clear it from Saved.

## Persistence and migration

The personalization state advances from schema version 2 to schema version 3 by adding:

- `personalNotes`
- `prayerMemory`

Existing version-2 and version-1 browser data migrate without inventing any note or prayer-history entries.

For backward compatibility, the storage key remains `unreached.personal.v2`. The key name is historical; changing it would strand existing local data and established private-sync installations. The parsed state version is authoritative.

## Private Sync boundary

Phase 11 does **not** expand the private backend protocol.

The existing optional sync boundary remains:

- Saved membership and supported saved snapshot;
- prayer-list membership and supported prayer snapshot;
- latest recorded prayer timestamp.

The following remain device-local and are not serialized into sync reconciliation:

- private notes;
- prayer memory;
- recent browsing.

This keeps the most personal material local while preserving the existing optional continuity layer for stable list membership.

## Visual hierarchy

Saved is now a Modern Mission Atlas surface rather than a utility dashboard.

- A restrained editorial masthead explains the purpose and privacy boundary first.
- Saved and Prayer are visually separate sections with their own explanation.
- Notes live inside the relevant people cards instead of becoming a detached notes app.
- Prayer memory reads as a chronological return trail, not a stats panel.
- Recent browsing stays collapsed and secondary.
- Desktop and mobile controls retain the V3 44 px interaction target and final accessibility layer.

## Data deletion

Phase 11 exposes deletion at the same place the data is understood:

- remove a Saved bookmark;
- remove a prayer-list entry;
- clear a note by saving it empty;
- clear all local prayer memory;
- clear recent browsing.

Removing a Saved bookmark or prayer-list entry does not rewrite source data. Prayer memory is independent historical continuity until explicitly cleared.

## Non-goals

Phase 11 does not add:

- public profiles or social prayer activity;
- prayer streaks, scores, totals, achievements, badges or leaderboards;
- mission-priority scoring;
- AI interpretation of private notes;
- collaborative notes;
- syncing of notes, prayer memory or recents;
- a new mission source or classification system.

## Verification

The blocking Phase 11 gate certifies:

- version-2 → version-3 migration;
- bounded notes and prayer memory;
- explicit note/history deletion;
- Saved/Prayer semantic separation;
- unchanged Private Sync scope;
- no provider import in the Saved product surface;
- Modern Mission Atlas styling and responsive behavior;
- deterministic desktop/mobile browser journeys.

## Phase 12 handoff

**Phase 12 — Content Expansion + 3.0 Certification** is the next and final pre-3.0 phase. It should not add another product subsystem. Its job is to expand reviewed content toward the release target, run the complete V3 product/data/accessibility/offline/browser/security certification, fix remaining release blockers, and determine whether Unreached 3.0 is ready to ship.
