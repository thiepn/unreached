# Unreached 3.0 — Phase 8 Definitive People Profile

**Phase:** 8 — Definitive People Profile  
**Status:** implementation contract  
**Depends on:** Phase 7 Regions & Countries

---

## 1. Phase outcome

Phase 8 turns the people route into the central understanding surface of Unreached 3.0.

The profile is no longer a source-record page followed by a disconnected editorial panel. It is one coherent atlas article that combines:

- geographic identity;
- source-grounded people-group facts;
- mission classification and its meaning;
- reviewed editorial context when it exists;
- an explicit source-only fallback when it does not;
- evidence and citations;
- prayer continuation;
- saving/private continuity;
- deeper source and methodology disclosure.

The intended journey is:

```text
World → Region → Country → People → Context → Prayer
```

---

## 2. One profile, not stacked products

Before Phase 8, the route rendered the live people profile and then appended `EditorialContextPanel` as a second article below it.

Phase 8 removes that split. `PeopleContextualPage` remains only as a lazy-route compatibility wrapper. `PeoplePage` owns the entire profile composition.

This matters because editorial depth is now part of the meaning of the profile rather than an optional-looking attachment.

---

## 3. Editorial depth is explicit

The Phase 3 editorial tiers now become visible product behavior.

### Reviewed

A reviewed profile can show:

- reviewed contextual sections;
- claim-level evidence;
- source links;
- interpretation notes;
- review metadata;
- reviewed/template prayer prompts;
- explicit research gaps.

### Enhanced

Enhanced profiles use the same structure but are labeled as curated rather than fully reviewed.

### Source

When no reviewed/curated article exists, the route creates a **source profile** from the current people record.

A source profile:

- shows structured source facts;
- may show explicitly attributed provider description text;
- does not manufacture cultural/history/religion/gospel-access narrative;
- states that reviewed editorial context is not yet published;
- contains no fake editorial citations or prayer prompts.

The profile must never imply that source-only and reviewed content have equal research depth.

---

## 4. Canonical editorial runtime

Phase 8 activates the Phase 3 canonical editorial model in the browser through:

```text
src/editorial/runtime.ts
```

The runtime:

1. reads the existing reviewed editorial publication status;
2. reads its manifest;
3. fetches reviewed shards;
4. converts each legacy V2 context package through `adaptLegacyContextPackageToV3Editorial`;
5. exposes canonical `EditorialProfile` objects keyed by verified PEID;
6. preserves the profile shard path used by the migration adapter.

This is a migration bridge, not a new editorial truth source.

---

## 5. People source boundary

The people route no longer imports PeopleGroups provider modules directly.

The transitional launch boundary is:

```text
PeopleGroups runtime
      ↓
src/peoples/profile.ts
      ↓
PeoplePage
```

`src/peoples/profile.ts` exposes the route record, corpus relationships, provider description, taxonomy, resource breakdown and attribution needed by the page.

This retains the current PeopleGroups/IMB launch semantics without forcing future people-profile UI to depend directly on provider DTO modules.

---

## 6. Geographic identity

The profile breadcrumb completes the Phase 7 hierarchy:

```text
World → Region → Country → People
```

The region comes from the canonical Phase 7 Natural Earth geography taxonomy, not a PeopleGroups free-text region field.

Country context remains the specific country of the source record.

The breadcrumb therefore describes the product geography while provider geography remains source context.

---

## 7. Profile reading order

The normal profile order is:

1. **identity and status**;
2. **four source facts** — population estimate, religion, language, Bible-resource label;
3. **mission meaning** — why the record is currently classified as unreached/other/unknown;
4. **source context** — country context and evangelical-presence label;
5. **provider description**, explicitly attributed when present;
6. **reviewed/curated/source editorial depth**;
7. **prayer/save action**;
8. **related source records**;
9. **technical source and methodology disclosure**.

The route does not begin with PEID, PGID, GSEC codes or source machinery.

---

## 8. Reviewed editorial article

`DefinitiveEditorialProfile` renders canonical Phase 3 editorial sections as an atlas article rather than a card dashboard.

Each section has:

- a section key/heading;
- readable editorial body;
- optional evidence disclosure;
- the claims supporting the section;
- evidence level and certainty;
- interpretation notes when needed;
- direct source links.

The main reading surface stays concise. Claim machinery appears only when the reader asks for evidence.

Research gaps are disclosed rather than filled with generated prose.

---

## 9. Prayer transition

Reviewed editorial profiles can expose prayer prompts whose basis is tied back to reviewed claims.

The profile labels this section:

> Pray from what is actually known.

This keeps prayer context connected to documented evidence without treating a people group as a project, score, urgency ranking or stereotype.

The existing focused prayer route remains the primary action for current source records classified as unreached.

Profiles outside that source-defined prayer flow can still be saved and researched, but do not receive a false prayer-eligibility CTA.

---

## 10. Source truth

Phase 8 changes no mission formula.

The following remain unchanged:

- PeopleGroups.org / IMB launch source;
- GSEC 0–3 → source-scoped `unreached`;
- GSEC 4–6 → compatibility `other` / V3 `not-unreached` semantics;
- missing GSEC → unknown;
- population values remain source record estimates;
- Bible/Jesus Film values remain provider availability labels;
- repeated people names are not automatically merged across countries;
- technical source identifiers remain available in research disclosure.

---

## 11. Visual composition

Phase 8 adds:

```text
src/styles/atlas-foundation/people-profile.css
```

The profile uses the Phase 4 Modern Mission Atlas system:

- large editorial identity typography;
- restrained status labeling;
- fact strips rather than a card wall;
- readable long-form measure;
- section dividers rather than floating surfaces;
- evidence behind disclosure;
- action surface only where action requires a bounded component;
- responsive single-column mobile flow;
- 44px interaction targets and final accessibility-layer ownership.

The Phase 4 migration guard now allows `PeoplePage.tsx` in addition to the routes already owned by Phases 6–7.

---

## 12. Compatibility

Phase 8 preserves:

- `#/peoples/:PEID` URLs;
- positive numeric deep-link validation;
- single-record PeopleGroups route loading and caching;
- people explorer links;
- country → people links;
- prayer routes;
- Saved/private personalization behavior;
- related-source-record logic;
- source methodology and raw resource labels;
- one application `<main>` landmark.

The old `EditorialContextPanel` remains available for legacy/internal uses but is no longer appended to the normal people route.

---

## 13. Automated acceptance

Phase 8 adds:

```bash
npm run v3:phase8-check
npm run v3:phase8-people-visual
```

Static certification verifies:

- the people route uses the people boundary rather than provider imports;
- canonical Phase 3 editorial profiles are loaded at runtime;
- source-only fallback is explicit and contains no fabricated editorial depth;
- reviewed content has claim/source evidence affordances;
- the geographic breadcrumb uses Phase 7 region identity;
- editorial depth precedes action;
- research/source machinery remains secondary;
- the old appended editorial panel is removed from the route;
- the V3 profile stylesheet is loaded before the canonical accessibility layer.

Browser certification verifies:

- source-only profiles are visibly labeled;
- the existing reviewed Fon profile becomes one cohesive article;
- evidence and editorial sources remain inspectable;
- contextual prayer prompts appear only for reviewed editorial context;
- World → Africa → Benin → People continuity;
- source identifiers remain hidden from the hero and available in research disclosure;
- prayer eligibility is unchanged;
- mobile does not overflow;
- deterministic desktop/mobile screenshots are produced.

---

## 14. Non-goals

Phase 8 does **not**:

- create new reviewed profiles;
- redesign the Peoples index/search experience;
- activate Joshua Project or another source;
- create universal cross-country ethnicity identity;
- normalize Scripture translation completeness;
- add historical source snapshots;
- redesign the prayer route;
- add notes/history/private-memory UX;
- add new mission ranking or urgency scores.

Those belong to later phases.

---

## 15. Gate B

With Phases 4–8 complete, the definitive people profile now lives inside the final V3 visual shell, map experience and geographic hierarchy.

This satisfies the structural purpose of **Gate B**: later search, prayer and personal-memory work can point at one stable people destination rather than another temporary profile implementation.

---

## 16. Phase 9 handoff

**Phase 9 — Search, Discovery & Collections** should now make this definitive people profile the canonical destination for discovery.

Phase 9 should:

1. unify search across people, countries, regions and languages;
2. distinguish reviewed profiles from source-only profiles without treating reviewed coverage as importance;
3. reduce filter overload;
4. add useful guided collections without mission-priority scoring;
5. preserve the World → Region → Country → People path while supporting direct jumps;
6. keep the definitive profile URL stable.
