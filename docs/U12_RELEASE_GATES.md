# U12 — Production Data Activation Release Gates

**Phase:** Production Data Activation  
**Status:** **COMPLETE — U12A through U12F merged and production-certified**  
**Release target:** **v1.0.0**

U12 closes the production-data boundary for Unreached. Mission, peoples, countries, languages/resources, prayer and reviewed editorial context all have explicit production-safe publication modes. The final identity contract was verified against the complete live PeopleGroups.org corpus rather than inferred from legacy assumptions.

## Final production baseline

- U12F PR: **#30**
- U12F merge commit: **`80c38901e1bfcc0de1eb94fc369de474b07d9771`**
- Post-merge `unreached/pages-production`: **success**
- Post-merge `unreached/peoplegroups-live`: **success**
- Package version: **1.0.0**
- Live site: **https://www.thiepn.dev/unreached/**

## Certified PeopleGroups identity contract

A complete live-corpus audit on **23 August 2026** established the current provider behavior used by this release:

- [x] 12,370 PGID records.
- [x] 12,370 PEID values.
- [x] 0 PEIDs attached to more than one PGID.
- [x] 0 PEIDs spanning more than one country.
- [x] 12,370/12,370 PGID numeric suffixes equal their PEID.
- [x] One current PEID/PGID pair is treated as one people-group-in-country source record.
- [x] Existing PEID route URLs remain stable for compatibility.
- [x] PEID is not used as a cross-country aggregation key.
- [x] Duplicate PEIDs fail closed under the certified current contract.
- [x] Related-record discovery prioritizes source `PplNm` / ROP3 people name, then cluster and affinity bloc.
- [x] Related taxonomy never collapses population, GSEC, religion or resource values into a synthetic global record.

## U12A — Provider Foundation & Semantic Isolation

**Status:** complete.

- [x] PeopleGroups.org registered independently from Joshua Project.
- [x] Development ingestion and runtime-read policy certified.
- [x] PGID and PEID retained as separate provider fields.
- [x] IMB GSEC/SPI/LPI semantics remain source-specific.
- [x] No JPScale, Frontier, exact evangelical percentage or Scripture-completeness values fabricated.
- [x] Population remains estimated with provenance/freshness retained.
- [x] Third-party image reuse remains separately rights-gated.

## U12B — Real Data Runtime Architecture

**Status:** complete; identity semantics corrected by U12F.

- [x] Direct read-only browser API is the production transport.
- [x] Runtime read permission is separate from static redistribution.
- [x] No static PeopleGroups mirror ships with the application.
- [x] Runtime requires the certified one-record PEID/PGID contract.
- [x] GSEC is constrained to 0–6.
- [x] GSEC 0–3 → `unreached`; 4–6 → `other`; missing → `unknown`.
- [x] Country aggregation uses explicit source-record denominators and coverage.
- [x] Raw Bible/Jesus/resource values remain source labels.
- [x] Timeout, pagination, advertised-count, duplicate, schema and corpus-bound checks fail closed.
- [x] Origin-local IndexedDB cache uses 24-hour fresh / 7-day stale windows.
- [x] Cache failure cannot block a healthy live API.
- [x] External live certification is independent from deterministic CI.

Evidence: PR #24, merge `93ca1a9a8edc8ed1c4f0e1e604ab73652fa3018d`.

## U12C — Visible Real-Data Integration

**Status:** complete; people-record semantics corrected by U12F.

- [x] Shared runtime store prevents duplicate full-corpus loads.
- [x] People Explorer uses one current PEID/PGID source record per route.
- [x] Profiles expose source identity, country, GSEC, taxonomy, resources and freshness.
- [x] No cross-country PEID population/GSEC rollup remains.
- [x] Country Explorer combines Natural Earth with live source records.
- [x] Search lazily indexes live people/country records.
- [x] Saved and Recent retain route compatibility and legacy local snapshots remain readable.
- [x] Provider descriptions are shown only as attributed source material.
- [x] Third-party people photos remain excluded.
- [x] Prayer subjects are current GSEC 0–3 source records.
- [x] Prayer uses fixed template `u12c-v1` with source-record grounding.
- [x] No arbitrary AI-generated person-level factual or spiritual claims are created.

Evidence: PR #25 merge `6868b19d6759215501ecf60bf3765eb67c0ad83b`; docs correction PR #26 merge `a4e532c0e1ae41b532d96c276da635e7c6555f9d`.

## U12D — Live Mission Visualization

**Status:** complete and production-certified.

- [x] Root atlas uses the shared live PeopleGroups corpus.
- [x] Natural Earth remains the geographic presentation layer.
- [x] GSEC 0–3 population share uses only records with known population + known GSEC.
- [x] GSEC 0–3 context share uses records with known GSEC.
- [x] GSEC coverage and population-estimate coverage remain explicit coverage measures.
- [x] People-group contexts is a direct source-record count.
- [x] Missing denominator data stays no-data.
- [x] Frontier, JPScale, exact evangelical percentage and normalized Scripture completeness are not inferred.
- [x] Mission runs from live provider data with no static provider corpus.
- [x] Desktop/mobile browser and external live certification passed.
- [x] Post-merge Pages and PeopleGroups statuses passed.

Evidence: PR #27 merge `d32b4d7ba1d9221d80fe3a8fe63a60c30a5f810f`; hotfix PR #28 merge `8f50173a8567fdf8872261581aca09c242bd023c`.

## U12E — Live Language & Resource Integration

**Status:** complete and production-certified; record terminology corrected by U12F.

- [x] Languages derive from the shared live runtime corpus.
- [x] Only valid source ROL / ISO 639-3 values enter the language index.
- [x] Runtime language identity is `language:peoplegroups:<ISO6393>`.
- [x] Language name/family remain PeopleGroups source values.
- [x] Counts describe separate PEID/PGID source records.
- [x] Represented population uses known source estimates with coverage.
- [x] GSEC 0–3, 4–6 and unknown counts remain separate.
- [x] Language pages do not claim census totals.
- [x] Bible, Jesus and total-resource values remain raw source fields with coverage/distribution.
- [x] Generic Bible availability is not converted to translation milestones.
- [x] ProgressBible and Ethnologue remain permission-gated.
- [x] No static source-derived language corpus ships in `dist`.
- [x] Deterministic, browser and live certification passed.
- [x] PR #29 merge `a3783a1ce2bf0551b387ec8efabf92a09043d988` received green Pages and PeopleGroups production statuses.

## U12F — Reviewed Editorial Context Migration & Identity Correction

**Status:** complete, merged and production-certified.

### Identity migration

- [x] Editorial schema v2 uses canonical `people-entity:peoplegroups:<PEID>` route identity.
- [x] Profiles store explicit target PEID and provider identity.
- [x] Publication evidence includes PEID, PGID, verified name, country and language anchors.
- [x] Legacy IDs survive only as migration provenance.
- [x] Numeric coincidence is structurally forbidden as identity evidence.
- [x] Live preflight verifies each editorial PGID against current provider identity fields.
- [x] Full-corpus certification verifies every production editorial mapping.
- [x] Incorrect draft mapping `PEID 14343 + PG012319` was blocked before publication.
- [x] Correct production Fon identity is **PEID 12319 / PG012319 / BEN / fon**.

### Editorial integrity

- [x] Evidence levels A/B/C retained.
- [x] Level B synthesis requires multiple distinct sources.
- [x] Level C interpretation restrictions retained.
- [x] Current claims require `asOf` + `reviewAfter`.
- [x] Stale published claims fail integrity checks.
- [x] Restricted material cannot publish.
- [x] Anti-stereotype guardrails remain enforced.
- [x] Publication checklist includes identity verification.
- [x] Missing reviewed context stays missing; no generated filler is substituted.

### First reviewed production profile

- [x] `public/data/context/editorial.v2.json` is non-fixture and separately authored.
- [x] First profile is **Fon of Benin — PEID 12319 / PG012319**.
- [x] Identity is anchored to the live provider record and explicit identity evidence.
- [x] Historical context is independently sourced.
- [x] Religion is presented as aggregate source-record language, not every individual's belief.
- [x] GSEC remains provider-native and scoped to PG012319.
- [x] Language/media resources are acknowledged where sources report them.
- [x] Resource availability is not upgraded into translation-completeness or comprehension claims.
- [x] Editorial publication does not authorize a static PeopleGroups mirror.

### Product correction

- [x] People Explorer/profile describe one PEID/PGID source record per route.
- [x] `mixed` is removed from current live people status generation/filtering.
- [x] Legacy locally saved `mixed` snapshots remain readable only for compatibility.
- [x] People-profile population is one PGID estimate, not a cross-country sum.
- [x] Prayer is scoped to the selected source record's country/GSEC/resource values.
- [x] Language pages count separate PEID/PGID records.
- [x] Related-record UI uses ROP3 people name before cluster/affinity relationships.
- [x] About, README and runtime architecture document the corrected identity model.

### Final U12F certification evidence

- [x] Deterministic duplicate-PEID rejection passed.
- [x] Explicit legacy-ID → different-PEID migration test passed.
- [x] Mismatched editorial PGID rejection passed.
- [x] Final TypeScript/production build passed.
- [x] Full desktop/mobile Browser Certification passed on the final PR head.
- [x] Editorial, people, language and prayer browser journeys passed.
- [x] PeopleGroups fast editorial identity preflight passed.
- [x] Complete 12,370-record PeopleGroups corpus audit passed.
- [x] Browser CORS/API certification passed.
- [x] PR #30 merged as `80c38901e1bfcc0de1eb94fc369de474b07d9771`.
- [x] Merged `unreached/pages-production` passed.
- [x] Merged `unreached/peoplegroups-live` passed.

## Final U12 closure

U12 is complete when the release-candidate closure branch passes the same deterministic, browser and live-provider gates and the resulting main commit deploys successfully.

Release certification now treats `release/**` branches as first-class targets:

- [x] Deterministic CI runs on release branches.
- [x] Full browser certification runs on release branches.
- [x] Live PeopleGroups full-corpus certification runs on release branches.
- [x] Release PR browser CORS/API certification is enabled.
- [x] Package version is already `1.0.0`.
- [x] No known production-data gate remains intentionally open.

See [`U12_FINAL_CERTIFICATION.md`](U12_FINAL_CERTIFICATION.md) for the final whole-system release checklist.

## Explicit non-authorizations

U12 completion does **not** authorize:

- a static PeopleGroups.org database mirror,
- ProgressBible redistribution,
- Ethnologue proprietary taxonomy reuse,
- third-party people-photo redistribution,
- conversion of generic resource fields into incompatible Scripture-completeness taxonomies,
- conversion of IMB mission fields into Joshua Project taxonomies.

These boundaries remain part of the release contract.
