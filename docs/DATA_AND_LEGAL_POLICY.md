# Unreached — Data, Licensing & Provenance Policy

**Status:** production policy  
**Reviewed:** 20 September 2026

This policy describes the external data, media and authored content that may enter the public Unreached application and the conditions under which they may be used.

## 1. Governing rule

Public availability is not the same as permission to redistribute. External material enters production only when its intended use is supported by published terms, a compatible license, written permission, or applicable law.

The repository does not relicense third-party data or media.

## 2. Current production architecture

Production atlas mission data is **not** a bundled dataset. People, country, language, religion, GSEC and resource records are read at runtime from the public PeopleGroups.org API. A validated copy may be stored privately in a user's browser for resilience. Phase 14 may also retain a bounded device-private history of mission-source state transitions actually observed by that browser. Neither mechanism is exposed as a public download or API.

PeopleGroups.org remains the canonical atlas runtime. V3 Phase 13 adds a narrowly scoped, optional Joshua Project comparison layer only for manually reviewed people-group-in-country identity links. Joshua Project responses are requested on demand through the Unreached Worker, reduced to a small comparison schema, returned with no-store handling and not persisted in the Unreached corpus or browser data stores.

Natural Earth geography is bundled because Natural Earth places its map data in the public domain.

Reviewed contextual articles are project-authored publication shards with explicit citations and PeopleGroups.org source-record identity evidence. They are separate from the provider corpus.

## 3. PeopleGroups.org / IMB Global Research

**Status:** CONDITIONAL — APPROVED FOR PUBLIC RUNTIME ACCESS  
**Provider:** Global Research Department of the International Mission Board  
**Reviewed:** 20 September 2026

PeopleGroups.org currently documents a free, public, read-only API and explicitly suggests maps, prayer tools and research applications. That published runtime-use invitation is the basis for Unreached's public browser integration.

Approved production use:

- direct read-only runtime API access;
- source-backed maps, people, country, language and prayer-subject views;
- narrow source-native aggregations with coverage disclosure;
- a validated device-local resilience cache;
- a bounded device-private history of observed source-state transitions, capped per PGID and excluded from sync/server storage/export;
- source-evidence language/resource relationships using public API fields with explicit PGID denominators;
- attribution and links back to PeopleGroups.org.

Not approved by Unreached policy:

- a static or downloadable mirror of the complete provider corpus;
- a public Unreached API that republishes the corpus;
- claiming ownership of or relicensing provider records;
- redistribution of provider-linked or third-party people photos without separate rights review;
- silently converting PeopleGroups.org fields into Joshua Project JPScale/Frontier or stronger Scripture-completeness claims;
- backfilling, interpolating or inferring historical source states that were not actually observed;
- converting Bible/Jesus/resource fields into stronger translation milestones not supplied by the source;
- treating shared language-family labels as proof of mutual intelligibility or dialect equivalence;
- treating same-country language records as proof of bilingualism or cross-language resource usability.

The device-local cache is an operational continuity mechanism, not a statement that Unreached has obtained a broad redistribution license. If the provider publishes new terms restricting runtime use or local caching, affected behavior must be disabled or revised before the next release.

### Attribution

Where practical, identify the source as:

**PeopleGroups.org / Global Research Department of the International Mission Board**

The About/source UI and repository notices must keep provider attribution visible and must not imply affiliation, endorsement or ownership by Unreached.

## 3A. Phase 14 historical mission intelligence

**Status:** CONDITIONAL — DEVICE-PRIVATE OBSERVATION HISTORY ONLY  
**Reviewed:** 19 September 2026

Phase 14 may retain a bounded history of PeopleGroups.org mission-source state transitions actually observed on the current device. PeopleGroups.org documents a source-native `UpdatedDate`. It also publishes historical GSEC overview PDFs at global aggregate level for 2011–2024 and states that archive is no longer currently updated. Those reports are not treated as individual PGID revision history.

Approved use:

- store only the narrow source-backed mission fields used by the profile plus provider `UpdatedDate` and local first/last-observed timestamps;
- retain at most 24 timeline points for one PGID;
- de-duplicate consecutive repeated observations of the same tracked state;
- display concrete field changes between adjacent locally observed states;
- reset the local history to the current source state;
- link users to the provider-hosted historical GSEC overview archive without copying those PDF reports into the Phase 14 application corpus.

Not approved:

- backfilling, interpolation or reconstruction of source states the device never observed;
- a public or downloadable historical PeopleGroups.org snapshot archive;
- copying or parsing the provider-hosted historical GSEC overview PDF archive into a new Unreached dataset without a separate rights and methodology review;
- server-side history storage, D1 history, account sync or server-held export of this ledger;
- claims that a changed field proves progress, decline, causation or ministry effectiveness;
- storing Joshua Project comparison responses in the historical ledger.

This local history does not change the rights basis for the canonical provider corpus and does not create a public redistribution channel.

## 3B. Phase 15 Scripture & language intelligence

**Status:** CONDITIONAL — SOURCE-EVIDENCE RELATIONSHIPS ONLY  
**Reviewed:** 20 September 2026

Phase 15 may use PeopleGroups.org `ROL`, `Lang`, `LangFamily`, `Bible`, `Jesus`, `ResTot` and `UpdatedDate` fields already returned by the approved public runtime API.

Approved use:

- aggregate exact source labels by ISO 639-3 language with explicit PGID denominators;
- distinguish complete, partial and absent reporting coverage;
- distinguish uniform versus mixed source labels;
- show Bible, Jesus Film and resource-count fields observed together on the same PGID;
- show other languages sharing a PeopleGroups.org family label;
- show other primary-language records occurring in the same countries.

Not approved:

- inferring Scripture portions, New Testament, complete Bible or translation-progress milestones from the current API fields;
- treating a shared family label as proof of mutual intelligibility, dialect equivalence or interchangeable resources;
- treating country co-presence as evidence of bilingualism;
- direct ProgressBible registered-data ingestion without written permission;
- proprietary Ethnologue supplementation without an appropriate license or permission.

ProgressBible and Ethnologue therefore remain excluded as direct Phase 15 providers.

## 3C. Phase 16 mission knowledge graph

**Status:** DERIVED IN-MEMORY EVIDENCE GRAPH ONLY  
**Reviewed:** 20 September 2026

Phase 16 may derive a bounded per-profile graph from already loaded, already permitted PeopleGroups.org runtime data and reviewed Unreached editorial publications.

Approved graph relationships:

- direct PGID source fields with exact source-field provenance;
- explicit PeopleGroups.org taxonomy labels;
- related people records only when an explicit taxonomy field matches;
- reviewed editorial profile → claim → citation relationships.

Not approved:

- fuzzy-name, embedding, geographic-proximity or behavioral similarity edges;
- hidden relevance/confidence scores that rank people groups or sources;
- merging editorial synthesis into provider facts;
- treating missing edges as proof that a real-world relationship does not exist;
- persisting or silently graphing Joshua Project no-store responses;
- creating a downloadable graph mirror of the provider corpus.

The graph is derived in memory and adds no D1, Worker, IndexedDB graph store, private-sync field or analytics telemetry.

## 3D. Phase 17 advanced geographic intelligence

**Status:** COUNTRY-CONTEXT SOURCE EVIDENCE ONLY  
**Reviewed:** 20 September 2026

Phase 17 may derive a country-level distribution view from already loaded PeopleGroups.org and Natural Earth data.

Approved:

- the current PGID country context;
- other PGIDs reporting the exact same normalized PeopleGroups.org ROP3 people-name field (`PplNm`);
- country-level grouping;
- Natural Earth continent grouping;
- sums of known PGID population estimates with explicit field-coverage counts;
- explicit user-triggered loading of the wider PeopleGroups corpus.

Not approved:

- treating same cluster or same affinity bloc as a people distribution footprint;
- fuzzy-name or embedding-based geographic links;
- city/settlement inference from provider coordinates;
- migration-route, origin/destination or settlement chronology inference;
- converting cross-country source-taxonomy matches into a diaspora claim;
- presenting summed PGID population estimates as a census, global population, diaspora population or geographic share.

Diaspora status remains **not established** unless a separately reviewed source explicitly supplies compatible migration/diaspora evidence.

Phase 17 adds no new external provider and does not broaden PeopleGroups.org or Natural Earth redistribution rights.

## 3E. Phase 18 guided mission atlas

**Status:** SOURCE-GROUNDED LEARNING LAYER ONLY  
**Reviewed:** 20 September 2026

Phase 18 may compose already approved Natural Earth, PeopleGroups.org and reviewed Unreached editorial data into a guided Region → Country → People → Prayer learning sequence.

Approved:

- regional prose generated only from current atlas geography and mission-source counts;
- deterministic country sampling for manageable learning breadth;
- preference for reviewed editorial profiles as a teaching-depth criterion;
- URL-only journey state using public region IDs and PEIDs;
- cross-page validation that journey parameters match the current country/people/prayer record.

Not approved:

- unsourced cultural, historical, political or strategic regional essays;
- ranking countries or people by mission importance, urgency, population, prayer activity, saved status, source disagreement or model score;
- storing guided-atlas completion/progress in browser persistence, private sync or server storage;
- treating reviewed editorial coverage as a mission-priority signal;
- changing Prayer 3.0 eligibility or wording.

The guided atlas is additive and does not replace normal atlas exploration.

## 4. Natural Earth

**Status:** APPROVED  
**Reviewed:** 28 August 2026

Natural Earth states that its raster and vector map data are public domain and may be used, modified and distributed, including commercially. Attribution is not legally required, but Unreached retains source attribution for provenance.

Boundary presentation follows Natural Earth's de facto Admin-0 model unless a later release explicitly documents a change. Cartographic display is navigation, not a political or theological endorsement of sovereignty claims.

## 5. Joshua Project

**Status:** CONDITIONAL — PHASE 13 OPTIONAL COMPARISON; POST-3.0 GATE  
**Reviewed:** 17 September 2026

Joshua Project's current API terms grant revocable, non-commercial API use, require visible linked attribution where its data is displayed, prohibit direct replication or a highly overlapping service, require API-key protection and require downloaded/cached data to be deleted if API access is terminated.

Phase 13 therefore permits only a narrow value-added source-comparison use after V3 Gate D is satisfied.

Approved Phase 13 use:

- on-demand retrieval of a specific Joshua Project people-group-in-country record only after a user explicitly requests source comparison;
- only records present in an explicitly reviewed PeopleGroups.org ↔ Joshua Project identity crosswalk;
- server-side API access through the existing Unreached Worker using the `JOSHUA_PROJECT_API_KEY` secret;
- a minimal normalized comparison response containing provider identity, source-native mission-status fields and a small set of explanatory estimates;
- side-by-side methodology display with linked **Data provided by Joshua Project** attribution;
- descriptive `agreement`, `disagreement` or `incomplete` comparison states.

Not approved:

- fuzzy name matching or assuming equivalent numeric IDs across providers;
- replacing PeopleGroups.org as the canonical atlas runtime;
- averaging, ranking or silently reconciling provider classifications;
- recomputing Joshua Project `LeastReached` from displayed rounded percentage fields instead of retaining the source value;
- a general Joshua Project proxy, search service, bulk endpoint, downloadable mirror or static corpus copy;
- storing API responses in D1, the Unreached application corpus, IndexedDB, localStorage, sessionStorage or service-worker caches;
- exposing the Joshua Project API key in browser code, client environment variables or repository history;
- Joshua Project photos, maps or narrative profile text without separate rights review.

The Worker and browser requests use `Cache-Control: no-store`. Avoiding persistence also minimizes the amount of provider data that would require deletion if access is terminated.

Production activation is additionally blocked until Unreached 3.0 satisfies V3 Gate D. The source registry may describe Phase 13 as release-eligible on this stacked branch, but that does not authorize bypassing the Phase 12 certification gate.

## 6. ProgressBible

**Status:** PERMISSION REQUIRED / NOT USED  
**Reviewed:** 28 August 2026

ProgressBible Registered User Data terms state that supplied registered data may not be incorporated into a product or service, free or paid, without written permission.

Therefore Unreached does not ingest, bundle or scrape that registered dataset. Detailed ProgressBible integration requires written permission compatible with this public product.

## 7. Ethnologue

**Status:** LICENSE OR PERMISSION REQUIRED / NOT USED  
**Reviewed:** 28 August 2026

Ethnologue's published terms restrict republication, scraping and incorporation of its proprietary content into products/services without an appropriate license or permission.

Unreached does not supplement PeopleGroups.org language data with proprietary Ethnologue taxonomy.

## 8. Wikimedia Commons and other media

**Status:** PER ITEM  
**Reviewed:** 28 August 2026

A Commons file is reusable only according to the individual file's license and any applicable non-copyright restrictions. Before inclusion record creator, source, license, license URL, required credit, modifications and review date.

No third-party people image is approved merely because it is publicly visible.

## 9. Project-authored code and content

The repository is public, but no general open-source/open-content license is granted by default. Project-authored code, documentation, design and editorial synthesis remain copyright-protected unless a file states otherwise.

See `LICENSE.md`.

Third-party packages remain under their own licenses. Factual claims/citations in editorial profiles remain subject to the rights of their original sources; project-authored wording and synthesis are not a relicense of those sources.

## 10. Privacy and personal data

Anonymous/local-only use is the default. Unreached does not implement first-party analytics, advertising, profiling pixels or prayer-performance telemetry.

Browser storage may contain Saved/prayer state, recent routes, latest-only prayer timestamps, optional sync metadata, a validated PeopleGroups cache and a bounded local history of PeopleGroups mission-source state transitions observed on that device. Optional private continuity is explicitly activated and is limited to the allow-listed Saved/prayer continuity subset described in `PRIVACY.md` and `docs/V20_PRIVATE_CONTINUITY.md`.

Device-local PeopleGroups mission-source history is not persisted in private sync or server storage and is not included in server-held account export. Joshua Project comparison records are not persisted in browser storage, historical storage or private sync.

Do not publish confidential field information, personal prayer details, or information that could endanger individuals or communities.

## 11. Provenance requirements

Production source records should remain traceable to the provider and provider identifier. Derived values must preserve the source fields/formula and must not imply stronger precision or semantics than the inputs support.

For historical observations, provider identity, record identity, source-update time and local observation time must remain distinguishable. Earlier states must not be synthesized from current values. Consecutive repeated observations of the same tracked state must be de-duplicated, while a later return after an intervening state remains a historical transition.

For guided-atlas journeys, regional prose must remain limited to source-derived atlas statements, pathway selection must remain non-ranking, reviewed coverage may affect teaching depth only, and journey progress must remain URL-only rather than persisted or synced.

For advanced geographic intelligence, direct PGID country evidence must remain distinguishable from cross-country ROP3 taxonomy matches. Country-level source distribution must never be relabeled as diaspora, migration, city-level settlement or verified global-population evidence.

For knowledge-graph relationships, every edge must retain its typed evidence layer, source identity, source-record IDs and exact source fields where applicable. Derived taxonomy matches must remain distinguishable from direct provider fields and reviewed editorial claims.

For language/resource intelligence, raw provider labels, PGID denominators and missing values must remain visible. Shared family labels and country overlap are descriptive source relationships only; they must not be upgraded into intelligibility, bilingualism or translation-completeness claims.

For multi-source comparisons, each assertion must retain its own provider and methodology identity. Cross-source agreement must not be presented as proof that definitions are identical, and disagreement must not be silently resolved into one provider-independent verdict.

For reviewed editorial claims, citations and review/freshness information are stored separately from provider data.

Unknown stays unknown. Zero is not automatically "none." Population remains an estimate where the source does not guarantee exactness.

## 12. Review and change policy

Before each release that changes a provider integration, and periodically during maintenance:

1. revisit the provider's current terms/documentation;
2. record the review date in `data/source-registry.json`;
3. compare current obligations with the actual architecture;
4. stop or constrain use if the rights basis becomes unclear;
5. obtain written permission where published terms do not cover the intended use.

Historical permission or historical terms are not assumed to override later changes.

## 13. Current source matrix

| Source | Current role | Status |
| --- | --- | --- |
| PeopleGroups.org public API | canonical live mission runtime + bounded device-private observed history + Phase 15 Scripture/language evidence | runtime approved; source-evidence relationships only; static corpus redistribution not approved |
| Natural Earth | bundled geography | public domain / approved |
| Reviewed Unreached editorial content | contextual publication | project-authored, citation/review controlled |
| Joshua Project API | optional Phase 13 source comparison | conditional, non-commercial, manual-crosswalk/no-store/server-secret only; activation after Gate D |
| Joshua Project photos/maps/profile text | none | separate per-item/use-rights review |
| ProgressBible registered data | none | written permission required |
| Ethnologue proprietary content | none | license/permission required |
| Wikimedia Commons | none by default | per-item review |

## 14. Release gates

A release must fail if any of the following is false:

- README/package/current release version agree;
- `PRIVACY.md` and `/unreached/privacy.html` describe current optional sync rather than obsolete local-only behavior;
- PeopleGroups.org is recorded as the canonical public runtime while static corpus redistribution remains blocked;
- Phase 14 historical observations, if present, remain bounded, device-private, observed-only, consecutively de-duplicated and excluded from sync, server storage, server export and Joshua Project data;
- Phase 15 Scripture/language intelligence preserves exact PeopleGroups resource/family semantics and does not infer translation milestones, intelligibility, bilingualism or resource transfer;
- Phase 16 knowledge-graph edges remain typed/provenanced, derived in memory only, free of hidden similarity/ranking semantics, and exclude persisted Joshua Project comparison data;
- Phase 17 geographic intelligence remains country-level, exact-ROP3-linked, explicit about population coverage, and must not infer diaspora/migration/city precision;
- Phase 18 guided atlas prose remains source-grounded, pathway selection remains deterministic/non-ranking, and guided journey state remains URL-only with no stored completion history;
- Natural Earth remains public-release/redistribution approved;
- Joshua Project Phase 13 use, if present, is covered by a current terms review, remains non-commercial, uses explicit linked attribution, manual crosswalks, a server-only key and no-store/no-persistence handling, and does not bypass Gate D;
- ProgressBible and Ethnologue remain excluded from the public runtime unless a new reviewed policy explicitly changes that;
- source review dates are current for changed integrations;
- code/content licensing and third-party notices are present;
- production status files identify PeopleGroups.org runtime mode without a bundled dataset;
- no provider credential is emitted into the client bundle.

## 15. References

Reviewed for the governing policy on 20 September 2026; unchanged sources retain their source-specific review dates above.

- PeopleGroups.org API: https://peoplegroups.org/using-the-api/
- PeopleGroups.org privacy policy: https://peoplegroups.org/privacy-policy/
- PeopleGroups.org research downloads: https://peoplegroups.org/downloads/
- Natural Earth terms: https://www.naturalearthdata.com/about/terms-of-use/
- Joshua Project API terms: https://api.joshuaproject.net/terms_of_use
- Joshua Project API documentation: https://api.joshuaproject.net/v1/docs/available_api_requests
- Joshua Project PGIC field documentation: https://api.joshuaproject.net/v1/docs/column_descriptions/people_groups
- ProgressBible registered-data terms: https://progress.bible/terms-of-use/
- Ethnologue terms: https://shop.ethnologue.com/policies/terms-of-service
- Wikimedia Commons reuse guidance: https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia
