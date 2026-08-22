# U9 — Language & Scripture Display Rules

## Identity

1. Display the sourced language name and ISO 639-3 code when present.
2. Do not describe a language as an ethnicity, nationality or religion.
3. “Primary language” describes the source relationship for a people-group record; it does not imply monolingualism.

## Family and branch

1. Show family/branch only when `taxonomySourceId` identifies an approved source.
2. Otherwise display **Not published from an approved source** rather than guessing.
3. Never derive linguistic taxonomy from geography, religion or people-group cluster.

## Scripture milestone labels

Use these exact user-facing concepts:

- Unknown
- Translation needed
- Translation started
- Scripture portions
- New Testament
- Complete Bible

Do not rename “no complete Bible” to “Bibleless” in general UI because a language may already have portions, a New Testament or an active translation project.

## Milestone years

- Display milestone years only when sourced.
- A milestone year is historical metadata, not a freshness guarantee about current editions or distribution.
- Do not infer missing earlier milestones from a later milestone year.

## Audio and film

- `true` → **Available**
- `false` → **Not reported available**
- `null` → **Unknown**

Do not turn a reported availability flag into a direct download/watch link unless the specific resource URL, provider, current availability and usage terms are separately verified.

## Access caveat

A complete Bible or media resource does not mean every speaker has practical gospel access. Profiles should explain that access can also depend on:

- literacy
- dialect/comprehension
- distribution
- affordability
- device/internet access
- censorship or legal restrictions
- local church presence
- oral preference
- resource quality and actual use

## People and country relationships

- People lists use canonical U6 global people records.
- Country lists derive from U2 country-specific people records.
- Represented population means the sum of known linked country-context populations; it is not the global number of speakers.
- Do not call represented population “language population” or “number of speakers.”

## Mission classifications

Language-level mission metrics are source classifications associated with the language record. Do not imply every speaker has the same religious identity, gospel exposure or response.

## Unknown and zero

Unknown values remain unknown. Never convert a missing population, percentage, Scripture status, audio flag or film flag into zero/false.

## Source disclosure

Language profiles expose source IDs, attributions and field-level provenance. Derived people/country relationships should be described as normalized-record relationships, not independently verified ethnolinguistic claims.
