# U9 — Languages & Scripture Architecture

## Purpose

U9 turns language from a secondary people-group field into a first-class mission-exploration domain. It connects languages to peoples, countries, Scripture milestones and reported media availability without treating language as a proxy for ethnicity, nationality, religion or political identity.

## Stable identity

- Language route: `#/languages/:iso6393`
- Domain ID: `language:<iso6393>`
- ISO 639-3 is the stable public route key when available.
- Language names remain display labels and are never used as join keys.

## Browser record

Each published language record can contain:

- ISO 639-3 code and name
- source language-status classification
- optional, separately sourced family and branch taxonomy
- source primary religion classification where present
- source mission metrics where present
- Scripture milestone status
- portions / New Testament / complete-Bible milestone years
- reported audio availability
- reported Jesus Film availability
- canonical global people-group relationships
- country-context relationships
- known represented population from country-specific people records
- field-level provenance and source IDs

## Relationship rules

### Language → people

A canonical global people group is linked when its normalized `primaryLanguageId` matches the language. This is a primary-language relationship, not a claim that every member uses only that language.

### Language → country

Country relationships are derived from country-specific people-group records whose normalized primary language matches the language. Known population is summed only from records with a known population.

### Country → language

Country pages surface contextual language links only when the U9 dataset is published. The primary navigation remains Explore / Peoples / Countries / Pray / About; Languages is intentionally contextual rather than a new top-level tab.

## Scripture semantics

The normalized progression is:

1. unknown
2. translation needed
3. translation started
4. portions
5. New Testament
6. complete Bible

These categories describe a reported translation milestone. They do **not** measure literacy, comprehension, dialect suitability, distribution, affordability, censorship, internet availability, audio quality, church adoption or actual Scripture use.

`hasAudioRecordings` and `hasJesusFilm` are tri-state values:

- `true` — source reports availability
- `false` — source reports not available / negative according to that field
- `null` — unknown

The UI must not collapse `null` into `false`.

## Language taxonomy

U9 contains nullable `familyName`, `branchName` and `taxonomySourceId` fields so a future approved linguistic source can be integrated without changing the route model.

U9 **must not** infer family or branch from:

- language name
- country
- geography
- religion
- ethnicity or people-group classification
- similarity of spelling

Current normalized Joshua Project language records do not populate family/branch in Unreached, so those fields remain null.

## Source/legal boundary

- Joshua Project-derived language fields remain subject to the U0 non-commercial, attribution, value-added and redistribution gates.
- ProgressBible registered data is permission-required and is not bundled into U9 without written permission.
- Ethnologue/proprietary linguistic datasets are not scraped or bulk republished.
- Additional media/resource URLs require their own source and licensing review; U9 currently models reported availability, not unverified download links.

## Production data flow

```text
approved source
  ↓
build-time ingestion
  ↓
normalized Language domain model
  ↓
U9 relationship derivation
  ↓
validation + source policy
  ↓
public language dataset
  ↓
browser
```

The production runtime rejects datasets marked `fixture: true`.

## Performance

The language explorer is designed for static JSON delivery and local filtering. Large real datasets can later be chunked/indexed in U10 without changing the U9 record model.
