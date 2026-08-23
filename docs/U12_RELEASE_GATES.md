# U12 — Production Data Activation Release Gates

**Phase:** Production Data Activation  
**Current subphase:** U12F — Reviewed Editorial Context Migration & Activation  
**Status:** U12A–U12E complete and production-certified; U12F implementation in certification

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

**Status:** complete, merged, and production-certified.

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

### Product integration and certification

- [x] `#/languages` uses live runtime records and exposes query, GSEC-context, raw Bible-label, and sorting controls.
- [x] `#/languages/:ISO6393` exposes source identity, people/country relationships, population coverage, GSEC counts, raw resource-label distributions, load date, update date, and denominator.
- [x] Language profile links route to PeopleGroups PEIDs rather than legacy Joshua-shaped people IDs.
- [x] Global search indexes live language records from the shared corpus.
- [x] Browser-local recent history records live language visits.
- [x] Source/loading/error/stale-cache states are visible on language surfaces.
- [x] `public/data/languages/status.json` declares `runtime-api`, PeopleGroups source, and no static dataset URL.
- [x] Production dist policy forbids a source-derived static language corpus.
- [x] Deterministic live-language aggregation and semantic-exclusion tests pass.
- [x] Live language explorer/profile and global-search browser journeys pass.
- [x] Final branch TypeScript/production build passed.
- [x] Full desktop/mobile Browser Certification passed.
- [x] PeopleGroups full-corpus/browser live certification passed.
- [x] PR #29 merged.
- [x] Merged `unreached/pages-production` status is green.
- [x] Merged `unreached/peoplegroups-live` status is green.

### U12E merge evidence

- PR #29 — **U12E — live language & resource integration**
- Final PR head: `d2b435ae874bdf7234819450a96b777ed96485f0`
- Squash merge commit: `a3783a1ce2bf0551b387ec8efabf92a09043d988`
- Final production statuses on the merge commit:
  - `unreached/pages-production` → success
  - `unreached/peoplegroups-live` → success

## U12F — Reviewed Editorial Context Migration & Activation

**Status:** implementation on `phase/u12f-editorial-context`; certification in progress.

### PEID-native editorial identity

- [x] Editorial context schema upgraded to v2 with canonical `people-entity:peoplegroups:<PEID>` identity.
- [x] Each profile stores an explicit target PEID and PeopleGroups identity-provider declaration.
- [x] Published identity evidence requires provider PEID and PGID evidence, plus reviewed name/country/language anchors.
- [x] Legacy IDs may survive only as migration provenance.
- [x] `numericCoincidenceUsed` is structurally fixed to `false`; an old numeric ID cannot establish a new PEID mapping by coincidence.
- [x] PEID-native profiles cannot pretend to carry legacy provenance.
- [x] Live-corpus certification verifies PEID, PGID, country, language and verified-name anchors against the current PeopleGroups runtime model.

### Editorial integrity

- [x] U7 evidence levels A/B/C remain intact.
- [x] Level B synthesis still requires at least two distinct sources.
- [x] Level C remains labeled interpretation, cannot claim high certainty, and requires an interpretation note.
- [x] Current claims require `asOf` and `reviewAfter` dates.
- [x] Published profiles fail when current claims become stale.
- [x] Restricted material cannot be published.
- [x] Existing anti-stereotype shortcut language remains prohibited.
- [x] Publication review checklist now explicitly includes `identityMatchChecked`.
- [x] Missing reviewed context remains missing; no AI-generated filler is substituted.

### First reviewed production publication

- [x] `public/data/context/editorial.v2.json` is non-fixture and separately authored from the live PeopleGroups database.
- [x] First production profile is Fon / PeopleGroups PEID 14343.
- [x] Fon identity is anchored to PeopleGroups PEID/PGID/country/language evidence rather than number coincidence.
- [x] Fon historical context is source-cited independently.
- [x] Religion treatment is explicitly aggregate/contextual rather than generalized to every individual.
- [x] Why-unreached material distinguishes current source mission status from language/media availability and does not claim that translated resources are absent when sources report resources.
- [x] Production status uses `reviewed-editorial`, schema v2, explicit profile count, and PeopleGroups identity provider.
- [x] Reviewed editorial publication does not authorize a static PeopleGroups database mirror.

### Product integration

- [x] People PEID profiles render reviewed editorial context when a certified profile exists.
- [x] Editorial UI exposes the verified PEID/PGID/country/language identity basis.
- [x] Claim-level citations, evidence labels, freshness and review metadata remain visible.
- [x] Profiles without reviewed context retain the live source profile and show a clear unpublished-context state.
- [x] About/methodology explains partial editorial coverage and identity-proof requirements.

### Deterministic, browser, release and deployment gates

- [x] Synthetic migration test deliberately migrates legacy `people:999001` to different PEID `910001`.
- [x] Deterministic test rejects a deliberately incorrect PGID identity anchor.
- [x] Context release check requires active reviewed-editorial v2 publication.
- [x] Dist gate allows only certified reviewed context files while runtime PeopleGroups domains remain static-corpus-free.
- [x] PeopleGroups live workflow validates every production editorial identity against the current full provider corpus.
- [x] Browser journey verifies a reviewed PEID article renders with identity evidence and no legacy route leakage.
- [x] Browser journey verifies a PEID without editorial coverage receives no fabricated article.
- [x] Pages production workflow validates deployed editorial schema, profile count, identity contract and review state.
- [ ] Final branch TypeScript/production build green.
- [ ] Full desktop/mobile Browser Certification green.
- [ ] U12F editorial browser journeys green on final PR head.
- [ ] PeopleGroups full-corpus/browser + editorial identity certification green on final PR head.
- [ ] PR merged.
- [ ] Merged `unreached/pages-production` status green.
- [ ] Merged `unreached/peoplegroups-live` status green.

## U12 completion boundary after U12F

A green U12F completes the planned **production-data activation** boundary: mission, people, countries, languages/resources, prayer and reviewed editorial context all have production-safe publication modes. Editorial context coverage remains intentionally partial and can expand profile-by-profile without weakening the release gate.

U12F still does **not** authorize a PeopleGroups.org static database mirror, ProgressBible redistribution, Ethnologue reuse, third-party photo redistribution, or semantic conversion into incompatible Scripture/mission taxonomies.

After U12F is merged and production-certified, U12 should receive a final whole-system closure/certification pass before the project moves into a new product-development cycle focused on broader reviewed context coverage, UX/product depth, performance and further source-safe exploration.
