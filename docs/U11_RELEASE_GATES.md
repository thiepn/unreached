# U11 — Release Gates

**Phase:** Release Hardening & Data Expansion  
**Status:** implementation pending validation

## Product completeness

- [x] About placeholder replaced with definitions, methodology, source permissions, freshness and boundary transparency.
- [x] Existing Explore → Country → People → Understand → Pray journeys remain structurally intact.
- [x] Search, Saved and recent exploration remain browser-local and account-free.
- [x] No new major V1 product system was added during hardening.

## Release metadata & deployment

- [x] Canonical production URL is declared.
- [x] Robots, Open Graph, Twitter and application metadata exist.
- [x] `/unreached/`-scoped web manifest exists.
- [x] First-party SVG application icon exists.
- [x] `robots.txt` exists.
- [x] Service-worker/offline caching is explicitly deferred for V1.
- [x] GitHub Actions checkout/setup wrappers updated to current major releases.
- [x] GitHub Pages configure/upload wrappers updated to current major releases.
- [x] Pages still deploys only from `main`.

## Source & data release audit

- [x] Source registry review date refreshed to 2026-08-22.
- [x] Joshua Project browser redistribution remains gated.
- [x] ProgressBible registered data remains excluded without written permission.
- [x] Ethnologue content remains excluded without a compatible license.
- [x] Wikimedia Commons remains per-item only.
- [x] Natural Earth remains approved for public geographic distribution.
- [x] Production fixture datasets remain blocked.
- [x] Release build fails if gated data status files are accidentally enabled.

## Automated release validation

- [ ] application TypeScript passes
- [ ] script TypeScript passes
- [ ] U2–U10 validation chain passes
- [ ] U11 release-policy check passes
- [ ] Vite production build passes
- [ ] generated-dist base-path/assets/size check passes
- [ ] Chromium desktop Playwright smoke passes
- [ ] Firefox desktop Playwright smoke passes
- [ ] WebKit desktop Playwright smoke passes
- [ ] Chromium mobile Playwright smoke passes
- [ ] WebKit mobile Playwright smoke passes
- [ ] no horizontal-overflow smoke regression on certified routes

## Deployment-only final certification

These gates cannot be honestly checked until the stacked PRs are integrated and the real GitHub Pages build is deployed:

- [ ] `https://www.thiepn.dev/unreached/` loads the integrated release candidate
- [ ] deployed asset base path is correct
- [ ] desktop Chrome/Edge/Firefox/Safari manual smoke pass
- [ ] Android Chrome and iOS Safari manual smoke pass
- [ ] real map wheel/trackpad/touch/GPU behavior pass
- [ ] 200% zoom and reduced-motion manual pass
- [ ] browser back/forward and direct hash-refresh pass
- [ ] final displayed attribution/permission audit on the deployed build

## Promotion rule

U11 may be declared **code-complete and build/browser-validated** when all automated gates pass. The product may be promoted to the V1 release candidate only after the deployment-only gates above pass on the integrated `main` build.
