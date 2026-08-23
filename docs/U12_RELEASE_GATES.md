# U12 — Production Data Activation Release Gates

**Phase:** Production Data Activation  
**Current subphase:** U12E — Live Language & Resource Integration  
**Status:** U12A–U12D complete and production-certified; U12E implementation in certification

## U12A — Provider Foundation & Semantic Isolation

**Status:** complete.

- [x] PeopleGroups.org registered independently from Joshua Project.
- [x] Development ingestion policy certified.
- [x] PGID and PEID preserved separately.
- [x] IMB GSEC/SPI/LPI semantics kept source-specific.
- [x] No JPScale, Frontier, exact evangelical percentage, or Scripture-completeness values fabricated.
- [x] Population remains estimated and provenance/freshness are retained.
- [x] Third-party image references remain independently rights-gated.

## U12B — Real Data Runtime Architecture

**Status:** complete and merged in PR #24.

- [x] Direct read-only browser API selected as production transport.
- [x] `runtime-read` separated from public static release/browser redistribution in source policy.
- [x] PeopleGroups.org runtime reads approved; static mirror/redistribution remains blocked.
- [x] Browser CORS/API contract certified.
- [x] Canonical runtime identity: `people-entity:peoplegroups:<PEID>`.
- [x] Every PGID retained as a country context below its PEID.
- [x] GSEC constrained to documented 0–6 range.
- [x] GSEC 0–3 derives only the neutral `unreached` runtime label; 4–6 remains `other` rather than being overclaimed as `reached`.
- [x] Country aggregation has explicit people-group-in-country denominator and population coverage.
- [x] Raw Bible/Jesus Film availability descriptors remain source labels.
- [x] 10-second request timeout, pagination/count/duplicate/schema checks, and hard corpus bounds fail closed.
- [x] Origin-local IndexedDB cache uses 24-hour fresh / 7-day stale windows.
- [x] Cache is best-effort, validates one coherent snapshot, and never becomes a required dependency.
- [x] Dedicated external-source live certification exists independently from deterministic application CI.

### U12B merge evidence

- PR: #24 — **merged**
- Merge commit: `93ca1a9a8edc8ed1c4f0e1e604ab73652fa3018d`

## U12C — Visible Real-Data Integration

**Status:** complete and merged in PR #25.

- [x] Shared PeopleGroups runtime store prevents duplicate full-corpus loads during one application session.
- [x] People Explorer uses live PEID entities.
- [x] People profiles expose PGID country contexts, GSEC, source taxonomy, raw resource labels, source update dates, and explicit partial-population semantics.
- [x] Country Explorer combines Natural Earth geography with live PeopleGroups.org country-context records.
- [x] Country counts/shares identify the source-record denominator and do not masquerade as census statistics.
- [x] Global search indexes live PEID/country records only when search is opened.
- [x] Saved and Recent use PEID routes while remaining backward-compatible with old local snapshots.
- [x] Legacy Joshua-ID-bound context/language/prayer joins are removed from live PEID routes.
- [x] Provider `PeopleDesc`/`LocationDesc` text is shown only as attributed source material.
- [x] Third-party people photos remain excluded.
- [x] Live prayer subjects are limited to PEIDs with at least one GSEC 0–3 country context.
- [x] Prayer wording uses fixed release-certified template `u12c-v1`.
- [x] Runtime interpolation is limited to source-backed identity, country, GSEC, and resource fields.
- [x] No person-by-person AI-generated factual or spiritual claims are created.

### U12C merge evidence

- PR: #25 — **merged**
- Merge commit: `6868b19d6759215501ecf60bf3765eb67c0ad83b`
- Post-merge documentation correction: PR #26, merge commit `a4e532c0e1ae41b532d96c276da635e7c6555f9d`.

## U12D — Live Mission Visualization

**Status:** complete, merged, and production-certified.

- [x] Root mission atlas uses the shared PeopleGroups.org runtime corpus rather than the legacy static mission dataset loader.
- [x] Natural Earth remains the geographic presentation layer.
- [x] `GSEC 0–3 population share` uses only contexts with both known population and known GSEC in its denominator.
- [x] `GSEC 0–3 context share` counts PGID country contexts with known GSEC.
- [x] `GSEC coverage` measures source-field coverage rather than mission status.
- [x] `Population estimate coverage` measures PGID-record population-field coverage rather than national census coverage.
- [x] `People-group contexts` is a direct PGID country-context count, not a unique global PEID count.
- [x] Missing population denominators remain no-data rather than becoming false zeroes.
- [x] Frontier, JPScale, exact evangelical percentage and normalized Scripture-completeness layers are not inferred.
- [x] `mission` is runtime-active with no static dataset URL.
- [x] Deterministic visualization tests and the full desktop/mobile browser matrix pass.
- [x] Mobile WebKit map-sheet interaction was corrected and certified after the phase merge.
- [x] PeopleGroups external full-corpus/browser certification passes.
- [x] Merged `unreached/pages-production` status is green.
- [x] Merged `unreached/peoplegroups-live` status is green.

### U12D merge evidence

- PR #27 — **U12D — live mission visualization**
- Merge commit: `d32b4d7ba1d9221d80fe3a8fe63a60c30a5f810f`
- Post-merge browser/mobile hotfix: PR #28
- Hotfix merge commit: `8f50173a8567fdf8872261581aca09c242bd023c`
- Final production statuses on the hotfix merge commit:
  - `unreached/pages-production` → success
  - `unreached/peoplegroups-live` → success

## U12E — Live Language & Resource Integration

**Status:** implementation on `phase/u12e-live-language-resources`; certification in progress.

### Runtime language identity

- [x] Language records are derived from the existing shared PeopleGroups runtime store; no second corpus loader is introduced.
- [x] Only PGID contexts with a syntactically valid source `ROL` / ISO 639-3 code enter the live language index.
- [x] Runtime language identity is `language:peoplegroups:<ISO6393>`.
- [x] Language name and family remain PeopleGroups.org source fields; Ethnologue is not used to fill taxonomy.
- [x] Unique PEID count and PGID context count remain separate.
- [x] Country relationships remain PGID country-context relationships.

### Population and GSEC semantics

- [x] Represented population is the sum of known PGID context population estimates for the language.
- [x] Population field coverage is shown explicitly; missing populations are not converted to zero in the denominator.
- [x] GSEC 0–3, GSEC 4–6, and unknown context counts remain separate.
- [x] Language pages do not claim a census total of all speakers or residents.

### Bible / media resource semantics

- [x] `Bible` values remain raw PeopleGroups.org source availability labels.
- [x] `Jesus` values remain raw PeopleGroups.org source availability labels.
- [x] `ResTot` remains a source-reported resource-count field and is exposed with field coverage.
- [x] Conflicting labels across PGID contexts are shown as a distribution rather than collapsed into a stronger claim.
- [x] Generic Bible availability is **not** converted to `translation-needed`, `portions`, `New Testament`, or `complete Bible`.
- [x] ProgressBible registered translation-progress data remains excluded without written permission.
- [x] Ethnologue proprietary linguistic data remains excluded without a compatible license.

### Product integration

- [x] `#/languages` uses live runtime records and exposes query, GSEC-context, raw Bible-label, and sorting controls.
- [x] `#/languages/:ISO6393` exposes source identity, people/country relationships, population coverage, GSEC counts, raw resource-label distributions, load date, update date, and denominator.
- [x] Language profile links route to PeopleGroups PEIDs rather than legacy Joshua-shaped people IDs.
- [x] Global search indexes live language records from the shared corpus.
- [x] Browser-local recent history records live language visits.
- [x] Source/loading/error/stale-cache states are visible on language surfaces.
- [x] `public/data/languages/status.json` declares `runtime-api`, PeopleGroups source, and no static dataset URL.
- [x] Production dist policy forbids a source-derived static language corpus.

### Deterministic and browser gates

- [x] Deterministic live-language aggregation test covers ISO grouping, PEID/country counts, partial population, GSEC, raw Bible/Jesus labels, resource-count fields, relationships, filters, denominator, and source freshness.
- [x] Deterministic test rejects `complete-bible`, `new-testament`, `translation-needed`, Frontier and JPScale leakage from the live model.
- [x] Browser journey covers live language explorer → profile and verifies partial-population/resource-label semantics.
- [x] Global-search browser journey covers ISO language search → live profile.
- [ ] Final branch TypeScript/production build green.
- [ ] Full desktop/mobile Browser Certification green.
- [ ] U12E language journeys green on the final PR head.
- [ ] PeopleGroups full-corpus/browser live certification green on the final PR head.
- [ ] PR merged.
- [ ] Merged `unreached/pages-production` status green.
- [ ] Merged `unreached/peoplegroups-live` status green.

## Remaining production-data boundary after U12E

The separately reviewed **editorial-context dataset** remains gated. Its current U7 integrity model is intentionally claim-by-claim, evidence-level-aware, freshness-aware, sensitivity-aware, and bound to legacy `people:<sourcePeopleId>` records. It must not be attached to PeopleGroups PEIDs by numeric coincidence. A later phase must design and certify an explicit PEID migration/review process before that editorial layer can be reactivated.

A green U12E authorizes **direct runtime language/resource aggregation from PeopleGroups.org only**. It does not authorize a static PeopleGroups.org database mirror, ProgressBible redistribution, Ethnologue reuse, third-party photo redistribution, or semantic conversion into incompatible Scripture/mission taxonomies.
