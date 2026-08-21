# Country Explorer Architecture

U5 connects the world map to structured country intelligence without collapsing national statistics, people-group estimates, and missing data into one undifferentiated number.

## Route model

- `#/countries` — searchable country index
- `#/countries/TUR` — country detail route using ISO3
- map selection can link into the corresponding country route
- country pages link back to the same geographic area on Explore

## Country dataset

The browser-facing country dataset is a derived, versioned view built from the normalized U2 domain model plus U4 country mission summaries. Each country record contains:

- identity and region
- source country-population metric when available
- U4 mission summary and coverage
- ranked people groups in country
- language aggregation
- religious aggregation
- Scripture-status distribution
- source IDs

People-group rows retain source classifications and unknown values. U5 does not reclassify a people group from percentages.

## Population semantics

`population` is the source country-level population metric and may be unknown. `mission.knownPopulation` is the summed population represented by people-group records with known populations. The interface labels these differently and never substitutes one for the other.

## Religious landscape

Religion shares are derived from the summed known populations of people-group primary-religion records. They are not presented as national census statistics.

## Scripture overview

Scripture status is summarized by the people-group-in-country records behind the country. This is a people-group resource-access view, not a statement that every individual in a country has equal access.

## Release gating

U5 does not publish real Joshua Project-derived country records while the U0 redistribution gate remains unresolved. `public/data/countries/status.json` explicitly reports that country mission data is unavailable. The production runtime rejects fixture datasets. Synthetic data exists only for validation.

## Accessibility

Country intelligence is text-first. Every statistic is readable without the map, tables use real headers, coverage is written explicitly, and unknown values are labeled rather than encoded only by color.
