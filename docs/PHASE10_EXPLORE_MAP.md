# Phase 10 — Explore/map simplification

Phase 10 reduces the Explore screen to one primary map task: choose one mission view, inspect one country, and continue to the country profile when deeper records are needed.

## Interaction hierarchy

1. **Choose one map view** — the existing PeopleGroups.org visualization layers remain available through one compact selector.
2. **Read one map key** — desktop shows a single key over the map; mobile shows a single key inside the map sheet. The previous duplicate sidebar/floating/mobile legends are removed.
3. **Find or select a country** — country search is always available in the desktop sidebar and in the expanded mobile sheet.
4. **Inspect the active metric** — the selected country's current-layer value is visible immediately.
5. **Open deeper detail only when needed** — supporting source counts, methodology, and source/boundary notes use disclosures.
6. **Continue to the country profile** — the country-profile action remains the route to underlying people-group records.

## Scroll contract

### Desktop

The Explore sidebar itself is fixed to the available viewport and does not scroll. The country result list is the only vertical scrolling region inside the sidebar. This removes the previous nested-scroll interaction where both the panel and the list could consume wheel/trackpad input.

### Mobile

The map remains the primary canvas. Opening the bottom sheet exposes the layer selector, one compact map key, optional methodology, the selected-country action, and the country browser. The country list owns the sheet's variable-height browsing space and the sheet must not create horizontal page overflow.

## Progressive detail

The selected-country card now prioritizes the current map metric. The supporting PeopleGroups.org breakdown—people contexts, GSEC 0–3 contexts, unknown GSEC, population denominator information—is behind **Source breakdown**.

Layer description and methodology are behind **About this view**. Source attribution and boundary policy remain behind **Sources & boundaries**.

## Preserved behavior

Phase 10 does not change the map's source-of-truth or routing model:

- PeopleGroups.org mission summaries remain the mission-data source;
- Natural Earth remains the geography source;
- layer, country selection, and map view remain URL-backed;
- existing reset, hover, country selection, profile navigation, loading, stale-cache, and provider-error behavior remain intact.

## Certification

Static enforcement: `scripts/visualization/phase10-check.ts`.

Browser enforcement:

- `tests/e2e/map-sidebar-layout.spec.ts` verifies that the outer desktop sidebar cannot scroll while the country list remains usable;
- `tests/e2e/phase10-explore-map.spec.ts` verifies one visible map key per viewport, opt-in selected-country breakdown, mobile ownership of the map key, and no horizontal overflow.

The static Phase 10 contract is part of `npm run visualization:check` and therefore the production build gate.
