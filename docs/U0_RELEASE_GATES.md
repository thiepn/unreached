# U0 — Exit Gates

U0 is complete only when the project has fixed its scope, terminology, source rules, and legal constraints well enough that U1 can build without reopening foundational assumptions.

## Product gates

- [x] Product mission defined.
- [x] Core loop fixed as **Explore → Understand → Pray**.
- [x] V1 feature boundary defined.
- [x] Out-of-scope systems explicitly listed.
- [x] Primary navigation fixed for V1.
- [x] Canonical map, search, and prayer journeys defined.
- [x] Browser-first/static architecture constraint established.
- [x] Target public path recorded as `thiepn.dev/unreached`.

## Definition gates

- [x] People-group concept documented.
- [x] Unreached/least-reached terminology documented.
- [x] Frontier terminology documented.
- [x] Unengaged distinguished from frontier/unreached.
- [x] Christian Adherent distinguished from personal conversion/discipleship.
- [x] Evangelical term defined in the source’s theological rather than political sense.
- [x] Scripture availability distinguished from meaningful access.
- [x] Unknown/zero/rounded-value handling defined.
- [x] Source-provided status is authoritative for boundary cases rather than silently recomputing classifications.

## Data integrity gates

- [x] Source registry schema established.
- [x] Field-level provenance requirements established.
- [x] Derived-value provenance requirements established.
- [x] Source status taxonomy established.
- [x] Data transformation pipeline concept established.
- [x] Public field allowlisting required.
- [x] Dataset freshness/version metadata required.
- [x] Statistical precision rules established.

## Legal/source gates

- [x] Joshua Project API terms reviewed on 2026-08-21.
- [x] Joshua Project classified as conditional rather than unrestricted.
- [x] Mandatory Joshua Project attribution recorded.
- [x] Joshua Project non-commercial restriction recorded.
- [x] Joshua Project no-direct-replication/value-add restriction recorded.
- [x] Full-database public static-cache release gated on written confirmation.
- [x] Joshua Project API key prohibited from public client/repository.
- [x] Joshua Project photos treated as per-item rights rather than automatically reusable.
- [x] ProgressBible registered data blocked without written permission.
- [x] Natural Earth approved as public-domain base geography.
- [x] Wikimedia Commons classified as per-item licensing.
- [x] Proprietary linguistic datasets blocked without compatible permission/license.

## Editorial gates

- [x] Profile content classes defined.
- [x] Evidence levels defined.
- [x] “Why unreached?” evidence standard defined.
- [x] Stereotype/monocausal shortcuts prohibited.
- [x] Religion-description rules defined.
- [x] Naming rules defined.
- [x] Prayer theology/tone defined.
- [x] Prayer prompt categories defined.
- [x] Sensitive-context publication rules defined.
- [x] AI-assisted authoring rules defined.
- [x] Editorial quality tiers established.

## Privacy and safety gates

- [x] V1 has no account system.
- [x] Favorites/personalization are local-only by default.
- [x] Third-party analytics are off by default.
- [x] Sensitive worker identities prohibited.
- [x] Underground church locations prohibited.
- [x] Vulnerable convert identities prohibited without explicit safe public authorization.
- [x] Restricted-source details may not be reconstructed.

## Remaining external gates before full V1 release

These do **not** block U1–U10 development, but they block release of affected production content:

- [ ] Obtain written Joshua Project confirmation for the intended full-scale static public presentation if a substantial portion of its database will be distributed to browsers.
- [ ] Re-review Joshua Project terms near release.
- [ ] Verify every production image/license entry.
- [ ] Obtain ProgressBible permission if its detailed registered data is later desired.
- [ ] Perform final data/sensitive-content audit before release.

## U0 verdict

**PASS for development.**

The product may proceed to **U1 — Production Architecture & Design System**.

The unresolved Joshua Project confirmation is a **release-scale data gate**, not an architecture-development blocker. U1 should use fixtures/synthetic records or a deliberately small permitted prototype dataset until the ingestion pipeline and final scale are ready.
