# U10 — Release Gates

**Phase:** Search, Discovery & Local Personalization  
**Status:** implementation pending CI validation

## Global search

- [x] Header search action is enabled.
- [x] `/` keyboard shortcut opens search outside editable controls.
- [x] `Ctrl+K` / `Cmd+K` also opens search outside editable controls.
- [x] Search spans published People, Countries and Languages.
- [x] Country search falls back to local Natural Earth geography.
- [x] Results are visibly grouped by domain.
- [x] Arrow-key result navigation and Enter activation are implemented.
- [x] Escape closes search.
- [x] Ranking supports exact/prefix/substring/token/alias matching plus limited typo tolerance.
- [x] Result collection is bounded for future larger datasets.

## Local personalization

- [x] People profiles expose `Save for Prayer`.
- [x] Saved people persist in browser localStorage only.
- [x] Saved snapshots are schema-versioned and runtime-validated.
- [x] Saved snapshots are explicitly non-authoritative compared with live profiles.
- [x] Saved people can be removed.
- [x] Saved page links back to people profiles and focused prayer.
- [x] Recent people/country/language exploration is recorded locally.
- [x] Recent exploration is deduplicated and capped at 12 items.
- [x] Recent exploration appears in global search and Saved.
- [x] Recent exploration can be cleared.
- [x] Cross-tab localStorage changes are observed.
- [x] No account, backend, cloud synchronization or analytics event is added.

## Architecture and source safety

- [x] Search indexes only browser-published data.
- [x] U0–U9 publication gates remain unchanged.
- [x] No source API is called by the search layer.
- [x] Recent-route tracking only initializes the active domain loader.
- [x] Global search data loaders mount on demand rather than permanently.

## Validation required before U10 completion

- [ ] application TypeScript check passes
- [ ] script TypeScript check passes
- [ ] U2–U9 checks still pass
- [ ] U10 cross-domain search checks pass
- [ ] U10 fuzzy/ranking checks pass
- [ ] U10 save/remove state checks pass
- [ ] U10 recent-history cap/deduplication checks pass
- [ ] Vite production build passes

## Deferred

- full approved production-data search profiling (U11)
- final cross-browser/localStorage certification (U11)
- final keyboard/focus accessibility certification (U11)
- final deployment smoke tests (U11)

## Deployment-only gate

Desktop/mobile visual smoke tests remain required after the stacked phases are integrated and deployed. They do not block U11 development.
