# U11 — Browser Certification

## Automated matrix

The U11 Playwright workflow runs the production Vite build against five browser/device projects:

- Chromium desktop
- Firefox desktop
- WebKit desktop
- Chromium mobile viewport with touch
- WebKit mobile viewport with touch

Automated smoke coverage includes:

- application shell and primary navigation
- `/unreached/` base-path correctness
- country geography fallback while mission data is gated
- `/` global-search keyboard shortcut
- search dialog keyboard close
- geographic search results
- release-transparency/About page
- Saved empty-state safety
- invalid-route handling
- horizontal-overflow regression checks on tested pages/viewports

## Manual deployment matrix

After the stacked PRs are integrated and deployed, the release candidate must still be visually checked on real current browsers/devices because headless automation cannot certify every GPU, safe-area, virtual-keyboard or assistive-technology behavior.

### Desktop

- Chrome / Chromium current stable
- Edge current stable
- Firefox current stable
- Safari current stable on macOS

### Mobile

- Android Chrome current stable
- iOS Safari current stable

### Interaction checks

- mouse wheel and trackpad pan/zoom on map
- touch pan/pinch on map
- keyboard focus order
- `/`, Ctrl/Cmd+K, arrows, Enter and Escape in global search
- focus return after closing search
- visible focus on navigation, cards, tables and buttons
- portrait and landscape layouts
- browser back/forward through hash routes
- direct refresh at `/unreached/#/...`
- localStorage enabled, blocked and cleared
- reduced-motion mode
- 200% browser zoom without horizontal page scrolling

## Certification rule

Automated Playwright success is required for U11 code completion. Real deployed smoke tests remain a release-candidate promotion gate; they are not silently claimed complete before the stacked branch is actually deployed.
