# Unreached

**Explore the peoples. Understand their world. Pray for the nations.**

Unreached is a browser-based Christian mission atlas for discovering unreached peoples, understanding source-backed country/language context, and moving from information into prayer.

- **Live site:** https://www.thiepn.dev/unreached/
- **Repository:** https://github.com/thiepn/unreached
- **Platform:** static Preact/Vite application deployed through GitHub Pages
- **Core loop:** **Explore → Understand → Pray**
- **Version:** **1.2.0**
- **Release state:** **v1.2 Guided Exploration & Content Prioritization release candidate**

## v1.2

v1.2 adds a guided entry layer on top of the simplified v1.1 application without turning Unreached into a mission-priority scoring system.

### Guided starting points

People Explorer now offers a small set of source-backed starting points when the user does not know what to search for. The selection method is intentionally narrow and explainable:

- current PeopleGroups.org source record;
- source record classified GSEC 0–3;
- known reported population estimate;
- larger reported estimates appear first;
- country diversity is preferred where possible.

This is explicitly a **discovery heuristic, not a ranking of mission importance**. Unreached does not infer spiritual urgency, receptivity, cultural resistance, or hidden priority scores.

Country profiles also surface one clear **Start here** people context before the full country table. It uses the largest known-population GSEC 0–3 source record in that country as a navigation starting point and discloses the method directly in the interface.

### Explore → Understand → Pray

People profiles now make the product journey visible as three explicit steps:

1. **Explore** — return to the relevant country/map context.
2. **Understand** — read the current source-backed people profile.
3. **Pray** — continue to the focused prayer guide when the current record is GSEC 0–3.

The prayer handoff still uses the fixed release-certified prayer template. v1.2 does not add person-by-person AI-authored spiritual claims.

### Better recovery

A no-match People Explorer state now explains what happened and provides one action to clear search/filters and return to the full index plus guided starting points.

## v1.1 baseline retained

v1.2 preserves the v1.1 UX and performance reconstruction:

- primary navigation remains **Explore / Peoples / Pray**;
- Countries, Languages, and About & sources stay under **Browse**;
- Search and Saved remain utility actions;
- People, Languages, and Countries remain search-first;
- advanced filters/sorting remain collapsed until requested;
- People, Language, and Country indexes remain bounded and progressively reveal more;
- MapLibre remains isolated to Explore instead of loading globally;
- Explore paints local Natural Earth geography before activating the full PeopleGroups runtime corpus;
- Countries paints its local country index before remote mission aggregation begins;
- opening global Search without a query does not load PeopleGroups;
- People and Language full-corpus matching remains debounced;
- derived Language records remain cached for a stable runtime corpus;
- PeopleGroups network pagination remains bounded-concurrent;
- validated IndexedDB cache pages are read concurrently.

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
| Peoples | One current PEID/PGID source record per route + source-safe guided starting points |
| Countries | Local Natural Earth index + live country-context records + one disclosed guided starting context |
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

They are presented through a single selector. No-data remains no-data, and all denominators describe PeopleGroups source records rather than national census populations.

## Peoples

`#/peoples` supports guided starting points plus search and optional filtering by GSEC, country, language, religion, Bible label, population, PEID, PGID, and text.

`#/peoples/:PEID` prioritizes:

- identity and current status
- population estimate
- GSEC
- country
- language / religion
- explicit Explore → Understand → Pray progression
- direct focused-prayer action when the record is GSEC 0–3
- the current provider source record
- reviewed editorial context when published

Provider descriptions are attributed as provider material. Taxonomy, related records, and methodology remain available but do not compete with the first-screen decision flow.

The first U12F reviewed production profile is **Fon of Benin — PEID 12319 / PG012319 / BEN / fon**.

## Countries

`#/countries` uses local Natural Earth geography immediately, so the index is useful before PeopleGroups aggregation completes. `#/countries/:ISO3` combines geography with live country-context records while keeping population/data coverage explicit and now offers one disclosed GSEC 0–3 starting context before the larger table.

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

v1.2 additionally certifies guided starting points, disclosure that curation is not a mission-priority ranking, country-to-people handoff, no-match recovery, and the explicit Explore → Understand → Pray profile journey.

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