# U11 — Source & Release Audit

**Reviewed:** 22 August 2026  
**Purpose:** final V1 source-permission and production-publication decision

This is an engineering release gate, not legal advice. `data/source-registry.json` is the machine-readable source of truth used by the build.

## Release verdict

| Source | V1 production decision | Reason |
|---|---|---|
| Natural Earth | **Approved** | Natural Earth states that its raster and vector map data are public domain and may be used, modified and electronically disseminated. |
| Joshua Project Data API | **Keep browser publication gated** | Current API terms permit free non-commercial use with attribution and require value-added presentation, but access is revocable and the terms do not give enough confidence for exposing a substantial static browser-accessible mirror. Written confirmation remains required for that release scale. |
| Joshua Project photos | **Per-item / not enabled** | Image rights are not assumed from API/data permission. |
| ProgressBible Registered User Data | **Do not bundle** | Current terms state that supplied registered data may not be incorporated into a product or service without written permission. |
| Ethnologue | **Do not bundle** | Current terms prohibit republication/redistribution and require an appropriate license for use in products/services or database redistribution. |
| Wikimedia Commons | **Per-item only** | Each file can carry different attribution, license, ShareAlike and non-copyright obligations. No Commons media is admitted without a per-file rights record. |

## Current authoritative pages reviewed

- Joshua Project API Terms of Use — <https://api.joshuaproject.net/terms_of_use>
- Natural Earth Terms of Use — <https://www.naturalearthdata.com/about/terms-of-use/>
- ProgressBible Registered User Data Terms — <https://progress.bible/terms-of-use/>
- Ethnologue Terms of Service — <https://shop.ethnologue.com/policies/terms-of-service>
- Wikimedia Commons reuse guidance — <https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia>

## Consequence for U11 data expansion

U11 does **not** force a production data expansion merely to make the site look complete. The correct release behavior is fail-closed:

1. Natural Earth geography remains publishable.
2. Real Joshua Project-derived mission/country/people/language browser datasets remain disabled until the permission gate is resolved.
3. ProgressBible registered data and Ethnologue content remain absent.
4. Synthetic fixtures remain CI-only and are rejected by production runtimes.
5. The user interface explains unavailable data instead of fabricating values or silently substituting another restricted source.

When written permission is received, the source registry must be changed intentionally, the relevant generated dataset must be rebuilt, and the full U2–U11 validation chain must pass again before deployment.
