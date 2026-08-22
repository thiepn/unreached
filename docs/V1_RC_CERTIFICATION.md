# V1 Release Candidate Certification

**Product:** Unreached  
**Candidate branch:** `main`  
**Certification mechanism:** commit status `unreached/pages-production`  
**Certification state:** candidate until the production status on the merged `main` commit is `success`

## Integrated engineering status

- [x] U0–U11 integrated into `main` in dependency order.
- [x] Integrated `main` pushes run full build/policy CI.
- [x] Integrated `main` pushes run Chromium, Firefox, WebKit, mobile Chromium and mobile WebKit certification.
- [x] GitHub Pages is enabled for the repository.
- [x] Production workflow builds from `main` only.
- [x] Production workflow preserves the source-permission gates established in U0–U11.

## Production certification contract

After GitHub Pages deploys a `main` commit, the workflow must verify the deployed artifact itself before that commit is accepted as a release candidate.

The live certification job verifies:

- the deployed Pages entry point becomes reachable;
- deployed HTML identifies Unreached and retains `/unreached/`-scoped asset paths;
- the production web manifest loads and identifies the application;
- mission, country, people, context, prayer and language publication status files remain non-fixture and release-gated;
- the complete Playwright release suite passes against the deployed URL in Chromium desktop, Firefox desktop, WebKit desktop, mobile Chromium and mobile WebKit;
- release transparency, Saved empty state, invalid-route behavior, keyboard search focus handling and horizontal-overflow checks pass on the deployed site.

## Machine-verifiable result

The Pages workflow publishes exactly one status context on the deployed commit:

`unreached/pages-production`

- `success` means Pages deployment and live production browser certification both passed.
- `failure` means the deployed commit must not be certified or promoted.

`V1_RC_CERTIFIED` may be issued only for a `main` commit whose `unreached/pages-production` status is `success` and whose normal integrated CI/browser gates have already passed for the same source tree.

## Promotion rule

Promotion to `v1.0.0` must point to the accepted certified RC commit without altering the application tree. Source-permission gates remain in force after promotion; unavailable licensed datasets must not be enabled merely to complete the release.
