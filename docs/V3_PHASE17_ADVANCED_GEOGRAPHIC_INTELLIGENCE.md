# V3 Phase 17 — Advanced Geographic Intelligence

**Status:** implemented on a post-3.0 stacked branch above Phase 16; production activation remains blocked by V3 Gate D.  
**Reviewed:** 2026-09-20

## Goal

Phase 17 adds responsible geographic distribution context without manufacturing diaspora precision.

The feature answers a narrow question:

> Which country-level PeopleGroups.org records are explicitly linked by the strongest currently certified source taxonomy relationship?

It does **not** answer where every member of a people lives, where a diaspora originated, where communities migrated, or where settlements exist at city/neighborhood level.

## Gate D remains binding

Phase 17 inherits all earlier V3 release gates. Engineering completion does not certify Unreached 3.0, bypass the Phase 12 reviewed-profile threshold, or make post-3.0 phases production-eligible before Gate D is satisfied.

## Direct geographic evidence

The current people profile always starts with one certified PeopleGroups.org PGID country-context record.

That record may provide:

- country identity;
- provider region/subregion labels;
- population estimate;
- primary language;
- source-scoped GSEC classification;
- source update date.

The current PGID is direct source evidence.

## Cross-country distribution evidence

Wider distribution is shown only when another PeopleGroups.org PGID reports the **exact same normalized ROP3 people-name field (`PplNm`)**.

Normalization is limited to:

- trimming surrounding whitespace;
- case-insensitive comparison;
- collapsing repeated whitespace.

Phase 17 does not use:

- fuzzy names;
- alternate/display-name similarity;
- embeddings;
- cluster-only matches;
- affinity-bloc-only matches;
- geographic proximity;
- language similarity.

An exact ROP3 match is labeled **source-linked distribution** or **same ROP3 source taxonomy**.

It is not promoted into proof that all linked PGIDs represent one universal ethnic population.

## Why cluster/affinity matches are excluded

Phase 16 preserves cluster and affinity-bloc relationships in the knowledge graph because they are legitimate provider taxonomy.

Phase 17 does **not** use those broader relationships to construct a people distribution footprint. Doing so would make broad taxonomy look like geographic identity.

Only the strongest current explicit taxonomy relationship—same ROP3 people name—is eligible for the distribution view.

## Diaspora status

Phase 17 keeps diaspora evidence separate from distribution evidence.

Current status is:

**Diaspora evidence: not established by the certified source set.**

The current sources do not establish:

- migration direction;
- origin/destination history;
- diaspora self-identification;
- settlement chronology;
- refugee/migrant generation;
- city or neighborhood communities;
- migration causes;
- verified diaspora population shares.

Cross-country ROP3 matches therefore never become a diaspora claim.

## Geographic precision

Phase 17 uses **country-context precision**.

It intentionally does not render:

- people-group point pins;
- city markers;
- settlement heatmaps;
- migration arrows;
- inferred routes;
- buffers around provider coordinates.

Provider coordinates remain available elsewhere as source data, but they are not repurposed as precise diaspora settlements.

## Natural Earth role

Natural Earth may group the source-linked countries by continent.

Natural Earth contributes only geographic structure and boundaries. It does not provide:

- people-group identity;
- population;
- mission classification;
- migration evidence;
- diaspora evidence.

The map boundary presentation remains the documented Natural Earth de facto Admin-0 model.

## Population semantics

Phase 17 may sum known PGID population estimates across source-linked records.

That value is always described as a **sum of known represented estimates**.

The feature also exposes:

- records with known population;
- total linked records;
- whether population coverage is complete.

It must not describe the sum as:

- a census;
- verified worldwide population;
- diaspora population;
- share of a global people;
- precise migration distribution.

## Loading behavior

The current PGID country context is available immediately.

The complete PeopleGroups.org corpus is not loaded merely because a user opens a people profile.

A user explicitly chooses **Load wider source distribution** before Phase 17 requests/prepares the full corpus, unless it is already present from another product journey.

Failure to load the wider corpus does not invalidate the current PGID.

## User interface

People profiles gain **Advanced geographic intelligence** after the mission knowledge graph.

The panel includes:

- source-linked record count;
- country count;
- Natural Earth region count;
- population-field coverage;
- country-context cards;
- underlying PGID/PEID records;
- region summaries;
- an explicit **Diaspora evidence — Not established** section;
- interpretation methodology.

If the full corpus contains no exact cross-country ROP3 match, the UI states that this is an absence of current source-linked evidence—not proof that the people exist in only one country.

## Certification

Phase 17 adds:

- `npm run v3:phase17-check`;
- blocking integration into `npm run build`;
- `npm run v3:phase17-visual`;
- dedicated Phase 17 GitHub Actions workflow;
- desktop/mobile browser acceptance.

Certification verifies:

- current PGID always remains present;
- exact ROP3 matches are included;
- cluster-only/affinity-only records are excluded;
- distribution country and region aggregation;
- partial population coverage semantics;
- diaspora remains `not-established`;
- no city/point/migration-route inference enters the model;
- wider corpus loading is explicit;
- mobile overflow safety;
- no new persistence, sync or Worker surface.

## Explicit non-goals

Phase 17 does not:

- build a diaspora database;
- estimate migration flows;
- infer cities or settlements;
- infer geographic population shares;
- infer origin or homeland;
- convert same-cluster/affinity relationships into distribution;
- create a universal ethnic identity;
- create a provider corpus mirror;
- add a new external data provider;
- weaken Phase 12–16 or Gate D.
