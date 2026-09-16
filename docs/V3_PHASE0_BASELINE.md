# Unreached 3.0 — Phase 0 Baseline

**Phase:** 0 — Product Reset, Scope Freeze & Baseline  
**Baseline commit:** `375be4da01239964c5623a6abd4cd7042f2fb21a`  
**Baseline version:** `2.1.5`  
**Runtime behavior change in this phase:** **none**

This document records the current product shape before V3 implementation begins. It complements the older stabilization-era `PHASE0_BASELINE.md`; it does not replace that historical document.

---

## 1. Baseline purpose

Phase 0 exists to stop open-ended iteration and establish a stable answer to four questions:

1. What is the product trying to become?
2. What currently exists?
3. Which current systems are worth preserving?
4. Which user-facing systems are explicitly scheduled for redesign rather than endless patching?

The V3 product direction is defined in [`V3_PRODUCT_CONTRACT.md`](V3_PRODUCT_CONTRACT.md).

---

## 2. Current production baseline

At the V3 baseline, Unreached is:

- a Preact/Vite browser application deployed through GitHub Pages;
- version `2.1.5`;
- powered at runtime primarily by PeopleGroups.org / IMB Global Research records;
- using Natural Earth geography;
- using source-native GSEC values, with current production treating GSEC 0–3 as `unreached`, 4–6 as `other`, and missing values as `unknown`;
- shipping twelve separately reviewed contextual profiles;
- providing local Saved/prayer tools;
- installable as an offline-capable PWA shell;
- optionally able to use private cross-device continuity through the Cloudflare Worker/D1 sync system.

The current README remains the release truth for v2.1.5 production behavior until V3 ships.

---

## 3. Current route inventory

The current router exposes these product routes:

| Route | Current implementation | V3 classification |
| --- | --- | --- |
| `#/`, `#/explore` | Explore world map | REBUILD |
| `#/peoples` | People explorer | REBUILD |
| `#/peoples/:PEID` | Contextual people profile | REBUILD |
| `#/countries` | Country catalogue | REBUILD |
| `#/countries/:ISO3` | Country profile | REBUILD |
| `#/languages` | Language catalogue | KEEP / REBUILD LATER |
| `#/languages/:ISO6393` | Language profile | KEEP / REBUILD LATER |
| `#/coverage` | Reviewed editorial coverage | DEMOTE |
| `#/pray` | Prayer landing/library | REBUILD |
| `#/pray/:PEID` | Prayer focus | REBUILD |
| `#/pray/session` | Prayer session | REBUILD |
| `#/saved` | Saved/private lists | REBUILD |
| `#/account` | Account & sync | KEEP / DEMOTE |
| `#/about` | About & sources | KEEP / SIMPLIFY |
| unknown route | Not found | KEEP |

Route compatibility is frozen during Phase 0. No current route is removed here.

---

## 4. Current navigation baseline

The shell currently presents:

### Primary navigation

- Explore
- Peoples
- Pray

### Browse/discovery menu

- Reviewed coverage
- Countries
- Languages
- About & sources

### Utilities

- global search;
- Saved;
- account/sync access;
- responsive mobile navigation.

V3 Phase 5 will simplify the visible hierarchy, but Phase 0 does not change it.

---

## 5. Technical strengths to preserve

The current repository has significantly stronger infrastructure than the visible product experience. That infrastructure is an asset.

Preserve by default:

- strict TypeScript and schema validation;
- current provider request limits and cache safety boundaries;
- prepared PeopleGroups IndexedDB snapshot behavior;
- cold/partial/live data-state handling;
- source and legal policy documentation;
- Natural Earth geography build/check pipeline;
- live mission-map aggregation checks;
- route lazy loading/preloading;
- browser-local personalization;
- optional private sync with explicit opt-in;
- service-worker/offline resilience;
- accessibility checks;
- extensive Playwright desktop/mobile browser certification;
- deterministic release and production certification workflows.

V3 should spend this technical maturity on a better product instead of replacing mature internals without evidence.

---

## 6. Baseline product problems

These are the problems V3 is explicitly designed to fix.

### 6.1 Product identity and source semantics are not fully aligned

The historic product constitution was written around a Joshua Project-oriented mission taxonomy, while current production uses PeopleGroups.org / IMB GSEC as the active source. Recent map clarification made the current semantics more honest, but the underlying V3 source strategy still requires an explicit decision.

**Owner:** Phase 1.

### 6.2 Engineering machinery leaks into the user experience

Users encounter terminology and copy concerning provider fields, denominators, GSEC, source-record coverage, release-certified templates, runtime interpolation, sync behavior, and other implementation details earlier than necessary.

Source transparency is valuable; making software internals part of the primary reading path is not.

**Owners:** Phases 5–10.

### 6.3 The map does not yet own the Explore experience strongly enough

The product is supposed to be an atlas, but controls, explanation, methodology, panels, and supporting chrome compete heavily with the map.

**Owner:** Phase 6.

### 6.4 People profiles are still closer to structured source records than definitive atlas articles

The comprehension-first work improved ordering, but V3 needs a much stronger editorial/geographic composition and significantly more reviewed context.

**Owners:** Phases 3 and 8.

### 6.5 Prayer is too catalogue-oriented

The prayer system is functionally sophisticated, but the landing experience still exposes a library/search/card model before a calm focused practice.

**Owner:** Phase 10.

### 6.6 Content depth is far behind infrastructure depth

Production currently has twelve separately reviewed contextual profiles. That is insufficient for an atlas whose value proposition is to help users genuinely understand peoples.

**Owners:** Phases 3 and 12.

### 6.7 Editorial/research administration is too visible

`Reviewed coverage` is useful internally and for research transparency, but it should not compete with normal atlas navigation.

**Owner:** Phase 5.

### 6.8 The visual implementation has accumulated historical layers

The intended "Modern Mission Atlas" direction is sound, but the repository contains many route-specific, historical, and phase-specific style layers. V3 needs a coherent new visual foundation rather than another patch pass.

**Owner:** Phase 4.

---

## 7. Existing measurement harness retained for V3

The existing baseline command remains useful:

```bash
npm run audit:baseline
```

After a production build:

```bash
npm run build
npm run audit:baseline
```

it captures:

- TypeScript/TSX source-file count;
- CSS file count and total CSS bytes;
- historical version-specific CSS files;
- production `dist/` total/JS/CSS sizes;
- JS chunks and CSS assets;
- service-worker size;
- provider request safety budgets;
- private-sync limits;
- prayer-list and people-list limits.

The older Phase 0 browser stress harness also remains available:

```bash
npm run audit:phase0
```

V3 does not discard existing regression evidence simply because the product direction is changing.

---

## 8. V3 visual baseline capture

Phase 0 adds an automated screenshot baseline so later visual work can be compared against a fixed pre-V3 state.

The V3 Phase 0 workflow builds the current app, installs Chromium, uses deterministic PeopleGroups browser fixtures, and captures desktop/mobile screenshots plus small route metadata snapshots.

### Baseline route set

- Explore
- Peoples
- People detail
- Countries
- Country detail
- Languages
- Language detail
- Reviewed coverage
- Pray
- Prayer focus
- Prayer session
- Saved
- Account
- About

### Viewports/projects

- Playwright `chromium` desktop project;
- Playwright `mobile-chromium` Pixel project.

### Artifact contents

```text
artifacts/v3-phase0/
  source/
    phase0-baseline.json
  visual/
    chromium/
      *.png
      *.json
    mobile-chromium/
      *.png
      *.json
```

The artifact is evidence, not a golden-image test. V3 is intentionally expected to look substantially different later.

---

## 9. Baseline acceptance tasks

The following tasks define the human usability baseline that later phases must improve:

1. Identify what Unreached is from the opening screen.
2. Find a country from the world map.
3. Open a people connected to that country.
4. Explain who that people is.
5. Explain why the application/source marks the people unreached.
6. Find language and Scripture/resource information.
7. Begin prayer for that people.
8. Save the people for later.
9. Return to the saved person/people without knowing provider identifiers.

Phase 12 repeats these as real usability tests after the V3 rebuild.

---

## 10. Phase 0 non-goals

Phase 0 intentionally does **not**:

- change mission values;
- change map colors or aggregation;
- switch Joshua Project or PeopleGroups source priority;
- alter navigation;
- redesign any route;
- rewrite the router;
- change storage schemas;
- modify sync behavior;
- add regions;
- add profile content;
- change prayer behavior;
- bump the production version.

If runtime behavior changes in this phase, scope has leaked.

---

## 11. Phase 0 exit criteria

Phase 0 is complete when:

- [`V3_PRODUCT_CONTRACT.md`](V3_PRODUCT_CONTRACT.md) is committed;
- [`V3_ROADMAP.md`](V3_ROADMAP.md) is committed;
- this baseline is committed;
- the current route inventory is explicitly classified;
- technical foundations to preserve are documented;
- major product weaknesses are documented with a future phase owner;
- V3 scope is frozen through Phase 12;
- the automated desktop/mobile visual baseline is captured as a workflow artifact;
- normal CI and browser certification remain green;
- production behavior is unchanged.

Only after these gates pass should Phase 1 change product architecture.
