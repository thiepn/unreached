# Unreached

**Explore the peoples. Understand their world. Pray for the nations.**

Unreached is a browser-based Christian world atlas for discovering unreached peoples, exploring country, language and mission context, and praying with source-aware information.

- **Live site:** https://www.thiepn.dev/unreached/
- **Repository:** https://github.com/thiepn/unreached
- **Platform:** static Preact/Vite application deployed through GitHub Pages
- **Core loop:** **Explore → Understand → Pray**
- **Version:** **1.0.1**
- **Release state:** **U12 production-data activation complete; v1.0.1 usability/performance hotfix release**

## Release status

U0–U12F are implemented and production-certified. **v1.0.1** is the first post-release repair pass, focused on real user-facing loading, navigation, and rendering defects rather than new mission/data semantics.

v1.0.1 improves the application by:

- fetching the multi-page PeopleGroups runtime corpus in bounded concurrent batches instead of serial page-by-page waits;
- reading validated IndexedDB cache pages concurrently on repeat visits;
- code-splitting route surfaces so non-map routes no longer download the MapLibre application engine at startup;
- keeping the dedicated MapLibre worker while loading it only with the Explore route;
- limiting People Explorer to 48 initially rendered cards and Languages to 60, with progressive disclosure instead of huge DOM trees;
- exposing Languages in primary navigation and restoring Search on mobile;
- restoring legacy design-token aliases that previously caused borders, surfaces, typography, and muted text to disappear on Languages, Prayer, Search, Saved, About, and map UI;
- resizing the map when its responsive container changes to prevent clipped or blank rendering;
- hardening long-content wrapping and horizontal-overflow behavior;
- simplifying People and Language discovery copy and collapsing advanced People filters by default.

The U12F production-data baseline remains unchanged: its source identity, semantic, legal, editorial, and live-provider gates are preserved.

See [`docs/U12_RELEASE_GATES.md`](docs/U12_RELEASE_GATES.md) and [`docs/U12_FINAL_CERTIFICATION.md`](docs/U12_FINAL_CERTIFICATION.md).

## Production data architecture

U12 uses **PeopleGroups.org / IMB Global Research** as the production people-group runtime source. The browser reads the provider's public read-only API directly. Unreached does **not** ship a bundled mirror of the PeopleGroups.org corpus.

A complete live-corpus audit on **23 August 2026** established the source identity contract used by this release:

- 12,370 PGID records
- 12,370 PEID values
- 0 PEIDs attached to more than one PGID
- 0 PEIDs spanning more than one country
- 12,370/12,370 PGID numeric suffixes equal their PEID

Accordingly:

- **PGID** identifies one PeopleGroups.org people-group-in-country source record.
- **PEID** remains the provider numeric field and compatibility route key, but is **not** treated as a cross-country grouping key.
- Every current people route resolves to one PEID/PGID source record.
- Duplicate PEIDs fail closed under the certified current-provider contract.
- Related records across countries use explicit source taxonomy, prioritizing `PplNm` / ROP3 people name, then cluster and affinity bloc.
- Matching taxonomy never merges population, GSEC, religion or resources into a synthetic global record.
- Valid source ROL / ISO 639-3 values identify language records.
- Reviewed editorial context attaches only through explicitly verified PEID + PGID + name + country + language evidence.
- Legacy numeric IDs never establish PEID identity by numeric coincidence.

### Mission and resource semantics

IMB **GSEC** remains source-native:

- GSEC 0–3 → `unreached`
- GSEC 4–6 → `other`
- missing → `unknown`

`other` is deliberately not renamed `reached`. Unreached does not fabricate Joshua Project `JPScale`, `Frontier`, exact evangelical percentages, or normalized Scripture-completeness claims from incompatible IMB fields. Bible, Jesus Film and resource values remain raw source labels with explicit coverage. Unknown values stay unknown rather than becoming zero.

## Production surfaces

| Domain | Production mode |
| --- | --- |
| Mission Atlas | Natural Earth geography + live PeopleGroups.org source-record aggregation |
| Peoples | One live PEID/PGID source record per route |
| Countries | Natural Earth geography + live country-context records |
| Languages & resources | Live ISO 639-3 aggregation over individual source records + raw resource fields |
| Prayer | One live GSEC 0–3 source record + fixed release-certified prayer template |
| Reviewed editorial context | Separately authored, reviewed source-record profiles with intentionally partial coverage |
| ProgressBible translation-progress data | Permission-gated and not used |
| Ethnologue proprietary taxonomy | Permission-gated and not used |
| Third-party people photos | Not redistributed without separate authorization |

## Mission Atlas

The root atlas uses five source-safe layers:

1. **GSEC 0–3 population share** among records with known population and known GSEC.
2. **GSEC 0–3 context share** among records with known GSEC.
3. **GSEC coverage** across represented source records.
4. **Population estimate coverage** across represented source records.
5. **People-group contexts** as a direct PGID source-record count.

No-data remains no-data. These denominators are PeopleGroups source records, not national census statistics.

## People Explorer

`#/peoples` supports source-aware search/filtering by GSEC, country, language, religion, Bible label, population, PEID, PGID and text. Large result sets render progressively rather than mounting the entire corpus at once.

`#/peoples/:PEID` displays one source record with:

- PEID / PGID identity
- country
- population estimate when reported
- GSEC and source evangelical-level text
- language and religion labels
- Bible / Jesus Film availability
- engagement / church-planting fields when reported
- source taxonomy
- attributed provider descriptions
- source update and methodology information
- reviewed editorial context when that profile has passed publication gates

People without reviewed editorial context keep the live source profile and a clear unpublished-context state. Unreached does not generate generic cultural or spiritual filler.

The first U12F reviewed production profile is **Fon of Benin — PEID 12319 / PG012319 / BEN / fon**.

## Countries

`#/countries` and `#/countries/:ISO3` combine Natural Earth geography with live PeopleGroups source records. Population and religion/language summaries identify known-value coverage and are not presented as national census totals.

## Languages & resources

`#/languages` groups the shared runtime corpus by valid source ROL / ISO 639-3 values and is available directly from primary navigation. Large results render progressively.

Language pages show source name/family, source-record and country counts, represented known population with coverage, GSEC breakdown, people links, raw Bible/Jesus/resource distributions, source freshness and an explicit source-record denominator.

Same-named people records in different countries remain separate. Generic Bible availability is never converted into `translation-needed`, `portions`, `New Testament`, or `complete Bible` milestones.

## Prayer

`#/pray` uses current source records whose own GSEC is 0–3. Prayer wording comes from fixed release-certified template **`u12c-v1`** and interpolates only the selected record's source-backed people, country, identity, GSEC and resource fields.

Focused prayer retains 2/5/10-minute pacing without scores, streaks, leaderboards, public activity, or fabricated person-level spiritual claims.

## Search, Saved and Recent

- `/` or `Ctrl/Cmd+K` opens global search; the Search action is also visible on mobile.
- Live people/country/language data is loaded lazily when discovery surfaces need it.
- GSEC 0–3 records can be saved locally for prayer.
- Recent people/country/language visits remain browser-local.
- Legacy saved snapshots remain readable after the U12F identity correction.

## Runtime reliability

PeopleGroups responses are treated as untrusted external input. Runtime protections include:

- Zod validation
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
- best-effort cache behavior so storage failure cannot block a healthy live API

The normal browser suite uses deterministic provider fixtures. An independent PeopleGroups Live Certification workflow validates editorial anchors, the complete external corpus, current identity assumptions, and browser API/CORS behavior.

## Release certification

Release branches are first-class certification targets. A release candidate must pass:

- TypeScript and production build
- deterministic data/policy checks
- PeopleGroups runtime, visible-data and cache checks
- geography and mission-visualization checks
- country, people, context, prayer, language and discovery checks
- production distribution checks
- Chromium, Firefox and WebKit desktop/browser journeys
- mobile Chromium and mobile WebKit journeys
- live PeopleGroups editorial identity preflight
- complete live PeopleGroups corpus audit
- browser API/CORS contract
- post-merge GitHub Pages production certification

v1.0.1 additionally certifies bounded People/Language DOM rendering, Search/Languages navigation visibility, restored computed design styles, and horizontal-overflow behavior across desktop and mobile viewports.

## Local development

Requires Node.js 22.12+.

```bash
npm install
npm run dev
```

Full production validation:

```bash
npm run check
```

Focused checks:

```bash
npm run data:check
npm run peoplegroups:check
npm run peoplegroups:runtime-check
npm run peoplegroups:visible-check
npm run peoplegroups:editorial-identity-live-check
npm run peoplegroups:live-corpus-check
npm run geography:check
npm run visualization:check
npm run visualization:live-check
npm run country:check
npm run people:check
npm run context:check
npm run prayer:check
npm run language:check
npm run discovery:check
npm run release:check
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
- browser-local IndexedDB + localStorage personalization
- GitHub Actions + GitHub Pages
- locally bundled Newsreader + Source Sans 3 typography
- no backend, account system, analytics SDK, external map tile service, prayer scoring, or client-side API secret

## Development phases

- **U0 — Product Constitution, Definitions & Data Legality** ✅
- **U1 — Production Architecture & Design System** ✅
- **U2 — Data Pipeline & Domain Model** ✅
- **U3 — Global Map Foundation** ✅
- **U4 — Mission Visualization Engine** ✅
- **U5 — Country Explorer** ✅
- **U6 — People Group Explorer** ✅
- **U7 — Context & Why Unreached?** ✅
- **U8 — Prayer Experience** ✅
- **U9 — Languages & Scripture Integration** ✅
- **U10 — Search, Discovery & Local Personalization** ✅
- **U11 — Release Hardening & Data Expansion** ✅
- **U12A — Provider Foundation & Semantic Isolation** ✅
- **U12B — Real Data Runtime Architecture** ✅
- **U12C — Visible Real-Data Integration** ✅
- **U12D — Live Mission Visualization** ✅
- **U12E — Live Language & Resource Integration** ✅
- **U12F — Reviewed Editorial Context Migration & Identity Correction** ✅ production-certified
- **U12 — Production Data Activation** ✅ complete
- **v1.0.1 — Performance, Navigation & Rendering Repair** 🚧 release certification

## Product rule

A feature belongs only if it directly strengthens **Explore → Understand → Pray** while preserving source meaning, uncertainty, editorial provenance and user privacy.
