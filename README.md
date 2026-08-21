# Unreached

**Explore the peoples. Understand their world. Pray for the nations.**

Unreached is a browser-based Christian world atlas for discovering unreached peoples, understanding their cultural, linguistic, religious, geographic, and gospel-access context, and praying for them intelligently.

- **Target:** https://www.thiepn.dev/unreached/
- **Repository:** https://github.com/thiepn/unreached
- **Platform:** static web application deployed through GitHub Pages
- **Core loop:** **Explore → Understand → Pray**
- **Current phase:** U3 complete; U4 next

## Local development

Requires Node.js 22.12+.

```bash
npm install
npm run dev
```

`npm run dev` generates the pinned Natural Earth map artifact before Vite starts.

Full production/data/map validation:

```bash
npm run check
```

Focused checks:

```bash
npm run data:check
npm run geography:build
npm run geography:check
```

Vite is configured for the `/unreached/` project path.

## Current architecture

- Vite 8 + TypeScript 7 + Preact 10
- MapLibre GL JS 6.5
- Natural Earth v5.1.1 1:110m Admin-0 geography
- Zod-backed normalized mission-data schemas
- separate build-time data and geography pipelines
- static-host-safe hash routing with shareable map query state
- deterministic mission-data chunking with SHA-256 manifest metadata
- machine-enforced source permissions
- locally bundled Newsreader + Source Sans 3 typography
- native CSS design-token system
- GitHub Actions → GitHub Pages deployment
- no backend, authentication, analytics SDK, client-side source API keys, or external map tile service

## U3 map foundation

The Explore page now has a real interactive world map with:

- pan/zoom and keyboard map navigation
- hover/click country-area selection
- fit-to-selection and reset-to-world
- URL-synced selected area and camera state
- desktop country/area search and list
- mobile map-first expandable bottom sheet
- textual fallback when interactive rendering is unavailable
- visible disclosure of Natural Earth's de facto boundary presentation

Mission data is deliberately **not** painted onto the map yet. U4 owns mission-data joins, choropleths, legends, and layers.

See [`docs/MAP_ARCHITECTURE.md`](docs/MAP_ARCHITECTURE.md) and [`docs/U3_RELEASE_GATES.md`](docs/U3_RELEASE_GATES.md).

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

## Development phases

- **U0 — Product Constitution, Definitions & Data Legality** ✅
- **U1 — Production Architecture & Design System** ✅
- **U2 — Data Pipeline & Domain Model** ✅
- **U3 — Global Map Foundation** ✅
- **U4 — Mission Visualization Engine**
- **U5 — Country Explorer**
- **U6 — People Group Explorer**
- **U7 — Context & “Why Unreached?”**
- **U8 — Prayer Experience**
- **U9 — Languages & Scripture Integration**
- **U10 — Search, Discovery & Local Personalization**
- **U11 — Release Hardening & Data Expansion**

## Product rule

A proposed V1 feature belongs only if it directly strengthens **Explore → Understand → Pray**.
