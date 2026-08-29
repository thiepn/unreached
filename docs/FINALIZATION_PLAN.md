# Unreached — Five-Phase Finalization Plan

## Finalization rule

Unreached is feature-complete. Finalization adds no new mission/prayer product surface. The program closes release blockers, removes structural debt, aligns public policy with production behavior, hardens operations and promotes one exact certified release SHA into maintenance mode.

## Phase 1 — Release-Gate Repair

**Status:** completed  
**Merged SHA:** `005db0b89dce43b15939541fd7769bc8aa425844`

Production/browser gate races were repaired and canonical Pages certification was made authoritative.

## Phase 2 — CSS Architecture Closure

**Status:** completed

Historical numbered CSS ownership was replaced by semantic ownership, MapLibre CSS became Explore-route-loaded, service-worker precache integrity was repaired, search/map production-certification races were closed, and the canonical production matrix passed on the integrated line.

## Phase 3 — Release Truth, Privacy and Licensing

**Status:** completed  
**Merged SHA:** `ae0a5654ea149ccec27b3b331384b13895392b48`  
**Release line:** `2.1.1`

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

### Exit result

Deterministic build, full browser matrix, PeopleGroups live certification, Pages deployment and canonical production browser certification passed on the integrated release line.

## Phase 4 — Reproducibility, Security and Operations

**Status:** completed  
**Final certified SHA:** `61892441636344a19e67ee121abbd4a801ac49d5`

### Implemented scope

- committed root and Worker lockfiles;
- converted release workflows to `npm ci`;
- pinned Node 22.23.2 through `.nvmrc`;
- added root/Worker vulnerability, dependency-license and SBOM evidence;
- added CSP/referrer/static security policy and Worker security headers;
- migrated private-sync persistent identity storage to hash-only values while retaining rollback-compatible schema shape;
- defined D1 retention, tombstone/mutation-ledger, Time Travel recovery and incident-response policy;
- captured a pre-migration Time Travel recovery bookmark and certified the production D1 migration;
- added scheduled PeopleGroups, dependency and operational-health monitoring;
- added deployed Worker production certification for health, headers, CORS and Access protection.

### Exit result

CI, browser certification, dependency audit, private-sync certification, D1 migration/deployment, PeopleGroups live certification, Pages/canonical production certification and deployed Worker production certification passed on the final Phase 4 SHA.

## Phase 5 — Final Content, Device-Class and Release Certification

**Status:** in final release-candidate certification  
**Release:** `2.1.1`

### Goal

Promote one frozen SHA into the final maintained release without inventing acceptance evidence that the available execution environment cannot produce.

### Scope

- complete end-to-end editorial, theological and source-identity review of all 12 reviewed Tier-3 profiles;
- re-review the fixed runtime prayer template and publication metadata;
- freeze one release-candidate tree;
- add final PWA install assets and packaging checks;
- run every deterministic, browser, responsive/reflow, offline, sync, Worker, corpus and deployed-production gate on the exact final SHA;
- certify desktop and mobile browser/device-class behavior through Chromium, Firefox, WebKit, Pixel-7-class and iPhone-15-class Playwright projects;
- certify portrait/landscape, 200%-zoom-equivalent reflow and controlled-shell offline relaunch;
- explicitly disclose that physical-hardware, real mobile virtual-keyboard and real screen-reader speech-output acceptance cannot be claimed without a connected device/provider;
- record repository governance through CODEOWNERS, exact-SHA publication gates and maintenance policy;
- record GitHub branch-protection state rather than falsely claiming protection that the connected integration cannot configure;
- merge, deploy, tag and publish v2.1.1 only after exact-SHA production evidence is green;
- enter maintenance mode after publication.

### Exit criterion

The exact `v2.1.1` tag points to the live certified `main` SHA; CI, Browser Certification, dependency audit, PeopleGroups live, Worker production and canonical Pages production evidence are green for that SHA; release notes disclose the physical-hardware and branch-protection boundaries; and the repository is handed to the documented maintenance policy.
