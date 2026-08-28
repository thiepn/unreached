# Unreached — Five-Phase Finalization Plan

## Finalization rule

Unreached is feature-complete. Finalization adds no new product surface. The remaining work closes release blockers, removes structural debt, aligns public policy with production behavior, hardens operations and certifies one exact release SHA.

## Phase 1 — Release-Gate Repair

**Status:** completed  
**Merged SHA:** `005db0b89dce43b15939541fd7769bc8aa425844`

### Result

- blocked-personalization-storage certification now uses same-document hash routing;
- document, origin and route continuity are asserted explicitly;
- deployed browser certification runs against the canonical HTTPS `www` origin;
- the canonical site is verified to serve the exact GitHub Pages artifact before testing;
- core CI, Browser Certification, Private Sync, PeopleGroups live certification and Pages production certification passed on the merged SHA;
- `unreached/pages-production` is green.

## Phase 2 — CSS Architecture Closure

**Status:** implementation complete; exact-SHA certification and explicit PR integration required  
**PR:** `#62`  
**Branch:** `phase/phase15-css-architecture-cleanup`

### Goal

Finish Phase 15 and remove every historical release/update-number stylesheet while preserving the certified Phase 14 rendering contract and the Phase 1 production-gate repair.

### Implemented scope

- certified Stage 1 relocation of `v21`–`v28` into semantic ownership;
- certified Stage 2 relocation of `v14`–`v20` into semantic ownership;
- split `v101-hotfix.css` into ordered semantic fragments;
- split `v11.css` into shell, Explore, foundation, country and people ownership with checksum reconstruction;
- split `v12.css` into discovery, people, country and responsive ownership with checksum reconstruction;
- moved `u12e-languages.css` byte-for-byte into semantic language ownership;
- deleted dormant, unimported `u5-integration.css` without activating its previously inactive declarations;
- reviewed and retained the genuinely shared country/language detail-record layer;
- moved MapLibre CSS from the global entrypoint to the lazy Explore boundary;
- added full-browser MapLibre route-loading and searchable-fallback certification;
- added a blocking architecture gate that rejects numbered CSS files, incomplete import graphs, cascade-order drift and legacy-content drift;
- merged current `main` into the phase branch before final certification.

### Exit criterion

- no release/update-number CSS file or import remains;
- semantic ownership and intentional cascade order are enforced;
- former mixed layers reconstruct to their certified hashes;
- MapLibre CSS is route-loaded with Explore;
- build, full browser matrix and all applicable existing gates pass on one exact PR head SHA;
- PR #62 is reviewed before any explicit merge into `main`;
- after merge, GitHub Pages and `unreached/pages-production` pass on the merged SHA.

## Phase 3 — Release Truth, Privacy and Licensing

### Goal

Make every public and repository statement accurately describe the shipped application.

### Scope

- choose and apply the final patch version;
- align README, package metadata, changelog, release state and certification documents;
- replace obsolete local-only privacy documentation with a current public privacy notice;
- reconcile data/licensing policy and source registry with the PeopleGroups.org runtime architecture;
- refresh provider-term and editorial review dates;
- remove brittle historical release assertions;
- add explicit code, content and third-party licensing documents.

### Exit criterion

Version, privacy, data use, licensing, attribution and release documentation agree with actual production behavior and pass blocking policy checks.

## Phase 4 — Reproducibility, Security and Operations

### Goal

Make the final release reproducible, defensible and maintainable after active development stops.

### Scope

- commit root and Worker lockfiles;
- use `npm ci` in every workflow;
- standardize the Node version;
- run dependency, vulnerability and license audits;
- add appropriate CSP/referrer/security hardening;
- define D1 retention, tombstone, mutation-ledger, backup, restore and rollback policies;
- add scheduled PeopleGroups, Pages and Worker health certification;
- document incident response and maintenance procedures.

### Exit criterion

A clean checkout builds deterministically, production credentials remain isolated, operational recovery is documented and scheduled monitoring covers external dependencies.

## Phase 5 — Final Content, Device and Release Certification

### Goal

Promote one frozen SHA into the final maintained release.

### Scope

- complete independent editorial, theological and source-identity review;
- freeze one release-candidate SHA;
- run every deterministic, browser, offline, sync, Worker, corpus and deployed-production gate on that SHA;
- complete real-device desktop/mobile/PWA/accessibility testing;
- resolve every release-blocking defect without adding features;
- merge, deploy, tag and publish the release;
- archive obsolete branches and enter maintenance mode.

### Exit criterion

The exact tagged SHA is live, fully automated- and manually-certified, documented, recoverable and accepted as the maintenance baseline.
