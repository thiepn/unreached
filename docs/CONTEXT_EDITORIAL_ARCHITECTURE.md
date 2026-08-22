# U7 — Contextual Editorial Architecture

U7 adds original explanatory value without allowing narrative prose to outrun its evidence.

## Core model

A contextual profile is a separate dataset joined to the canonical U6 people record by `peopleGroupId` and `sourcePeopleId`. Imported mission statistics are not copied into editorial content.

Each profile contains:

- `whoTheyAre`
- optional `religionAndCommunity`
- `whyUnreachedIntro`
- one or more `whyUnreached` dimensions
- atomic claims
- editorial sources
- review metadata

## Claim model

Every material claim has:

- evidence level: A, B, or C
- claim kind: fact, synthesis, or interpretation
- certainty: high, medium, or low
- stable/current temporal class
- source citations
- `asOf` and `reviewAfter` for current claims
- sensitivity classification

### Level A

Directly sourced facts. At least one source is required.

### Level B

Multi-source synthesis. At least two distinct editorial sources are required.

### Level C

Interpretation. It must be explicitly labeled, cannot claim high certainty, and requires an interpretation note. Level C is exceptional rather than filler.

## Why Unreached dimensions

The model supports only the dimensions established by the U0 editorial standard:

- church presence
- language/media
- social identity
- geography
- legal/political context
- conflict/displacement
- history
- access gap

A profile need not use all dimensions, and the system must never invent extra causes merely to fill a template.

## Freshness

Current claims require both an `asOf` date and a `reviewAfter` date. A published profile with an overdue current claim fails build-time integrity validation.

Stable cultural/history claims do not receive artificial expiry dates, but their source quality is still reviewed.

## Publication review

Only Tier 2 or Tier 3 contextual profiles exist in U7. Published profiles require all review checks to pass:

- naming checked
- material claims cited
- current claims fresh
- stereotype shortcuts absent
- religion described with nuance
- sensitive data checked
- source licensing checked

AI assistance may be recorded, but AI output is never accepted as evidence or a citation.

## Data separation

`public/data/context/status.json` controls whether a browser-readable editorial dataset is published. U7 ships no real-world editorial profiles. Its synthetic fixture validates the complete model without making claims about an actual people.
