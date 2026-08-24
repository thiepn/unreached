# v1.7 — Prayer Rotation & Guided Return

## Purpose

v1.6 introduced a private browser-local prayer list and an optional latest prayer timestamp. v1.7 turns those existing data into a simple return rhythm without adding prayer totals, streaks, deadlines, scores, rankings, or new tracking fields.

The release answers one practical question: **if I have several people on my prayer list, whom should I return to next?**

## Rotation rule

The prayer rotation is derived entirely from the existing personalization-v2 prayer entries.

1. Entries with no recorded prayer timestamp come first.
2. Among never-recorded entries, the oldest `addedAt` comes first.
3. Entries with a recorded prayer timestamp follow.
4. Among recorded entries, the oldest `lastPrayedAt` comes first.
5. Stable name/PEID ordering breaks exact timestamp ties.

The function is deterministic and non-mutating. It does not rewrite the stored prayer-list order.

## What the order does not mean

Rotation order is **not**:

- mission priority;
- urgency;
- importance;
- a statement that one people is more unreached than another;
- prayer faithfulness;
- a spiritual-performance metric;
- a deadline or obligation.

It is only a local continuity aid intended to keep a user from repeatedly returning to the same entry while forgetting the rest of their own list.

## Prayer page

When the private prayer list contains a current prayer-eligible PeopleGroups record in the active country scope, **People to Pray for Today** now uses the first eligible rotation entry.

If no eligible list entry is available, the existing source-backed daily selection remains the fallback.

Country filters remain authoritative for scope. A prayer-list entry outside the selected country cannot displace an eligible in-country entry.

## Saved & prayer workspace

The Prayer list now exposes a **Next return point** callout and displays the list in derived rotation order.

The stored local array itself is not reordered merely by viewing the page. The UI is a projection over existing data.

## Focused prayer continuation

After the user explicitly records prayer for a listed person, focused prayer can offer **Continue with [next person]** when another current eligible prayer-list entry exists.

The current person is excluded from this continuation lookup. Recording prayer changes only `lastPrayedAt`, so the next return point naturally advances without a counter or queue-state field.

## Persistence contract

v1.7 deliberately keeps personalization schema **v2**.

No fields are added for:

- rotation position;
- rotation score;
- urgency or priority score;
- overdue dates;
- prayer count;
- prayer streak;
- completion percentage.

The rotation is recalculated from `addedAt` and `lastPrayedAt` whenever needed.

## Release gates

`scripts/prayer/v17-check.ts` verifies:

1. package version `1.7.0`;
2. never-recorded entries precede recorded entries;
3. oldest-added ordering among never-recorded entries;
4. least-recently-recorded ordering among recorded entries;
5. stored input order is not mutated;
6. eligibility and current-person exclusion work correctly;
7. personalization schema remains v2;
8. no ranking/performance fields are persisted;
9. Prayer, Saved and focused-prayer surfaces expose the new rotation behavior and guardrails;
10. the v1.7 stylesheet is loaded.

The v1.6 capability gate is forward-compatible and continues to certify migration, local-only persistence, latest-only prayer recording, and non-gamification behavior.

## Browser certification

`tests/e2e/v17-prayer-rotation.spec.ts` verifies:

- Saved shows the correct next return point and derived card order without mutating storage;
- daily prayer uses the next eligible private rotation entry;
- country scope filters rotation correctly;
- recording prayer exposes the next eligible listed person;
- schema v2 remains in use and no rotation/priority score is created.

## Privacy and theology

Nothing in v1.7 leaves the browser beyond the existing live PeopleGroups data requests. Rotation metadata is not uploaded because there is no extra metadata to upload.

The product continues to treat prayer as Christian practice rather than engagement mechanics. A recorded timestamp is an optional memory aid, not evidence of spiritual accomplishment.
