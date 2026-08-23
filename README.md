# Unreached

**Explore the peoples. Understand their world. Pray for the nations.**

Unreached is a browser-based Christian world atlas for discovering unreached peoples, exploring country, language and mission context, and praying with source-aware information.

- **Live site:** https://www.thiepn.dev/unreached/
- **Repository:** https://github.com/thiepn/unreached
- **Platform:** static Preact/Vite application deployed through GitHub Pages
- **Core loop:** **Explore → Understand → Pray**
- **Current phase:** **U12E — Live Language & Resource Integration**

## Real-data architecture

U12 uses **PeopleGroups.org / IMB Global Research** as the production people-group runtime source.

The public application reads the provider's read-only API directly from the browser. Unreached does **not** ship a bundled mirror of the PeopleGroups.org corpus.

### Identity and methodology

- **PEID** is the canonical cross-country people entity used by live people routes.
- Every **PGID** is preserved as its own country-context record.
- Valid PeopleGroups.org **ROL / ISO 639-3** values identify live language records.
- IMB **GSEC** remains source-native:
  - GSEC 0–3 → `unreached`
  - GSEC 4–6 → `other`
  - missing → `unknown`
- `other` is deliberately not renamed `reached`.
- Joshua Project `JPScale`, `Frontier`, and exact evangelical percentages are not fabricated from IMB fields.
- Bible and Jesus Film fields are displayed as raw source availability labels rather than converted into translation-completeness claims.
- Population totals disclose whether every country context has a known estimate.

### Production publication modes

| Domain | Production state |
| --- | --- |
| Mission atlas | Natural Earth geography + live PeopleGroups.org runtime aggregation |
| Peoples | Live PeopleGroups.org runtime API |
| Countries | Natural Earth geography + live PeopleGroups.org runtime records |
| Languages & resources | Live PeopleGroups.org ISO 639-3 + raw resource fields |
| Prayer | Live people subjects + fixed release-certified prayer template |
| Reviewed editorial context dataset | Still separately gated |
| ProgressBible translation-progress data | Permission-gated and not used |
| Ethnologue proprietary taxonomy | Permission-gated and not used |

PeopleGroups.org runtime reads are policy-approved independently from static redistribution. Static public dataset mirroring and third-party people-photo reuse remain blocked unless separately authorized.

## Live product surfaces

### Mission Atlas

The root map uses the same shared PeopleGroups.org corpus as the other live product surfaces. Its production layers are intentionally limited to source-native or narrowly derived measures:

- **GSEC 0–3 population share** — among PGID contexts that have both known population and known GSEC
- **GSEC 0–3 context share** — among PGID contexts with known GSEC
- **GSEC coverage** — share of represented PGID contexts with a reported GSEC value
- **Population estimate coverage** — share of represented PGID contexts with a population estimate
- **People-group contexts** — direct count of PeopleGroups.org PGID country-context records

Every layer preserves no-data states. Population/context denominators are shown explicitly and are not presented as national census statistics. The live atlas does not infer Frontier, JPScale, normalized Scripture completeness, or an evangelical percentage from incompatible fields.

### People Explorer

`#/peoples` searches and filters live PEID entities by:

- source-native GSEC rollup
- country
- source-backed language and religion
- raw Bible availability label
- known represented population
- PEID / PGID / people / country text search

`#/peoples/:PEID` displays:

- country-context PGIDs
- estimated population and completeness
- GSEC and evangelical-level source text
- language and religion source labels
- Bible / Jesus Film availability
- engagement and church-planting fields where reported
- PeopleGroups.org source taxonomy
- attributed provider descriptions
- source update dates and methodology notes

### Country Explorer

`#/countries` and `#/countries/:ISO3` combine Natural Earth geography with PeopleGroups.org people-group-in-country records.

Country aggregation explicitly identifies its denominator. Represented population and religion/language shares are based only on the source contexts with known values; they are not presented as national census statistics.

### Languages & Resources

`#/languages` groups the shared runtime corpus by valid PeopleGroups.org `ROL` / ISO 639-3 code. It can search and filter by language, people, country, GSEC context, and raw Bible availability label.

`#/languages/:ISO6393` displays:

- source-reported language name and family
- unique PEIDs and PGID country contexts using that ISO code
- represented population with population-field coverage
- GSEC 0–3 / 4–6 / unknown context counts
- country and people relationships
- raw Bible availability-label distribution
- raw Jesus Film availability-label distribution
- raw total-resource-field coverage and values
- source load date and newest provider update date
- the explicit denominator: PeopleGroups.org PGID country-context records reporting that ISO 639-3 language

The language surface deliberately does **not** infer `translation-needed`, `portions`, `New Testament`, or `complete Bible` from PeopleGroups.org's generic Bible-availability field. ProgressBible registered translation-progress data and Ethnologue proprietary taxonomy remain excluded without compatible permission.

### Prayer

`#/pray` uses current PEIDs with at least one GSEC 0–3 country context as prayer subjects.

Prayer wording comes from fixed release-certified template **`u12c-v1`**. Runtime interpolation is limited to source-backed identity, country, GSEC, and resource fields. Unreached does not generate arbitrary person-by-person factual or spiritual claims.

Focused prayer keeps the existing 2/5/10-minute pacing modes without scores, streaks, leaderboards, completion ranks, or public prayer activity.

### Search, Saved, and Recent

- `/` or `Ctrl/Cmd+K` opens global search.
- Opening search lazily loads the shared live people/country/language runtime corpus; the closed dialog does not trigger a large source download.
- PEID people profiles can be saved locally for prayer when they contain a GSEC 0–3 context.
- People, country and language recent visits remain browser-local under `unreached.personal.v1`.
- Legacy saved snapshots remain readable after the PEID migration.

## Runtime reliability

PeopleGroups.org responses are treated as untrusted external input.

The runtime includes:

- Zod validation
- 10-second per-request timeout
- maximum 250 records/page
- maximum 100 pages / 25,000 records
- pagination and advertised-count consistency checks
- duplicate PGID detection
- GSEC 0–6 bounds
- fail-closed schema drift handling
- one shared application-session corpus store
- origin-local IndexedDB cache
- 24-hour fresh cache window
- 7-day explicit stale fallback window
- best-effort cache behavior so browser-storage failure cannot block a healthy live API

The normal browser suite uses a deterministic intercepted provider corpus. A separate **PeopleGroups Live Certification** workflow tests the full real corpus plus browser CORS/API behavior so provider uptime does not redefine unrelated application correctness.

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

Important focused checks:

```bash
npm run data:check
npm run peoplegroups:check
npm run peoplegroups:runtime-check
npm run peoplegroups:visible-check
npm run geography:check
npm run visualization:check
npm run visualization:live-check
npm run country:check
npm run people:check
npm run prayer:check
npm run language:check
npm run discovery:check
npm run release:check
npm run e2e
```

Vite is configured for the `/unreached/` project path.

## Current stack

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
- **U7 — Context & Why Unreached?** ✅ architecture/review system; production editorial dataset still separately gated
- **U8 — Prayer Experience** ✅
- **U9 — Languages & Scripture Integration** ✅ architecture; legacy publication dataset superseded by U12E runtime semantics
- **U10 — Search, Discovery & Local Personalization** ✅
- **U11 — Release Hardening & Data Expansion** ✅
- **U12A — Provider Foundation & Semantic Isolation** ✅
- **U12B — Real Data Runtime Architecture** ✅
- **U12C — Visible Real-Data Integration** ✅
- **U12D — Live Mission Visualization** ✅
- **U12E — Live Language & Resource Integration** 🚧 implementation/certification

See [`docs/U12_RELEASE_GATES.md`](docs/U12_RELEASE_GATES.md) and [`docs/PEOPLEGROUPS_RUNTIME_ARCHITECTURE.md`](docs/PEOPLEGROUPS_RUNTIME_ARCHITECTURE.md) for the current data/publication contract.

## Product rule

A feature belongs only if it directly strengthens **Explore → Understand → Pray** while preserving source meaning, uncertainty, and user privacy.
