# Unreached

**Explore the peoples. Understand their world. Pray for the nations.**

Unreached is a browser-based Christian world atlas for discovering unreached peoples, understanding their cultural, linguistic, religious, geographic, and gospel-access context, and praying for them intelligently.

- **Target:** https://www.thiepn.dev/unreached
- **Repository:** https://github.com/thiepn/unreached
- **Platform:** static web application deployed through GitHub Pages
- **Core loop:** **Explore → Understand → Pray**
- **Current phase:** U0 complete; U1 next

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

## Foundational documents

- [`docs/PROJECT_CONSTITUTION.md`](docs/PROJECT_CONSTITUTION.md) — product mission, scope, definitions, safety, privacy, and architecture constraints
- [`docs/DATA_AND_LEGAL_POLICY.md`](docs/DATA_AND_LEGAL_POLICY.md) — data-source approvals, licensing, provenance, attribution, and release gates
- [`docs/EDITORIAL_AND_PRAYER_STANDARD.md`](docs/EDITORIAL_AND_PRAYER_STANDARD.md) — profile-writing, evidence, “Why unreached?”, prayer, naming, and sensitive-content standards
- [`docs/U0_RELEASE_GATES.md`](docs/U0_RELEASE_GATES.md) — U0 completion checklist and unresolved external release gates
- [`data/source-registry.json`](data/source-registry.json) — machine-readable source status registry

## Data baseline

- **Joshua Project:** conditional primary mission-data source; non-commercial use, visible attribution, and value-added presentation required. Full-scale static public distribution is gated on written confirmation.
- **Natural Earth:** approved public-domain geographic base.
- **ProgressBible registered data:** not included without written permission.
- **Wikimedia Commons:** media accepted only after per-file license review.
- **Proprietary linguistic datasets:** not ingested without a compatible license.

## Development phases

- **U0 — Product Constitution, Definitions & Data Legality** ✅
- **U1 — Production Architecture & Design System**
- **U2 — Data Pipeline & Domain Model**
- **U3 — Global Map Foundation**
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
