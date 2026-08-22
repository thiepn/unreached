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
- no PeopleGroups.org raw corpus in `dist/`
- no third-party people-group photos in the runtime corpus/cache

At the provider's documented 250-record maximum, a 12,000+ record corpus is roughly 50 page requests on a cold full load. U12C should avoid initiating that work from the landing page and should measure real first-load timing, memory, indexing cost and search latency on the final visible explorer before production content activation.

Real-device performance, WebGL/GPU behavior, third-party API behavior and slow-network experience remain part of deployed certification rather than being inferred from bundle-size budgets alone.
