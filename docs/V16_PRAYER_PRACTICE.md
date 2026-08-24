# v1.6 — Prayer Practice & Private Prayer List

## Purpose

v1.6 closes the gap between discovering a prayer subject and returning to that person intentionally later. The release adds a browser-local private prayer list and one optional latest-prayer timestamp without turning prayer into a quantified engagement mechanic.

The governing product principle is simple: **support remembrance, not performance**.

## User-facing behavior

### Private prayer list

From Prayer cards and focused-prayer guides, a visitor can add or remove a current GSEC 0–3 PeopleGroups.org record from a private prayer list.

The prayer-list entry stores only:

- source route PEID;
- PeopleGroups-backed entity identifier;
- people display name;
- country snapshot;
- language snapshot;
- when the entry was added;
- the latest prayer timestamp, if the visitor explicitly records one.

The list stays in browser `localStorage`. It is not uploaded, synchronized, shared, or associated with an account.

### Daily prayer preference

If the visitor has eligible people on the private list, the daily prayer selector chooses from that list first. If the list is empty, or no listed person matches an active country scope, the normal source-backed daily selector remains the fallback.

This is not ranking. It only helps the visitor return to people they intentionally chose.

### Focused-prayer recording

Focused prayer includes an optional **Record prayer today** action. It records only the latest timestamp for that person and automatically keeps the person in the private list.

The action does not create:

- prayer counts;
- streaks;
- scores;
- leaderboards;
- public activity;
- spiritual-completion metrics.

The interface describes the timestamp as a private return aid, not evidence of spiritual performance or completion.

### Saved & prayer workspace

The existing Saved route becomes a combined private workspace with three independent sections:

1. **Prayer list** — people intentionally retained for prayer;
2. **Saved peoples** — profile bookmarks;
3. **Recent** — recently opened people/country/language routes.

A person can appear in both Saved and Prayer because those actions have different meanings.

## Personalization schema v2

v1.6 upgrades local personalization from schema version 1 to version 2.

### v1

```text
savedPeoples
recent
```

### v2

```text
savedPeoples
prayerList
recent
```

The runtime first reads `unreached.personal.v2`. If it is absent, it reads `unreached.personal.v1` and migrates valid Saved/Recent data in memory with an empty prayer list. The first subsequent local change is persisted under the v2 key.

The old v1 key is not deleted automatically, preserving rollback safety and avoiding destructive migration behavior.

## Privacy and spiritual-integrity boundary

Prayer practice remains fully client-local. The personalization runtime may not call remote APIs or transmit prayer-list state.

The release intentionally avoids competitive and quantitative mechanics because prayer is not treated as a productivity score. The only prayer-history field is `lastPrayedAt`, which answers a narrow personal-remembrance question: *When did I last record praying for this person?*

No inference should be drawn from absence or presence of a timestamp about the visitor's actual spiritual life.

## Source semantics

Prayer-list snapshots do not become authoritative mission data. Opening a focused-prayer or people route still resolves the current PeopleGroups.org source record.

A stored name/country/language value is continuity metadata only. The live provider record remains authoritative for current identity, GSEC and resource fields.

## Release gate

`scripts/prayer/v16-check.ts` requires:

1. package version `1.6.0`;
2. valid v1 → v2 migration that preserves Saved/Recent data;
3. prayer-list add/remove behavior;
4. explicit latest-prayer recording with no fabricated date on add;
5. no competitive/spiritual metric fields in the personalization model;
6. no network primitives in the personalization runtime;
7. v2 storage plus v1 migration fallback;
8. Prayer-page private-list controls and daily-list preference;
9. focused-prayer recording controls;
10. Saved/prayer workspace integration;
11. v1.6 stylesheet loading.

The v1.5 editorial gate is also made forward-compatible so later minor releases certify that v1.5 capabilities remain intact rather than incorrectly requiring the package to remain exactly `1.5.0`.

## Browser certification

`tests/e2e/v16-prayer-practice.spec.ts` verifies:

- v1 Saved/Recent data survives migration;
- live prayer subjects can be added to the local prayer list;
- v2 state is persisted locally;
- prayer-list entries do not contain count/streak fields;
- daily focus prefers an eligible listed person;
- focused prayer writes only a latest timestamp;
- no competitive prayer metric appears in stored state.

## Non-goals

v1.6 does not add:

- accounts;
- cloud sync;
- social prayer activity;
- prayer requests between users;
- reminders/notifications;
- streaks or habit gamification;
- public prayer statistics;
- free-form notes that could encourage storage of sensitive ministry identities.

Those boundaries keep the feature aligned with Unreached's privacy model and editorial/prayer standard.
