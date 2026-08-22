# Unreached — Product Constitution

**Status:** U0 baseline  
**Product:** Unreached  
**Target URL:** https://www.thiepn.dev/unreached  
**Repository:** https://github.com/thiepn/unreached  
**Platform:** static browser application deployed through GitHub Pages  
**Core loop:** **Explore → Understand → Pray**

---

## 1. Product mission

Unreached is an interactive Christian world atlas for discovering unreached peoples, understanding their cultural, linguistic, religious, geographic, and gospel-access context, and praying for them intelligently.

The product exists to make mission data understandable and prayer actionable. It is not intended to replace field research, mission agencies, churches, Bible-translation organizations, or the primary datasets from which it draws.

### Product promise

A visitor should be able to move naturally through:

**World → Region → Country → People Group → Context → Prayer**

and leave with a clearer understanding of a people rather than merely having seen statistics.

---

## 2. Governing principles

### 2.1 People before metrics

People groups are communities of real persons made in the image of God, not scores, targets, or collectibles. Statistics must serve understanding rather than flatten identity.

### 2.2 Source before assertion

Important factual claims must be traceable to a source. Estimates must be presented as estimates. Unknown values must remain unknown rather than being guessed.

### 2.3 Explanation before simplification

Terms such as *unreached*, *frontier*, *Christian adherent*, and *Evangelical* require visible definitions. The interface must not present mission classifications as self-evident facts.

### 2.4 Prayer without manipulation

Prayer content may be explicitly Christian and biblically motivated, but it must not depend on fear, exoticism, stereotyping, or demeaning descriptions of other religions or cultures.

### 2.5 Safety before detail

The application must not expose sensitive worker identities, underground church locations, vulnerable believers, precise ministry locations, or other information that could create risk.

### 2.6 Value added, not database replication

Unreached must add meaningful value through cartography, explanation, contextual synthesis, discovery, source transparency, and prayer. It must not become a reformatted mirror of another mission-data service.

### 2.7 Browser first

Every major experience must work in a modern desktop and mobile browser without requiring an account, native app, server-side session, or installation.

### 2.8 Lightweight personalization

Saved peoples and recent exploration may be stored locally in the browser. Cloud accounts and social features are outside V1.

---

## 3. V1 scope

V1 contains exactly these primary systems:

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
12. Sources, methodology, attribution, and data-freshness information

### Explicitly out of scope for V1

- user accounts
- cloud sync
- comments or social network features
- missionary job listings
- agency directories
- donations or fundraising
- mission-calling or personality assessments
- full mission-preparation curriculum
- general Bible reader
- general devotional platform
- church-management tools
- public prayer wall
- AI chatbot or generative research assistant
- leaderboards, XP, competitive prayer metrics, or spiritual scores
- full mission-history encyclopedia
- unrestricted public API

Scope additions require an explicit post-V1 product decision.

---

## 4. Primary navigation

V1 primary navigation is limited to:

- **Explore**
- **Peoples**
- **Countries**
- **Pray**
- **About**

Global utilities:

- Search
- Saved

Languages are a connected information layer in V1, not a top-level destination unless later evidence shows that users need one.

---

## 5. Canonical user journeys

### 5.1 Map journey

1. Open Unreached.
2. See the world and the meaning of the active mission layer.
3. Select a region or country.
4. Inspect country-level mission context.
5. Open an unreached people group.
6. Learn who they are.
7. Review language, religion, Scripture access, and gospel-access indicators.
8. Read sourced contextual reasons that help explain limited gospel access.
9. Enter prayer mode.
10. Optionally save the people for later prayer.

### 5.2 Search journey

1. Search a people, country, or language.
2. See clearly grouped results.
3. Open a result directly.
4. Continue through related peoples/countries/languages.

### 5.3 Prayer journey

1. Open Pray.
2. See the daily people group or saved peoples.
3. Learn the minimum context necessary to pray responsibly.
4. Follow a concise prayer guide.
5. Return to exploration without gamified reward mechanics.

---

## 6. Definitions

Unreached does not invent its own mission taxonomy when using a source dataset. Source-defined classifications are stored with the source and version/date that produced them.

### 6.1 People group

For V1, a people group follows the mission-research concept used by Joshua Project: a community sharing identity such that barriers of understanding or acceptance are relevant to the spread of the gospel and church planting.

The application must explain that people-group models vary. Ethnolinguistic grouping is common, while caste/community and other social boundaries can be especially significant in parts of South Asia.

### 6.2 Unreached / least-reached

The primary V1 classification follows Joshua Project terminology. Joshua Project describes an unreached people as one without an indigenous community of believing Christians with adequate numbers and resources to evangelize the group without outside assistance.

Joshua Project currently operationalizes this classification using Christian-adherent and Evangelical thresholds around **5% Christian Adherent and 2% Evangelical**. Because Joshua Project documentation contains slightly different boundary wording in different pages (`<` versus `≤`), Unreached must prefer the **source-provided unreached/status field** rather than independently reclassifying boundary cases.

The UI must make clear that:

- “unreached” is a missiological category, not a claim that no Christian exists in the group;
- it does not mean every individual has literally never heard of Christianity;
- thresholds are analytical conventions, not divinely revealed boundaries;
- source estimates may change.

### 6.3 Frontier people group

The V1 Frontier label follows Joshua Project’s current definition: a subset of unreached peoples with virtually no followers of Jesus and no confirmed sustained movement. Joshua Project currently approximates frontier status using **0.1% or fewer Christian Adherents plus movement criteria**.

Unreached must use the source-provided frontier classification where available and must not infer movement status from percentages alone.

### 6.4 Unengaged

If shown later, *unengaged* refers to reported mission activity, not the same concept as frontier status. It must never be used as a synonym for *unreached* or *frontier*.

### 6.5 Christian Adherent

This is a broad identification/affiliation measure used by mission datasets. It must not be displayed as equivalent to personal conversion, evangelical theology, or active discipleship.

### 6.6 Evangelical

When displaying Joshua Project data, *Evangelical* uses Joshua Project/Operation World’s theological definition, not a national political identity or voting bloc.

### 6.7 Scripture status

Scripture availability describes published/available translation status in a language; it does **not** by itself establish meaningful access, literacy, distribution, comprehension, or use within every community speaking that language.

### 6.8 Unknown, zero, and rounded values

Unknown values must remain unknown. A displayed zero from a source may represent a true zero, a rounded very small estimate, or other source-specific meaning. UI copy must avoid claiming exact absence unless the underlying source supports that claim.

---

## 7. Statistical integrity rules

1. Never fabricate missing values.
2. Never convert an estimate into language implying exactness.
3. Store source, retrieval date, source field, and transformation history for displayed mission metrics.
4. Prefer source-provided classifications to recomputation when classification methodology is source-specific.
5. Do not calculate absolute numbers from percentage estimates when the source cautions against doing so.
6. Do not combine metrics from different dates/sources without recording that fact.
7. Surface the latest-known data date where feasible.
8. If two credible sources disagree materially, preserve the disagreement or choose one canonical source and document the reason.
9. Derived values must be explicitly identified as derived.
10. Global totals must be generated from a single coherent dataset/version wherever possible.

---

## 8. Content model

Every people-group profile may contain four distinct content classes.

### 8.1 Imported facts

Examples:

- name and aliases
- countries
- population estimate
- primary religion
- primary language
- Evangelical estimate
- Christian-adherent estimate
- unreached/frontier classification
- Scripture indicators

Imported facts retain provenance.

### 8.2 Editorial context

Original Unreached content may summarize:

- identity and culture
- geography
- historical background
- social structures
- linguistic context
- barriers to gospel access

Editorial content requires citations and review.

### 8.3 Interpretation

“Why unreached?” may synthesize multiple sourced facts into cautious explanatory analysis. Interpretation must be clearly distinguishable from direct source data and must avoid unsupported causal claims.

### 8.4 Prayer content

Prayer material is original Christian devotional/editorial content informed by the profile. It may include biblical prayer themes and specific needs, but should avoid pretending to know hidden spiritual conditions or private local realities.

---

## 9. “Why unreached?” standard

This feature is a differentiator and therefore has a stricter evidence standard.

Permitted explanatory dimensions include:

- geographic isolation or dispersion
- language and literacy
- Scripture/resource availability
- legal or political restrictions
- social costs of religious change
- religious identity and community structures
- limited local church presence
- historical mission access
- migration/diaspora patterns
- conflict or instability

Rules:

1. Every concrete claim must be sourced.
2. Avoid monocausal explanations.
3. Do not describe a religion, ethnicity, or culture as inherently resistant.
4. Do not infer motives from aggregate statistics.
5. Do not use “closed,” “hostile,” or similar language without specific context.
6. Separate documented fact from analysis.
7. Prefer “limited access” language over sensational claims.
8. Where evidence is insufficient, say so.

---

## 10. Prayer standard

Prayer content should normally include several of the following:

- meaningful access to the gospel
- local believers’ faithfulness, maturity, safety, and fellowship
- healthy indigenous churches
- Scripture translation, distribution, comprehension, and use
- wise and faithful Christian workers
- discipleship and theological formation
- families and communities
- peace, justice, dignity, and human flourishing
- governments and authorities
- freedom for truthful and peaceful religious witness

Prayer guidance must not:

- dehumanize adherents of another religion;
- imply that suffering exists merely as a mission opportunity;
- disclose sensitive persons or locations;
- promise outcomes God has not promised;
- turn prayer into a points system.

---

## 11. Safety and sensitive-context policy

Never publish:

- names of covert workers without explicit public authorization;
- precise underground church locations;
- identifiable converts in high-risk contexts without explicit permission;
- private contact information;
- non-public worker estimates tied to exact locations;
- operational mission plans;
- confidential agency information;
- precise location data that a source marks restricted;
- scraped private/community data.

Where public sources themselves redact or generalize sensitive information, Unreached must not attempt to reconstruct it.

---

## 12. Geographic and political neutrality

Maps and names can encode political claims. Unreached must:

- use a documented geographic source;
- handle disputed boundaries consistently;
- avoid presenting map boundaries as theological or political endorsements;
- display alternative place names where useful;
- avoid editorial political advocacy unrelated to the product mission;
- include a general map disclaimer where disputed boundaries are shown.

Natural Earth is the preferred V1 geographic base because its raster/vector data is public domain and it explicitly documents disputed-boundary handling.

---

## 13. Personalization and privacy

V1 has no account system.

Permitted local data:

- saved people groups
- recent exploration
- optional local prayer-history state
- UI preferences

Default storage:

- `localStorage` for small preferences/favorites
- IndexedDB only when larger offline datasets justify it

Rules:

1. No personally identifiable profile is required.
2. No prayer contents are uploaded in V1.
3. No third-party analytics by default.
4. If analytics are introduced later, they require a separate privacy decision and must minimize data collection.
5. Sensitive prayer notes are out of scope for V1.

---

## 14. Architecture constraints established by U0

The following are binding for later phases unless explicitly superseded:

- static browser application
- GitHub repository as source of truth
- deployment through GitHub Pages to the `thiepn.dev/unreached` route
- no secret API keys shipped to the browser
- third-party API ingestion occurs at build/update time, not from public client code, when terms permit caching/redistribution
- browser-ready data is generated from validated source material
- raw/imported data and original editorial content are kept logically separate
- every imported dataset has licensing/provenance metadata
- route-level lazy loading is preferred for large profile datasets

---

## 15. Data-source hierarchy

### Tier A — approved for V1 foundation

- **Joshua Project** — mission/people-group source, subject to its API/data terms, attribution, non-commercial use, and non-replication requirement.
- **Natural Earth** — geographic base; public-domain map data.
- **Original Unreached editorial content** — context and prayer content written specifically for this project with cited sources.

### Tier B — allowed only per-item/per-license

- **Wikimedia Commons media** — each file must pass individual license and attribution checks before inclusion.
- other public/open datasets — only after license compatibility is documented.

### Tier C — permission required before ingestion

- **ProgressBible Registered User Data** — current terms prohibit incorporation into a product/service without written permission.
- proprietary linguistic datasets such as Ethnologue unless a compatible license is explicitly obtained.
- copyrighted photos or profile text without explicit reusable rights.

---

## 16. Joshua Project compliance requirements

If Joshua Project data is used:

1. Unreached remains non-commercial unless separate permission is obtained.
2. Pages displaying Joshua Project content show clear **“Data provided by Joshua Project”** attribution with a link.
3. Unreached must provide value beyond repackaging Joshua Project content.
4. Source terms are reviewed periodically because Joshua Project may change them.
5. API credentials are never committed to the repository or bundled into client code.
6. Downloaded/cached data is treated as revocable source material; if access is terminated and terms require deletion, it must be removable from builds and repository history going forward.
7. Joshua Project photos are not assumed reusable merely because they appear on Joshua Project.
8. Before a broad public release containing a substantial portion of Joshua Project’s database, obtain written confirmation from Joshua Project that the intended static-cache scale and presentation are acceptable.

U0 legal status: **prototype use is conditionally acceptable; full-database public release is gated on documented permission/confirmation.**

---

## 17. Media policy

Preferred order:

1. original graphics/cartography
2. public-domain imagery
3. clearly licensed Creative Commons imagery with recorded attribution requirements
4. no image

Every external image included in production must store:

- source page
- creator
- license
- license URL
- attribution text
- retrieval date
- modification status

Hotlinking third-party images is discouraged. Images should be locally hosted only when their license permits redistribution.

No image is better than an image with uncertain rights.

---

## 18. Accessibility principles

Map exploration may never be the sole route to information.

V1 must provide:

- structured people/country lists
- keyboard-accessible search and filters
- text equivalents for map-derived data
- visible focus states
- non-color status labels
- sufficient contrast
- reduced-motion behavior
- touch targets appropriate for mobile

---

## 19. Product tone

The site should be:

- factual
- reverent
- clear
- globally aware
- explicitly Christian without being triumphalist
- cautious with uncertain data
- respectful toward cultures and religions it describes

Avoid:

- “exotic peoples” framing
- alarmist copy
- colonial vocabulary
- culture-as-problem framing
- political stereotyping
- simplistic claims about why a people has or has not responded to Christianity

---

## 20. Definition of done for V1

V1 is complete when a first-time visitor can reliably:

1. understand what *unreached* means;
2. explore the global map;
3. select a country;
4. discover unreached peoples there;
5. open a people-group profile;
6. understand identity, location, language, religion, gospel-access data, and Scripture status;
7. understand sourced contextual factors behind limited gospel access;
8. know why and how to pray;
9. enter a focused prayer experience;
10. save the people locally;
11. verify major statistics through visible source information;
12. do all of the above on desktop and mobile.

---

## 21. Change control

This constitution is the baseline against which later feature proposals are evaluated.

A proposed feature belongs in V1 only if it directly strengthens **Explore → Understand → Pray**. Features that mainly create a fourth product pillar should be deferred.

Changes to definitions, source policy, privacy, safety, or licensing gates require explicit documentation rather than silent implementation changes.

---

## 22. U0 decision summary

| Decision | Status |
|---|---|
| Product name: Unreached | Locked |
| Target: browser/static web app | Locked |
| Public path: `thiepn.dev/unreached` | Locked |
| Core loop: Explore → Understand → Pray | Locked |
| No accounts in V1 | Locked |
| No AI in V1 | Locked |
| Joshua Project as primary mission-data candidate | Conditional approval |
| Natural Earth as preferred geographic base | Approved |
| ProgressBible registered data | Blocked without written permission |
| Unlicensed third-party photos/text | Blocked |
| Full public Joshua Project database scale | Requires written confirmation |
| Local-only favorites | Approved |
| Sensitive worker/believer data | Prohibited |

---

## 23. Authoritative external references reviewed for U0

- Joshua Project API Terms of Use: https://api.joshuaproject.net/terms_of_use
- Joshua Project definitions: https://joshuaproject.net/help/definitions
- Joshua Project datasets/API information: https://joshuaproject.net/resources/datasets
- Joshua Project data overview: https://joshuaproject.net/data
- ProgressBible Terms of Use: https://progress.bible/terms-of-use/
- Natural Earth Terms of Use: https://www.naturalearthdata.com/about/terms-of-use/
- Wikimedia Commons reuse guidance: https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia

**Review date:** 2026-08-21
