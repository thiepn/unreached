# Unreached 3.0 — Phase 6 Explore

**Phase:** 6 — Explore 3.0  
**Status:** implementation contract  
**Depends on:** `V3_PHASE5_SHELL_NAVIGATION_IA.md`  
**Primary surface:** `#/` / `#/explore`

---

## 1. Phase outcome

Phase 6 rebuilds Explore as the first major Unreached 3.0 product surface.

The map is now the primary workspace rather than one half of a dashboard-like screen. The page exists to answer a simple sequence quickly:

```text
Where should I look?
→ What does the map mean here?
→ Which peoples are behind this country result?
→ Where do I continue?
```

The global shell from Phase 5 is inherited unchanged.

---

## 2. Default map meaning

The default view remains:

```text
Unreached population share
```

It is calculated from PeopleGroups.org / IMB people-group-in-country records with known population and GSEC, using the existing certified mapping:

```text
GSEC 0–3 → unreached
GSEC 4–6 → other source status
missing   → unknown
```

The page presents this in normal language first:

> Share of represented population in source people-group records classified as unreached.

The UI also states that this is **not national census data**.

Phase 6 does not alter the calculation, source, classification rule, denominators, or map layer IDs.

---

## 3. Map-first desktop composition

Desktop uses:

```text
compact context rail | dominant map
```

The rail is deliberately narrow enough that geography owns most of the viewport.

It contains only:

1. a short Explore introduction;
2. current map meaning;
3. country selection context;
4. country finder/list fallback;
5. secondary source/methodology disclosure.

The map itself contains:

- world geography;
- country hover feedback;
- the active map legend;
- reset control;
- a compact current-view label;
- MapLibre zoom controls.

The page must not introduce a second dashboard header, KPI strip, or decorative map card.

---

## 4. Country selection

Selecting a country now changes Explore from abstract world statistics to a human discovery entry point.

The primary country panel shows:

- country name and geographic context when available;
- the current map result;
- unreached people groups represented;
- total people-group records represented;
- represented population with reported estimates;
- up to five of the largest unreached peoples represented in the source;
- direct continuation to the country page;
- direct continuation to prayer.

Each listed people group links to its existing people route.

Population wording remains explicitly **represented population**, not a national census or authoritative national population total.

---

## 5. People behind the map

Phase 6 adds a product-facing country brief derived from the already-loaded PeopleGroups runtime country records.

The brief exposes only the fields needed by Explore:

```text
country identity
region/subregion labels
represented population
people-group count
unreached people-group count
top unreached people:
  PEID route key
  display name
  population estimate
  language
  religion
```

`ExplorePage.tsx` does not import PeopleGroups provider DTOs directly. Provider-specific runtime records remain behind the visualization boundary.

This is a transition surface for the current runtime and does not supersede the Phase 2 canonical mission model.

---

## 6. Research detail is secondary

Normal exploration exposes two mission views:

- Unreached population share;
- Unreached people-group share.

The following remain available but are explicitly research views:

- mission-status data coverage;
- population-data coverage;
- source people-group record count.

All alternate views stay behind **Change map view**.

Detailed methodology stays behind **About this view**.

Country-level provider detail stays behind **Source breakdown**.

Raw GSEC terminology therefore remains recoverable without dominating first contact with the atlas.

---

## 7. Country finder and accessible map alternative

Interactive maps cannot be the only way to select geography.

Explore therefore keeps a keyboard-operable country finder and list using the same country selection state as the map.

The rail also links to the complete Countries destination.

Map rendering errors do not remove the country finder.

This preserves a usable path for keyboard users, low-capability browsers, WebGL failures, and users who simply know the country name they want.

---

## 8. Mobile Explore

Mobile is map-first.

The persistent desktop rail disappears. The screen contains:

```text
map
+ compact map controls
+ bottom sheet
+ Phase 5 bottom navigation
```

The bottom sheet begins as a compact country/finder summary and expands to provide:

- selected-country context;
- the current map result;
- essential country facts;
- largest unreached peoples represented;
- country/prayer actions;
- country finder;
- map-view controls;
- legend;
- methodology.

Selecting a country opens the sheet so the map action has an immediate explanatory result.

The sheet has one vertical scroll region and must not create horizontal page overflow.

---

## 9. Visual direction

Explore consumes the Phase 4 Modern Mission Atlas foundation and Phase 5 shell.

The Phase 6 stylesheet is:

```text
src/styles/atlas-foundation/explore.css
```

Rules include:

- narrow paper-toned context rail;
- dominant cartographic workspace;
- restrained map overlays;
- no large decorative cards;
- Newsreader for geographic/editorial emphasis;
- Source Sans 3 for controls/data;
- forest for product actions;
- mission layer colors only for mission semantics;
- 44px minimum controls;
- mobile bottom-sheet adaptation.

---

## 10. Preserved contracts

Phase 6 preserves:

- `unreached-population` as the default URL-compatible layer;
- all existing mission layer IDs;
- country URL state;
- map viewport URL state;
- Natural Earth geography;
- PeopleGroups.org / IMB runtime source;
- existing mission aggregation formulas;
- explicit no-data behavior;
- search/list fallback;
- MapLibre keyboard focus;
- existing country, people and prayer route URLs.

No map color or calculation is cosmetically manipulated to make a country appear more or less unreached.

---

## 11. Automated acceptance

Phase 6 adds:

```bash
npm run v3:phase6-check
npm run v3:phase6-explore-visual
```

Static certification verifies:

- Explore consumes the atlas foundation;
- the map remains the dominant workspace;
- the default layer remains `unreached-population`;
- research layers stay behind the existing map-view disclosure;
- country selection exposes human-readable facts and top unreached peoples;
- `ExplorePage` does not import provider DTOs directly;
- source breakdown and methodology remain secondary;
- mobile uses the map-first bottom-sheet composition;
- the accessibility/list fallback remains present.

Browser certification verifies:

- the map occupies most desktop width;
- one legend is visible per viewport;
- default semantics are understandable before methodology;
- Benin fixture selection reveals essential facts and people links;
- research views remain opt-in and URL-compatible;
- mobile selection opens the explanatory sheet;
- desktop and mobile Explore do not overflow horizontally;
- deterministic desktop/mobile visual evidence is captured.

---

## 12. Non-goals

Phase 6 does not redesign:

- country detail pages;
- region pages;
- people profile pages;
- global search results;
- prayer sessions;
- Saved/personal history.

It does not add new source providers, new mission classifications, new map metrics, or historical data.

---

## 13. Phase 6 acceptance criteria

- [x] map dominates the desktop Explore workspace;
- [x] default map view is a plain-language mission view;
- [x] research layers are secondary;
- [x] methodology and source breakdown are progressive disclosures;
- [x] country selection explains the map result before technical data;
- [x] country selection shows essential facts;
- [x] country selection surfaces largest unreached peoples represented;
- [x] people/country/prayer continuation paths are direct;
- [x] keyboard country finder remains available;
- [x] mobile is map-first with an explanatory bottom sheet;
- [x] selecting a country opens the mobile sheet;
- [x] mission calculation and source semantics are unchanged;
- [x] automated static/browser acceptance exists.

---

## 14. Phase 7 handoff

**Phase 7 — Regions & Countries** should now build the geographic hierarchy behind Explore.

It should:

1. define the canonical V3 region taxonomy;
2. rebuild region pages as meaningful geographic entry points;
3. rebuild country pages around human context and represented peoples;
4. preserve source-scoped mission meaning;
5. keep research tables secondary;
6. create a natural path from world → region → country → people.

Phase 7 should consume the Phase 4 visual foundation and Phase 5 shell and should not reopen the Explore layout unless a real regression is found.
