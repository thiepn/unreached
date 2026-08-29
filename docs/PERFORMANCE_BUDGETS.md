# Performance Budgets

## U11 static release budgets

The release build fails when these coarse regression budgets are exceeded:

- entire generated `dist/`: **20 MiB maximum**
- compact Natural Earth world geography: **5 MiB maximum**
- largest JavaScript asset: **375 KiB gzip maximum**
- largest CSS asset: **60 KiB gzip maximum**

These are guardrails, not performance claims for every network/device. They are intentionally loose enough for MapLibre and bundled variable fonts while catching accidental large assets, raw dataset dumps or major bundle regressions.

The first U11 production build measured approximately **4.53 MiB total**, with the main JavaScript asset around **307 KiB gzip** and CSS around **23 KiB gzip**. The build also retains the existing deterministic data chunking and local Natural Earth geography so there is no runtime dependency on a third-party tile service.

## U12B PeopleGroups.org runtime budgets

PeopleGroups.org remains a runtime API source rather than a public static data bundle. The runtime enforces:

- maximum **250 records per API page**
- maximum **100 pages per corpus load**
- maximum **25,000 validated records**
- maximum **10 seconds per HTTP request**
- **24-hour** fresh origin-local IndexedDB cache window
- **7-day** maximum stale fallback window
- bounded full-corpus fetch concurrency of **6** requests
- no PeopleGroups.org raw corpus in `dist/`
- no third-party people-group photos in the runtime corpus/cache

At the provider's documented 250-record maximum, a 12,000+ record corpus is roughly 50 page requests on a cold full load. The complete corpus is still required before world/country/language/prayer aggregates are considered ready.

## 2.1.x loading-latency policy

The maintenance performance pass reduces perceived loading time without changing the completeness or provider-data contracts:

- the prepared IndexedDB PeopleGroups snapshot starts hydrating immediately when the entry module executes; it no longer waits for an idle callback or a startup timer;
- this startup hydration remains **local-only** and never initiates a PeopleGroups.org network request by itself;
- the browser receives DNS/preconnect hints for `peoplegroups.org` so connection setup may begin before a data route requests the API;
- lazy route modules are opportunistically preloaded when navigation intent is visible through pointer hover/down or keyboard focus;
- on a true cold load, the **People Explorer only** may become interactive after the first validated provider page arrives;
- while that cold preview is active, the UI explicitly states that it is a partial catalog and that search/filter/match counts cover only records received so far;
- guided starts are withheld until the complete corpus is ready;
- Explore/world map, country aggregation, language aggregation and prayer eligibility continue to use only the complete validated corpus;
- a partial cold load is never persisted as the prepared complete snapshot and is discarded if the full corpus fails validation.

The fetch concurrency remains **6** until a separate provider-safe benchmark demonstrates that higher concurrency improves end-to-end latency without increasing throttling or tail failures.

Real-device performance, WebGL/GPU behavior, third-party API behavior and slow-network experience remain part of deployed certification rather than being inferred from bundle-size budgets alone.
