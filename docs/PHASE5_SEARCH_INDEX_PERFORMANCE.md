# Phase 5 — Search and index performance

Phase 5 removes repeated search/filter preparation from interactive hot paths. The app should pay the normalization/indexing cost once per shared data generation, then keep typing and filter changes lightweight.

## PeopleGroups prepared index

The shared PeopleGroups runtime owns one `RuntimePeopleSearchIndex` per `entities` array. Each prepared record contains:

- lower-cased People Explorer search text;
- lower-cased Prayer-specific search text;
- exact country ISO3 membership;
- exact unreached-country membership;
- language ISO/name membership;
- religion code/name membership;
- Bible availability labels;
- precomputed GSEC minimum;
- known population;
- taxonomy values reused by global search.

The same index also owns the sorted Country, Language, Religion and Bible-label options used by the People Explorer. Interactive filtering therefore does not rebuild taxonomy/context haystacks or filter-option maps.

## Prayer

Prayer uses the same shared PeopleGroups prepared index and debounces only the expensive corpus filter by 100 ms. The input value remains synchronous. Country scoping, prayer query matching and population sorting use prepared fields.

## Languages

Language aggregation remains one shared derivation per PeopleGroups context generation. A second generation-scoped index prepares each language's searchable country/people/resource text and exact Bible-label membership. Language query/filter changes reuse it.

## Global search

Search documents now store normalized and compact labels at document-build time. Per-query scoring reuses those fields instead of normalizing every result label. The top-18 collector uses bounded insertion rather than sorting the candidate array after every match.

## Budgets and certification

`npm run instant-data:check` runs `scripts/performance/phase5-check.ts` against a synthetic 12,370-record corpus, matching the current live PeopleGroups corpus size used by the release audit. The median budget is 50 ms for prepared People, Prayer, Language and global-search work on the CI runner. Index construction is deliberately outside those timings because it occurs once per data generation rather than once per keystroke.

Browser Certification also runs a Chromium-only 4× CPU scenario over a 4,000-record synthetic corpus. It verifies that People search, Prayer search and global search settle within an 800 ms end-to-end envelope including the deliberate 100 ms debounce and Preact rendering.

## Non-negotiable invariants

1. Search/filter preparation is generation-scoped, not component-render-scoped.
2. Debouncing must never delay the visible input value itself.
3. Exact filter membership semantics remain unchanged.
4. People, Prayer and global search reuse the Phase 3 shared PeopleGroups generation.
5. Route-specific Phase 4 records do not become a partial replacement for the full search index.
6. Performance certification is blocking in the production build gate.
