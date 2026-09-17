# Unreached 3.0 — Phase 10 Prayer 3.0

**Phase:** 10 — Prayer 3.0  
**Status:** implementation contract  
**Depends on:** Phase 9 Search, Discovery & Collections

---

## 1. Phase outcome

Prayer 3.0 turns Prayer from a prayer-guide catalog into the clearest action step in the Unreached product loop:

**Discover → Understand → See the need → Pray → Remember**

The normal experience now begins with **one daily focus**, presents **context before prayer**, and then offers a small Scripture-shaped prayer guide. Choosing another people, maintaining a private prayer list, and praying through a rotation remain available without competing with the main daily action.

The design rule is explicit: **no streaks, scores, urgency rankings, or completion pressure**.

---

## 2. One daily focus

`#/pray` is no longer led by a large card catalog.

Its reading order is:

1. brief Prayer 3.0 purpose;
2. today’s people-group focus;
3. private continuity when the reader has chosen people to remember;
4. optional **Choose another people** disclosure;
5. source/template methodology behind disclosure.

The daily subject uses the existing source-safe behavior:

- first prefer the next currently eligible entry from the reader’s private prayer rotation;
- otherwise use the existing deterministic daily selection from current GSEC 0–3 source records;
- honor an explicit country scope such as `#/pray?country=BEN`.

Neither path is an urgency, importance, spirituality, or mission-priority ranking.

---

## 3. Context before prayer

`#/pray/:PEID` now begins with a small human-readable source context before the prayer prompts.

The normal surface can show:

- people name;
- country;
- primary language label when reported;
- primary religion label when reported;
- the source-scoped unreached status;
- the provider’s Bible-availability label when reported.

The interface states that these are source-record facts rather than descriptions of every individual.

PEID, PGID, exact GSEC code, source-update date, and other source machinery remain available in a secondary **Source record details** disclosure instead of leading the prayer experience.

---

## 4. Prayer wording remains reviewed and bounded

Phase 10 does not generate personalized prayer claims.

The existing release-certified prayer template remains authoritative:

- template version: `u12c-v1`;
- review date: `2026-08-29`;
- runtime interpolation remains limited to source-backed identity, country, GSEC, and resource fields.

`src/prayer/live.ts` now exposes an atlas-facing prayer context boundary so Prayer pages do not need to import PeopleGroups route/runtime modules directly.

This is a UI/product boundary, not a new data source or a new mission classification.

---

## 5. Focused prayer

The focused guide keeps three reader-controlled lengths:

- **Short** — 3 prompts;
- **Standard** — 5 prompts;
- **Extended** — 7 prompts.

These are content lengths, not time estimates. No timer runs and there is no completion target.

Each step continues to provide:

- one prayer prompt;
- a prayer category;
- a Scripture reference and its prayer purpose where available;
- source grounding where a prompt relies on a specific provider fact.

The reader can move backward and forward without creating progress, points, completion state, or performance data.

---

## 6. Private prayer continuity

Prayer 3.0 preserves the existing local-first prayer-list model.

A reader may:

- add or remove a people group from the private prayer list;
- optionally record that they prayed today;
- store only the latest prayer timestamp for that people group;
- continue to the next eligible private rotation entry.

The rotation remains a **return aid**. Never-recorded entries come first and then least-recently recorded entries. That ordering does not represent urgency, importance, unreachedness, worth, faithfulness, or spiritual performance.

Phase 10 creates no new persistent prayer metric.

---

## 7. Guided prayer sessions

Prayer now exposes 3-person, 5-person, and full-eligible-list session entry points directly from the Prayer surface when a private prayer list exists.

A session:

1. freezes the current eligible rotation plan when opened;
2. presents one person at a time;
3. gives a small context summary and three prayer prompts;
4. allows the same optional latest-only prayer record;
5. never reshuffles the current session after a record action;
6. is discarded when the reader leaves the page.

No session history, completion percentage, session count, score, streak, prayer-minutes total, or ranking is stored.

---

## 8. Choosing another people is secondary

The full live prayer-subject browser still exists because direct choice is useful.

It is now behind **Choose another people** on an ordinary Prayer visit. The disclosure opens automatically when a query or explicit country scope is already present.

The browser preserves:

- current source-defined prayer eligibility;
- people/country/language/PEID search;
- 24-record progressive batches;
- add/remove private prayer-list actions;
- truthful current record counts.

This demotion removes catalog pressure without deleting capability.

---

## 9. Visual direction

Phase 10 adds:

```text
src/styles/atlas-foundation/prayer.css
```

Prayer now uses the Modern Mission Atlas foundation through:

- editorial rather than dashboard-led headings;
- one dominant daily focus surface;
- fact strips for contextual source facts;
- restrained dividers and paper surfaces;
- a focused reading measure for prayer prompts;
- progressive disclosures for the subject catalog and source machinery;
- mobile single-column layouts;
- 44px minimum controls;
- the existing final accessibility stylesheet as the last cascade layer.

The three Prayer routes are now explicitly owned V3 visual migrations.

---

## 10. Compatibility preserved

Phase 10 preserves:

- `#/pray`;
- `#/pray?country=:ISO3`;
- `#/pray/:PEID`;
- `#/pray/session?size=3|5|all`;
- current PeopleGroups.org / IMB launch semantics;
- GSEC 0–3 prayer eligibility;
- route-specific people-record loading for focused prayer;
- fixed release-certified prompt wording;
- Scripture references;
- private prayer-list storage;
- latest-only prayer timestamps;
- optional Private Sync fields already allowed by the existing sync model;
- frozen session plans;
- offline/cache behavior.

---

## 11. Non-goals

Phase 10 does **not**:

- introduce a new mission source;
- create a mission urgency or priority score;
- generate person-specific factual claims with AI;
- infer local ministry or worker locations;
- create streaks, achievements, leaderboards, XP, prayer totals, or devotion scores;
- redesign the full personal-memory workspace;
- add private notes or long-term prayer history;
- create shared/social prayer activity.

The broader personal-memory experience belongs to **Phase 11**.

---

## 12. Automated acceptance

Phase 10 adds:

```bash
npm run v3:phase10-check
npm run v3:phase10-prayer-visual
```

Static certification verifies:

- the daily focus precedes the optional live catalog;
- Prayer pages consume the Prayer 3.0 boundary rather than provider imports;
- source context precedes prayer prompts;
- route-specific source details remain inspectable;
- fixed template certification is preserved;
- no-gamification copy and storage contracts remain intact;
- session launchers and frozen-plan semantics remain intact;
- Prayer 3.0 styles load before the final accessibility layer.

Browser certification verifies:

- the landing page is daily-focus first;
- private rotation becomes the next daily return point;
- context appears before focused prayer prompts;
- 3/5/7 prompt lengths remain functional;
- direct subject selection remains available on demand;
- guided sessions keep their frozen plan and optional latest-only recording;
- desktop and mobile surfaces do not overflow;
- deterministic screenshot evidence is generated.

---

## 13. Phase 11 handoff

**Phase 11 — Personal Mission Memory** should build on the now-stable Prayer 3.0 action layer.

It should make Saved the coherent long-term place for:

- saved peoples;
- the private prayer list;
- latest prayer continuity;
- private notes if introduced;
- useful personal history without converting devotion into performance analytics.
