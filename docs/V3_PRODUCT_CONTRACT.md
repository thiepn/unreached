# Unreached 3.0 — Product Contract

**Status:** Phase 0 product reset baseline  
**Program:** Unreached 3.0  
**Baseline:** `main` at `375be4da01239964c5623a6abd4cd7042f2fb21a` (v2.1.5)  
**Authority:** This document governs V3 product work when it conflicts with older product-shape documents. Existing release, data-integrity, privacy, licensing, safety, and source-policy constraints remain binding unless they are explicitly superseded by a reviewed V3 replacement.

---

## 1. Product purpose

Unreached is a trustworthy interactive Christian mission atlas for discovering peoples, understanding their cultural, linguistic, geographic, religious, Scripture, and gospel-access context, praying intelligently, and remembering those peoples over time.

It is not primarily a database browser, analytics dashboard, generic devotional app, mission-agency directory, social network, or technical research console.

### Product promise

A visitor should be able to move naturally through:

**World → Region → Country → People → Context → Prayer**

and leave with a clearer understanding of real people rather than merely having seen mission statistics.

### Primary product loop

**Discover → Understand → See the need → Pray → Remember**

The loop is deliberately human-first. Provider records, taxonomy, cache state, synchronization machinery, raw identifiers, and research methodology support this loop; they do not define the normal interface.

---

## 2. Non-negotiable product principles

### 2.1 People before metrics

People groups are communities of real persons, not scores, targets, collectibles, or map colors. Numbers serve understanding.

### 2.2 Meaning before machinery

The normal interface answers these questions first:

1. Who are these people?
2. Where do they live?
3. What context should I understand?
4. What is their reported gospel-access situation?
5. Why does the source classify them this way?
6. How can I pray responsibly?

Technical identifiers, provider fields, denominators, cache state, release certification, and implementation details belong in research/methodology surfaces unless they are required to explain uncertainty.

### 2.3 Source before assertion

Important factual claims remain traceable to a source. Estimates are presented as estimates. Unknown remains unknown. Provider-specific classifications are not silently converted into incompatible semantics.

### 2.4 Separate identity, gospel access, and classification

V3 must not collapse these into one synthetic score.

- **Identity/context:** people, geography, language, culture, religion.
- **Gospel access:** reported evangelical/Christian presence, church engagement, Scripture/resources, and related evidence where the source supports it.
- **Classification:** the source-specific missiological status and the definition that produced it.

### 2.5 Explain disagreement instead of hiding it

When future sources disagree, V3 preserves source scope and methodology rather than choosing an arbitrary number or averaging incompatible data.

### 2.6 Prayer without manipulation or gamification

Prayer may be explicitly Christian and biblically motivated. It must not use fear, exoticism, demeaning cultural descriptions, streak pressure, XP, leaderboards, spiritual scores, or competitive completion mechanics.

### 2.7 Geographic precision may never exceed source precision

Broad country or region evidence must not be rendered as a precise local point. Sensitive worker, church, or ministry locations must never be exposed.

### 2.8 Editorial depth must be explicit

V3 distinguishes reviewed editorial profiles from enhanced/source-only profiles. Missing research is shown as missing rather than filled with invented narrative.

### 2.9 Browser-first, mobile-first in execution

Every core experience works without an account in a modern desktop or mobile browser. PWA/offline behavior is additive, not a prerequisite for understanding the product.

### 2.10 Lightweight personal continuity

Saving peoples, prayer history, and private notes exist to help people remember, not to quantify devotion. Anonymous/local use remains valid. Sync remains optional.

---

## 3. V3 information architecture

### Primary surfaces

Only these are primary product destinations:

1. **Explore** — geographic discovery and the world atlas.
2. **Peoples** — people discovery and people profiles.
3. **Pray** — daily focus, personal rotation, and focused prayer sessions.
4. **Search** — global people/country/region/language discovery.
5. **Saved** — private personal continuity.

### Secondary destinations

These remain available but do not compete with the primary loop:

- Countries
- Regions (introduced during V3)
- Languages
- Sources & methodology
- About
- Account / Sync

### Internal/editorial destinations

These must not appear as ordinary primary user destinations:

- reviewed editorial coverage administration;
- provider/cache diagnostics;
- release certification state;
- source completeness dashboards intended for maintainers.

---

## 4. Route disposition at the V3 baseline

This is a product classification, not a Phase 0 deletion list. Route compatibility remains intact until the phase responsible for a route changes it deliberately.

| Current route/surface | V3 disposition | Phase owner |
| --- | --- | --- |
| `#/`, `#/explore` | **REBUILD** — map-first Explore | Phase 6 |
| `#/peoples` | **REBUILD** — human-first discovery | Phase 9 |
| `#/peoples/:PEID` | **REBUILD** — definitive people profile | Phase 8 |
| `#/countries` | **REBUILD** — secondary geographic browser | Phase 7 |
| `#/countries/:ISO3` | **REBUILD** — country → people journey | Phase 7 |
| `#/languages` | **KEEP / REBUILD LATER** — secondary destination | Phase 15 |
| `#/languages/:ISO6393` | **KEEP / REBUILD LATER** | Phase 15 |
| `#/coverage` | **DEMOTE** — editorial/research utility, not primary product navigation | Phase 5 |
| `#/pray` | **REBUILD** — one clear daily prayer entry | Phase 10 |
| `#/pray/:PEID` | **REBUILD** — people-specific prayer focus | Phase 10 |
| `#/pray/session` | **REBUILD** — focused prayer session | Phase 10 |
| `#/saved` | **REBUILD** — personal mission memory | Phase 11 |
| `#/account` | **KEEP / DEMOTE** — optional sync/settings | Phase 5 / 11 |
| `#/about` | **KEEP / SIMPLIFY** — sources, definitions, methodology | Phase 5 / 13 |
| not-found | **KEEP** | Phase 5 |

---

## 5. Technical foundation to preserve unless evidence proves otherwise

V3 is a product-layer rebuild, not a mandatory rewrite of reliable infrastructure.

Preserve by default:

- Preact + Vite application foundation;
- hash-router compatibility during the 3.0 rebuild;
- route preloading/lazy loading where it remains useful;
- current PeopleGroups.org provider integration until Phase 1 makes an explicit source decision;
- validated provider cache/store architecture;
- Natural Earth geography pipeline;
- local personalization persistence;
- offline/service-worker infrastructure;
- optional private-sync worker and reconciliation foundation;
- deterministic source/policy checks;
- Playwright browser matrix and accessibility/release gates.

Replacement requires a concrete product, correctness, performance, maintainability, or legal reason.

---

## 6. Product layer considered replaceable

V3 may substantially replace:

- current Explore composition and control hierarchy;
- current people-list composition;
- current people-profile composition;
- current country-profile composition;
- current Pray landing-page composition;
- current prayer-card catalogue emphasis;
- current Saved composition;
- primary navigation hierarchy;
- generic card/pill-heavy visual patterns;
- explanatory microcopy that exposes internal software/data machinery before meaning;
- duplicated or historically layered CSS patterns.

Functional behavior that is intentionally preserved must remain covered by tests while its presentation changes.

---

## 7. Source-model freeze for Phase 0

Phase 0 does **not** switch production data sources and does **not** alter any mission value.

Current production remains PeopleGroups.org / IMB-derived until Phase 1 completes a fresh source and legal architecture review.

Phase 1 must explicitly decide the V3 canonical launch model:

- PeopleGroups/IMB-first; or
- Joshua Project-first with supplementary PeopleGroups data, if current terms and technical constraints permit.

The V3 architecture must be capable of representing multiple source assertions later, but the initial normal interface must not become a confusing source-comparison console.

No future phase may make Europe, a country, or a people appear more or less "unreached" by cosmetic manipulation. A semantic change requires a source/model change with provenance.

---

## 8. Content model direction

V3 will support three explicit editorial depth levels:

- **Reviewed profile** — substantial human-reviewed contextual research with citations.
- **Enhanced profile** — reliable structured source data plus limited reviewed context.
- **Source profile** — clean structured source information without invented narrative depth.

The exact schema and validation pipeline are Phase 3 work.

V3 must never imply that every profile has equivalent research depth.

---

## 9. Visual direction

The existing "Modern Mission Atlas" idea remains directionally correct, but V3 will reimplement it as a coherent system rather than continue incremental visual patching.

The target character is:

**cartographic + editorial + modern + calm + precise + human + information-rich**

The product should resemble a serious digital geographic publication more than a React administration dashboard.

Maps, typography, editorial hierarchy, and geographic storytelling are the visual identity.

Phase 4 owns the implementation of the new system.

---

## 10. 3.0 scope freeze

Before the Phase 12 Unreached 3.0 release, work is limited to the systems required to make the core atlas excellent:

- mission/source model;
- normalized product data model;
- editorial content architecture;
- visual foundation;
- shell/navigation;
- Explore/world map;
- regions/countries;
- people profiles;
- search/discovery;
- prayer;
- saved/personal continuity;
- substantial reviewed-content expansion;
- mobile/PWA refinement, accessibility, performance, and release hardening.

### Explicitly frozen until after 3.0

Do not build these before Phase 12 passes:

- historical source timelines;
- multi-source comparison UI;
- large knowledge-graph surfaces;
- advanced diaspora/distribution cartography;
- guided regional courses/journeys beyond what 3.0 needs;
- broad localization;
- church sharing;
- AI chat/research assistants;
- social features;
- donations/fundraising;
- agency directories;
- leaderboards, XP, streaks, or prayer scoring.

---

## 11. First-minute acceptance contract

A new visitor, without prior explanation, should be able to:

- understand within roughly **5 seconds** that Unreached is a Christian world atlas about peoples and mission context;
- interact with the world map within roughly **10 seconds**;
- open a country within roughly **20 seconds**;
- discover a relevant people within roughly **30 seconds**;
- understand the core identity and reported mission context within roughly **60 seconds**;
- begin informed prayer within roughly **90 seconds**.

These are human usability targets, not synthetic CI timing budgets.

The normal journey should expose almost no provider-specific terminology unless the user asks for deeper research detail.

---

## 12. Quality bar for Unreached 3.0

Phase 12 may ship only when all of the following are true:

1. The world map is useful and comprehensible without reading methodology first.
2. A reviewed people profile feels like a strong digital atlas article rather than a provider record viewer.
3. Country → people navigation is natural.
4. Search works for people, geography, language, and guided discovery.
5. Prayer is focused and calm rather than catalogue-first.
6. Saved peoples provide meaningful private continuity without gamification.
7. At least ~100 substantial reviewed profiles exist, subject to the Phase 3 editorial standard.
8. Mobile is a first-class experience rather than compressed desktop UI.
9. Important source claims are attributable and unknowns remain unknown.
10. Accessibility, performance, offline behavior, privacy, source policy, and browser certification remain release-blocking gates.

---

## 13. Change-control rule

The V3 roadmap is intentionally finite.

- Phases 0–12 produce Unreached 3.0.
- Phases 13–20 are post-3.0 peak-system expansion.
- No Phase 13+ feature begins until Phase 12 passes.
- New ideas discovered during implementation go into a parking lot unless required for the active phase's acceptance criteria.
- A phase may be split internally for implementation safety, but that must not create an open-ended public roadmap of micro-phases.
- Phase 20 closes the numbered V3 roadmap. Do not create Phase 21+ for ordinary iteration.
- A genuinely new post-lock product capability requires an explicit reviewed architecture decision and an update to the Peak Architecture Lock.

The purpose of this contract is to prevent Unreached from accumulating more infrastructure faster than it accumulates user value.
