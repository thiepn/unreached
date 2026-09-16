# Unreached 3.0 — Phase 1 Mission Classification & Source Architecture

**Phase:** 1 — Mission Classification & Source Architecture  
**Decision date:** 16 September 2026  
**Status:** implementation contract  
**Depends on:** `V3_PRODUCT_CONTRACT.md`, `DATA_AND_LEGAL_POLICY.md`, `data/source-registry.json`

---

## 1. Phase outcome

Unreached 3.0 will launch **PeopleGroups.org / IMB-first** for mission classification and structured people-group runtime data.

PeopleGroups.org / the Global Research Department of the International Mission Board is the **canonical launch source** through the Phase 12 Unreached 3.0 release unless a later reviewed source-policy change is required for correctness or legal reasons.

Joshua Project remains a useful research source and a possible future supplementary provider, but it is **not active in the public V3 launch runtime**. Multi-source comparison is deliberately deferred to Phase 13, after 3.0 ships.

This decision resolves the source ambiguity identified in Phase 0 without pretending that different mission datasets use interchangeable definitions.

---

## 2. Why PeopleGroups.org / IMB is the launch source

The current PeopleGroups.org API is a practical fit for the V3 launch architecture:

- it is publicly documented as free, read-only, and usable without an account or API key;
- the provider explicitly presents maps, prayer tools, and research applications as intended API use cases;
- the current Unreached runtime already has validated schema, pagination, caching, failure-mode, and browser-origin handling for it;
- its people-group records expose source-native GSEC, engagement, language, religion, population, and resource fields needed by the V3 atlas;
- using the existing runtime source avoids a migration whose primary effect would be to replace one missiological definition with another rather than improve product understanding.

The API remains an external beta dependency and may change. Unreached therefore continues to fail closed on incompatible schema/pagination changes and does not treat runtime accessibility as a broad redistribution license.

---

## 3. Why Joshua Project is not the V3 launch source

Joshua Project remains valuable, but its current public terms create a materially different operational envelope:

- use is non-commercial and revocable;
- a credentialed API key is required;
- pages displaying Joshua Project data require visible linked attribution;
- direct or highly overlapping public replication is prohibited and public uses must provide value beyond repackaging;
- if API access is terminated, downloaded or cached Joshua Project data must be deleted;
- Joshua Project itself warns that its percentages and statuses are estimates of varying precision.

Those terms do not make a future Unreached integration impossible. They do mean that switching the entire V3 atlas to Joshua Project would introduce credential, cache-removal, attribution, product-overlap, and operational obligations that are unnecessary for the focused 3.0 release.

Accordingly:

- no Joshua Project credential may be shipped in the browser bundle;
- no Joshua Project corpus may be bundled into the public application;
- no existing PeopleGroups field may be silently converted into Joshua Project `JPScale`, Frontier, Christian-adherent, or unreached semantics;
- any Phase 13+ Joshua Project integration requires a fresh terms review and an architecture that can satisfy termination/cache-deletion obligations.

---

## 4. Definitions are source assertions, not universal truth fields

The word **unreached** is not stored or interpreted as an unqualified universal fact.

V3 represents mission classification as a **source-scoped assertion** with at least:

- source identifier;
- methodology identifier;
- normalized classification value;
- original source code/label;
- source definition;
- a short basis explaining the mapping;
- source update timestamp when available.

Phase 1 introduces this boundary in `src/mission/classification.ts`.

Provider adapters may map into the boundary. They may not drop the source/methodology context and return a naked boolean that could later be mistaken for another provider's definition.

The full normalized entity/assertion model belongs to Phase 2. Phase 1 intentionally defines only the minimum classification contract needed to prevent semantic drift now.

---

## 5. Canonical V3 launch classification

For the PeopleGroups.org / IMB launch source:

| Source GSEC | V3 boundary value | Meaning |
| --- | --- | --- |
| `0` | `unreached` | source-defined unreached range |
| `1` | `unreached` | source-defined unreached range |
| `2` | `unreached` | source-defined unreached range |
| `3` | `unreached` | source-defined unreached range |
| `4` | `not-unreached` | outside the source-defined unreached range |
| `5` | `not-unreached` | outside the source-defined unreached range |
| `6` | `not-unreached` | outside the source-defined unreached range |
| missing | `unknown` | no classification is inferred |

The source's GSEC model describes levels `0–3` as the unreached range. GSEC `1–3` are below 2% evangelical Christian presence with differences in recent church-planting activity; GSEC `0` represents no evangelical Christians/churches and no access to major evangelical resources in the model. GSEC `4–6` are at or above the model's unreached threshold.

### Why the normalized value is `not-unreached`

V3 deliberately does **not** normalize GSEC `4–6` to a generic `reached` value.

`not-unreached` says only what the source rule actually establishes: the record does not fall inside that provider's unreached range. It avoids turning a threshold result into a stronger statement about church health, gospel access, theological identity, or another provider's classification.

The existing v2 compatibility runtime may continue exposing its historical `other` label while V3 is built. The new source-scoped assertion is the authoritative bridge for Phase 2.

---

## 6. Joshua Project semantics remain distinct

Joshua Project currently defines an unreached people group using both Christian-adherent and evangelical thresholds. That is a different rule from the IMB GSEC mapping.

V3 therefore prohibits all of the following:

- comparing a PeopleGroups GSEC-derived percentage to a Joshua Project unreached percentage as if they were the same metric;
- making Europe, a country, or a people look more or less unreached through color changes or relabeling rather than a real source/model change;
- deriving Joshua Project status from GSEC;
- averaging or merging incompatible classification values into one synthetic score;
- treating provider disagreement as data corruption by default.

A future multi-source implementation must retain both assertions and explain the methodological difference.

---

## 7. Country and map aggregation contract

The V3 source decision does not turn provider people-group records into national census statistics.

When Unreached derives a country-level mission layer from PeopleGroups.org records:

- the numerator must be explicitly tied to source records classified as unreached under the IMB rule;
- the denominator must include only the represented source population for records with the data required by the formula;
- missing GSEC or population data remains missing/coverage debt rather than silently becoming zero;
- the UI must describe the value as a derived PeopleGroups/IMB aggregation, not a national Christian census percentage;
- coverage information must remain available wherever the aggregation could otherwise imply false completeness.

Phase 6 may redesign how this is explained visually, but it may not weaken these semantics.

---

## 8. Source architecture rules through Phase 12

Through the Unreached 3.0 release:

1. **PeopleGroups.org / IMB** is the canonical live mission-data source.
2. **Natural Earth** remains the canonical bundled base geography source.
3. **Reviewed Unreached editorial content** remains project-authored and citation controlled.
4. **Joshua Project** remains development/research-only unless a separately reviewed integration is explicitly approved.
5. Provider photos are not reusable merely because a provider record links to them.
6. Unknown data stays unknown.
7. Provider identifiers remain traceable in methodology/research surfaces even when hidden from the normal reading path.
8. Source-specific terminology may be simplified for the normal UI only when the underlying source assertion remains recoverable and accurate.

---

## 9. Runtime compatibility strategy

Phase 1 is not a wholesale provider rewrite.

The current PeopleGroups runtime shapes remain in place so V3 can proceed incrementally. The PeopleGroups adapter now routes GSEC classification through the provider-independent mission-classification boundary and carries the resulting source-scoped assertion alongside the legacy compatibility fields.

This gives Phase 2 a safe migration path:

```text
PeopleGroups API record
        ↓
PeopleGroups provider adapter
        ↓
source-scoped mission classification assertion   ← Phase 1
        ↓
normalized people/place/mission knowledge model  ← Phase 2
        ↓
editorial + product surfaces                      ← Phases 3+
```

The provider DTO is no longer allowed to be the conceptual definition of "unreached," even though existing V2 screens still consume compatibility objects during the rebuild.

---

## 10. Legal/source review completed for Phase 1

Reviewed on **16 September 2026**:

### PeopleGroups.org / IMB

- API documentation: `https://peoplegroups.org/using-the-api/`
- definitions: `https://peoplegroups.org/definitions/`
- research downloads: `https://peoplegroups.org/downloads/`
- privacy policy: `https://peoplegroups.org/privacy-policy/`

Observed current architecture basis:

- public read-only API;
- no authentication required;
- documented use for maps, prayer tools, and research applications;
- API described as beta and subject to change;
- data/research maintained by the Global Research Department of the International Mission Board.

### Joshua Project

- API terms: `https://api.joshuaproject.net/terms_of_use`
- general terms: `https://joshuaproject.net/help/terms`
- API documentation: `https://joshuaproject.net/api/v2/documentation`
- definitions: `https://joshuaproject.net/help/definitions`

Observed current constraints include non-commercial use, required visible linked attribution, no direct/high-overlap replication, revocable access, and deletion of downloaded/cached data if API access is terminated.

The source registry records the review date and remains the executable policy gate.

---

## 11. Phase 1 acceptance criteria

Phase 1 is complete only when all of the following are true:

- [x] the canonical V3 launch source strategy is explicit;
- [x] PeopleGroups.org / IMB is selected as the canonical launch source through Phase 12;
- [x] Joshua Project production activation remains blocked pending a later reviewed integration;
- [x] current source terms are re-reviewed and recorded with the Phase 1 date;
- [x] a provider-independent source-scoped classification boundary exists in runtime code;
- [x] PeopleGroups GSEC mapping uses that boundary rather than a free-standing provider boolean;
- [x] `unknown` remains a first-class classification state;
- [x] the generic normalized opposite of `unreached` is `not-unreached`, not a stronger `reached` claim;
- [x] compatibility runtime behavior and map formulas are not cosmetically altered to manufacture different results;
- [x] an automated Phase 1 gate verifies source-policy and classification invariants;
- [x] Phase 2 has an explicit handoff target without prematurely rebuilding the full normalized entity model.

---

## 12. Phase 2 handoff

Phase 2 — **Normalized Mission Knowledge Model** — may now proceed.

It should consume the Phase 1 classification assertion rather than redesign source semantics again. Its job is to separate provider DTOs from durable product entities, relationships, measurements, provenance, and assertions while preserving the launch-source decision made here.
