# Phase 3 — Shared Data Architecture

Phase 3 gives runtime data one owner per domain. Components may subscribe to a shared snapshot, but they must not independently fetch, parse, or rebuild large indexes from the same source generation.

## PeopleGroups corpus

`src/providers/peoplegroups/store.ts` remains the canonical corpus lifecycle. In addition to validated records, contexts, entities, and country summaries, each installed corpus generation now owns:

- `peopleByRouteKey`
- `peopleByPeid`
- visible country records
- `countriesByIso3`
- prayer-eligible people
- `eligiblePrayerIds`

Those references are created once when a prepared snapshot is hydrated or a refreshed source snapshot is installed. Progress/status updates do not rebuild them. `generation` changes only when a new coherent corpus snapshot is published.

People, Country, Prayer, and mission-visualization hooks consume those shared references rather than reconstructing them per mounted component.

## Language selectors

Language aggregation is derived from the canonical PeopleGroups context array. `getSharedLiveLanguageData()` caches one language record list, ISO lookup map, and Bible-label list for each corpus context-array identity. Multiple Language/Search consumers therefore share the same derived objects without introducing a reverse dependency from the provider store into the language feature.

## Geography

World geography is a module singleton with one snapshot, listener set, and in-flight request. The GeoJSON file is fetched and parsed once per SPA lifetime. The sorted country list and ISO lookup map are created once with that snapshot. Component unmounts do not abort a request that other consumers still need.

## Editorial context

Reviewed editorial context follows the same singleton model. Status, manifest/profile materialization, dataset validation, and `profilesByPeid` are shared. Moving between a people profile and Reviewed Coverage does not fetch and parse the publication a second time.

## Global search

Global search no longer mounts separate People, Country, Language, and Geography explorer pipelines. `useSharedSearchDocuments()` combines the canonical PeopleGroups generation, shared Language selector, and Geography generation into one cached search-document generation. A query activates the required stores on demand; subsequent search consumers reuse the same documents until one source generation changes.

## Invariants

1. One PeopleGroups corpus generation produces one set of corpus identity/country/prayer indexes.
2. One context-array identity produces one shared Language derivation.
3. One SPA lifetime has at most one in-flight Geography request and one in-flight Editorial publication load.
4. Geography and Editorial loading are not owned by individual component lifetimes.
5. Search-document cache invalidation is generation-based rather than component-based.
6. A refreshed PeopleGroups snapshot publishes raw/derived state atomically so pages cannot observe mismatched entity and index generations.
7. Existing feature hooks retain their public data shapes so Phase 3 is an architectural consolidation, not a product-behavior redesign.

## Certification

`npm run instant-data:check` includes the Phase 3 source architecture gate. Playwright additionally verifies that Explore followed by Global Search does not fetch geography twice and that a people profile followed by Reviewed Coverage reuses the same editorial publication lifecycle.
