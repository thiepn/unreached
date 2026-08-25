# Unreached

**Explore the peoples. Understand their world. Pray for the nations.**

Unreached is a browser-based Christian mission atlas for discovering unreached peoples, understanding source-backed country/language context, and moving from information into prayer.

- **Live site:** https://www.thiepn.dev/unreached/
- **Repository:** https://github.com/thiepn/unreached
- **Platform:** static Preact/Vite application deployed through GitHub Pages
- **Core loop:** **Explore → Understand → Pray**
- **Version:** **1.9.0**
- **Release state:** **v1.9 Offline Resilience & Cached Return**

## v1.9 — offline resilience & cached return

v1.9 makes the existing local-first V1 product resilient to temporary connectivity and provider outages without bundling a PeopleGroups.org mirror.

### Installable offline shell

The production build emits a scoped `/unreached/sw.js` service worker and installable manifest. The worker precaches only same-origin Unreached-owned assets: the application shell, hashed code/styles/fonts, Natural Earth geography, the reviewed editorial publication, and local status/methodology assets.

It does **not** intercept, proxy, precache, or runtime-cache PeopleGroups.org API requests.

### Validated cached mission data

PeopleGroups mission records remain in the existing validated IndexedDB snapshot cache after a successful runtime load.

- up to 24 hours: a complete validated cache may be used as fresh;
- after 24 hours while online: Unreached attempts a live refresh;
- if an online refresh fails: a validated cache up to seven days old may be used as stale fallback;
- while explicitly offline: an older fully validated snapshot may still be used for continuity, but it is visibly marked stale and awaiting revalidation.

If no validated mission snapshot exists yet, the offline app shell fails closed and asks the user to reconnect once rather than inventing or silently substituting mission data.

### Visible provenance and reconnect

The header exposes **Live mission data**, **Cached mission data**, **Stale cached mission data**, and **Offline · no mission cache** states with snapshot-time context. When connectivity returns after a cached/stale/error state, Unreached automatically forces PeopleGroups revalidation and returns to live provenance after a successful refresh.

Saved people, the private prayer list, rotation, and guided sessions remain browser-local and can resolve against the validated cached corpus when available. No account, cloud sync, prayer-history, or performance tracking is added.

See [`docs/V19_OFFLINE_RESILIENCE.md`](docs/V19_OFFLINE_RESILIENCE.md).

## v1.8 — guided prayer session & rotation review

v1.8 turns the v1.7 private prayer rotation into a temporary multi-person prayer session without adding another tracking model.

### Frozen session plan

From **Saved & prayer**, a user can start a session for:

- 3 people;
- 5 people;
- the full current eligible private prayer list.

When `#/pray/session` opens, Unreached filters the private list against current live prayer eligibility, applies the existing v1.7 rotation, and copies the selected PEIDs into page-local state. That session plan is then frozen.

Recording prayer may update a person's existing `lastPrayedAt` value for future rotations, but it does **not** reshuffle the people already selected for the current session.

### Session content

Each stop includes the existing source-backed people identity, country context, `whyPray` explanation, and three compact prompts from the release-certified prayer template. The full people profile and full focused-prayer guide remain one link away.

### No session tracking

The personalization schema remains **v2**. The session plan is discarded when the page is left or closed.

v1.8 stores no:

- session history;
- session count;
- completion percentage;
- completed-session timestamp;
- total prayer minutes;
- streak;
- score;
- ranking;
- deadline;
- overdue state;
- mission-priority value;
- spiritual-performance metric.

“Person 2 of 3” is navigation context only, not a completion target.

See [`docs/V18_PRAYER_SESSION.md`](docs/V18_PRAYER_SESSION.md) for the frozen-plan, privacy, and release-gate contract.

## v1.7 — prayer rotation & guided return

v1.7 turns the v1.6 private prayer list into a simple return rhythm without introducing new tracking fields.

The rotation is derived from the existing browser-local `addedAt` and `lastPrayedAt` timestamps:

1. people with no recorded prayer date first;
2. oldest-added first among those never recorded;
3. least-recently recorded next;
4. stable identity ordering only for exact ties.

This order is a continuity aid only. It is **not** a mission-priority, urgency, importance, unreachedness, prayer-faithfulness, or spiritual-performance ranking.

The Prayer page uses the next eligible private rotation entry when available, Saved & prayer shows a **Next return point**, and focused prayer can offer **Continue with [next person]** after explicit recording.

See [`docs/V17_PRAYER_ROTATION.md`](docs/V17_PRAYER_ROTATION.md).

## v1.6 — prayer practice & private prayer list

v1.6 added a browser-local prayer list separate from ordinary Saved bookmarks.

- add/remove current prayer-eligible people from Prayer and focused-prayer surfaces;
- optional **Record prayer today** stores only the latest timestamp;
- v1 personalization migrates to schema v2 while preserving Saved and Recent data;
- no account or cloud synchronization;
- no prayer totals, streaks, scores, leaderboards, public activity, or spiritual-completion metrics.

See [`docs/V16_PRAYER_PRACTICE.md`](docs/V16_PRAYER_PRACTICE.md).

## v1.5 — editorial coverage expansion & regional balance

v1.5 expanded reviewed contextual publication from six to twelve Tier-3 source-record profiles and made editorial distribution visible without turning coverage into a mission-priority signal.

New reviewed profiles:

| People profile | Provider identity | Country | Language | Editorial region |
| --- | --- | --- | --- | --- |
| Kazakh | PEID 24277 / PG024277 | Kazakhstan | `kaz` | Central Asia |
| Tajik | PEID 24529 / PG024529 | Tajikistan | `tgk` | Central Asia |
| Rohingya | PEID 22052 / PG022052 | Myanmar | `ben` source anchor | Southeast Asia |
| Wolof | PEID 14267 / PG014267 | Senegal | `wol` | West Africa |
| Kurmanji Kurds | PEID 24567 / PG024567 | Türkiye | `kmr` | West Asia |
| Javanese Transmigrants | PEID 46650 / PG046650 | Indonesia | `jav` | Southeast Asia |

The coverage browser reports seven broad editorial regions. These are navigation groupings only—not PeopleGroups.org mission regions, geopolitical priorities, quotas, or rankings.

See [`docs/V15_EDITORIAL_EXPANSION.md`](docs/V15_EDITORIAL_EXPANSION.md).

## v1.4 — editorial discovery & coverage navigation

v1.4 made the reviewed editorial publication a first-class local-first discovery surface:

- dedicated `#/coverage` index;
- search and country filtering;
- reviewed-context annotation/filter in People Explorer;
- country editorial handoff;
- previous/next/all-coverage navigation.

Coverage is explicitly an **editorial-publication measure**. It does not mean a covered people is more important, more urgent, more unreached, or higher priority than an uncovered people.

See [`docs/V14_EDITORIAL_DISCOVERY.md`](docs/V14_EDITORIAL_DISCOVERY.md).

## v1.3 — reviewed editorial context

The original six Tier-3 reviewed profiles are:

| People profile | Provider identity | Country | Language |
| --- | --- | --- | --- |
| Fon | PEID 12319 / PG012319 | Benin | `fon` |
| Hui | PEID 7206 / PG007206 | China | `cmn` |
| Uyghur | PEID 24104 / PG024104 | China | `uig` |
| Somali | PEID 11954 / PG011954 | Somalia | `som` |
| Southern Pashtuns | PEID 24009 / PG024009 | Afghanistan | `pbt` |
| Bengali Sunni Muslims | PEID 1156 / PG001156 | Bangladesh | `ben` |

Coverage remains intentionally partial. Twelve reviewed profiles do **not** imply representative coverage of all peoples, countries, religions, regions, or mission situations.

Each reviewed profile uses explicit PeopleGroups.org PEID/PGID/name/country/language identity evidence, cited contextual sources, date-aware current claims, and evidence-based “Why unreached?” synthesis. Religion, ethnicity, and culture are not used as causal shortcuts for mission status.

See [`docs/V13_EDITORIAL_COVERAGE.md`](docs/V13_EDITORIAL_COVERAGE.md) and [`docs/EDITORIAL_AND_PRAYER_STANDARD.md`](docs/EDITORIAL_AND_PRAYER_STANDARD.md).

## Guided exploration and performance baseline

Earlier releases established:

- primary navigation: **Explore / Peoples / Pray**;
- Reviewed coverage, Countries, Languages, and About & sources under **Browse**;
- search-first People, Languages, and Countries surfaces;
- bounded progressive rendering for large indexes;
- MapLibre isolated to Explore instead of loading globally;
- local geography/index paint before full remote aggregation where practical;
- debounced corpus matching;
- bounded-concurrent PeopleGroups pagination;
- validated IndexedDB cache reads.

## Production data architecture

Production people-group data comes from **PeopleGroups.org / IMB Global Research** through its public read-only API. Unreached does **not** publish a bundled mirror of that corpus.

A complete live-corpus audit on **23 August 2026** established the currently certified identity contract:

- 12,370 PGID records;
- 12,370 PEID values;
- 0 PEIDs attached to more than one PGID;
- 0 PEIDs spanning more than one country;
- 12,370/12,370 PGID numeric suffixes equal their PEID.

PGID therefore identifies one PeopleGroups.org people-group-in-country source record. PEID remains the provider numeric field and compatibility route key but is **not** treated as a cross-country grouping key. Related records use explicit provider taxonomy such as ROP3 people name, cluster, or affinity bloc; population, GSEC, religion, or resource fields are never silently merged into a synthetic global record.

## Mission and resource semantics

IMB **GSEC** remains source-native:

- GSEC 0–3 → `unreached`
- GSEC 4–6 → `other`
- missing → `unknown`

`other` is deliberately not renamed `reached`. Unreached does not fabricate Joshua Project `JPScale`, `Frontier`, exact evangelical percentages, Scripture-completeness milestones, or cultural/spiritual claims from incompatible fields. Bible, Jesus Film, and resource values remain raw provider labels with explicit coverage; unknown remains unknown.

## Product surfaces

| Surface | Production behavior |
| --- | --- |
| Explore | Natural Earth geography + live or explicitly cached/stale PeopleGroups.org mission aggregation |
| Peoples | One current PEID/PGID source record per route + guided starts + reviewed-context annotation/filter |
| Reviewed coverage | Local-first index, regional distribution, filtering and navigation over twelve reviewed profile shards; available from the owned offline shell |
| Countries | Local Natural Earth index + live/cached country-context records + country-specific reviewed editorial links |
| Languages | Live/cached ISO 639-3 aggregation over current validated source records |
| Prayer | Current eligible source record + fixed release-certified prayer template + private prayer rotation when available |
| Focused prayer | Source-backed prayer flow + optional latest-only local prayer timestamp + guided next-person continuation |
| Guided prayer session | Frozen page-local 3/5/full rotation plan + compact source-backed prompts + optional existing latest-only recording |
| Editorial context | Twelve reviewed Tier-3 source-record profile shards; intentionally partial coverage |
| Saved & prayer | Browser-local prayer list/rotation/session launcher, saved people snapshots, and recent exploration |
| Offline shell | Same-origin PWA precache for Unreached-owned application/geography/editorial assets only |
| ProgressBible | permission-gated and not used |
| Ethnologue proprietary taxonomy | permission-gated and not used |
| Third-party people photos | not redistributed without separate authorization |

## Runtime reliability

PeopleGroups responses are treated as untrusted external input. Protections include Zod validation, request timeouts, pagination/count limits, bounded concurrency, duplicate PGID/PEID rejection, GSEC bounds, fail-closed schema-drift handling, one shared session corpus, complete-snapshot IndexedDB validation, and best-effort storage behavior.

Online cache policy uses a 24-hour fresh window and seven-day explicit stale fallback after refresh failure. When the browser explicitly reports that it is offline, an older fully validated local snapshot may be used only with stale/offline provenance until reconnection revalidates it. The service worker caches only same-origin Unreached-owned assets and never becomes a PeopleGroups corpus store.

Personal prayer state is separate from mission data: it is local-only, bounded, migration-validated, and never treated as an authoritative source record. v1.7 rotation and v1.8 session planning are derived at runtime and add no persistent ranking, performance, or session-history state. v1.9 does not change that schema.

## Release certification

A release candidate must pass:

- TypeScript and production build;
- deterministic source/data/editorial/release-policy checks;
- PeopleGroups runtime/cache/visible-data/identity checks;
- geography and mission-visualization checks;
- country, people, context, prayer, prayer-practice, prayer-rotation, prayer-session, language, discovery, and offline-resilience checks;
- production distribution checks including the emitted service worker and manifest boundary;
- Chromium, Firefox, and WebKit desktop journeys;
- mobile Chromium and mobile WebKit journeys;
- offline shell, cached mission-data, first-offline, and reconnect browser journeys;
- live PeopleGroups editorial-identity preflight;
- complete live PeopleGroups corpus audit;
- browser API/CORS contract;
- post-merge GitHub Pages certification against the deployed site.

v1.6 certifies browser-local personalization migration, private prayer-list persistence, latest-only prayer recording, and absence of competitive/spiritual prayer metrics. v1.7 adds derived rotation ordering, scope-aware selection, guided continuation, and non-priority semantics. v1.8 adds frozen 3/5/full guided-session planning, eligibility filtering, mid-session ordering stability, page-local session state, and explicit zero-persistence session-history/performance guarantees. v1.9 adds the same-origin PWA shell, explicit live/cached/stale provenance, validated offline return, first-offline fail-closed behavior, and reconnect revalidation without introducing a bundled PeopleGroups dataset.

See [`docs/V19_OFFLINE_RESILIENCE.md`](docs/V19_OFFLINE_RESILIENCE.md), [`docs/V18_PRAYER_SESSION.md`](docs/V18_PRAYER_SESSION.md), [`docs/V17_PRAYER_ROTATION.md`](docs/V17_PRAYER_ROTATION.md), [`docs/V16_PRAYER_PRACTICE.md`](docs/V16_PRAYER_PRACTICE.md), [`docs/V15_EDITORIAL_EXPANSION.md`](docs/V15_EDITORIAL_EXPANSION.md), [`docs/V14_EDITORIAL_DISCOVERY.md`](docs/V14_EDITORIAL_DISCOVERY.md), [`docs/V13_EDITORIAL_COVERAGE.md`](docs/V13_EDITORIAL_COVERAGE.md), [`docs/U12_RELEASE_GATES.md`](docs/U12_RELEASE_GATES.md), and [`docs/U12_FINAL_CERTIFICATION.md`](docs/U12_FINAL_CERTIFICATION.md).

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

Vite is configured for the `/unreached/` project path. Service-worker registration is production-build only.
