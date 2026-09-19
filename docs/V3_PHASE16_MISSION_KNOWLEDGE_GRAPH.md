# V3 Phase 16 — Mission Knowledge Graph

**Status:** implemented on a post-3.0 stacked branch above Phase 15; production activation remains blocked by V3 Gate D.  
**Reviewed:** 2026-09-20

## Goal

Phase 16 turns the explicit entity and evidence relationships established across V3 into an inspectable, typed mission knowledge graph.

The graph is not a global similarity engine and does not create a universal mission ontology. It is a bounded per-profile evidence graph derived in memory from already loaded, already permitted data.

## Gate D remains binding

Phase 16 inherits all earlier V3 release gates. Engineering completion does not certify Unreached 3.0, bypass the Phase 12 reviewed-profile threshold, or make post-3.0 phases production-eligible before Gate D is satisfied.

## Evidence layers

The graph has four intentionally separate evidence layers.

### 1. Source fields

Direct PeopleGroups.org PGID relationships:

- people entity → certified PGID record;
- PGID → country;
- PGID → primary language;
- PGID → aggregate religious-context label;
- PGID → source-scoped mission classification;
- PGID → Bible availability;
- PGID → Jesus Film availability;
- PGID → reported resource total.

Every edge stores the source ID, PGID and exact source fields supporting it.

### 2. Source taxonomy

Provider taxonomy labels remain explicit nodes:

- ROP3 people name;
- people cluster;
- affinity bloc;
- ethnographic group.

These labels are not treated as universal ethnic identities.

### 3. Derived source relationships

Related people records may be connected only when an explicit PeopleGroups.org taxonomy field matches:

- same ROP3 people name;
- same people cluster;
- same affinity bloc.

The matching source field and both PGIDs remain attached to the edge.

No fuzzy name similarity, embedding similarity, geographic proximity, population similarity or hidden relevance score creates an edge.

### 4. Reviewed editorial evidence

Published reviewed/curated editorial context remains separate from provider facts:

- people record → reviewed editorial profile;
- profile → reviewed claim;
- reviewed claim → cited external source.

Editorial claims retain evidence level, certainty, section membership and citation identity. A citation edge does not convert an editorial synthesis into a PeopleGroups.org provider fact.

## Node types

Phase 16 supports typed nodes for:

- people;
- PeopleGroups.org source record;
- country;
- language;
- religion/religious context;
- mission classification;
- source resource indicator;
- source taxonomy label;
- reviewed editorial profile;
- reviewed editorial claim;
- editorial source.

Node identity is deterministic and collisions fail closed.

## Edge semantics

Every graph edge has:

- typed relation;
- human label;
- evidence layer;
- source ID when applicable;
- source record IDs;
- exact source fields;
- semantic explanation.

Edges cannot reference missing nodes and self-edges are rejected.

## Interactive profile explorer

People profiles gain **Mission knowledge graph** after editorial context.

The explorer supports:

- focus-node navigation;
- source-fact, taxonomy, related-record and reviewed-editorial layer filters;
- relationship counts;
- direct navigation to Unreached country/language/people records;
- external navigation to cited editorial sources;
- per-edge “Why this connection exists” evidence disclosure;
- explicit graph interpretation boundaries.

The UI intentionally uses an inspectable relationship explorer rather than a force-directed canvas. This keeps the evidence readable on mobile and avoids implying that visual distance, cluster position or node size carries analytical meaning.

## Important non-implications

A graph connection does not prove more than its edge semantics.

In particular:

- same ROP3 name does not prove one universal ethnic identity;
- same cluster does not prove cultural equivalence;
- same affinity bloc does not imply close identity;
- same language family does not prove mutual intelligibility;
- same country does not prove bilingualism;
- one mission classification does not become a provider-independent verdict;
- a resource label does not become a translation-completeness claim;
- editorial citation does not turn synthesis into provider data;
- missing graph edge does not prove the real-world relationship is absent.

## Joshua Project boundary

Phase 13 Joshua Project comparison remains opt-in and no-store.

Phase 16 does not persist, prefetch or silently insert Joshua Project comparison responses into the graph. A future cross-source graph extension would require an explicit interaction model and renewed certification of the no-store/provider-identity boundary.

## Storage and privacy

The graph is derived in memory from already loaded runtime/editorial records.

Phase 16 adds:

- no D1 schema;
- no Worker storage;
- no IndexedDB graph database;
- no private-sync fields;
- no graph export corpus;
- no analytics or graph-interaction telemetry.

## Certification

Phase 16 adds:

- `npm run v3:phase16-check`;
- blocking integration into `npm run build`;
- `npm run v3:phase16-visual`;
- dedicated Phase 16 GitHub Actions workflow;
- desktop/mobile browser acceptance.

Certification verifies:

- deterministic typed nodes/edges;
- no dangling/self edges;
- exact source-field provenance;
- taxonomy-only related-record derivation;
- reviewed editorial claim/citation separation;
- absence of similarity/ranking edges;
- Joshua Project exclusion from the derived graph;
- no new persistence/sync/Worker boundary;
- interactive focus navigation;
- evidence-layer filtering;
- mobile overflow safety.

## Explicit non-goals

Phase 16 does not:

- create a universal mission score;
- rank people groups;
- infer relationships from embeddings or fuzzy names;
- build a public provider corpus mirror;
- make visual graph distance meaningful;
- merge provider facts with editorial synthesis;
- persist Joshua Project data;
- infer language intelligibility or bilingualism;
- weaken Phase 12–15 or Gate D.
