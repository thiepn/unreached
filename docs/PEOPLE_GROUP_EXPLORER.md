# U6 — People Group Explorer

## Purpose

U6 makes the global people group the canonical entity at the center of Unreached.

The product flow is now:

`Map → Country → People Group → factual profile`

U7 will add editorial context such as `Why unreached?`; U8 will add prayer. U6 itself stays factual and source-grounded.

## Routes

- `#/peoples` — global people-group browser
- `#/peoples/:sourcePeopleId` — stable people-group profile

The route identifier is the positive numeric source people ID already preserved by the U2 normalized model. Internal IDs remain namespaced (`people:<id>`), while the public hash route stays concise.

## Canonical profile model

A people profile is built from:

1. the global people-group record (canonical identity and global mission metrics)
2. people-group-in-country records (country contexts)
3. the primary-language record (language identity and preferred Scripture-resource basis)
4. the primary-religion record
5. source taxonomy fields used only for explicitly labeled related-group discovery

Country-specific rows never overwrite the global record. They remain contexts beneath it.

## Scripture basis

Profile-level Scripture/resource status uses this precedence:

1. primary-language record, when resolvable
2. first population-ranked country context with a known Scripture/resource value
3. unknown

The selected basis is stored on the profile and displayed in the UI. U6 does not silently blend incompatible Scripture records.

## Related peoples

Related-group suggestions are deterministic and source-taxonomy based:

1. same source people cluster
2. same source affinity bloc

They are not presented as proof of ethnic, genetic, political, historical, linguistic, or self-identity relationships. The interface states this limitation explicitly.

## Location handling

Country-level source location text may be displayed when available. The normalized record retains whether source coordinates exist, but U6 does not print raw latitude/longitude values in the profile UI.

Map navigation is country-context based. This keeps the product useful without turning approximate people-group centroids into falsely precise settlement claims or exposing more precise location data than the interface needs.

## Discovery

The `/peoples` browser supports:

- free-text search across people, country, language, religion, cluster and affinity bloc
- reached/unreached/frontier/unknown filtering
- country filtering
- language filtering
- religion filtering
- Scripture-status filtering
- minimum-population filtering
- population, least-reached, evangelical and alphabetical sorting

This is entity-local discovery. U10 will later build the unified global search experience across people, countries and languages.

## Provenance

The profile retains field-level provenance from:

- global people record
- primary language
- primary religion
- each country context

The profile page exposes a collapsible provenance table rather than only a generic source footer.

## Runtime publication gate

`public/data/peoples/status.json` controls browser availability.

Production rejects any people dataset marked `fixture: true`. U6 does not publish real Joshua Project-derived people records while the U0 redistribution gate remains unresolved.

## Deliberate U6 non-scope

U6 does not author:

- cultural narratives
- historical narratives
- `Why unreached?` analysis
- prayer points
- language-family pages
- global app-wide search
- saved/prayer-list state

Those belong to U7–U10.
