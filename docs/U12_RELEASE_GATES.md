# U12 — Production Data Activation Release Gates

**Phase:** Production Data Activation  
**Current subphase:** U12C — Visible Real-Data Integration  
**Status:** U12A and U12B certified/merged; U12C implementation in certification

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
- Pre-merge deterministic CI and browser/CORS certification passed.

## U12C — Visible Real-Data Integration

**Status:** implementation complete on `phase/u12c-visible-real-data`; certification in progress.

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

### Publication state

- [x] `peoples` → `runtime-api`, active, no static dataset URL.
- [x] `countries` → `runtime-api`, active, no static dataset URL.
- [x] `prayer` → `runtime-api`, active, no static dataset URL.
- [x] `mission`, `context`, and `languages` remain separately gated.
- [x] PeopleGroups.org `publicReleaseAllowed` and `browserRedistributionAllowed` remain false.
- [x] PeopleGroups.org `runtimeReadAllowed` remains true.

### Automated gates

- [x] Deterministic visible-model test covers PEID/PGID/GSEC, population coverage, raw resource labels, filters, and prayer template invariants.
- [x] Normal browser suite intercepts a valid PeopleGroups corpus so deterministic CI does not depend on provider uptime.
- [x] Dedicated external PeopleGroups live certification remains separate.
- [x] Pages deployment policy updated for runtime-active People/Countries/Prayer.
- [ ] Final branch TypeScript/production build green.
- [ ] Full desktop/mobile Browser Certification green.
- [ ] U12C end-to-end explorer → profile → country and search → save → prayer journeys green.
- [ ] PR #25 merged.
- [ ] Merged `unreached/pages-production` status green.
- [ ] Merged `unreached/peoplegroups-live` status green from the production origin.

## U12C promotion rule

U12C may merge only when deterministic CI and the full browser matrix pass on the final PR head. After merge, production activation is certified only when both the Pages production status and the PeopleGroups live production-origin status are green.

A green U12C does **not** authorize a static PeopleGroups.org dataset mirror or third-party photo redistribution.
