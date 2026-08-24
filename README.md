# Unreached

**Explore the peoples. Understand their world. Pray for the nations.**

Unreached is a browser-based Christian mission atlas for discovering unreached peoples, understanding source-backed country/language context, and moving from information into prayer.

- **Live site:** https://www.thiepn.dev/unreached/
- **Repository:** https://github.com/thiepn/unreached
- **Platform:** static Preact/Vite application deployed through GitHub Pages
- **Core loop:** **Explore → Understand → Pray**
- **Version:** **1.4.0**
- **Release state:** **v1.4 Editorial Discovery & Coverage Navigation release candidate**

## v1.4 — editorial discovery & coverage navigation

v1.4 turns the reviewed editorial publication into a first-class discovery surface without turning editorial availability into a mission-priority signal.

- **Reviewed coverage** under Browse opens a dedicated local-first index of all published reviewed contextual profiles.
- The coverage browser supports people/country/language/PEID/PGID search and country filtering.
- People Explorer marks records with reviewed context and offers an explicit **Reviewed context only** filter while preserving its existing default sort order.
- Country pages expose reviewed articles whose certified editorial identity includes that country.
- Reviewed articles provide previous/next/all-coverage navigation.
- Source records without an article can recover directly to the reviewed-coverage browser.

Coverage is explicitly an **editorial-publication measure**. It does not mean a covered people is more important, more urgent, more unreached, or higher priority than an uncovered people.

The dedicated `#/coverage` route loads the bounded editorial manifest/shards plus local Natural Earth geography and does not activate the full PeopleGroups.org corpus merely to display coverage.

## v1.3 — reviewed editorial context

v1.3 expands the human-reviewable **Understand** layer from one production profile to six Tier-3 reviewed source-record profiles:

| People profile | Provider identity | Country | Language |
| --- | --- | --- | --- |
| Fon | PEID 12319 / PG012319 | Benin | `fon` |
| Hui | PEID 7206 / PG007206 | China | `cmn` |
| Uyghur | PEID 24104 / PG024104 | China | `uig` |
| Somali | PEID 11954 / PG011954 | Somalia | `som` |
| Southern Pashtun | PEID 24009 / PG024009 | Afghanistan | `pbt` |
| Bengali Sunni Muslims | PEID 1156 / PG001156 | Bangladesh | `ben` |

Coverage is intentionally partial. Six reviewed profiles do **not** imply representative coverage of all peoples, countries, religions, or mission situations.

### Editorial contract

Each published profile:

- attaches to one current PeopleGroups.org PEID/PGID country-context record;
- requires explicit PEID, PGID, name, country, and language identity evidence;
- never uses legacy numeric coincidence as identity evidence;
- separates sourced facts, evidence synthesis, and interpretation;
- gives current claims `asOf` and `reviewAfter` dates;
- requires at least two cited sources for Level-B synthesis;
- marks aggregate religion/status claims as generalized rather than individual facts;
- passes naming, citation, freshness, stereotype, religion-nuance, sensitivity, licensing, and identity review checks;
- remains fail-closed if current PeopleGroups identity anchors no longer match.

The editorial model does not treat a people's religion, ethnicity, or culture as a shortcut explanation for being unreached. Country/region conflict, legal restrictions, or access conditions are presented only where sourced and are not described as the sole cause of GSEC status.

### Sharded publication

The old single editorial JSON has been replaced by a small publication manifest plus individually reviewed profile shards:

- `data/context/manifest.v1.json`
- `data/context/profiles/*.json`

The browser materializes these packages into the existing reviewed-context model. This keeps each profile independently inspectable and allows future coverage growth without rewriting one large publication file.

Release gates verify manifest/shard counts, unique URLs, non-fixture status, required PEIDs, Tier-3 review metadata, source/claim integrity, and live PeopleGroups PEID/PGID/country/language/name anchors.

## v1.2 guided exploration retained

People Explorer offers source-backed starting points when a visitor does not know what to search for. These are explicitly a **discovery heuristic, not a mission-priority ranking**. Country pages also expose one disclosed GSEC 0–3 starting context, and people profiles show the explicit **Explore → Understand → Pray** journey.

## v1.1 usability/performance baseline retained

- Primary navigation: **Explore / Peoples / Pray**.
- Reviewed coverage, Countries, Languages, and About & sources live under **Browse**.
- People, Languages, and Countries are search-first with collapsed advanced controls.
- Large indexes use bounded initial rendering and progressive reveal.
- MapLibre is isolated to Explore instead of loading globally.
- Explore and Countries paint local geography/index content before activating full remote aggregation.
- Opening global Search without a query does not load PeopleGroups.
- People/Language corpus matching is debounced.
- PeopleGroups network pagination is bounded-concurrent and validated IndexedDB cache pages are read concurrently.

## Production data architecture

Production people-group data comes from **PeopleGroups.org / IMB Global Research** through its public read-only API. Unreached does **not** publish a bundled mirror of that corpus.

A complete live-corpus audit on **23 August 2026** established the currently certified identity contract:

- 12,370 PGID records
- 12,370 PEID values
- 0 PEIDs attached to more than one PGID
- 0 PEIDs spanning more than one country
- 12,370/12,370 PGID numeric suffixes equal their PEID

Accordingly, PGID identifies one PeopleGroups.org people-group-in-country source record. PEID remains the provider numeric field and compatibility route key but is **not** treated as a cross-country grouping key. Related records use explicit provider taxonomy such as ROP3 people name, cluster, or affinity bloc and never merge population, GSEC, religion, or resource fields into a synthetic global record.

## Mission and resource semantics

IMB **GSEC** remains source-native:

- GSEC 0–3 → `unreached`
- GSEC 4–6 → `other`
- missing → `unknown`

`other` is deliberately not renamed `reached`. Unreached does not fabricate Joshua Project `JPScale`, `Frontier`, exact evangelical percentages, Scripture-completeness milestones, or cultural/spiritual claims from incompatible fields. Bible, Jesus Film, and resource values remain raw provider labels with explicit coverage; unknown remains unknown.

## Product surfaces

| Surface | Production behavior |
| --- | --- |
| Explore | Natural Earth geography + live PeopleGroups.org mission aggregation |
| Peoples | One current PEID/PGID source record per route + guided starts + reviewed-context annotation/filter |
| Reviewed coverage | Local-first index and navigation over the reviewed editorial publication set |
| Countries | Local Natural Earth index + live country-context records + country-specific reviewed editorial links |
| Languages | Live ISO 639-3 aggregation over current source records |
| Prayer | Current GSEC 0–3 record + fixed release-certified prayer template |
| Editorial context | Six reviewed source-record profile shards inherited from v1.3; intentionally partial coverage |
| Saved / Recent | Browser-local only |
| ProgressBible | Permission-gated and not used |
| Ethnologue proprietary taxonomy | Permission-gated and not used |
| Third-party people photos | Not redistributed without separate authorization |

## Runtime reliability

PeopleGroups responses are treated as untrusted external input. Protections include Zod validation, request timeouts, pagination/count limits, bounded concurrency, duplicate PGID/PEID rejection, GSEC bounds, fail-closed schema-drift handling, one shared session corpus, IndexedDB caching with a 24-hour fresh window and seven-day explicit stale fallback, and best-effort storage behavior.

## Release certification

A release candidate must pass:

- TypeScript and production build;
- deterministic source/data/editorial/release-policy checks;
- PeopleGroups runtime/cache/visible-data/identity checks;
- geography and mission-visualization checks;
- country, people, context, prayer, language, and discovery checks;
- production distribution checks;
- Chromium, Firefox, and WebKit desktop journeys;
- mobile Chromium and mobile WebKit journeys;
- live PeopleGroups editorial-identity preflight;
- complete live PeopleGroups corpus audit;
- browser API/CORS contract;
- post-merge GitHub Pages certification against the deployed site.

v1.3 requires all six reviewed editorial profiles to survive deterministic publication validation, live PEID/PGID identity verification, and deployed manifest/shard verification. v1.4 additionally certifies the coverage browser's local-first boundary, reviewed-only People filtering, country editorial handoff, and previous/next/all-coverage article navigation.

See [`docs/V14_EDITORIAL_DISCOVERY.md`](docs/V14_EDITORIAL_DISCOVERY.md), [`docs/V13_EDITORIAL_COVERAGE.md`](docs/V13_EDITORIAL_COVERAGE.md), [`docs/U12_RELEASE_GATES.md`](docs/U12_RELEASE_GATES.md), and [`docs/U12_FINAL_CERTIFICATION.md`](docs/U12_FINAL_CERTIFICATION.md).

## Local development

Requires Node.js 22.12+.

```bash
npm install
npm run dev
```

Full deterministic validation:

```bash
npm run check
```

Browser certification:

```bash
npm run e2e
```

Vite is configured for the `/unreached/` project path.
