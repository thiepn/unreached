# Phase 14 — Accessibility Hardening & Certification

## Goal

Certify that the current Unreached interface remains operable, readable and structurally predictable across keyboard, touch, reduced-motion and mobile use without changing the product's data semantics or visual identity.

Phase 14 is a hardening phase. It does not redesign routes or alter sync, persistence, PeopleGroups.org data, prayer semantics, map classification, or account behavior.

## Measurable requirements

### 1. Muted-text readability

The canonical muted text token must meet WCAG AA 4.5:1 contrast on both primary paper surfaces used by the application.

Phase 14 darkens `--ink-2` from the pre-audit value to `#5f6a63`, which is above 4.5:1 on both `--paper-0` and `--paper-1`.

### 2. 44px primary interactive targets

Primary buttons, form controls, native disclosure summaries, navigation links and button-like application controls have a minimum 44px block target. Icon-only controls also have a minimum 44px inline target.

### 3. Visible routed-main focus

The single canonical `main` landmark remains programmatically focusable. Skip navigation and route focus must show a visible focus outline rather than relying on a suppressed outline.

### 4. Single main landmark

The application shell owns exactly one `<main id="main-content">` landmark. Route components render inside that landmark rather than creating competing main regions.

### 5. Reduced-motion behavior

The existing global `prefers-reduced-motion: reduce` policy remains authoritative and collapses transitions and animations. Phase 14 also explicitly removes motion from the loading pulse, browse chevron and skip-link affordances.

### 6. Mobile form text sizing

At mobile widths, `input`, `select` and `textarea` text is at least 16 CSS px to preserve readability and avoid browser text-zoom behavior.

### 7. Critical microcopy floor

Critical interface labels such as eyebrows, rail labels, status chips, map kickers, browse labels, mobile navigation labels and filter metadata are at least 12 CSS px.

### 8. Keyboard operation

Browser certification covers:

- skip navigation into the main landmark;
- desktop Browse opening with ArrowDown and returning focus with Escape;
- global search opening from `/` and closing with Escape;
- native disclosure operation with Enter.

Existing search focus containment and mobile-navigation focus containment remain covered by the broader browser suite.

### 9. Representative-route overflow

A 390px browser viewport certifies no document-level horizontal overflow on representative primary routes:

- Explore;
- Peoples;
- Countries;
- Languages;
- Pray;
- My lists;
- Account;
- About & sources.

## Static certification

`scripts/accessibility/phase14-check.ts` verifies that:

- the Phase 14 stylesheet is loaded after the existing visual layers;
- the accessibility check is part of the blocking production build;
- the 44px target token exists;
- the routed main has an explicit focus-visible rule;
- reduced-motion policy remains present;
- mobile form text and critical microcopy floors are encoded;
- exactly one `<main>` exists in application TSX source;
- the canonical main remains focusable;
- muted-token contrast is at least 4.5:1 on both paper surfaces;
- Phase 14 browser coverage for keyboard, landmarks and overflow remains present.

## Browser certification

`tests/e2e/phase14-accessibility.spec.ts` verifies computed behavior rather than only source declarations:

1. muted-token contrast;
2. visible primary control dimensions;
3. single main landmark plus visible skip-link focus destination;
4. reduced-motion computed styles;
5. mobile form text and critical microcopy sizes;
6. primary keyboard journeys;
7. representative-route mobile overflow.

The file runs automatically through the existing full `npm run e2e` Browser Certification workflow.

## Preservation requirements

Phase 14 must not weaken or bypass any existing gate. In particular:

- Phase 13 Account UX and Private Sync behavior remain unchanged;
- all sync certification stays blocking;
- PeopleGroups.org and mission-classification semantics remain unchanged;
- offline/PWA, navigation, prayer and release checks remain part of `npm run build`;
- accessibility fixes must not be implemented by hiding document overflow that would conceal a real layout defect.

## Exit criterion

Phase 14 is complete only when the Phase 14 static gate, the full production CI build, Private Sync Certification and the complete desktop/mobile Browser Certification all pass on the same Phase 14 head SHA, after which the Phase 14 PR may be merged into `main`.
