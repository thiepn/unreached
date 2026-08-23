# U12 — Production Data Activation Release Gates

**Phase:** Production Data Activation  
**Current subphase:** U12F — Reviewed Editorial Context Migration & Identity Correction  
**Status:** U12A–U12E merged and production-certified; U12F implementation in certification

## U12F identity correction to U12B–E

The original U12B architecture interpreted PeopleGroups `PEID` as a cross-country grouping key with multiple `PGID` country contexts beneath it. U12F's complete live-corpus audit on **23 August 2026** proved that assumption incorrect for the current API.

Certified current corpus:

- [x] 12,370 PGID records.
- [x] 12,370 PEID values.
- [x] 0 PEIDs with more than one PGID.
- [x] 0 PEIDs spanning more than one country.
- [x] 12,370/12,370 PGID numeric suffixes equal their PEID.

Corrected contract:

- [x] One current PEID/PGID pair represents one people-group-in-country source record.
- [x] Existing numeric PEID routes remain stable for compatibility.
- [x] PEID is **not** used as a cross-country aggregation key.
- [x] Duplicate PEIDs fail closed under the current certified contract.
- [x] Cross-country related-record discovery prioritizes source `PplNm` / ROP3 people name, followed by cluster and affinity bloc.
- [x] Matching source taxonomy never causes population, GSEC, religion or resource values to be collapsed into a synthetic global record.
- [x] U12B–E tests and visible wording are being corrected under U12F without weakening their source-policy or runtime-safety gates.

## U12A — Provider Foundation & Semantic Isolation

**Status:** complete.

- [x] PeopleGroups.org registered independently from Joshua Project.
- [x] Development ingestion policy certified.
- [x] PGID and PEID retained separately as provider fields.
- [x] IMB GSEC/SPI/LPI semantics kept source-specific.
- [x] No JPScale, Frontier, exact evangelical percentage, or Scripture-completeness values fabricated.
- [x] Population remains estimated and provenance/freshness are retained.
- [x] Third-party image references remain independently rights-gated.

## U12B — Real Data Runtime Architecture

**Status:** complete; transport/cache/security architecture merged in PR #24. Identity semantics corrected by U12F.

- [x] Direct read-only browser API selected as production transport.
- [x] `runtime-read` separated from public static release/browser redistribution.
- [x] PeopleGroups.org runtime reads approved; static mirror/redistribution blocked.
- [x] Browser CORS/API contract certified.
- [x] Compatibility route identity remains `people-entity:peoplegroups:<PEID>`.
- [x] Runtime now requires exactly one PGID context per current PEID wrapper.
- [x] GSEC constrained to 0–6.
- [x] GSEC 0–3 → neutral `unreached`; 4–6 → `other`; missing → `unknown`.
- [x] Country aggregation uses explicit people-group-in-country denominator and population coverage.
- [x] Raw Bible/Jesus Film availability values remain source labels.
- [x] Timeout, pagination/count/duplicate/schema checks, and hard corpus bounds fail closed.
- [x] Origin-local IndexedDB cache uses 24-hour fresh / 7-day stale windows.
- [x] Cache is best-effort and never a required dependency.
- [x] External-source live certification remains independent from deterministic CI.

Merge evidence:
- PR #24
- merge commit `93ca1a9a8edc8ed1c4f0e1e604ab73652fa3018d`

## U12C — Visible Real-Data Integration

**Status:** complete; merged in PR #25. People-profile aggregation semantics corrected by U12F.

- [x] Shared PeopleGroups runtime store prevents duplicate full-corpus loads.
- [x] People Explorer uses one current PEID/PGID source record per route.
- [x] People profiles expose PEID, PGID, country, GSEC, source taxonomy, raw resources and source update date.
- [x] No cross-country PEID population/GSEC rollup remains in current runtime UI.
- [x] `PplNm` / ROP3 people name is available as a source-backed related-record relationship.
- [x] Country Explorer combines Natural Earth with live PeopleGroups country-context records.
- [x] Country counts/shares identify their source-record denominator.
- [x] Global search indexes live people/country records only when opened.
- [x] Saved and Recent retain numeric route compatibility and old local snapshots remain readable.
- [x] Provider `PeopleDesc`/`LocationDesc` is shown only as attributed source material.
- [x] Third-party people photos remain excluded.
- [x] Live prayer subjects are current source records with GSEC 0–3.
- [x] Prayer wording uses fixed template `u12c-v1` and one-record country/GSEC/resource grounding.
- [x] No arbitrary person-by-person AI-generated factual or spiritual claims are created.

Merge evidence:
- PR #25, merge `6868b19d6759215501ecf60bf3765eb67c0ad83b`
- docs correction PR #26, merge `a4e532c0e1ae41b532d96c276da635e7c6555f9d`

## U12D — Live Mission Visualization

**Status:** complete, merged, production-certified.

- [x] Root atlas uses shared live PeopleGroups corpus.
- [x] Natural Earth remains geographic presentation layer.
- [x] GSEC 0–3 population share uses only records with known population + known GSEC.
- [x] GSEC 0–3 context share uses PGID records with known GSEC.
- [x] GSEC coverage measures field coverage.
- [x] Population-estimate coverage measures PGID field coverage, not census coverage.
- [x] People-group contexts is a direct PGID country-context count.
- [x] Missing denominator data stays no-data.
- [x] Frontier, JPScale, exact evangelical percentage and normalized Scripture-completeness layers are not inferred.
- [x] Mission is runtime-active with no static provider dataset.
- [x] Desktop/mobile browser matrix and external live certification passed.
- [x] Post-merge `unreached/pages-production` and `unreached/peoplegroups-live` green.

Evidence:
- PR #27 merge `d32b4d7ba1d9221d80fe3a8fe63a60c30a5f810f`
- mobile/browser hotfix PR #28 merge `8f50173a8567fdf8872261581aca09c242bd023c`

## U12E — Live Language & Resource Integration

**Status:** complete, merged, production-certified. Record terminology corrected by U12F.

- [x] Languages derive from the existing shared runtime corpus.
- [x] Only valid source `ROL` / ISO 639-3 values enter the language index.
- [x] Runtime language identity is `language:peoplegroups:<ISO6393>`.
- [x] Language name/family remain PeopleGroups.org values; Ethnologue is not used to fill taxonomy.
- [x] Counts now describe separate PEID/PGID source records, not inferred cross-country PEID entities.
- [x] Represented population sums known PGID estimates for the language with explicit field coverage.
- [x] GSEC 0–3, 4–6, and unknown PGID counts remain separate.
- [x] Language pages do not claim census speaker/resident totals.
- [x] `Bible`, `Jesus`, and `ResTot` remain source values with coverage/distribution.
- [x] Generic Bible availability is not converted to translation milestones.
- [x] ProgressBible and Ethnologue remain permission-gated.
- [x] Search/recent/profile links preserve individual PEID/PGID records.
- [x] No static source-derived language corpus ships in `dist`.
- [x] Deterministic/browser/live certification passed before merge.
- [x] PR #29 merged.
- [x] Merge commit `a3783a1ce2bf0551b387ec8efabf92a09043d988` has green `unreached/pages-production` and `unreached/peoplegroups-live` statuses.

## U12F — Reviewed Editorial Context Migration & Identity Correction

**Status:** implementation on `phase/u12f-editorial-context`; certification in progress.

### Reviewed source-record identity

- [x] Editorial schema v2 uses canonical `people-entity:peoplegroups:<PEID>` route identity.
- [x] Profiles store explicit target PEID and PeopleGroups identity provider.
- [x] Publication identity evidence includes PEID, PGID, verified name, country and language anchors.
- [x] Legacy IDs survive only as migration provenance.
- [x] `numericCoincidenceUsed` is fixed to `false`.
- [x] Live preflight fetches each editorial PGID directly and verifies the current provider identity fields.
- [x] Full-corpus certification validates every production editorial mapping after auditing overall PEID/PGID structure.
- [x] Original Fon `14343 + PG012319` mismatch was blocked by live certification rather than published.
- [x] Correct production Fon identity is **PEID 12319 / PG012319 / BEN / fon**.

### Editorial integrity

- [x] Evidence levels A/B/C retained.
- [x] Level B synthesis requires multiple distinct sources.
- [x] Level C interpretation restrictions retained.
- [x] Current claims require `asOf` + `reviewAfter`.
- [x] Stale published claims fail integrity checks.
- [x] Restricted material cannot publish.
- [x] Anti-stereotype guardrails remain enforced.
- [x] Publication checklist includes `identityMatchChecked`.
- [x] Missing reviewed context stays missing; no generated filler is substituted.

### First reviewed production profile

- [x] `public/data/context/editorial.v2.json` is non-fixture and separately authored.
- [x] First profile is **Fon of Benin — PEID 12319 / PG012319**.
- [x] Identity is anchored to the live API record plus explicit PGID/country/language/name evidence.
- [x] Historical context is independently sourced.
- [x] Religion is presented as an aggregate source-record label, not every individual's belief.
- [x] GSEC remains provider-native and scoped to PG012319.
- [x] Language/media resources are acknowledged when sources report them; absence is not fabricated.
- [x] Resource availability is not upgraded into translation completeness/distribution/comprehension claims.
- [x] Reviewed editorial publication does not authorize a static PeopleGroups mirror.

### Product / compatibility correction

- [x] People Explorer and profile pages describe one PEID/PGID source record per route.
- [x] `mixed` is removed from current live people status generation/filtering.
- [x] Legacy locally saved `mixed` snapshots may remain readable for compatibility.
- [x] Population on a people profile is a single PGID estimate, not a cross-country sum.
- [x] Prayer is scoped to the selected source record's country/GSEC/resource values.
- [x] Language pages count separate PEID/PGID records and do not merge same-named cross-country records.
- [x] Related-record UI uses `PplNm` / ROP3 people name before cluster/affinity relationships.
- [x] About, README and runtime architecture document the 23 Aug 2026 identity correction.

### Deterministic / browser / deployment gates

- [x] Synthetic legacy migration deliberately maps `people:999001` to different PEID `910001`.
- [x] Incorrect PGID editorial anchor is rejected.
- [x] Runtime fixtures enforce unique PEID/PGID records.
- [x] Duplicate PEID synthetic corpus fails closed.
- [x] Browser provider fixture uses one PEID per PGID and a separate same-ROP3-name record.
- [x] Context release check requires active reviewed-editorial v2 publication.
- [x] Dist gate allows only certified reviewed context files while runtime provider domains remain static-corpus-free.
- [x] Pages workflow validates deployed editorial schema/profile count/review contract.
- [ ] Final branch TypeScript/production build green.
- [ ] Full desktop/mobile Browser Certification green.
- [ ] U12F editorial and corrected people/language/prayer browser journeys green on final PR head.
- [ ] PeopleGroups fast editorial preflight green on final PR head.
- [ ] PeopleGroups full-corpus/browser certification green on final PR head.
- [ ] PR #30 merged.
- [ ] Merged `unreached/pages-production` green.
- [ ] Merged `unreached/peoplegroups-live` green.

## U12 completion boundary after U12F

A green U12F closes planned production-data activation: mission, people records, countries, languages/resources, prayer and reviewed editorial context all have production-safe publication modes, and the runtime identity semantics have been checked against the complete live provider corpus rather than assumed.

U12F does **not** authorize a PeopleGroups static database mirror, ProgressBible redistribution, Ethnologue reuse, third-party photo redistribution, or conversion into incompatible Scripture/mission taxonomies.

After U12F is merged and both post-merge production statuses are green, U12 should receive a final whole-system closure/certification pass before the next product-development cycle.
