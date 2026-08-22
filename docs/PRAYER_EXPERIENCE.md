# U8 — Prayer Experience

## Purpose

U8 completes the V1 product loop: **Explore → Understand → Pray**. Prayer content is a reviewed editorial product joined to canonical U6 people profiles and, where relevant, grounded in U7 contextual claims.

The prayer system is intentionally not a spiritual activity tracker. It provides structure, context, Scripture references and navigation; it does not measure prayer quality, award points, create streaks, rank users or publish prayer activity.

## Routes

- `#/pray` — prayer hub and deterministic People to Pray for Today
- `#/pray/:sourcePeopleId` — focused prayer guide
- `#/pray?country=:ISO3` — country-scoped prayer-ready people list

People profiles expose a `Pray for this people` entry point when a reviewed guide exists. Country pages link to the country-scoped prayer hub.

## Data model

Each prayer profile belongs to one canonical global people group and contains:

- canonical people ID and source people ID
- display name checked against U6
- country ISO3 scopes
- daily-feature eligibility
- `Why pray?` bridge
- 4–7 prayer prompts
- review metadata and checklist

Prayer prompts record:

- category
- text
- grounding: biblical, contextual or mixed
- U7 context claim references where factual context is used
- Scripture references and their purpose
- stable/current temporal class
- freshness dates for current prompts
- sensitivity classification

Scripture references are stored as references and application purposes, not copied verse text.

## Required prompt coverage

A reviewed guide must contain 4–7 prompts spanning at least four categories. It must include a gospel prompt and at least one believers/church prompt.

Available categories:

- gospel
- believers
- church
- Scripture
- workers
- community
- authorities
- specific documented need

Not every guide must use every category.

## Grounding rules

### Biblical

A prayer based on a general biblical priority. It requires at least one Scripture reference and must not smuggle in people-specific factual assumptions.

### Contextual

A prayer that depends on a people-specific factual condition. It requires at least one valid U7 claim reference.

### Mixed

A prayer that connects a documented people-specific need with a biblical theme. It requires both U7 claim references and Scripture references.

## Freshness

Current prayer prompts require both `asOf` and `reviewAfter`. A published guide fails validation when a current prompt is stale.

## Review

Published prayer guides require review metadata and all checklist items to pass:

- factual assumptions grounded
- Scripture applied appropriately
- sensitive data checked
- tone reviewed
- no competitive gamification
- current claims fresh

AI may assist drafting but is never a source and is disclosed in review metadata.

## Focused prayer mode

Focused mode offers 2, 5 and 10 minute pacing choices.

- 2 minutes: first 3 curated prompts
- 5 minutes: first 5 curated prompts
- 10 minutes: all available prompts, up to 7

The duration is only a pacing aid. There is no required countdown and no completion metric.

## Daily selection

People to Pray for Today is deterministic. Published profiles marked `featuredDaily` are sorted by source ID and selected from a stable hash of the local calendar date plus optional country scope.

The same date and scope produce the same result without a server call. The system records no personal prayer completion history.

## Publication boundary

`public/data/prayer/status.json` controls whether reviewed prayer content is available. U8 ships no real-world prayer-guide dataset by default. Production runtime rejects fixture datasets.

The fictional Example People fixture exists only to validate schemas, cross-references, daily selection, prayer-flow construction and publication gating.
