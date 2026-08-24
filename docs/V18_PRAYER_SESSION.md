# v1.8 — Guided Prayer Session & Rotation Review

## Purpose

v1.7 can identify the next return point in a private prayer rotation, but praying through several people still requires repeatedly leaving one focused guide and choosing the next person manually.

v1.8 adds a temporary guided session over the existing v1.7 rotation. It is intentionally a navigation layer, not a new tracking system.

## Session entry

Guided sessions start from **Saved & prayer**, where the private prayer list already lives.

Available session sizes:

- 3 people
- 5 people
- full eligible prayer list

A shorter private list is accepted naturally; a requested five-person session may contain fewer than five people when fewer current eligible records exist.

## Frozen plan

When `#/pray/session` opens after live PeopleGroups data is ready:

1. current prayer-list entries are filtered to current prayer-eligible PeopleGroups records;
2. the existing v1.7 rotation order is applied;
3. the requested session size is applied;
4. the resulting PEID route keys are copied into page-local state.

That plan is **frozen for the life of the session page**.

If the user records prayer for the current person, `lastPrayedAt` changes exactly as it did in v1.6/v1.7. That change may affect the next rotation built in a future visit, but it must not reorder the people already selected for the current session.

The session plan is discarded when the user leaves or closes the page.

## Session content

Each session stop shows:

- the current source-backed people identity;
- country context;
- the existing `whyPray` explanation;
- three compact prayer prompts from the release-certified live prayer template;
- the first relevant Scripture reference for each compact prompt;
- links to the full people profile and full focused-prayer guide.

The compact guide uses the existing two-minute `livePrayerFlow` slice only as a prompt-count selector. There is no timer and no required duration.

## Optional prayer recording

The session exposes the existing **Record prayer today** action.

It:

- writes only the existing latest `lastPrayedAt` timestamp;
- keeps personalization schema version 2;
- does not store session position or session membership;
- does not mark skipped people incomplete;
- does not create a completion event.

## Explicitly not stored

v1.8 does not add:

- session history;
- session count;
- completion percentage;
- completed-session timestamps;
- minutes prayed totals;
- prayer totals;
- streaks;
- scores;
- rankings;
- deadlines;
- overdue status;
- mission-priority values;
- spiritual-performance metrics.

## Theological and product semantics

A session is a convenience for moving through a private list. Position such as “Person 2 of 3” is navigation context only.

It must never be interpreted as:

- a requirement to finish all people;
- evidence that prayer was spiritually complete;
- evidence that one people is more urgent than another;
- a measure of faithfulness;
- a mission-priority ranking.

Users may move forward or backward without recording prayer.

## Failure behavior

If the private list is empty or no listed entry remains current prayer-eligible, the session fails gently and directs the user back to Prayer.

If live data cannot load, the existing PeopleGroups error/retry boundary is shown.

If a frozen PEID unexpectedly cannot be resolved after the plan was created, the session fails closed and asks the user to start a fresh session from current data rather than guessing identity.

## Release gate

`scripts/prayer/v18-check.ts` verifies:

1. package version `1.8.0`;
2. 3/5/full session planning follows v1.7 rotation order;
3. session planning does not mutate the stored prayer list;
4. eligibility filtering happens before the size limit is accepted as the session plan;
5. personalization remains schema v2;
6. no session/performance fields are introduced into persistent personalization source;
7. `/pray/session` resolves through the Pray route;
8. Saved exposes all three session launch sizes;
9. the session page contains frozen-plan, optional-recording, and no-session-history guardrails;
10. `v18.css` is included in the application entrypoint.

The v1.7 release gate becomes forward-compatible so v1.8 and later releases retain rotation certification rather than failing only because the package version advanced.

## Browser certification

`tests/e2e/v18-prayer-session.spec.ts` verifies:

- all three launcher sizes;
- exact three-person frozen plan order;
- current-person rendering and three compact prompts;
- no persistence mutation merely from entering a session;
- latest-only recording inside a session;
- frozen next-person behavior after recording;
- full-list session planning;
- graceful empty-list behavior.

## Data boundary

v1.8 does not change the PeopleGroups identity or mission-data contract. Live PeopleGroups.org records remain authoritative for eligibility and runtime identity. The session only arranges the user's existing private prayer-list references against current eligible live records.
