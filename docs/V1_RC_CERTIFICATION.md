# V1 Release Candidate Certification

**Product:** Unreached  
**Candidate branch:** `main`  
**Integrated candidate before production deployment trigger:** `a7c4539f1993037400156d180ca0eb59845bf001`  
**Certification state:** production deployment validation pending

## Integrated engineering status

- [x] U0–U11 integrated into `main` in dependency order.
- [x] RC workflow hardening merged so integrated `main` pushes run full CI and browser certification.
- [x] Full build/policy validation passed on the RC workflow patch.
- [x] Chromium desktop Playwright certification passed.
- [x] Firefox desktop Playwright certification passed.
- [x] WebKit desktop Playwright certification passed.
- [x] Chromium mobile/touch Playwright certification passed.
- [x] WebKit mobile/touch Playwright certification passed.
- [x] GitHub Pages is enabled for the repository.

## Production certification gates

The following gates are evaluated only after this certification record is merged and triggers a fresh `main` deployment with Pages already enabled.

- [ ] GitHub Pages deployment workflow completes successfully.
- [ ] production `/unreached/` entry point serves the integrated candidate.
- [ ] production asset paths remain `/unreached/` scoped and load successfully.
- [ ] production shell and primary routes load without deployment-specific failures.
- [ ] production source/permission disclosures match the approved release policy.
- [ ] no synthetic or gated source dataset is exposed by the production build.

## Promotion rule

`V1_RC_CERTIFIED` may be issued only after every production gate above is verified. Promotion to `v1.0.0` occurs only from the accepted certified RC; certification must not weaken the source-permission gates established in U0–U11.
