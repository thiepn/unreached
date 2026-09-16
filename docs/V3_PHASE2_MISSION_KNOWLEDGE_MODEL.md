# Unreached 3.0 — Phase 2 Normalized Mission Knowledge Model

**Phase:** 2 — Normalized Mission Knowledge Model  
**Status:** implementation contract  
**Depends on:** `V3_PHASE1_SOURCE_ARCHITECTURE.md`  
**Canonical launch source:** PeopleGroups.org / IMB through Phase 12

---

## 1. Phase outcome

Phase 2 introduces the canonical **Unreached V3 mission knowledge model**.

The important architectural change is that a provider API record is no longer the product's conceptual data model. Provider records enter through an adapter and become durable product entities, relationships, source observations, measurements, mission assertions, and provenance.

The boundary is:

```text
PeopleGroups API record
        ↓
validated provider DTO
        ↓
PeopleGroups → V3 normalization adapter
        ↓
normalized mission knowledge model
        ↓
editorial/product projections in later phases
```

Existing V2 screens may continue consuming compatibility runtime objects while V3 is rebuilt. New V3 product work must treat `src/mission-model/` as the canonical model boundary rather than expanding provider DTOs into a second product model.

---

## 2. Design principles

### 2.1 Provider-independent core

`src/mission-model/` does not import PeopleGroups provider DTOs.

Provider-specific translation lives on the provider side, currently in:

```text
src/providers/peoplegroups/mission-model.ts
```

This dependency direction is deliberate:

```text
mission model ← provider adapter ← provider DTO
```

not:

```text
mission model → provider DTO
```

A future provider can write another adapter without changing the meaning of the core entities.

### 2.2 Source-scoped assertions

Phase 1 established that `unreached` is a source assertion, not an unqualified universal truth field. Phase 2 retains that assertion and adds record-level provenance around it.

The normalized model therefore does not contain a generic `reached` boolean, Joshua Project `JPScale`, Frontier status, or Christian-adherent percentage merely because an older model once had those fields.

If another provider is added later, its mission assertions remain separate.

### 2.3 Unknown remains unknown

Missing values are represented as missing values.

Examples:

- missing population → `value: null`, quality `unknown`;
- missing GSEC → classification `unknown`;
- language name without a stable language code → source label retained, no language entity ID invented;
- invalid/missing coordinates → no coordinate, with provenance explaining an omission when the source value was invalid.

Zero is never substituted merely to simplify rendering.

### 2.4 Identity is conservative

Phase 2 does not solve universal people-group identity.

The current certified PeopleGroups corpus has one PEID per PGID record and no certified cross-country PEID rollups. Therefore the Phase 2 adapter creates a provider-qualified people identity and a separate provider-record context identity without merging records by name, language, taxonomy, or numeric coincidence.

Future source reconciliation belongs to the multi-source work after 3.0.

### 2.5 Precision cannot increase during normalization

Normalization may make fields easier to consume, but it may not manufacture stronger precision.

A provider coordinate remains a provider coordinate. A country label does not become a local point. A resource availability string does not become a claim that a complete Bible is accessible. A mission threshold does not become a broader claim about spiritual health.

---

## 3. Canonical V3 entities

### People

Stable V3 identity for the current source:

```text
people:peoplegroups:<PEID>
```

Contains:

- display name;
- alternate source name when explicitly provided;
- source-qualified external identifier;
- source taxonomy observations such as people name, affinity bloc, cluster, and ethnographic group;
- provenance.

This identity means "the people entity represented by this PeopleGroups identity." It does **not** assert equivalence to a similarly named Joshua Project or other-provider entity.

### PeopleContext

Stable V3 source-context identity:

```text
people-context:peoplegroups:<lowercase PGID>
```

Contains the relationship between a people and its current geographic/source context, including:

- people reference;
- country reference;
- population estimate;
- language and religion references where stable codes exist;
- source language/religion labels even when no stable linked entity can be created;
- provider coordinates without increased precision;
- region/subregion source labels;
- mission classification assertion;
- evangelical-presence, engagement, church-planting, and congregation observations;
- source-native GSEC/SPI/LPI research indicators;
- source-native Bible/Jesus Film/resource-count observations;
- source descriptions;
- full source-record identity/provenance.

### Country

Stable ID:

```text
country:<ISO3>
```

ISO alpha-3 is used as the durable linking key. Repeated country records are deduplicated into one country entity. Conflicting source names are retained as alternate names rather than silently overwriting identity.

### Language

Stable ID when a valid ISO 639-3 code exists:

```text
language:<iso6393>
```

If the source supplies a language label but no stable code, the label remains on the people context and no language entity is fabricated.

### Religion

PeopleGroups religion codes are treated as provider-scoped identifiers rather than universal religion taxonomy IDs.

Stable ID:

```text
religion:peoplegroups:<encoded provider code>
```

This avoids pretending that a provider-specific religion code can safely join to another provider's taxonomy.

### Region

The Phase 2 schema defines a normalized Region entity, but the PeopleGroups adapter does **not** convert free-text `Regn` / `RegnSub` labels into canonical region identities.

Those labels remain source observations on `PeopleContext`.

Phase 7 will establish the product's canonical geographic region taxonomy. This prevents Phase 2 from freezing a provider's text labels into long-term product geography by accident.

---

## 4. Measurements and observations

Phase 2 separates a value from its evidence.

### Population estimate

A population measurement contains:

```text
value
quality: estimated | unknown
unit: persons
provenance
```

PeopleGroups population values are estimates. Missing population remains `null`.

### Text observation

Used for source-native fields such as:

- evangelical level;
- engagement status;
- church planting;
- congregation existence;
- Bible availability;
- Jesus Film availability;
- language/religion labels.

Shape:

```text
value
quality: reported | unknown
provenance
```

The model intentionally does not reinterpret arbitrary provider strings into stronger universal enums unless a reviewed mapping exists.

### Numeric observation

Used for source-reported quantities such as total resource count while retaining source provenance and unknown state.

### Coordinates

Coordinates contain:

```text
value: { latitude, longitude } | null
precision: provider-coordinate | unknown
provenance
```

Out-of-range or incomplete provider coordinates are omitted, not clamped, relocated, geocoded, or fabricated.

---

## 5. Mission classification

The normalized context embeds the Phase 1 source-scoped assertion:

```text
mission.classification.assertion
mission.classification.provenance
```

For the V3 launch source:

```text
GSEC 0–3 → unreached
GSEC 4–6 → not-unreached
missing  → unknown
```

The provenance points back to the exact PeopleGroups record and source fields used for the classification.

`not-unreached` remains intentionally narrower than `reached`.

Other gospel-access observations are separate fields; they are not blended into a synthetic mission score.

---

## 6. Source indicators

Provider-specific research concepts that are useful to preserve but should not become universal core fields are represented as source indicators.

The PeopleGroups adapter currently retains:

- GSEC detail;
- SPI;
- LPI.

Each indicator contains:

```text
key
source code
source label
source description
provenance
```

This allows research/methodology surfaces to expose source detail later without forcing every future provider to implement IMB-specific fields.

---

## 7. Resource semantics

Phase 2 deliberately models current PeopleGroups resource fields as **availability observations**, not concrete resource entities.

For example:

```text
Bible: "Available"
```

is preserved as a source-native observation. Phase 2 does not reinterpret it as:

```text
Complete Bible available and meaningfully accessible
```

because the source field does not justify that stronger claim.

Concrete Scripture-resource entities, translation milestones, media resources, and access semantics belong to Phase 15 if appropriate sources support them.

This is an intentional correction to the early roadmap shorthand that listed `ScriptureResource` as though every provider availability flag already identified a concrete resource.

---

## 8. Provenance contract

Every material observation contains provenance with:

```text
sourceId
recordId
retrievedAt
sourceUpdatedAt
sourceFields[]
transformation
geographicScopeId
```

The distinction matters:

- `retrievedAt` = when Unreached obtained the record;
- `sourceUpdatedAt` = provider-supplied record freshness when available;
- `sourceFields` = exact input fields supporting the normalized observation;
- `transformation` = any non-trivial normalization or omission rule;
- `geographicScopeId` = product geography to which the observation applies.

The model does not hide transformed values behind a generic source badge.

---

## 9. Source snapshot metadata

A normalized in-memory model records which source retrieval produced it:

```text
sourceId
retrievedAt
recordCount
```

This is current-snapshot metadata only.

Phase 2 does **not** introduce historical snapshots or change timelines. Those belong to Phase 14.

The normalized model is an application boundary, not permission to publish a static mirror of PeopleGroups.org. Existing source-policy restrictions against public corpus redistribution remain binding.

---

## 10. Relationship integrity

The model enforces references rather than relying on coincidental strings.

Every context must resolve its:

- people ID;
- country ID;
- region ID when present;
- language ID when present;
- religion ID when present.

The invariant layer also rejects:

- duplicate entity IDs;
- duplicate source records;
- classification/source mismatches;
- provenance whose source has no model snapshot;
- country IDs that disagree with ISO3;
- language IDs that disagree with ISO 639-3;
- self-parenting regions.

Provider adapters may impose stronger provider-specific invariants. The PeopleGroups adapter continues to fail closed on duplicate PGIDs or PEIDs because the current certified runtime semantics require one PGID/PEID pair per record.

---

## 11. Legacy `src/domain` status

The repository already contains an older normalized dataset model in:

```text
src/domain/
```

That model was designed around the earlier Joshua Project-oriented architecture and includes concepts such as:

- generic `reached` classification;
- `JPScale`;
- Frontier status;
- Christian/evangelical percentage fields as universal mission metrics.

It remains in place for legacy fixture/build compatibility while V3 is developed, but it is **not the canonical V3 mission knowledge model**.

Do not extend it with new V3 product semantics.

Migration or retirement can occur safely after the V3 model has real consumers; Phase 2 does not break stable V2 build/test infrastructure merely to remove old code early.

---

## 12. What Phase 2 intentionally does not do

Phase 2 does not:

- switch production providers;
- activate Joshua Project in production;
- change current map values or colors;
- redesign UI;
- rewrite search, countries, languages, prayer, Saved, or sync;
- create cross-provider people equivalence;
- aggregate people across countries by name;
- define the final region taxonomy;
- invent Scripture completeness from availability strings;
- create historical source timelines;
- create a general-purpose knowledge graph;
- create editorial narrative.

These boundaries keep Phase 2 focused on data truth rather than feature expansion.

---

## 13. Implementation files

Canonical core:

```text
src/mission-model/schemas.ts
src/mission-model/invariants.ts
src/mission-model/index.ts
```

PeopleGroups adapter:

```text
src/providers/peoplegroups/mission-model.ts
```

Verification:

```text
scripts/v3/phase2-check.ts
.github/workflows/v3-phase2-mission-model.yml
```

The core files are checked to ensure they do not import PeopleGroups DTOs or leak legacy Joshua-specific mission fields.

---

## 14. Phase 2 acceptance criteria

Phase 2 is complete only when:

- [x] a provider-independent V3 mission model exists;
- [x] People, PeopleContext, Country, Region, Language, and Religion have explicit schemas;
- [x] people and context identities are provider-qualified without false cross-source equivalence;
- [x] current PeopleGroups records can normalize into the V3 model;
- [x] every normalized context retains source-record identity;
- [x] important measurements and observations carry field-level provenance;
- [x] Phase 1 mission classification remains source-scoped;
- [x] GSEC 4–6 remains `not-unreached`, not generic `reached`;
- [x] missing population/classification/resource data remains unknown;
- [x] invalid coordinates are omitted rather than repaired into false precision;
- [x] unresolved language/religion labels are preserved without invented linked IDs;
- [x] relationship/integrity validation fails closed on invalid references and duplicate source identities;
- [x] canonical core code contains no PeopleGroups DTO dependency;
- [x] legacy Joshua-oriented `src/domain` is explicitly compatibility-only for V3;
- [x] the current V2 runtime can continue operating while later phases migrate product consumers deliberately.

---

## 15. Phase 3 handoff

Phase 3 — **Editorial Content System** — can build on stable V3 people/context identities without coupling editorial articles to provider DTO structure.

Editorial content should reference V3 people/context IDs and separately retain citations/review metadata. It must not copy provider fields into prose as though those fields were editorial research.

The Phase 3 content tiers remain:

```text
Reviewed profile
Enhanced profile
Source profile
```

Phase 3 should consume the normalized identity/provenance model established here rather than redesign mission semantics again.
