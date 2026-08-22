# U1 — Release Gates

**Phase:** Production Architecture & Design System

## Required gates

- [x] Vite/TypeScript/Preact production scaffold exists.
- [x] `/unreached/` base path is explicit.
- [x] Host-safe static routing works without server rewrites.
- [x] GitHub Pages deployment workflow exists.
- [x] No source API secrets are required by the browser.
- [x] Responsive site shell exists.
- [x] Desktop primary navigation exists.
- [x] Mobile bottom navigation exists.
- [x] Map route has a dedicated desktop control rail.
- [x] Mobile map route is map-first and reserves a bottom-sheet interaction model.
- [x] Typography is self-hosted.
- [x] Design tokens exist for color, spacing, radius, motion, and layout.
- [x] Mission-status colors are semantically reserved.
- [x] Keyboard focus treatment exists.
- [x] Skip navigation exists.
- [x] Reduced-motion behavior exists.
- [x] Touch target baseline is 44px.
- [x] Empty/future systems avoid fake mission statistics.
- [x] Architecture and design-system documentation exist.

## Validation

- [x] GitHub Actions dependency install
- [x] `npm run build` (strict TypeScript + Vite production build)
- [ ] desktop smoke test after deployment
- [ ] mobile smoke test after deployment
- [ ] GitHub Pages deployment validation after integration to `main`

CI build passed on U1 PR #2 on 2026-08-21.

## Exit condition

U1 is **code-complete and build-validated**. The remaining three checks are deployment-only release gates and do not block U2 development. Later phases can add data, maps, profiles, and prayer functionality without reconstructing navigation, responsive ownership, routing, or global visual tokens.
