# Third-Party Notices

**Reviewed:** 20 September 2026

Unreached combines project-authored software/content with external data and open-source components. Nothing in the Unreached project license changes the rights attached to third-party material.

## PeopleGroups.org / IMB Global Research

Production mission data is read from the public PeopleGroups.org API operated by the Global Research Department of the International Mission Board.

- API documentation: https://peoplegroups.org/using-the-api/
- Provider: PeopleGroups.org / Global Research Department of the International Mission Board
- Production use: canonical direct read-only runtime access for maps, people, countries, languages, mission status, resource fields and prayer-subject selection
- Redistribution policy: Unreached does not publish or relicense a static mirror of the provider corpus
- Images: linked/provider or third-party images are not redistributed by Unreached without separate rights review

PeopleGroups.org states that its public API is free and read-only and expressly invites maps, prayer tools and research applications. Provider data remains provider data; Unreached's source registry records runtime-use approval separately from static redistribution rights.

### Phase 14 device-private source history

**Reviewed:** 19 September 2026

Unreached may keep a bounded local history of PeopleGroups.org mission-source state transitions actually observed by the current browser. The history uses the provider's source fields and `UpdatedDate` when supplied, plus local observation timestamps.

- Storage: separate device-local IndexedDB only; maximum 24 retained timeline points per PGID
- Sync/export: excluded from private continuity, server storage and server-held account export
- Redistribution: no public historical snapshot archive, bulk export or provider mirror
- Interpretation: no backfill, interpolation, inferred intermediate state or causal claim
- Joshua Project: Phase 13 comparison responses remain no-store and are not copied into this history

### Phase 15 Scripture & language intelligence

**Reviewed:** 20 September 2026

Phase 15 deepens language/resource presentation using fields already returned by the public PeopleGroups.org runtime API: ISO 639-3 language code/name, language-family label, Bible availability, Jesus Film availability, resource-total count and source update date.

- Exact source labels and PGID denominators are preserved.
- Mixed labels remain mixed rather than becoming one language-wide verdict.
- Shared family labels are not treated as proof of mutual intelligibility.
- Same-country language records are not treated as proof of bilingualism.
- The feature does not directly ingest ProgressBible registered data or Ethnologue proprietary content.
- No stronger Scripture-completeness milestone is manufactured from the available fields.

## Natural Earth

Natural Earth vector/raster map data is public domain.

- Terms: https://www.naturalearthdata.com/about/terms-of-use/
- Production use: bundled world geography and map navigation
- Attribution: not legally required by Natural Earth; Unreached retains source attribution for provenance

## Joshua Project

**Reviewed:** 17 September 2026

Phase 13 introduces Joshua Project only as an optional secondary mission-intelligence comparison for a small set of manually reviewed people-group-in-country identity links. PeopleGroups.org remains the canonical atlas runtime.

- API terms: https://api.joshuaproject.net/terms_of_use
- API documentation: https://api.joshuaproject.net/v1/docs/available_api_requests
- Production eligibility: post-Unreached-3.0 only; V3 Gate D must be satisfied before activation
- Use: non-commercial, value-added source comparison
- Attribution: pages displaying Joshua Project values link the text **Data provided by Joshua Project** to the corresponding provider profile
- Credential: the API key is held only as the `JOSHUA_PROJECT_API_KEY` Worker secret
- Storage: API responses use no-store handling and are not added to the Unreached corpus, D1, browser persistence or service-worker caches
- Redistribution: no bulk endpoint, static mirror, general provider proxy or downloadable Joshua Project dataset is provided

Joshua Project's provider classification remains source-native. Unreached does not average or silently reconcile it with PeopleGroups.org / IMB classifications.

Joshua Project photos, maps and narrative profile text are not included by this integration. Those materials remain subject to separate item-level rights and use conditions.

## ProgressBible

ProgressBible Registered User Data is not included. Its published terms require written permission before supplied registered data is incorporated into a product or service.

- Terms: https://progress.bible/terms-of-use/

## Ethnologue

Ethnologue proprietary content is not bundled or scraped. Its published terms restrict republication, scraping and product/service reuse without the appropriate license or written permission.

- Terms: https://shop.ethnologue.com/policies/terms-of-service

## Wikimedia Commons

No Commons file is automatically approved merely because it is hosted on Wikimedia Commons. Any future media use must follow the individual file license, attribution and any applicable non-copyright restrictions.

- Reuse guidance: https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia

## Open-source packages

Runtime and development dependencies are distributed under their respective package licenses. The repository's `package.json` is the authoritative dependency inventory for a given release. This notice does not replace package license texts or notices supplied by those projects.
