# Phase 3 — Release Truth, Privacy & Licensing

**Release target:** 2.1.1  
**Policy review date:** 28 August 2026

## Purpose

Phase 3 makes the public repository and deployed application describe the same product. It does not introduce a new product feature or change mission/prayer semantics.

## Release truth fixed

- package version and README now agree on 2.1.1;
- the README describes the current PeopleGroups.org runtime instead of historical release narratives;
- the source registry distinguishes public runtime use from static/browser corpus redistribution;
- the legal/data policy no longer presents Joshua Project as the active production source;
- PeopleGroups.org / IMB Global Research attribution is explicit;
- source-policy review dates are refreshed to 28 August 2026;
- the dated 23 August 2026 corpus audit is presented as a certification snapshot rather than a permanent dataset guarantee.

## Privacy fixed

The obsolete local-only privacy note is replaced by a current architecture and public notice.

Local-first remains the default. The notice now discloses:

- Saved/prayer/recent browser state;
- latest-only prayer recording;
- device-local PeopleGroups IndexedDB resilience cache;
- optional sync metadata and pending mutations;
- session-only Cloudflare Access token behavior;
- explicit merge-and-enable consent before private sync;
- server-held continuity allow-list and excluded data;
- account export/delete and local-data deletion boundaries;
- absence of first-party analytics, advertising and prayer-performance telemetry.

The deployed static privacy page is `/unreached/privacy.html`.

## Licensing fixed

The public repository previously had no explicit license file. Phase 3 preserves the legal default rather than silently selecting an open-source license:

- project-authored code/content: all rights reserved unless explicitly stated otherwise;
- PeopleGroups.org provider data: external and not relicensed;
- Natural Earth: public domain;
- package dependencies: respective upstream licenses;
- third-party editorial source material: original rights retained;
- future media: per-item rights review.

## Provider review

Reviewed on 28 August 2026:

- PeopleGroups.org API, privacy and research/download documentation;
- Natural Earth terms of use;
- Joshua Project API terms;
- ProgressBible registered-data terms;
- Ethnologue terms of service;
- Wikimedia Commons reuse guidance.

## Blocking gate

`scripts/release/check.ts` now rejects:

- version drift;
- obsolete README release claims;
- missing public/repository privacy notices;
- missing licensing or third-party notices;
- stale source-registry schema/review dates;
- treating PeopleGroups.org public runtime use as blocked;
- treating PeopleGroups.org corpus redistribution as allowed;
- activation of Joshua Project, ProgressBible or Ethnologue in the public runtime without a new reviewed policy;
- obsolete Joshua-Project-primary-source legal language.

## Exit criterion

Phase 3 is complete when the exact PR SHA passes the deterministic build and browser certification, then the merged SHA passes the post-merge GitHub Pages and production certification gates.
