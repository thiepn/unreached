# Unreached — Five-Phase Finalization Plan

## Finalization rule

Unreached is feature-complete. Finalization adds no new product surface. The remaining work closes release blockers, removes structural debt, aligns public policy with production behavior, hardens operations and certifies one exact release SHA.

## Phase 1 — Release-Gate Repair

**Status:** in progress  
**Branch:** `phase/finalization-1-release-gate-repair`

### Goal

Restore deterministic post-deployment certification without weakening the blocked-storage integrity contract.

### Scope

1. Keep the blocked-personalization-storage journey within the same browser document so its intentionally non-persistent in-memory state is tested correctly.
2. Assert that the document marker, origin and target hash remain stable across the route transition.
3. Run production certification against the canonical HTTPS `www` origin rather than a redirecting deployment alias.
4. Verify the deployment output resolves to the canonical production origin before browser certification begins.
5. Require core CI, the complete browser matrix and Private Sync certification on the final branch SHA.
6. After merge, require a green GitHub Pages deployment and `unreached/pages-production` status on `main`.

### Exit criterion

- the blocked-storage test passes deterministically in desktop and mobile Chromium;
- no persistence fallback is introduced merely to satisfy the test;
- the canonical deployed site passes the full Playwright matrix;
- `unreached/pages-production` is green on the merged SHA.

## Phase 2 — CSS Architecture Closure

### Goal

Finish Phase 15 and remove every historical release/update-number stylesheet while preserving the certified Phase 14 rendering contract.

### Scope

- certify the completed `v101-hotfix.css` split;
- split and certify `v11.css`;
- split and certify `v12.css`;
- resolve or delete `u5-integration.css`;
- merge `u12e-languages.css` into semantic language ownership;
- review the shared country/language detail layer;
- route-load MapLibre CSS where practical and safe;
- add the blocking Phase 15 architecture gate;
- merge the completed Phase 15 PR.

### Exit criterion

No release-numbered CSS file or import remains, semantic ownership is enforced, and all Phase 1–14 behavioral checks still pass.

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
