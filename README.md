# Unreached

**Explore the peoples. Understand their world. Pray for the nations.**

Unreached is a browser-based Christian mission atlas for discovering unreached peoples, understanding source-backed country/language context, and moving from information into prayer.

- **Live site:** https://www.thiepn.dev/unreached/
- **Repository:** https://github.com/thiepn/unreached
- **Platform:** static Preact/Vite application deployed through GitHub Pages
- **Core loop:** **Explore → Understand → Pray**
- **Version:** **1.1.0**
- **Release state:** **v1.1 UX Simplification & Performance Refinement release candidate**

## v1.1

v1.1 is a usability and runtime-efficiency pass over the U12 production-data baseline. It deliberately removes interface competition rather than adding another feature layer.

### Simpler navigation

Primary navigation now expresses the three main product tasks:

1. **Explore** — use the mission atlas.
2. **Peoples** — find and understand a people-group source record.
3. **Pray** — move into a focused prayer guide.

**Countries**, **Languages**, and **About & sources** remain fully available under **Browse**. Search and Saved remain utility actions.

### Simpler discovery

- People, Languages, and Countries are search-first rather than filter-first.
- Advanced filters and sorting are collapsed until requested.
- People, Language, and Country indexes render **48 records initially** and progressively reveal more.
- People cards show only the information needed to choose a profile.
- People profiles lead with four essential facts and a direct **Pray now** action.
- Related records, taxonomy, source methodology, and other dense material remain available through progressive disclosure.
- Explore uses one explicit **Map view** selector instead of five competing layer buttons.
- Map provenance and boundary notes remain accessible without occupying the primary control flow.

### Faster interaction

- The app shell is route-split; MapLibre is isolated to Explore instead of loading globally.
- Explore paints local Natural Earth geography before activating the full PeopleGroups runtime corpus.
- Countries paints its local country index before remote mission aggregation begins.
- Opening global Search with an empty query does **not** load PeopleGroups; remote data begins only after the user types.
- People and Language full-corpus matching is debounced during typing.
- Derived Language records are cached for a stable runtime corpus instead of being rebuilt across surfaces.
- PeopleGroups network pagination remains bounded-concurrent rather than serial.
- Validated IndexedDB cache pages are read concurrently.

## Production data architecture

Production people-group data comes from **PeopleGroups.org / IMB Global Research** through its public read-only API. The browser reads that source at runtime; Unreached does **not** publish a bundled mirror of the provider corpus.

A complete live-corpus audit on **23 August 2026** established the current source-identity contract:

- 12,370 PGID records
- 12,370 PEID values
- 0 PEIDs attached to more than one PGID
- 0 PEIDs spanning more than one country
- 12,370/12,370 PGID numeric suffixes equal their PEID

Accordingly:

- **PGID** identifies one PeopleGroups.org people-group-in-country source record.
- **PEID** is retained as the provider numeric field and compatibility route key, but is **not** treated as a cross-country grouping key.
- Current people routes resolve to one PEID/PGID source record.
- Duplicate PEIDs fail closed under the certified current-provider contract.
- Related records use explicit provider taxonomy such as `PplNm` / ROP3 people name, cluster, or affinity bloc.
- Taxonomy relationships never merge population, GSEC, religion, or resource fields into a synthetic global record.
- Reviewed editorial context attaches only through explicitly verified PEID + PGID + name + country + language evidence.
- Legacy numeric IDs never establish identity by numeric coincidence.

## Mission and resource semantics

IMB **GSEC** remains source-native:

- GSEC 0–3 → `unreached`
- GSEC 4–6 → `other`
- missing → `unknown`

`other` is deliberately not renamed `reached`.

Unreached does not derive or fabricate Joshua Project `JPScale`, `Frontier`, exact evangelical percentages, Scripture-completeness milestones, or cultural/spiritual claims from incompatible fields. Bible, Jesus Film, and resource values remain raw provider labels with explicit coverage. Unknown values remain unknown.

## Product surfaces

| Surface | Production behavior |
| --- | --- |
| Explore | Natural Earth geography + live PeopleGroups.org mission aggregation |
| Peoples | One current PEID/PGID source record per route |
| Countries | Local Natural Earth index + live country-context records |
| Languages | Live ISO 639-3 aggregation over current source records |
| Prayer | Current GSEC 0–3 record + fixed release-certified prayer template |
| Editorial context | Separately authored/reviewed source-record profiles; intentionally partial coverage |
| Saved / Recent | Browser-local only |
| ProgressBible | Permission-gated and not used |
| Ethnologue proprietary taxonomy | Permission-gated and not used |
| Third-party people photos | Not redistributed without separate authorization |

## Explore

The atlas retains five source-safe views:

1. GSEC 0–3 population share
2. GSEC 0–3 context share
3. GSEC field coverage
4. population-estimate coverage
5. people-group context count

v1.1 presents them through a single selector. No-data remains no-data, and all denominators describe PeopleGroups source records rather than national census populations.

## Peoples

`#/peoples` supports search and optional filtering by GSEC, country, language, religion, Bible label, population, PEID, PGID, and text.

`#/peoples/:PEID` prioritizes:

- identity and current status
- population estimate
- GSEC
- country
- language / religion
- direct focused-prayer action when the record is GSEC 0–3
- the current provider source record
- reviewed editorial context when published

Provider descriptions are attributed as provider material. Taxonomy, related records, and methodology remain available but no longer compete with the first-screen decision flow.

The first U12F reviewed production profile is **Fon of Benin — PEID 12319 / PG012319 / BEN / fon**.

## Countries

`#/countries` uses local Natural Earth geography immediately, so the index is useful before PeopleGroups aggregation completes. `#/countries/:ISO3` combines geography with live country-context records while keeping population/data coverage explicit.

## Languages

`#/languages` groups the shared runtime corpus by valid source ROL / ISO 639-3 values. Language profiles show country/people connections, represented known population with coverage, GSEC distribution, raw Bible/Jesus/resource labels, source freshness, and an explicit source-record denominator.

Generic Bible availability is never converted into `translation-needed`, `portions`, `New Testament`, or `complete Bible` milestones.

## Prayer

`#/pray` uses current source records whose own GSEC is 0–3. Prayer wording comes from fixed release-certified template **`u12c-v1`** and interpolates only source-backed identity, country, GSEC, and resource information.

Focused prayer retains 2/5/10-minute pacing without scores, streaks, leaderboards, public activity, or fabricated person-level spiritual claims.

## Search, Saved and Recent

- `/` or `Ctrl/Cmd+K` opens global Search.
- Search opens immediately from local UI state and Recent history.
- The full PeopleGroups search corpus activates only once a query is entered.
- GSEC 0–3 people can be saved locally for prayer.
- Recent people/country/language visits stay in the browser.
- There is no account system, public prayer activity, or analytics SDK.

## Runtime reliability

PeopleGroups responses are treated as untrusted external input. Protections include:

- Zod runtime validation
- 10-second per-request timeout
- maximum 250 records/page
- maximum 100 pages / 25,000 records
- bounded six-page network concurrency after the first validated page
- pagination and advertised-count consistency checks
- duplicate PGID detection
- duplicate PEID rejection under the current certified contract
- GSEC 0–6 bounds
- fail-closed schema-drift handling
- one shared application-session corpus store
- origin-local IndexedDB cache
- concurrent validated cache-page reads
- 24-hour fresh cache window
- 7-day explicit stale fallback window
- best-effort cache behavior so storage failure cannot block a healthy API

## Release certification

A release candidate must pass:

- TypeScript and production build
- deterministic source/data/policy checks
- PeopleGroups runtime, cache, visible-data, and identity checks
- geography and mission-visualization checks
- country, people, context, prayer, language, and discovery checks
- production distribution checks
- Chromium, Firefox, and WebKit desktop journeys
- mobile Chromium and mobile WebKit journeys
- responsive navigation/overflow checks
- live PeopleGroups editorial-identity preflight
- complete live PeopleGroups corpus audit
- browser API/CORS contract
- post-merge GitHub Pages certification against the deployed site

v1.1 additionally certifies simplified Browse navigation, collapsed advanced controls, bounded People/Language/Country DOMs, direct profile prayer action, and zero PeopleGroups requests when Search opens without a query.

See [`docs/U12_RELEASE_GATES.md`](docs/U12_RELEASE_GATES.md) and [`docs/U12_FINAL_CERTIFICATION.md`](docs/U12_FINAL_CERTIFICATION.md) for the production-data gates.

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

## Stack

- Vite 8
- TypeScript 7
- Preact 10
- MapLibre GL JS 5.24
- Natural Earth v5.1.1 Admin-0 geography
- Zod runtime schemas
- IndexedDB + localStorage browser persistence
- GitHub Actions + GitHub Pages
- locally bundled Newsreader + Source Sans 3 typography
- no backend, account system, analytics SDK, external map tile service, prayer scoring, or client-side API secret

## Development phases

- **U0–U11 — Product foundation through release hardening** ✅
- **U12A — Provider Foundation & Semantic Isolation** ✅
- **U12B — Real Data Runtime Architecture** ✅
- **U12C — Visible Real-Data Integration** ✅
- **U12D — Live Mission Visualization** ✅
- **U12E — Live Language & Resource Integration** ✅
- **U12F — Reviewed Editorial Context Migration & Identity Correction** ✅
- **U12 — Production Data Activation** ✅
- **v1.0.1 — Performance, Navigation & Rendering Repair** ✅ merged
- **v1.1.0 — UX Simplification & Performance Refinement** 🚧 release certification

## Product rule

A feature belongs only if it strengthens **Explore → Understand → Pray** while preserving source meaning, uncertainty, editorial provenance, and user privacy.
