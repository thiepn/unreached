# Unreached

**Explore the peoples. Understand their world. Pray for the nations.**

Unreached is a browser-based Christian mission atlas for discovering unreached peoples, understanding source-backed country/language context, and moving from information into prayer.

- **Live site:** https://www.thiepn.dev/unreached/
- **Repository:** https://github.com/thiepn/unreached
- **Platform:** static Preact/Vite application deployed through GitHub Pages
- **Core loop:** **Explore → Understand → Pray**
- **Version:** **1.7.0**
- **Release state:** **v1.7 Prayer Rotation & Guided Return release candidate**

## v1.7 — prayer rotation & guided return

v1.7 turns the v1.6 private prayer list into a simple return rhythm without introducing any new tracking fields.

### Derived prayer rotation

The rotation is computed from the existing browser-local `addedAt` and `lastPrayedAt` timestamps:

1. people with no recorded prayer date first;
2. oldest-added first among those never recorded;
3. least-recently recorded next;
4. stable identity ordering only for exact ties.

This order is a continuity aid only. It is **not** a mission-priority, urgency, importance, unreachedness, prayer-faithfulness, or spiritual-performance ranking.

### Daily prayer

When an eligible person exists on the private prayer list, **People to Pray for Today** uses the next eligible rotation entry. Country scope remains authoritative, and the normal source-backed daily selection remains the fallback when no listed entry applies.

### Saved & prayer

The private workspace now shows a **Next return point** and displays prayer-list cards in derived rotation order. Viewing the page does not rewrite the stored array.

### Focused prayer continuation

After prayer is explicitly recorded, the focused-prayer screen can offer **Continue with [next person]** when another current eligible prayer-list entry exists. Recording changes only the existing latest timestamp; no queue position or completion state is stored.

The personalization schema remains **v2**. There are still no prayer totals, streaks, deadlines, scores, leaderboards, priority values, public activity records, or cloud synchronization.

See [`docs/V17_PRAYER_ROTATION.md`](docs/V17_PRAYER_ROTATION.md) for the ordering, privacy, theology, and release-gate contract.

## v1.6 — prayer practice & private prayer list

v1.6 closes the gap between discovering a prayer subject and intentionally returning to that person later without turning prayer into a score, streak, or public engagement mechanic.

### Private prayer list

- Add or remove current prayer-eligible people directly from Prayer cards and focused-prayer guides.
- The list remains browser-local and does not require an account.
- Prayer entries retain only a small identity snapshot, when the entry was added, and an optional latest prayer timestamp.
- Saved bookmarks and the Prayer list remain separate concepts.

### Daily prayer preference

When the private list contains an eligible person in the current scope, **People to Pray for Today** chooses from that list first. If no listed person applies, Unreached falls back to its normal source-backed daily selection.

This is a personal return aid, not a mission-priority ranking.

### Focused-prayer recording

Focused prayer includes an optional **Record prayer today** action. It stores only the most recent local timestamp for that person. It does **not** create prayer totals, streaks, scores, leaderboards, public activity, or spiritual-completion metrics.

### Saved & prayer workspace

The existing Saved route contains:

1. Private prayer list
2. Saved peoples
3. Recent exploration

All three remain local to the browser.

### Personalization migration

The browser-local personalization model moved from schema v1 to v2. Existing Saved and Recent data are preserved. The runtime reads `unreached.personal.v2` first and falls back to legacy `unreached.personal.v1` when necessary; the legacy key is not destructively removed.

See [`docs/V16_PRAYER_PRACTICE.md`](docs/V16_PRAYER_PRACTICE.md) for the privacy, migration, non-gamification, and release-gate contract.

## v1.5 — editorial coverage expansion & regional balance

v1.5 doubles the reviewed contextual publication from six to twelve Tier-3 source-record profiles and makes editorial distribution visible without turning coverage into a mission-priority signal.

New reviewed profiles:

| People profile | Provider identity | Country | Language | Editorial region |
| --- | --- | --- | --- | --- |
| Kazakh | PEID 24277 / PG024277 | Kazakhstan | `kaz` | Central Asia |
| Tajik | PEID 24529 / PG024529 | Tajikistan | `tgk` | Central Asia |
| Rohingya | PEID 22052 / PG022052 | Myanmar | `ben` source anchor | Southeast Asia |
| Wolof | PEID 14267 / PG014267 | Senegal | `wol` | West Africa |
| Kurd, Northern (Kurmanji) | PEID 24567 / PG024567 | Türkiye | `kmr` | West Asia |
| Javanese Transmigrants | PEID 46650 / PG046650 | Indonesia | `jav` | Southeast Asia |

The coverage browser reports and filters seven broad editorial regions: Central Asia, East Asia, Horn of Africa, South Asia, Southeast Asia, West Africa, and West Asia. These are editorial navigation groupings only. They are not PeopleGroups.org mission regions, geopolitical priorities, quotas, or rankings.

Each v1.5 addition uses the exact PeopleGroups.org source record for runtime mission/identity evidence plus a second contextual source from UNESCO, Encyclopaedia Iranica, UNHCR, or Minority Rights Group. Current claims remain review-dated; religion, ethnicity, culture, displacement, and migration are not used as causal shortcuts for GSEC status.

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

v1.3 expanded the human-reviewable **Understand** layer from one production profile to six Tier-3 reviewed source-record profiles:

| People profile | Provider identity | Country | Language |
| --- | --- | --- | --- |
| Fon | PEID 12319 / PG012319 | Benin | `fon` |
| Hui | PEID 7206 / PG007206 | China | `cmn` |
| Uyghur | PEID 24104 / PG024104 | China | `uig` |
| Somali | PEID 11954 / PG011954 | Somalia | `som` |
| Southern Pashtun | PEID 24009 / PG024009 | Afghanistan | `pbt` |
| Bengali Sunni Muslims | PEID 1156 / PG001156 | Bangladesh | `ben` |

Coverage remains intentionally partial. Twelve reviewed profiles do **not** imply representative coverage of all peoples, countries, religions, regions, or mission situations.

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

The editorial model does not treat a people's religion, ethnicity, or culture as a shortcut explanation for being unreached. Country/region conflict, legal restrictions, displacement, or access conditions are presented only where sourced and are not described as the sole cause of GSEC status.

### Sharded publication

The editorial publication uses a small manifest plus individually reviewed profile shards:

- `data/context/manifest.v1.json`
- `data/context/profiles/*.json`

The browser materializes these packages into the reviewed-context model. This keeps each profile independently inspectable and allows future coverage growth without rewriting one large publication file.

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
| Reviewed coverage | Local-first index, regional distribution, filtering and navigation over the twelve-profile reviewed publication set |
| Countries | Local Natural Earth index + live country-context records + country-specific reviewed editorial links |
| Languages | Live ISO 639-3 aggregation over current source records |
| Prayer | Current GSEC 0–3 record + fixed release-certified prayer template + private prayer rotation when available |
| Focused prayer | Source-backed prayer flow + optional latest-only local prayer timestamp + guided next-person continuation |
| Editorial context | Twelve reviewed Tier-3 source-record profile shards; intentionally partial coverage |
| Saved & prayer | Browser-local prayer list/rotation, saved people snapshots, and recent exploration |
| ProgressBible | Permission-gated and not used |
| Ethnologue proprietary taxonomy | Permission-gated and not used |
| Third-party people photos | Not redistributed without separate authorization |

## Runtime reliability

PeopleGroups responses are treated as untrusted external input. Protections include Zod validation, request timeouts, pagination/count limits, bounded concurrency, duplicate PGID/PEID rejection, GSEC bounds, fail-closed schema-drift handling, one shared session corpus, IndexedDB caching with a 24-hour fresh window and seven-day explicit stale fallback, and best-effort storage behavior.

Personal prayer state is separate from mission data: it is local-only, bounded, migration-validated, and never treated as an authoritative source record. v1.7 rotation is derived at runtime and adds no persistent ranking or performance state.

## Release certification

A release candidate must pass:

- TypeScript and production build;
- deterministic source/data/editorial/release-policy checks;
- PeopleGroups runtime/cache/visible-data/identity checks;
- geography and mission-visualization checks;
- country, people, context, prayer, prayer-practice, prayer-rotation, language, and discovery checks;
- production distribution checks;
- Chromium, Firefox, and WebKit desktop journeys;
- mobile Chromium and mobile WebKit journeys;
- live PeopleGroups editorial-identity preflight;
- complete live PeopleGroups corpus audit;
- browser API/CORS contract;
- post-merge GitHub Pages certification against the deployed site.

v1.3 requires the original six reviewed editorial profiles to survive deterministic publication validation and live identity verification. v1.4 additionally certifies the local-first coverage browser, reviewed-only People filtering, country editorial handoff, and previous/next/all-coverage article navigation. v1.5 requires twelve Tier-3 profile shards, six newly cross-sourced profiles, seven explicit editorial regions, regional coverage guardrails, and live verification of every declared PeopleGroups identity anchor. v1.6 additionally certifies v1→v2 browser-local personalization migration, private prayer-list persistence, latest-only prayer recording, daily-list preference, and the absence of competitive/spiritual prayer metrics or network synchronization. v1.7 certifies derived prayer rotation ordering, scope-aware selection, guided continuation, schema-v2 reuse, and explicit non-priority/non-performance semantics.

See [`docs/V17_PRAYER_ROTATION.md`](docs/V17_PRAYER_ROTATION.md), [`docs/V16_PRAYER_PRACTICE.md`](docs/V16_PRAYER_PRACTICE.md), [`docs/V15_EDITORIAL_EXPANSION.md`](docs/V15_EDITORIAL_EXPANSION.md), [`docs/V14_EDITORIAL_DISCOVERY.md`](docs/V14_EDITORIAL_DISCOVERY.md), [`docs/V13_EDITORIAL_COVERAGE.md`](docs/V13_EDITORIAL_COVERAGE.md), [`docs/U12_RELEASE_GATES.md`](docs/U12_RELEASE_GATES.md), and [`docs/U12_FINAL_CERTIFICATION.md`](docs/U12_FINAL_CERTIFICATION.md).

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
