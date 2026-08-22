# V1 Release Candidate Certification

**Product:** Unreached  
**Candidate branch:** `main`  
**Certification mechanism:** commit status `unreached/pages-production`  
**Certified RC:** `6847e40d8aea7c782f2e93dfb5b40418474dd9cf`  
**Certification state:** `V1_RC_CERTIFIED`  
**Promotion target:** `v1.0.0`

## Integrated engineering status

- [x] U0–U11 integrated into `main` in dependency order.
- [x] Integrated `main` pushes run full build/policy CI.
- [x] Integrated `main` pushes run Chromium, Firefox, WebKit, mobile Chromium and mobile WebKit certification.
- [x] GitHub Pages is enabled for the repository.
- [x] Production workflow builds from `main` only.
- [x] Production workflow preserves the source-permission gates established in U0–U11.
- [x] Certified RC commit reports `unreached/pages-production = success`.

## Production certification contract

After GitHub Pages deploys a `main` commit, the workflow verifies the deployed artifact itself before that commit is accepted as a release candidate.

The live certification job verifies:

- the deployed Pages entry point becomes reachable;
- deployed HTML identifies Unreached and retains `/unreached/`-scoped asset paths;
- the production web manifest loads and matches the canonical application identity and scope;
- mission, country, people, context, prayer and language publication status files remain non-fixture and release-gated;
- the complete Playwright release suite passes against the deployed URL in Chromium desktop, Firefox desktop, WebKit desktop, mobile Chromium and mobile WebKit;
- release transparency, Saved empty state, invalid-route behavior, keyboard search focus handling and horizontal-overflow checks pass on the deployed site.

## Machine-verifiable result

The Pages workflow publishes exactly one status context on the deployed commit:

`unreached/pages-production`

- `success` means Pages deployment and live production browser certification both passed.
- `failure` means the deployed commit must not be certified or promoted.

The RC listed above passed this production status and is certified.

## v1.0.0 promotion

The `release/v1.0.0-promotion` change sets the repository package version to `1.0.0` and records this certification. It contains no product-feature expansion. The merged promotion commit must itself receive `unreached/pages-production = success` before the `v1.0.0` tag/release is created.

Source-permission gates remain in force after promotion; unavailable licensed datasets must not be enabled merely to complete the release.
