# Unreached — Data, Licensing & Provenance Policy

**Status:** production policy  
**Reviewed:** 28 August 2026

This policy describes the external data, media and authored content that may enter the public Unreached application and the conditions under which they may be used.

## 1. Governing rule

Public availability is not the same as permission to redistribute. External material enters production only when its intended use is supported by published terms, a compatible license, written permission, or applicable law.

The repository does not relicense third-party data or media.

## 2. Current production architecture

Production mission data is **not** a bundled dataset. People, country, language, religion, GSEC and resource records are read at runtime from the public PeopleGroups.org API. A validated copy may be stored privately in a user's browser for resilience, but Unreached does not expose that cache as a public download or API.

Natural Earth geography is bundled because Natural Earth places its map data in the public domain.

Reviewed contextual articles are project-authored publication shards with explicit citations and PeopleGroups.org source-record identity evidence. They are separate from the provider corpus.

## 3. PeopleGroups.org / IMB Global Research

**Status:** CONDITIONAL — APPROVED FOR PUBLIC RUNTIME ACCESS  
**Provider:** Global Research Department of the International Mission Board  
**Reviewed:** 28 August 2026

PeopleGroups.org currently documents a free, public, read-only API and explicitly suggests maps, prayer tools and research applications. That published runtime-use invitation is the basis for Unreached's public browser integration.

Approved production use:

- direct read-only runtime API access;
- source-backed maps, people, country, language and prayer-subject views;
- narrow source-native aggregations with coverage disclosure;
- a validated device-local resilience cache;
- attribution and links back to PeopleGroups.org.

Not approved by Unreached policy:

- a static or downloadable mirror of the complete provider corpus;
- a public Unreached API that republishes the corpus;
- claiming ownership of or relicensing provider records;
- redistribution of provider-linked or third-party people photos without separate rights review;
- silently converting PeopleGroups.org fields into Joshua Project JPScale/Frontier or stronger Scripture-completeness claims.

The device-local cache is an operational continuity mechanism, not a statement that Unreached has obtained a broad redistribution license. If the provider publishes new terms restricting runtime use or local caching, affected behavior must be disabled or revised before the next release.

### Attribution

Where practical, identify the source as:

**PeopleGroups.org / Global Research Department of the International Mission Board**

The About/source UI and repository notices must keep provider attribution visible and must not imply affiliation, endorsement or ownership by Unreached.

## 4. Natural Earth

**Status:** APPROVED  
**Reviewed:** 28 August 2026

Natural Earth states that its raster and vector map data are public domain and may be used, modified and distributed, including commercially. Attribution is not legally required, but Unreached retains source attribution for provenance.

Boundary presentation follows Natural Earth's de facto Admin-0 model unless a later release explicitly documents a change. Cartographic display is navigation, not a political or theological endorsement of sovereignty claims.

## 5. Joshua Project

**Status:** CONDITIONAL / NOT ACTIVE IN PRODUCTION RUNTIME  
**Reviewed:** 28 August 2026

Joshua Project's API terms currently grant revocable, non-commercial API use, require visible linked attribution where its data is displayed, prohibit direct replication/heavy overlap, and require cached/downloaded data to be deleted if API access is terminated.

Because Joshua Project is not the active production runtime, no Joshua Project data should appear in current public runtime records. Before reintroduction, perform a fresh terms and architecture review and implement all required attribution/removal behavior.

Joshua Project photos remain per-item rights decisions and are not approved by default.

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

Browser storage may contain Saved/prayer state, recent routes, latest-only prayer timestamps, optional sync metadata and a validated PeopleGroups cache. Optional private continuity is explicitly activated and is limited to the allow-listed Saved/prayer continuity subset described in `PRIVACY.md` and `docs/V20_PRIVATE_CONTINUITY.md`.

Do not publish confidential field information, personal prayer details, or information that could endanger individuals or communities.

## 11. Provenance requirements

Production source records should remain traceable to the provider and provider identifier. Derived values must preserve the source fields/formula and must not imply stronger precision or semantics than the inputs support.

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
| PeopleGroups.org public API | live mission runtime | runtime approved; static corpus redistribution not approved |
| Natural Earth | bundled geography | public domain / approved |
| Reviewed Unreached editorial content | contextual publication | project-authored, citation/review controlled |
| Joshua Project API | inactive compatibility/development source | gated; fresh review required before production use |
| Joshua Project photos | none | per-item rights review |
| ProgressBible registered data | none | written permission required |
| Ethnologue proprietary content | none | license/permission required |
| Wikimedia Commons | none by default | per-item review |

## 14. Release gates

A release must fail if any of the following is false:

- README/package/current release version agree;
- `PRIVACY.md` and `/unreached/privacy.html` describe current optional sync rather than obsolete local-only behavior;
- PeopleGroups.org is recorded as public-runtime allowed but static corpus redistribution blocked;
- Natural Earth remains public-release/redistribution approved;
- Joshua Project, ProgressBible and Ethnologue remain excluded from the public runtime unless a new reviewed policy explicitly changes that;
- source review dates are current for this release;
- code/content licensing and third-party notices are present;
- production status files identify PeopleGroups.org runtime mode without a bundled dataset;
- no provider credential is emitted into the client bundle.

## 15. References reviewed 28 August 2026

- PeopleGroups.org API: https://peoplegroups.org/using-the-api/
- PeopleGroups.org privacy policy: https://peoplegroups.org/privacy-policy/
- PeopleGroups.org research downloads: https://peoplegroups.org/downloads/
- Natural Earth terms: https://www.naturalearthdata.com/about/terms-of-use/
- Joshua Project API terms: https://api.joshuaproject.net/terms_of_use
- ProgressBible registered-data terms: https://progress.bible/terms-of-use/
- Ethnologue terms: https://shop.ethnologue.com/policies/terms-of-service
- Wikimedia Commons reuse guidance: https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia
