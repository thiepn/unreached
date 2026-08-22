# U11 — Performance Budgets

The release build fails when these coarse regression budgets are exceeded:

- entire generated `dist/`: **20 MiB maximum**
- compact Natural Earth world geography: **5 MiB maximum**
- largest JavaScript asset: **375 KiB gzip maximum**
- largest CSS asset: **60 KiB gzip maximum**

These are guardrails, not performance claims for every network/device. They are intentionally loose enough for MapLibre and bundled variable fonts while catching accidental large assets, raw dataset dumps or major bundle regressions.

The first U11 production build measured approximately **4.53 MiB total**, with the main JavaScript asset around **307 KiB gzip** and CSS around **23 KiB gzip**. The build also retains the existing deterministic data chunking and local Natural Earth geography so there is no runtime dependency on a third-party tile service.

Real-device performance, WebGL/GPU behavior and slow-network experience remain part of the final deployed release-candidate smoke pass.
