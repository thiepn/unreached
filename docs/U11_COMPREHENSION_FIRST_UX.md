# U11 — Comprehension-First UX Redesign

## Status

U11-A, U11-B and U11-C implemented on the comprehension-first branch. U11-D and U11-E remain.

This document is intentionally separate from the historical `U11_RELEASE_GATES.md`. The earlier file remains part of the repository's prior release history.

## Governing problem

Unreached exposes rigorous mission-data semantics, but the interface previously required users to understand the data model before they could understand the people. Technical values such as GSEC, PEID, PGID, provider field labels, denominators, source coverage and map methodology competed with the actual user questions:

1. Who are these people?
2. Why are they marked unreached?
3. What few facts should I understand first?
4. What does the map actually mean?
5. How can I pray?

U11 changes the hierarchy without weakening source truth.

## Governing sequence

**Meaning → Evidence → Context → Prayer → Research**

The broader product journey remains **Explore → Understand → Pray**.

## Source-truth rules

U11 must not create precision or classifications the source does not provide.

- Categorical evangelical-presence labels remain categorical.
- Bible availability remains a raw provider availability label unless a separate normalized mapping is explicitly certified.
- Missing GSEC remains unknown.
- GSEC 4–6 is not renamed `reached`.
- PEID and PGID remain source-record identifiers and are not treated as cross-country people rollups.
- A people-group population estimate remains scoped to the source record and country context.
- Represented population and map percentages must not be described as national census data.
- Existing certified map layer IDs and URL state remain stable even when user-facing terminology changes.

## U11-A — Comprehension contract

### Canonical terminology

`src/comprehension/definitions.ts`

Defines user-facing explanations for:

- people group;
- unreached;
- GSEC;
- population estimate;
- evangelical presence;
- Bible resource status.

### Source-safe interpretation

`src/comprehension/explain.ts`

Contains narrow helpers that explain existing provider values without converting or enriching them.

### Inline help

`src/components/TermHelp.tsx`

Uses native `details` / `summary` semantics so explanations are available by keyboard, pointer and touch without hover dependence.

### Meaning components

- `MeaningSummary.tsx`
- `UnreachedExplanation.tsx`

These move human-readable meaning ahead of technical classification details.

## U11-B — People profile

The people profile now follows this hierarchy.

### 1. Identity and meaning

The hero shows:

- people-group name;
- user-facing status;
- country;
- primary language;
- one sentence explaining what the record represents;
- a primary prayer action when eligible;
- a country action.

PEID, PGID and GSEC are not shown in the hero.

### 2. Why this status?

A dedicated explanation tells the user why the record is marked unreached before displaying the exact GSEC code.

The source GSEC value remains available in a collapsed `See source classification` disclosure.

### 3. Four essential facts

Exactly four primary facts are shown:

1. population;
2. primary religion;
3. primary language;
4. Bible resource status.

No extra technical metric competes at this level.

### 4. Understand the source context

Secondary context includes the country context and exact evangelical-presence label. Provider-authored descriptions follow with explicit attribution.

### 5. Prayer

Prayer remains after basic context but is also promoted to the hero as a first-class action. The existing focused-prayer route, save behavior, local/private-sync behavior and eligibility rules remain intact.

### 6. Research on demand

Collapsed research disclosures retain:

- GSEC status and code;
- evangelical level;
- engagement status;
- congregation / church-planting fields;
- Bible and Jesus Film labels;
- PEID / PGID;
- taxonomy;
- source timestamps;
- provider attribution;
- methodology notes;
- related source records.

No research capability is deleted merely to simplify the first view.

### Browser-contract migration

Older browser tests that required PEID, PGID and GSEC in the primary profile were updated to verify the same exact semantics inside the research disclosure instead. This preserves the underlying U12C one-record source contract without reversing the comprehension-first hierarchy.

## U11-C — Explore map

The map keeps its existing analytics and URL contract but no longer presents every analytical layer as equally primary.

### Default view

The certified default remains:

`unreached-population`

User-facing name:

**Unreached population share**

Meaning shown directly in the interface:

> Shows the share of represented source population belonging to people-group records classified as unreached.

Persistent caveat:

> Based on source records with known population and mission status. Not national census data.

### Map-view hierarchy

Two mission views are presented as the normal interpretation layer:

- Unreached population share
- Unreached people-group share

Three analytical layers are explicitly labeled data/research views:

- Mission-status data coverage
- Population-data coverage
- Source people-group records

All alternatives are placed behind **Change map view** rather than competing with the default map on first sight.

### Selected-country comprehension

Selecting a country now presents:

1. the country name;
2. a plain-language explanation of the active map metric;
3. the metric value;
4. a short caveat when needed;
5. country-profile and prayer actions;
6. collapsed `Source breakdown` for people-context counts, GSEC counts, supporting coverage and denominator details.

### Map compatibility

U11-C deliberately does not change these certified IDs:

- `unreached-population`
- `unreached-contexts`
- `gsec-coverage`
- `population-coverage`
- `people-contexts`

The legacy `layer=unreached` alias still resolves to `unreached-population`, and the default layer continues to be omitted from URL state.

## Compatibility

The implementation preserves the prior Phase 9 people-profile structural journey:

`source context → provider context → prayer/save actions → provenance`

It also preserves the Phase 10 map architecture:

- one desktop map key;
- one mutually exclusive mobile map key;
- searchable country fallback;
- selected-country source breakdown as opt-in detail;
- existing live-data loading and error paths;
- existing layer IDs and URL state.

The existing runtime provider, cache behavior, offline behavior, saved-person model and prayer routes are unchanged.

## Styling

`src/styles/comprehension.css` is a semantic stylesheet loaded near the end of the application cascade but before the final accessibility layer.

The certified historical v11/v12 CSS fragments and hashed Phase 15 semantic fragments are not modified.

## Automated gates

### Static

`scripts/comprehension/u11-check.ts`

The build fails if:

- comprehension components disappear;
- technical identifiers return to the people-profile hero;
- meaning/evidence/context/prayer/research ordering regresses;
- canonical terms or source-truth guardrails disappear;
- inline term help loses native disclosure semantics;
- map mission/research hierarchy disappears;
- certified map layer IDs or URL compatibility are removed;
- the stylesheet is missing or overtakes the final accessibility layer;
- U11 browser certification is removed.

### Browser

`tests/e2e/u11-comprehension-first.spec.ts`

Certifies:

- meaning appears before identifiers;
- the people overview contains exactly four facts;
- mission terminology can be explained in place;
- prayer is immediately discoverable;
- detailed people research remains available;
- the profile has no horizontal overflow at 360 px;
- the map opens with a plain-language mission view;
- research map views remain opt-in;
- selected countries explain metrics before source breakdown;
- map layer IDs remain URL-compatible.

The prior Phase 9, Phase 10, v11 and U12C browser contracts remain active and are adjusted only where their old visible-text assumptions conflicted with the new hierarchy.

## Next implementation phases

### U11-D — Countries and peoples explorer

- limit country primary metrics to three;
- surface largest unreached peoples before research tables;
- move coverage and denominator mechanics into detailed data;
- simplify people cards and primary filters;
- retain all research data under progressive disclosure.

### U11-E — Final certification

Run the full build, full browser suite and a manual newcomer comprehension test before merge/release.
