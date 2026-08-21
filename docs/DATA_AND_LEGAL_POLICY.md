# Unreached — Data, Licensing & Provenance Policy

**Phase:** U0  
**Status:** Baseline policy  
**Review date:** 2026-08-21

This document governs which external data and media may enter Unreached, how they are transformed, how provenance is retained, and what must be true before public deployment.

---

## 1. Core rule

No external dataset, text, image, map, or media asset enters the production build unless its use is one of the following:

1. clearly permitted by its license/terms;
2. covered by written permission; or
3. original content owned by the project.

“Publicly accessible on the web” does **not** mean “free to redistribute.”

---

## 2. Source registry

Every source used in production must be registered with at least:

```text
source_id
name
canonical_url
provider
content_type
license_or_terms
allowed_uses
forbidden_uses
attribution_requirement
commercial_restriction
redistribution_status
cache_status
permission_record
retrieved_at
terms_reviewed_at
notes
```

A dataset may not be marked `approved` until all applicable fields are reviewed.

---

## 3. Provenance model

Every imported factual field should be traceable to:

```text
entity_id
field_name
value
source_id
source_record_id
source_field
source_date
retrieved_at
transformation
confidence_or_note
```

For derived values, record:

```text
derived = true
formula_or_rule
input_fields
input_sources
```

For original editorial content, record citations separately from imported data fields.

---

## 4. Source status taxonomy

### APPROVED

May be used in production under documented conditions.

### CONDITIONAL

May be used for development/prototype work, but public release has an unresolved scale, attribution, caching, or permission question.

### PER-ITEM

Each individual asset must be reviewed before use.

### PERMISSION REQUIRED

Do not ingest into the public product until written permission compatible with the intended use is obtained.

### PROHIBITED

Do not use.

---

## 5. Joshua Project

**Status:** CONDITIONAL  
**Intended role:** primary V1 source for people-group, country, language, progress, and selected Scripture/resource indicators.

### Current terms relevant to Unreached

Joshua Project’s API terms currently provide free access under a revocable license for non-commercial use. They require visible attribution on pages displaying Joshua Project content and prohibit public use that directly replicates or heavily overlaps Joshua Project’s service/presentation without meaningful value added.

The terms also state that data can contain inaccuracies, gaps, and estimates and may not be treated as perfectly precise.

### Mandatory attribution

Where Joshua Project content is displayed, use a clear linked acknowledgment equivalent to:

**Data provided by Joshua Project**

The attribution must be visible rather than hidden only in a legal page.

### V1 usage rules

Allowed subject to current terms:

- mission statistics
- people-group identifiers and names
- country relationships
- language relationships
- progress/unreached/frontier fields
- source-provided Scripture/resource indicators
- build-time API ingestion under a valid key
- original Unreached visualizations based on permitted fields
- original contextual synthesis and prayer content built around the data

Not allowed by project policy without further permission:

- cloning Joshua Project page structure or presentation
- republishing Joshua Project profile text wholesale
- mirroring its photo library
- exposing a bulk downloadable copy of Joshua Project data
- offering an Unreached API that republishes the source dataset
- commercializing Joshua Project-derived data
- pretending estimates are exact

### Full-scale release gate

Before shipping a public build containing a substantial portion of Joshua Project’s people-group database in static client-accessible files, obtain written confirmation from Joshua Project that the intended architecture and scale are acceptable.

The permission request should describe:

- `thiepn.dev/unreached`
- non-commercial Christian prayer/education purpose
- static GitHub Pages deployment
- build-time ingestion and browser-side cached/chunked data
- original map UX
- original “Why unreached?” explanations
- original prayer content
- visible attribution
- no public bulk export/API

Store the response or permission record in a private project record if it contains personal contact information; record only the approval status/date in the repository.

### API credentials

- API key must never appear in client JavaScript.
- API key must never be committed.
- Use environment secrets in local ingestion or GitHub Actions.
- Public build artifacts contain only approved output fields.

### Revocation requirement

Because Joshua Project’s API license is revocable and its terms require cached/downloaded data to be deleted if access is terminated, generated Joshua Project data must be structurally separable from original project code/content so it can be removed and rebuilt without it.

---

## 6. Joshua Project photos and profile prose

**Status:** PROHIBITED BY DEFAULT / PER-ITEM WITH RIGHTS

Do not assume that a photo or profile text displayed by Joshua Project is owned or freely reusable by Joshua Project. Its own pages may identify third-party photo sources and copyrights.

Rules:

- never scrape people-group photos for local reuse;
- never copy profile prose wholesale;
- an image may be used only when its own rights record permits redistribution;
- original Unreached summaries should be written from multiple sources where practical;
- quoted text must remain minimal and within copyright limits.

---

## 7. ProgressBible

**Status:** PERMISSION REQUIRED

ProgressBible’s current Registered User Data terms state that supplied data may not be incorporated into a product or service, free or paid, without written permission.

Therefore:

- do not ingest registered/downloaded ProgressBible data into V1;
- do not build a background scraper against its public site;
- do not copy its database into browser JSON;
- public high-level information may be cited editorially where normal web-use/copyright rules permit;
- integration of its detailed Scripture/translation data requires explicit written permission appropriate to a public web product.

Until permission exists, use source fields already available through an approved provider (for example Joshua Project’s Bible-status indicators) and clearly describe their limitations.

---

## 8. Natural Earth

**Status:** APPROVED

Natural Earth states that its raster and vector map data are public domain and may be used, modified, and electronically distributed.

Approved uses:

- country polygons
- coastlines
- borders
- physical geography
- simplified world geometry
- local preprocessing and vector simplification

Attribution is not legally required by Natural Earth, but Unreached may include **Made with Natural Earth** in the About/Sources page as good provenance practice.

### Political-boundary caveat

Natural Earth includes disputed-boundary handling. Unreached should preserve or deliberately document any modifications rather than presenting contested boundaries as undisputed facts.

---

## 9. OpenStreetMap

**Status:** NOT REQUIRED FOR V1 BASELINE

If OpenStreetMap data or tiles are introduced later:

- review ODbL attribution and database obligations;
- review the tile provider’s own usage policy separately;
- do not treat `tile.openstreetmap.org` as a free production tile CDN;
- ensure visible attribution where required;
- document whether Unreached stores, modifies, or derives data from OSM.

Prefer Natural Earth/local vector geography for the initial atlas unless detailed street-level mapping becomes genuinely necessary.

---

## 10. Wikimedia Commons

**Status:** PER-ITEM

Wikimedia Commons hosts media under many individual licenses. Reuse is permitted only according to the specific file’s rights information.

For every used file, record:

```text
commons_file_url
author
copyright_holder
license
license_url
source_url
required_credit
modifications
retrieved_at
```

Rules:

- verify the file page before inclusion;
- satisfy attribution requirements;
- satisfy ShareAlike requirements when applicable;
- consider personality/privacy rights for identifiable people;
- do not rely solely on Commons’ presence as proof that all non-copyright restrictions are resolved;
- prefer downloading and hosting a compliant copy rather than hotlinking.

---

## 11. Ethnologue and proprietary linguistic sources

**Status:** PERMISSION REQUIRED

Do not scrape, reproduce, or bulk import proprietary linguistic databases merely because selected information is visible online.

For V1:

- use language names/codes/relationships from sources with compatible terms;
- use Joshua Project fields only to the extent its terms permit their redistribution;
- consider open alternatives such as Glottolog only after its specific license and attribution requirements are reviewed.

---

## 12. Other web sources used for editorial research

Editorial summaries may use reputable web sources without copying substantial protected prose.

Preferred source hierarchy:

1. primary/public institutions
2. academic sources
3. recognized mission research organizations
4. reputable NGOs/international organizations
5. high-quality encyclopedic/reference sources
6. news reporting for current context

For politically sensitive or rapidly changing claims, require current sourcing and preferably corroboration.

---

## 13. Data transformation rules

Imported data must pass through a reproducible pipeline:

```text
Source
  ↓
Raw acquisition
  ↓
Source-specific parser
  ↓
Normalized internal schema
  ↓
Validation
  ↓
License/field allowlist
  ↓
Public build dataset
  ↓
Browser
```

### Raw data

Raw source files should not automatically be committed to the public repository. Whether they may be stored at all depends on source terms.

### Public field allowlist

The build pipeline should publish only explicitly approved fields. New source fields do not become public merely because an API starts returning them.

### Validation failures

The build must fail or quarantine a record when:

- required identifiers are missing;
- source provenance is absent;
- numeric ranges are impossible;
- a source status is unapproved;
- an asset lacks required license metadata;
- a transformation produces inconsistent classifications.

---

## 14. Dates and freshness

Every generated dataset release should expose:

```text
dataset_version
built_at
source_retrieved_at
source_terms_reviewed_at
```

At profile level, show a user-friendly **Data updated/retrieved** value where useful.

Do not imply that all fields are equally current. Joshua Project itself notes that population figures and other mission fields may have different update ages.

---

## 15. Statistical presentation rules

### Population

Display as an estimate unless the source guarantees otherwise.

### Percentages

Avoid unnecessary decimal precision. The UI should not visually imply confidence beyond the source.

### Christian/Evangelical estimates

Do not infer individual belief or conversion from aggregate affiliation estimates.

### Zero values

Do not automatically render `0` as “none.” Preserve source semantics and distinguish unknown where possible.

### Derived counts

Avoid deriving absolute believer counts from percentage estimates when the source warns against that use.

### Global totals

Use a coherent source snapshot. Do not sum records from mixed versions without documentation.

---

## 16. Attribution architecture

Attribution exists at three levels.

### Page-level

Provider acknowledgment near or within pages using source content when terms require it.

### Field/profile-level

Expandable source details for important statistics and narrative claims.

### Global sources page

A full source registry explaining providers, terms, retrieval dates, methodologies, and limitations.

Attribution must remain visible after responsive/mobile layout changes.

---

## 17. Media manifest

Production should include a generated media manifest containing every non-original asset.

Suggested schema:

```json
{
  "id": "...",
  "path": "...",
  "source": "...",
  "creator": "...",
  "license": "...",
  "licenseUrl": "...",
  "credit": "...",
  "retrievedAt": "...",
  "modified": false
}
```

A CI check should reject external media missing required metadata.

---

## 18. Terms-change policy

External terms can change.

Before each major release and at least periodically during active maintenance:

1. re-check the terms pages for active data providers;
2. record the review date;
3. compare obligations with current architecture;
4. stop publishing affected data if rights become unclear;
5. obtain new permission where necessary.

A provider’s past permission must not be assumed to override later contractual changes unless the written permission explicitly survives them.

---

## 19. Commercial status

V1 is constitutionally **non-commercial** while Joshua Project data is a foundational source under its current API terms.

Before introducing any of the following, perform a new rights review:

- advertising
- paid access
- sponsorship tied to product revenue
- paid API access
- selling data-derived reports
- monetized commercial redistribution

Donation links unrelated to access may still require clarification if they could cause the project to be considered revenue-generating; do not add them without a specific review.

---

## 20. U0 source matrix

| Source | Intended use | Status | Main condition |
|---|---|---|---|
| Joshua Project API/data | Peoples, countries, languages, progress, selected Bible/resource fields | CONDITIONAL | Non-commercial, visible attribution, value-added, full-scale confirmation |
| Joshua Project photos | People imagery | PROHIBITED BY DEFAULT | Rights vary; per-item permission required |
| Joshua Project profile prose | Narrative | PROHIBITED BY DEFAULT | Do not mirror/copy; write original synthesis |
| Natural Earth | Base geography | APPROVED | Public domain |
| Wikimedia Commons | Selected media | PER-ITEM | Verify each file’s license/credit obligations |
| ProgressBible registered data | Translation/language detail | PERMISSION REQUIRED | Written permission required for product/service inclusion |
| Ethnologue/proprietary datasets | Linguistic detail | PERMISSION REQUIRED | Compatible license required |
| Original Unreached content | Context/prayer | APPROVED | Maintain citations for factual claims |

---

## 21. Legal launch gates

A public V1 release may proceed only when all are true:

- [ ] Joshua Project public-scale use has written confirmation if a substantial database portion is included.
- [ ] Joshua Project attribution is implemented and visible.
- [ ] No secret API key is present in repository history or browser bundles.
- [ ] No ProgressBible registered data is included without permission.
- [ ] Every production image has a verified license record.
- [ ] No unlicensed Joshua Project photos/profile prose are mirrored.
- [ ] Natural Earth or other map source is documented.
- [ ] Source registry and retrieval dates are generated.
- [ ] Sensitive-data review passes.
- [ ] Terms have been re-reviewed near release.

---

## 22. References reviewed

- Joshua Project API Terms of Use — https://api.joshuaproject.net/terms_of_use
- Joshua Project definitions — https://joshuaproject.net/help/definitions
- Joshua Project datasets — https://joshuaproject.net/resources/datasets
- Joshua Project data overview — https://joshuaproject.net/data
- ProgressBible Terms of Use — https://progress.bible/terms-of-use/
- Natural Earth Terms of Use — https://www.naturalearthdata.com/about/terms-of-use/
- Wikimedia Commons reuse guidance — https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia

This project policy is intentionally more conservative than “technically accessible” reuse. When rights are unclear, Unreached does not ship the material until the uncertainty is resolved.
