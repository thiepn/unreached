# Unreached — Mission Visualization Architecture

**Phase:** U4 — Mission Visualization Engine  
**Methodology version:** 1

## Purpose

U4 converts normalized people-group-in-country records into transparent country-level map summaries. It does **not** redefine source classifications and does not treat missing values as zero.

The five V1 map lenses are:

1. Unreached population share
2. Frontier population share
3. Evangelical presence
4. Primary religion
5. Scripture availability

## Release architecture

Mission visualization is deliberately separated into two layers:

```text
normalized mission records
        ↓
country aggregation
        ↓
MissionVisualizationDataset
        ↓
source-policy / release gate
        ↓
publishable static browser dataset
        ↓
map join by ISO3
```

The browser loads `public/data/mission/status.json` first. A production dataset is fetched only when that status explicitly marks data as available. Fixture datasets are rejected by the production runtime.

This lets U4 be fully implemented and tested while the U0 Joshua Project redistribution permission gate remains unresolved.

## Country joins

Mission summaries use canonical ISO 3166-1 alpha-3 codes from the U2 domain model. Natural Earth geometry is matched using, in order:

1. `ISO_A3` normalized as `iso3`
2. `ADM0_A3` normalized as `adminA3`

Natural Earth areas with no matching mission country remain visible with the neutral **No data** state. They are never silently assigned another country's data.

## Layer 1 — Unreached population share

For each country:

```text
unreached share = known population in source-classified unreached PGIC records
                  ----------------------------------------------------------
                  known population in PGIC records with a known classification
```

Records whose classification is unknown are excluded from the denominator.

The source's `LeastReached` classification is retained; U4 does not recalculate the boundary from percentages.

## Layer 2 — Frontier population share

```text
frontier share = known population in PGIC records marked frontier
                 -----------------------------------------------
                 known population where frontier status is known
```

Unknown frontier flags are excluded from the denominator.

## Layer 3 — Evangelical presence

A population-weighted mean is calculated across PGIC records that have both:

- known population
- known evangelical percentage

No value is produced if no usable records exist. Coverage reports how much of the known people-group population contributed to the estimate.

This is a derived visualization statistic, not a source-provided national census percentage.

## Layer 4 — Primary religion

The map chooses the religion associated with the largest summed known PGIC population in the country.

This is a population-weighted dominant category among represented people groups. It must not be described as a precise census claim about every resident of the country.

## Layer 5 — Scripture availability

Bible-status categories keep the U2 normalized order:

1. Translation needed
2. Translation started
3. Portions
4. New Testament
5. Complete Bible

The country layer uses a **population-weighted median** among PGIC records with known population and known Scripture status. This keeps the output as a real category rather than inventing a fractional Bible-status score.

The UI labels this as a country-level aggregation and reports coverage.

## Coverage

Every layer carries population coverage independently:

- classification coverage
- frontier coverage
- evangelical coverage
- religion coverage
- Scripture coverage

A 100% result with 30% coverage must therefore remain distinguishable from a 100% result with full coverage.

## Missing data

`null` and `unknown` remain first-class states.

The map uses a neutral gray-green color for missing data and every legend explicitly includes **No data**. Missing values are never converted to `0`, `reached`, `non-frontier`, or `no Christians`.

## URL state

The active map layer is shareable alongside country selection and camera state:

```text
#/ ?country=TUR&layer=scripture&view=...
```

`unreached` is the default layer and is omitted from the URL when active.

## Accessibility

The choropleth is not the only representation of mission data.

The searchable textual area list exposes the active layer value for every matched country. Selected-country details include the value and population coverage. Color therefore never carries the only meaning.

## Attribution

When a mission dataset is publishable, its status manifest must include visible source attribution records. Geography continues to be attributed separately to Natural Earth.

## Current publication state

U4 ships the visualization engine but no real Joshua Project-derived browser dataset. `public/data/mission/status.json` records that mission data is unavailable while the redistribution permission gate remains unresolved.

Synthetic fixture data exists only for validation and is prohibited from production display.
