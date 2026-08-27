# Phase 6 — Router & Navigation State

Phase 6 makes discovery state part of the browser URL and restores normal browser-history behavior without replacing Unreached's lightweight hash router.

## Goals

- A user can search/filter a discovery page, open a profile, press Back, and return to the same discovery state.
- Browser Back/Forward owns scroll restoration; the router no longer forces history traversals to the top.
- Route titles identify the active section or deep-link identity.
- The skip link moves focus to the main landmark without becoming an application route.
- Invalid numeric deep links such as `/peoples/0` and `/pray/0` are real not-found routes.
- Global-search arrow keys follow the same order users see on screen.

## URL state contracts

The app keeps current discovery state in the hash query string with `history.replaceState`, so editing a search box or filter does not create one history entry per keystroke.

### People Groups

`#/peoples?q=&status=&country=&language=&religion=&bible=&population=&sort=&reviewed=1&page=`

Default values are omitted. `page` represents incremental result pages of 48 records and replaces ephemeral `visibleCount` state.

### Countries

`#/countries?q=&page=`

### Languages

`#/languages?q=&reach=&bible=&sort=&page=`

### Reviewed Coverage

`#/coverage?q=&country=&region=`

### Prayer

`#/pray?country=&q=`

The existing country scope and the prayer-subject search now coexist in one URL state contract.

## History and scroll behavior

`useHashRoute` distinguishes normal hash navigation from browser history traversal using `popstate` plus `hashchange`:

- normal forward navigation focuses `#main-content` and starts the new route at the top;
- Back/Forward leaves viewport restoration to `history.scrollRestoration = "auto"`;
- query-only state updates use `history.replaceState` and do not trigger route navigation.

## Titles and route validity

Titles are route-specific, including deep-link identifiers such as PEID, ISO3 country code, and ISO 639-3 language code. Numeric detail routes must contain a safe positive integer. A syntactically numeric but invalid value such as zero is not silently downgraded to the corresponding list page.

## Search keyboard order

Search results are still scored globally, but the rendered UI groups them as Peoples → Countries → Languages. Phase 6 flattens that rendered grouping into `visualResults`; Arrow Up/Down, Enter, `aria-activedescendant`, hover state, and active-row scrolling all use that exact visual sequence.

## Certification

The production build runs `npm run navigation:check`, which verifies the architecture and repaired Phase 0 contracts. `tests/e2e/phase6-navigation-state.spec.ts` certifies URL restoration, Back navigation, invalid numeric routes, Prayer/Coverage state, and global-search keyboard order. Previously expected Phase 0 failures for skip navigation, search-state restoration, and dynamic titles are promoted to passing contracts.
