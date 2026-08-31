# Unreached

**Explore the peoples. Understand their world. Pray for the nations.**

Unreached is a browser-based Christian mission atlas for discovering people groups, understanding source-backed context, and moving from information into prayer.

- **Live site:** https://www.thiepn.dev/unreached/
- **Current version:** **2.1.5**
- **Platform:** Preact/Vite on GitHub Pages
- **Optional continuity:** Cloudflare Worker + D1 + Cloudflare Access
- **Core loop:** **Explore → Understand → Pray**

## Current production behavior

Version 2.1.5 is a **release and operations automation hardening maintenance release** on the certified 2.1 line. It does not change the user-facing comprehension-first product introduced in v2.1.4. Instead, it removes the version-pinned release-publisher lifecycle and strengthens scheduled operations health so release/tag/production-state drift is detected automatically.

The v2.1.4 comprehension-first UX remains unchanged: people profiles explain why a record is marked unreached before exposing exact GSEC classification, keep the first overview to four essential facts, promote prayer as a first-class action, and move PEID/PGID, taxonomy and methodology into detailed research disclosures. Country profiles begin with three understandable metrics and surface the largest represented unreached peoples before technical tables. Explore keeps the certified map layer IDs and denominator semantics while treating coverage/count layers as opt-in research views.

The first-minute entry path exposes **What does “unreached” mean?** and a direct **Pray today** action on desktop and mobile. Short desktop viewports compact non-essential explanatory chrome so the country browser remains usable without overlapping the map workspace.

The v2.1.2 loading improvements and v2.1.3 map-layout fix remain intact: prepared PeopleGroups data hydrates immediately from IndexedDB, provider connection setup and signaled route chunks can prewarm opportunistically, a true cold People Explorer can become searchable after the first validated provider page, and map methodology remains in normal flow on narrow desktop layouts.

Any cold partial catalog is explicitly labeled as incomplete. Complete-world map, country, language and prayer aggregates remain gated on the full validated PeopleGroups corpus, and partial network data is never persisted as a complete prepared snapshot.

Production includes live PeopleGroups.org mission data, Natural Earth geography, twelve separately reviewed contextual profiles, browser-local Saved/prayer tools, an installable offline shell, and optional explicit private cross-device continuity.

The application does **not** ship a public static mirror of the PeopleGroups.org corpus. It also does not include ProgressBible registered data, Ethnologue proprietary datasets, or third-party people photos without separate rights review.

## Data sources

**PeopleGroups.org / IMB Global Research** is the active runtime source for people, country, language, religion, mission-status and resource fields. The provider's public API documentation explicitly invites use in maps, prayer tools and research applications. Unreached accesses those records at runtime and does not claim ownership of them.

**Natural Earth** supplies the bundled geographic base and is public domain.

A complete live-corpus certification on **23 August 2026** found 12,370 PGID records and 12,370 PEID values in a one-to-one relationship in that audited snapshot. This is a dated release certification, not a permanent claim about future provider data.

IMB GSEC values remain source-native: GSEC 0–3 is treated as `unreached`, GSEC 4–6 as `other`, and missing values as `unknown`. Unreached does not fabricate Joshua Project JPScale/Frontier values, exact evangelical percentages, or Scripture-completeness milestones from incompatible fields.

## Privacy

Anonymous/local-only use is the default. Core exploration and prayer features do not require an account.

Browser-local storage can contain Saved/prayer membership, recent routes, latest-only prayer timestamps, sync metadata, and a validated PeopleGroups cache for offline return. Optional private sync begins only after the user explicitly chooses to merge the current device and enable sync.

The optional private service stores only the allow-listed continuity subset. It does not store the PeopleGroups corpus, recent browsing history, prayer history, streaks, scores, rankings, or prayer-performance metrics.

- **Public privacy notice:** https://www.thiepn.dev/unreached/privacy.html
- Repository notice: [`PRIVACY.md`](PRIVACY.md)
- Sync architecture: [`docs/V20_PRIVATE_CONTINUITY.md`](docs/V20_PRIVATE_CONTINUITY.md)

## Licensing

This repository is public, but **no general open-source or open-content license is granted by default**. Project-authored code, documentation and editorial text remain copyright-protected unless a file explicitly says otherwise. See [`LICENSE.md`](LICENSE.md).

External material keeps its original legal status and is not relicensed by Unreached. PeopleGroups.org data belongs to its provider; Natural Earth geography is public domain; open-source dependencies remain under their own licenses. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) and [`docs/DATA_AND_LEGAL_POLICY.md`](docs/DATA_AND_LEGAL_POLICY.md).

Provider terms and source-policy records for this release were reviewed on **28 August 2026**.

## Offline and sync boundaries

The service worker precaches the application shell and other same-origin release assets. It does not intercept or runtime-cache PeopleGroups.org API requests. A separate validated IndexedDB snapshot can support device-local return during temporary provider or network failure.

Optional private sync is additive. Authentication alone does not enable it. Server-side state is limited to Saved/prayer continuity records, revisions/tombstones, mutation IDs, and the latest prayer timestamp. Account deletion removes server-held private continuity data while local browser data remains until the user separately clears it.

## Release certification

Release candidates pass deterministic build/policy gates, desktop/mobile Chromium/Firefox/WebKit tests, offline-resilience tests, private-sync certification, live PeopleGroups corpus/CORS checks, GitHub Pages deployment checks, and canonical production browser certification.

Maintenance release publication remains exact-SHA gated. Publication now uses one version-agnostic workflow that reads the candidate version from `package.json`, requires matching release notes, waits for the complete exact-SHA evidence set, and then creates the matching tag/release. The six-hour operations health workflow also verifies that `main`, the package version, latest release, tag target, and required production commit statuses remain aligned.

See [`docs/releases/v2.1.5.md`](docs/releases/v2.1.5.md), [`docs/MAINTENANCE_MODE.md`](docs/MAINTENANCE_MODE.md), and [`docs/PERFORMANCE_BUDGETS.md`](docs/PERFORMANCE_BUDGETS.md).

## Local development

Requires Node.js 22.12+.

```bash
npm ci
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
