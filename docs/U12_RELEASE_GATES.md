# U12 — Production Data Activation Release Gates

**Phase:** Production Data Activation  
**Current subphase:** U12D — Live Mission Visualization  
**Status:** U12A–U12C merged; U12D implementation in certification

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

### Product integration

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

### Prayer publication

- [x] Live prayer subjects are limited to PEIDs with at least one GSEC 0–3 country context.
- [x] Prayer wording uses fixed release-certified template `u12c-v1`.
- [x] Runtime interpolation is limited to source-backed identity, country, GSEC, and resource fields.
- [x] No person-by-person AI-generated factual or spiritual claims are created.
- [x] 2/5/10-minute flows remain pacing aids with no score, streak, completion rank, or public activity record.

### U12C merge evidence

- PR: #25 — **merged**
- Merge commit: `6868b19d6759215501ecf60bf3765eb67c0ad83b`
- PeopleGroups live certification observed green on the accepted U12C head.
- Post-merge documentation correction: PR #26, merge commit `a4e532c0e1ae41b532d96c276da635e7c6555f9d`.
- The latest post-docs Pages production status was red and is treated as an open release-hardening item to re-certify during U12D rather than being silently ignored.

## U12D — Live Mission Visualization

**Status:** implementation complete on `phase/u12d-live-mission-visualization`; certification in progress.

### Live atlas semantics

- [x] Root mission atlas uses the shared PeopleGroups.org runtime corpus rather than the legacy static mission dataset loader.
- [x] Natural Earth remains the geographic presentation layer.
- [x] `GSEC 0–3 population share` uses only contexts with both known population and known GSEC in its denominator.
- [x] `GSEC 0–3 context share` counts PGID country contexts with known GSEC.
- [x] `GSEC coverage` measures source-field coverage rather than mission status.
- [x] `Population estimate coverage` measures PGID-record population-field coverage rather than national census coverage.
- [x] `People-group contexts` is a direct PGID country-context count, not a unique global PEID count.
- [x] Missing population denominators remain no-data rather than becoming false zeroes.
- [x] Map selection exposes the PeopleGroups.org country-context denominator.
- [x] Old `?layer=unreached` URLs migrate safely to the new default layer.

### Semantic exclusions

- [x] Frontier is not inferred from PeopleGroups.org.
- [x] Joshua Project JPScale is not inferred from PeopleGroups.org.
- [x] Exact evangelical percentage layers are not fabricated from `EvngLvl` text.
- [x] Raw Bible availability is not converted into a normalized Scripture-completeness map layer.
- [x] Unknown GSEC remains visible and excluded from GSEC-known denominators.

### Publication state

- [x] `mission` → `runtime-api`, active, no static dataset URL.
- [x] `peoples` → `runtime-api`, active, no static dataset URL.
- [x] `countries` → `runtime-api`, active, no static dataset URL.
- [x] `prayer` → `runtime-api`, active, no static dataset URL.
- [x] `context` and `languages` remain separately gated.
- [x] PeopleGroups.org `publicReleaseAllowed` and `browserRedistributionAllowed` remain false.
- [x] PeopleGroups.org `runtimeReadAllowed` remains true.
- [x] Dist certification forbids source-derived static datasets in Mission/People/Countries/Prayer runtime directories.

### Automated gates

- [x] Deterministic U12D visualization test covers population/context ratios, coverage, no-data semantics and all five live layers.
- [x] Deterministic U12D test explicitly rejects Frontier, JPScale, normalized Scripture-completeness and fabricated evangelical-percentage leakage.
- [x] Cross-browser U12D journey uses the intercepted PeopleGroups corpus and covers map → country selection → layer switch.
- [x] Browser journey supports desktop and mobile map controls.
- [x] Legacy static mission loader treats `runtime-api` as intentionally non-static rather than throwing.
- [ ] Final branch TypeScript/production build green.
- [ ] Full desktop/mobile Browser Certification green.
- [ ] U12D live-map end-to-end journey green on the final PR head.
- [ ] PeopleGroups external live certification green on the final PR head.
- [ ] PR merged.
- [ ] Merged `unreached/pages-production` status green.
- [ ] Merged `unreached/peoplegroups-live` status green from production origin.

## U12D promotion rule

U12D may merge only when deterministic CI, the full browser matrix, and the live PeopleGroups contract pass on the final PR head. After merge, production activation is certified only when both `unreached/pages-production` and `unreached/peoplegroups-live` are green.

A green U12D authorizes **direct runtime visualization only**. It does **not** authorize a static PeopleGroups.org database mirror, third-party photo redistribution, or semantic conversion into Joshua Project fields.
