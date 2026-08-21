# Unreached

**Explore the peoples. Understand their world. Pray for the nations.**

Unreached is a browser-based Christian world atlas for discovering unreached peoples, understanding their cultural, linguistic, religious, geographic, and gospel-access context, and praying for them intelligently.

- **Target:** https://www.thiepn.dev/unreached/
- **Repository:** https://github.com/thiepn/unreached
- **Platform:** static web application deployed through GitHub Pages
- **Core loop:** **Explore → Understand → Pray**
- **Current phase:** U8 complete; U9 next

## Local development

Requires Node.js 22.12+.

```bash
npm install
npm run dev
```

`npm run dev` generates the pinned Natural Earth map artifact before Vite starts.

Full production/data/map/visualization/country/people/context/prayer validation:

```bash
npm run check
```

Focused checks:

```bash
npm run data:check
npm run geography:build
npm run geography:check
npm run visualization:check
npm run country:check
npm run people:check
npm run context:check
npm run prayer:check
```

Vite is configured for the `/unreached/` project path.

## Current architecture

- Vite 8 + TypeScript 7 + Preact 10
- MapLibre GL JS 6.5
- Natural Earth v5.1.1 1:110m Admin-0 geography
- Zod-backed normalized mission-data schemas
- five-layer country mission-visualization engine
- population-coverage-aware derived metrics
- dedicated country-intelligence dataset and stable ISO3 country routes
- canonical global people profiles with stable source-ID routes
- evidence-backed editorial context dataset for `Who are they?` and `Why Unreached?`
- reviewed prayer-guide dataset joined to U6 people and U7 contextual claims
- deterministic daily prayer selection and 2/5/10-minute focused-prayer flows
- separate build-time data, geography, editorial and prayer-validation pipelines
- static-host-safe hash routing with shareable country, people, prayer, camera and layer state
- deterministic mission-data chunking with SHA-256 manifest metadata
- machine-enforced source permissions and publication gates
- locally bundled Newsreader + Source Sans 3 typography
- native CSS design-token system
- GitHub Actions → GitHub Pages deployment
- no backend, authentication, analytics SDK, client-side source API keys, external map tile service, prayer scoring or competitive spiritual gamification

## U4 mission visualization

The map supports five mission lenses: Unreached population share, Frontier population share, Evangelical presence, Primary religion and Scripture availability. Every layer has explicit missing-data semantics, a legend, methodology text, and a textual country-list equivalent.

The production browser currently does **not** receive real Joshua Project-derived mission records because the U0 redistribution permission gate remains unresolved.

See [`docs/MISSION_VISUALIZATION.md`](docs/MISSION_VISUALIZATION.md) and [`docs/U4_RELEASE_GATES.md`](docs/U4_RELEASE_GATES.md).

## U5 country explorer

Country exploration has stable `#/countries` and `#/countries/:ISO3` routes. Country pages can render geographic identity independently of mission data and, when publishable data exists, expose mission metrics, population scope, largest unreached peoples, languages, derived religious context, Scripture distribution, sources and coverage.

See [`docs/COUNTRY_EXPLORER.md`](docs/COUNTRY_EXPLORER.md), [`docs/COUNTRY_DATA_DISPLAY_RULES.md`](docs/COUNTRY_DATA_DISPLAY_RULES.md), and [`docs/U5_RELEASE_GATES.md`](docs/U5_RELEASE_GATES.md).

## U6 people-group explorer

People exploration has `#/peoples` discovery and `#/peoples/:sourcePeopleId` canonical global profiles. Profiles keep country contexts separate, preserve unknown/quality semantics, resolve language and religion, expose Scripture basis, source-taxonomy related groups and field-level provenance.

The production browser currently does **not** receive real source-derived people records. `public/data/peoples/status.json` keeps the release gate explicit and production code rejects fixture datasets.

See [`docs/PEOPLE_GROUP_EXPLORER.md`](docs/PEOPLE_GROUP_EXPLORER.md), [`docs/PEOPLE_GROUP_DISPLAY_RULES.md`](docs/PEOPLE_GROUP_DISPLAY_RULES.md), and [`docs/U6_RELEASE_GATES.md`](docs/U6_RELEASE_GATES.md).

## U7 contextual profiles & Why Unreached?

U7 adds a separate contextual dataset joined to U6 people profiles. Material claims carry evidence level, fact/synthesis/interpretation kind, certainty, citations, temporal class, freshness dates where needed, sensitivity and review metadata. `Why Unreached?` is dimension-based rather than monocausal boilerplate.

The production browser ships no real-world editorial profile dataset by default. `public/data/context/status.json` keeps that publication state explicit.

See [`docs/CONTEXT_EDITORIAL_ARCHITECTURE.md`](docs/CONTEXT_EDITORIAL_ARCHITECTURE.md), [`docs/WHY_UNREACHED_DISPLAY_RULES.md`](docs/WHY_UNREACHED_DISPLAY_RULES.md), and [`docs/U7_RELEASE_GATES.md`](docs/U7_RELEASE_GATES.md).

## U8 prayer experience

Prayer now has two stable routes:

- `#/pray` — prayer hub, country scope and deterministic People to Pray for Today
- `#/pray/:sourcePeopleId` — focused prayer guide

Reviewed guides contain 4–7 prompts across at least four categories, including gospel and believers/church. Prompts explicitly distinguish biblical, contextual and mixed grounding; contextual factual assumptions reference U7 claims. Current prompts expire through `reviewAfter` dates. Scripture is stored as references and application purposes rather than copied verse text.

Focused prayer offers optional 2/5/10-minute pacing with step navigation. It deliberately has no prayer score, XP, streak, leaderboard, completion target or public prayer log. People profiles link into focused prayer, while country pages link to prayer-ready peoples scoped to that country.

The production browser currently ships no real-world prayer-guide dataset. `public/data/prayer/status.json` keeps that gate explicit and production blocks fixture data.

See [`docs/PRAYER_EXPERIENCE.md`](docs/PRAYER_EXPERIENCE.md), [`docs/PRAYER_DISPLAY_RULES.md`](docs/PRAYER_DISPLAY_RULES.md), and [`docs/U8_RELEASE_GATES.md`](docs/U8_RELEASE_GATES.md).

## V1 scope

1. Interactive world mission map
2. Country explorer
3. People-group explorer
4. People-group profiles
5. Language and Scripture information
6. Gospel-access statistics and definitions
7. “Why unreached?” contextual explanations
8. “Why pray?” and concrete prayer guides
9. People to Pray for Today
10. Search, filtering, and sorting
11. Locally saved prayer peoples
12. Sources, methodology, attribution, and data freshness

V1 deliberately excludes accounts, social features, missionary job listings, agency directories, AI chat, donations, general Bible-reader functionality, and competitive/gamified prayer metrics.

## Foundation documents

### U0
- [`docs/PROJECT_CONSTITUTION.md`](docs/PROJECT_CONSTITUTION.md)
- [`docs/DATA_AND_LEGAL_POLICY.md`](docs/DATA_AND_LEGAL_POLICY.md)
- [`docs/EDITORIAL_AND_PRAYER_STANDARD.md`](docs/EDITORIAL_AND_PRAYER_STANDARD.md)
- [`docs/U0_RELEASE_GATES.md`](docs/U0_RELEASE_GATES.md)
- [`data/source-registry.json`](data/source-registry.json)

### U1
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md)
- [`docs/U1_RELEASE_GATES.md`](docs/U1_RELEASE_GATES.md)

### U2
- [`docs/DATA_ARCHITECTURE.md`](docs/DATA_ARCHITECTURE.md)
- [`docs/JOSHUA_PROJECT_MAPPING.md`](docs/JOSHUA_PROJECT_MAPPING.md)
- [`docs/U2_RELEASE_GATES.md`](docs/U2_RELEASE_GATES.md)

### U3
- [`docs/MAP_ARCHITECTURE.md`](docs/MAP_ARCHITECTURE.md)
- [`docs/U3_RELEASE_GATES.md`](docs/U3_RELEASE_GATES.md)
- [`data/geography-source.json`](data/geography-source.json)

### U4
- [`docs/MISSION_VISUALIZATION.md`](docs/MISSION_VISUALIZATION.md)
- [`docs/U4_RELEASE_GATES.md`](docs/U4_RELEASE_GATES.md)
- [`public/data/mission/status.json`](public/data/mission/status.json)

### U5
- [`docs/COUNTRY_EXPLORER.md`](docs/COUNTRY_EXPLORER.md)
- [`docs/COUNTRY_DATA_DISPLAY_RULES.md`](docs/COUNTRY_DATA_DISPLAY_RULES.md)
- [`docs/U5_RELEASE_GATES.md`](docs/U5_RELEASE_GATES.md)
- [`public/data/countries/status.json`](public/data/countries/status.json)

### U6
- [`docs/PEOPLE_GROUP_EXPLORER.md`](docs/PEOPLE_GROUP_EXPLORER.md)
- [`docs/PEOPLE_GROUP_DISPLAY_RULES.md`](docs/PEOPLE_GROUP_DISPLAY_RULES.md)
- [`docs/U6_RELEASE_GATES.md`](docs/U6_RELEASE_GATES.md)
- [`public/data/peoples/status.json`](public/data/peoples/status.json)

### U7
- [`docs/CONTEXT_EDITORIAL_ARCHITECTURE.md`](docs/CONTEXT_EDITORIAL_ARCHITECTURE.md)
- [`docs/WHY_UNREACHED_DISPLAY_RULES.md`](docs/WHY_UNREACHED_DISPLAY_RULES.md)
- [`docs/U7_RELEASE_GATES.md`](docs/U7_RELEASE_GATES.md)
- [`public/data/context/status.json`](public/data/context/status.json)

### U8
- [`docs/PRAYER_EXPERIENCE.md`](docs/PRAYER_EXPERIENCE.md)
- [`docs/PRAYER_DISPLAY_RULES.md`](docs/PRAYER_DISPLAY_RULES.md)
- [`docs/U8_RELEASE_GATES.md`](docs/U8_RELEASE_GATES.md)
- [`public/data/prayer/status.json`](public/data/prayer/status.json)

## Development phases

- **U0 — Product Constitution, Definitions & Data Legality** ✅
- **U1 — Production Architecture & Design System** ✅
- **U2 — Data Pipeline & Domain Model** ✅
- **U3 — Global Map Foundation** ✅
- **U4 — Mission Visualization Engine** ✅
- **U5 — Country Explorer** ✅
- **U6 — People Group Explorer** ✅
- **U7 — Context & “Why Unreached?”** ✅
- **U8 — Prayer Experience** ✅
- **U9 — Languages & Scripture Integration**
- **U10 — Search, Discovery & Local Personalization**
- **U11 — Release Hardening & Data Expansion**

## Product rule

A proposed V1 feature belongs only if it directly strengthens **Explore → Understand → Pray**.
