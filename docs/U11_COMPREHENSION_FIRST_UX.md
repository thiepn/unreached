# U11 — Comprehension-First UX Redesign

## Status

U11-A, U11-B, U11-C and U11-D are implemented on the comprehension-first branch. U11-E final certification remains.

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

The people profile follows this hierarchy.

### Identity and meaning

The hero shows:

- people-group name;
- user-facing status;
- country;
- primary language;
- one sentence explaining what the record represents;
- a primary prayer action when eligible;
- a country action.

PEID, PGID and GSEC are not shown in the hero.

### Why this status?

A dedicated explanation tells the user why the record is marked unreached before displaying the exact GSEC code.

The source GSEC value remains available in a collapsed `See source classification` disclosure.

### Four essential facts

Exactly four primary facts are shown:

1. population;
2. primary religion;
3. primary language;
4. Bible resource status.

### Understand, pray, research

Secondary context includes country context and the exact evangelical-presence label. Provider-authored descriptions retain explicit attribution. Prayer remains a first-class action. Research disclosures retain GSEC, engagement fields, source resource labels, PEID/PGID, taxonomy, timestamps, attribution and methodology.

### Browser-contract migration

Older browser tests that required PEID, PGID and GSEC in the primary profile were updated to verify the same exact semantics inside the research disclosure instead. This preserves the underlying U12C one-record source contract without reversing the comprehension-first hierarchy.

## U11-C — Explore map

The map keeps its existing analytics and URL contract but no longer presents every analytical layer as equally primary.

### Default view

The certified default remains `unreached-population`.

User-facing name: **Unreached population share**.

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

Selecting a country presents the country, a plain-language explanation of the active metric, its value and caveat, country/prayer actions, then a collapsed `Source breakdown` containing people-context counts, GSEC counts, supporting coverage and denominator details.

### Map compatibility

U11-C deliberately does not change these certified IDs:

- `unreached-population`
- `unreached-contexts`
- `gsec-coverage`
- `population-coverage`
- `people-contexts`

The legacy `layer=unreached` alias still resolves to `unreached-population`, and the default layer continues to be omitted from URL state.

## U11-D — Countries and peoples explorer

### Country first view

Country profiles now begin with exactly three understandable metrics:

1. unreached people groups;
2. people groups represented;
3. known represented population.

The population tile explicitly states that the sum is not national census population.

### People before tables

A new **Largest unreached peoples represented** section appears before technical tables. It shows up to five unreached source records ranked by their reported country-context population estimate, with language and religion context.

### Visible country context

The normal reading path keeps:

- religions represented;
- major languages represented;
- Bible resource status.

Technical country details are moved into **Detailed country data & people records**.

That research disclosure retains:

- other and unknown GSEC counts;
- population and mission-status field coverage;
- the complete progressive unreached-record table;
- GSEC codes;
- evangelical-presence labels;
- PEID and PGID;
- Bible labels;
- Jesus Film labels;
- source-completeness metrics.

The prior 40-record progressive table contract remains intact.

### People explorer hierarchy

The people explorer now treats Country, Language and Religion as normal context filters rather than advanced research controls.

The advanced disclosure is limited to:

- Bible source label;
- known population threshold;
- reviewed editorial context.

The existing `gsec-asc` sort state remains URL-compatible but is labeled **Source mission status** rather than requiring users to understand GSEC terminology.

### People cards

People cards show:

- people name;
- high-level mission status;
- country;
- language;
- religion;
- population;
- Bible resource label;
- `Learn about this people`.

They no longer display GSEC, PEID or PGID. Those values remain available on the detailed profile when needed.

## Compatibility

The implementation preserves the prior Phase 9 people-profile structural journey:

`source context → provider context → prayer/save actions → provenance`

It preserves the Phase 10 map architecture:

- one desktop map key;
- one mutually exclusive mobile map key;
- searchable country fallback;
- selected-country source breakdown as opt-in detail;
- existing live-data loading and error paths;
- existing layer IDs and URL state.

It also preserves the Phase 8 and Phase 11 contracts:

- search remains the first people-discovery action;
- reach status and sort remain visible;
- filter URL state remains stable;
- country/language record tables retain progressive disclosure;
- country and language detail retain the certified one-record PEID/PGID identity semantics;
- no silent record truncation is introduced.

The existing runtime provider, cache behavior, offline behavior, saved-person model and prayer routes are unchanged.

## Styling

`src/styles/comprehension.css` is a semantic stylesheet loaded near the end of the application cascade but before the final accessibility layer.

The certified historical v11/v12 CSS fragments and hashed Phase 15 semantic fragments are not modified.

## Automated gates

### Static

`scripts/comprehension/u11-check.ts`

The build fails if:

- technical identifiers return to the people-profile hero;
- the people profile loses its four-fact hierarchy;
- map mission/research hierarchy disappears;
- certified map layer IDs or URL compatibility are removed;
- the country first view contains other than three primary metrics;
- the full country record table moves ahead of the people-first section or outside research disclosure;
- Country, Language or Religion return to the advanced people-filter panel;
- people cards expose PEID, PGID or GSEC;
- source-truth guardrails or accessibility disclosure semantics disappear;
- the comprehension stylesheet overtakes the final accessibility layer.

### Browser

`tests/e2e/u11-comprehension-first.spec.ts`

Certifies:

- meaning appears before people-profile identifiers;
- the people overview contains exactly four facts;
- mission terminology can be explained in place;
- prayer is immediately discoverable;
- detailed people research remains available;
- narrow mobile profile width does not overflow;
- the map opens with a plain-language mission view;
- research map views remain opt-in;
- selected countries explain metrics before source breakdown;
- map layer IDs remain URL-compatible;
- country profiles start with exactly three metrics and people before research tables;
- people cards hide source identifiers while normal context filters remain visible.

The prior Phase 8, Phase 9, Phase 10, Phase 11, v11 and U12C browser contracts remain active. Their assertions are changed only where old first-view assumptions conflict with progressive disclosure; underlying source semantics remain certified.

## Next phase

### U11-E — Final certification

Run the final full build, dependency/security audit and complete five-project browser matrix. Review any Playwright report rather than weakening source or comprehension contracts. A real newcomer usability test remains a separate human acceptance gate and must not be claimed from automated testing alone.
