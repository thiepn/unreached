# Browser, Device-Class, PWA and Accessibility Certification

**Release line:** 2.1.1  
**Phase:** Phase 5 — Final Content, Device and Release Certification  
**Final review date:** 29 August 2026

## Certification model

Unreached uses a layered release-acceptance model rather than treating one browser smoke test as sufficient evidence.

The final release candidate must pass:

1. deterministic type/build/data/privacy/license/operations/Phase-5 gates;
2. the full Playwright browser matrix on the exact candidate SHA;
3. accessibility and responsive-layout acceptance in that matrix;
4. service-worker/PWA acceptance;
5. GitHub Pages deployment of the exact SHA;
6. the same browser certification against the canonical deployed site.

A passing local or pull-request browser run is not by itself a production release certification.

## Automated browser/device matrix

The Browser Certification workflow runs the production Vite build against five browser/device projects:

- Chromium desktop;
- Firefox desktop;
- WebKit desktop (Safari-class engine coverage);
- Pixel 7 mobile Chromium emulation with touch;
- iPhone 15 mobile WebKit emulation with touch.

The deployed Pages workflow repeats the release browser suite against the canonical production origin after verifying that the canonical site serves the exact built artifact.

## Core browser coverage

The combined suite covers, among other release contracts:

- application shell and primary/browse/utility navigation;
- `/unreached/` base-path correctness and direct hash-route loads;
- browser back/forward and route restoration;
- global search keyboard shortcuts, focus containment and restoration;
- Explore map/fallback behavior and map route loading;
- People, Countries and Languages discovery/profile flows;
- Saved and prayer-list local personalization;
- guided prayer and latest-only prayer recording semantics;
- private-sync storage fallback and integrity behavior;
- offline/service-worker lifecycle and upgrade behavior;
- reduced-motion and keyboard behavior;
- representative horizontal-overflow checks;
- release/privacy/About disclosures.

## Phase 5 device-class and PWA acceptance

Phase 5 adds explicit release acceptance for packaging and layout boundaries that previously existed only across separate historical suites.

### PWA install surface

The release gate verifies:

- `/unreached/site.webmanifest` identity, scope, start URL and standalone display mode;
- SVG application icon;
- 192×192 PNG install icon;
- 512×512 maskable-capable PNG install icon;
- Apple touch icon;
- iOS/mobile web-app metadata in the document head.

### Portrait and landscape

Representative core routes are exercised at both a phone portrait boundary (390×844 CSS px) and a phone landscape boundary (844×390 CSS px). The page must retain a visible main landmark and must not introduce document-level horizontal overflow.

### 200%-zoom-equivalent layout boundary

Playwright cannot control every browser's outer-chrome zoom UI consistently across engines. The release suite therefore tests a **200%-zoom-equivalent** CSS layout boundary: a 1280px desktop display at 200% zoom is represented by roughly 640 CSS px. Major application routes must remain readable and free of document-level horizontal scrolling at that boundary.

This is an automated layout-equivalence test; it is not represented as physical browser-chrome zoom testing.

### Offline controlled-shell relaunch

Chromium service-worker acceptance verifies that, after the application is controlled by the production service worker, the owned application shell can reload offline and local-only routes such as My lists remain usable without horizontal overflow.

## Accessibility acceptance

Static and browser certification together cover:

- one main landmark per route;
- skip-link behavior and visible focus;
- keyboard-operable navigation and dialogs;
- minimum 44px interactive target treatment where required;
- WCAG-AA treatment for muted text covered by the design/accessibility gate;
- readable mobile form text sizing;
- reduced-motion behavior;
- representative 200%-zoom-equivalent/reflow behavior;
- mobile and desktop overflow regression checks.

Headless automation materially reduces accessibility regressions, but it does not substitute for every assistive-technology/hardware combination.

## Physical-device boundary

This execution environment has no connected physical Android phone, iPhone/iPad, macOS Safari hardware session, NVDA workstation, VoiceOver device session, BrowserStack, Sauce Labs or equivalent real-device provider.

Therefore **physical-hardware acceptance is not claimed**. In particular, this release does not fabricate PASS results for:

- physical GPU/WebGL differences;
- hardware safe-area behavior;
- real mobile virtual keyboards;
- OS-level PWA installation chrome;
- VoiceOver/NVDA speech output;
- browser-chrome zoom controls.

Instead, the exact-SHA automated browser/device-class, PWA, keyboard, reduced-motion, reflow and production-deployment tests are release-blocking, and the physical-hardware limitation is disclosed in the release record.

## Final certification rule

`v2.1.1` may be published only after the exact merged `main` SHA has passed the complete Browser Certification and the canonical GitHub Pages production certification, alongside the other Phase 5 release evidence. The release publisher verifies those exact-SHA workflow results immediately before tag and GitHub Release creation.
