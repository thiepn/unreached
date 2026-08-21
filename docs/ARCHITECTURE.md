# Unreached — Production Architecture

**Phase:** U1  
**Status:** Baseline architecture  
**Target:** `https://www.thiepn.dev/unreached/`

## 1. Architectural goals

Unreached is a static, browser-first application. The production architecture must:

- deploy to GitHub Pages with no application server;
- remain fast on ordinary mobile hardware;
- keep source API credentials out of the browser;
- support a large, chunked read-only mission dataset;
- preserve field-level data provenance;
- work with keyboard, pointer, touch, and assistive technology;
- keep future map, search, prayer, and local-storage systems modular;
- preserve the U0 product boundary: **Explore → Understand → Pray**.

## 2. Stack

- **Vite 8** — static build and development server
- **TypeScript 7** — strict application/domain typing
- **Preact 10** — lightweight component runtime
- **Lucide Preact** — SVG icon primitives
- **Fontsource** — locally bundled Newsreader and Source Sans 3
- **CSS** — native design-token and responsive architecture
- **Hash routing** — host-independent static navigation
- **GitHub Actions + GitHub Pages** — build and deployment

MapLibre is intentionally deferred until U3, when the geographic engine is actually implemented.

## 3. Hosting model

Vite uses the project base path:

```text
/unreached/
```

The public product is expected at:

```text
https://www.thiepn.dev/unreached/
```

No `CNAME` file belongs in this project repository. The root-site custom-domain configuration remains outside this repo.

## 4. Routing decision

V1 uses hash routing:

```text
/unreached/#/
/unreached/#/peoples
/unreached/#/countries
/unreached/#/pray
```

This guarantees direct refresh on static hosting without project-specific 404 rewrites or server configuration. Clean path routing can replace it later only after a tested host-level rewrite strategy exists.

## 5. Application layers

```text
src/
  app/          composition and routing
  components/   reusable interaction/visual primitives
  pages/        route-level views
  styles/       tokens, reset/base, product layout

future:
  domain/       normalized domain types
  data/         loaders, caches, provenance adapters
  map/          MapLibre engine and map-state adapters
  search/       indexes and query parsing
  prayer/       prayer-flow logic
  state/        persistent local user state
```

## 6. Data boundary

The browser must never call credentialed source APIs directly.

```text
external sources
    ↓
build-time ingestion
    ↓
normalization
    ↓
validation
    ↓
chunked public data
    ↓
browser loaders
```

No secret/API key may be committed or included in client bundles.

## 7. State rules

### URL state

Use route/hash state for shareable navigation. Future map state may encode selected country/people, map layer, and practical filter state.

### Ephemeral state

Use component-local state for temporary panels, dialogs, and filter editing.

### Persistent personal state

V1 uses local browser storage only for saved peoples, recent exploration, and lightweight preferences. No personal prayer data is transmitted to a backend.

## 8. Responsive architecture

- `>1040px`: full header navigation + map side panel
- `761–1040px`: compact header + map side panel
- `≤760px`: mobile bottom navigation + map-first layout + future bottom sheet

The mobile map is not a compressed desktop layout.

## 9. Accessibility baseline

- skip link;
- semantic header/nav/main structure;
- minimum 44px actionable targets;
- strong `:focus-visible` treatment;
- `aria-current` route state;
- keyboard-operable navigation;
- map information must have list/profile equivalents;
- reduced-motion support;
- no information encoded only by color;
- no hover-only critical interaction.

## 10. Performance principles

- no large dataset in the initial application bundle;
- no map engine before U3;
- lazy/chunked mission data;
- locally bundled fonts;
- tree-shaken icons;
- native CSS rather than runtime styling frameworks;
- no global state dependency until a concrete phase requires it;
- UI shell remains usable before mission data loads.

## 11. Resilience

Later data layers must distinguish loading, empty, unavailable, and invalid states. The app must never fabricate fallback statistics. Partial verified rendering is preferred over guessed content.

## 12. Architecture change rule

Add a dependency or architectural layer only when a concrete phase requires it. U1 intentionally excludes backend services, authentication, global state frameworks, analytics SDKs, animation frameworks, and large UI component suites.
