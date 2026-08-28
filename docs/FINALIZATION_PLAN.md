# Unreached — Five-Phase Finalization Plan

## Finalization rule

Unreached is feature-complete. Finalization adds no new mission/prayer product surface. The remaining work closes release blockers, removes structural debt, aligns public policy with production behavior, hardens operations and certifies one exact release SHA.

## Phase 1 — Release-Gate Repair

**Status:** completed  
**Merged SHA:** `005db0b89dce43b15939541fd7769bc8aa425844`

Production/browser gate races were repaired and canonical Pages certification was made authoritative.

## Phase 2 — CSS Architecture Closure

**Status:** completed  
**Merged through:** PR #65 production-certification hotfix

Historical numbered CSS ownership was replaced by semantic ownership, MapLibre CSS became Explore-route-loaded, service-worker precache integrity was repaired, search/map production-certification races were closed, and the canonical production matrix passed on the integrated line.

## Phase 3 — Release Truth, Privacy and Licensing

**Status:** implementation complete; exact-SHA PR and post-merge certification required  
**Release target:** `2.1.1`  
**Branch:** `phase/phase3-release-truth-privacy-licensing`

### Implemented scope

- selected 2.1.1 as the finalization patch version;
- aligned package metadata and README with the shipped 2.1 product;
- replaced obsolete local-only privacy documentation;
- added repository and deployed public privacy notices;
- reconciled PeopleGroups.org public runtime use with the separate static-redistribution boundary;
- refreshed source/provider review dates to 28 August 2026;
- replaced obsolete Joshua-Project-primary-source legal policy;
- added explicit project-authored licensing and third-party notices;
- refreshed public About/source language and attribution;
- upgraded the blocking release gate to enforce version/privacy/licensing/source-policy truth.

### Exit criterion

- deterministic build and full browser matrix pass on one exact PR head SHA;
- PR is reviewed and integrated;
- post-merge CI, Browser Certification, PeopleGroups live certification, Pages deployment and canonical production browser certification pass on the merged SHA.

## Phase 4 — Reproducibility, Security and Operations

### Goal

Make the final release reproducible, defensible and maintainable after active development stops.

### Scope

- commit root and Worker lockfiles;
- use `npm ci` in every workflow;
- standardize the Node version;
- run dependency, vulnerability and dependency-license audits;
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

The exact tagged SHA is live, automated- and manually-certified, documented, recoverable and accepted as the maintenance baseline.
