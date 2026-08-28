# Phase 5 — Final Content, Device and Release Certification

**Release line:** 2.1.1  
**Final review date:** 29 August 2026  
**Candidate branch:** `phase/phase5-final-release`  
**Promotion rule:** the GitHub Release workflow may publish `v2.1.1` only for the exact merged `main` SHA that satisfies the final automated and production gates.

## Scope freeze

Unreached is feature-complete for v2.1.1. Phase 5 adds release certification, PWA packaging, repository governance and maintenance handoff only. It does not add mission-data fields, new prayer mechanics, analytics, social features, rankings, streaks or new provider integrations.

## Editorial review

All 12 Tier-3 editorial shards were read end-to-end against `docs/EDITORIAL_AND_PRAYER_STANDARD.md`:

1. Fon of Benin
2. Hui of China
3. Uyghurs of China
4. Somalis of Somalia
5. Southern Pashtuns of Afghanistan
6. Bengali Sunni Muslims of Bangladesh
7. Kazakh of Kazakhstan
8. Tajik of Tajikistan
9. Rohingya of Myanmar
10. Wolof of Senegal
11. Kurmanji Kurds of Türkiye
12. Javanese Transmigrants of Indonesia

The final review checked identity anchoring, naming scope, source attribution, temporal framing, current-claim review windows, religion nuance, sensitive-data exposure, evidence levels and every published `whyUnreached` explanation.

### Editorial result

No profile requires a factual or tone correction for this release.

- Every profile remains attached to one explicit PeopleGroups.org PEID and one or more explicit PGID/country/language anchors.
- No profile relies on numeric PEID/PGID coincidence as identity evidence.
- Every material claim has one or more declared citations.
- Current provider claims are dated and have review-after dates.
- Aggregate religion labels are explicitly separated from individual belief or practice.
- GSEC remains source-native mission-research metadata, never an individual judgment.
- No profile uses religion, ethnicity or culture as a monocausal explanation for unreached status.
- No profile publishes a covert believer, underground congregation, missionary identity or sensitive precise location.
- Resource availability is not misrepresented as distribution, comprehension, usage or translation completeness.

## External source re-verification

The final review re-checked the higher-risk external claim classes against the cited institutional source layer:

- UNESCO Royal Palaces of Abomey supports the Aja-Fon / Kingdom of Dahomey historical context.
- The State Council Information Office Hui reference supports broad Hui distribution, standard Chinese language use, Islam and historical migration context; it is used only as a broad official reference, not for contested political interpretation.
- The Library of Congress Somalia country study supports the explicitly historical language and lineage/clan context, with its 1993 age disclosed in the profile.
- OHCHR and Minority Rights Group continue to support the carefully qualified Xinjiang religious/cultural restriction context used in the Uyghur profile.
- USCIRF's 2026 Afghanistan report supports the profile's 2025 religious-freedom context under Taliban de facto authorities.
- UNHCR's 2026 Somalia material continues to document conflict, insecurity, drought/climate shocks and displacement.
- UNHCR's current Rohingya emergency material continues to document more than one million Rohingya refugees in Bangladesh, statelessness/protracted displacement and constrained humanitarian access in Myanmar.
- UNESCO's Kazakh yurt listing supports the described living cultural-heritage context.
- Encyclopaedia Iranica supports the Tajik Persian/Central Asian ethnolinguistic context.
- Minority Rights Group supports the Bengali/Language Movement, Wolof language/demographic and Kurdish/Kurmanci/religious-diversity context used in those profiles.
- UNESCO's Yogyakarta listing supports the Javanese cultural-history context.

PeopleGroups.org provider identity, GSEC, language/resource and corpus relationships remain certified by the dedicated live-corpus workflow rather than copied into a static release mirror.

## Prayer theology review

`u12c-v1` was re-reviewed on 29 August 2026.

The seven runtime prayer categories remain:

- gospel;
- believers;
- church;
- Scripture/resources;
- workers;
- community wellbeing;
- authorities.

The template is explicitly Christian and asks for faithful communication of the gospel, faith in Jesus Christ, mature believers and churches, Scripture access, humble workers, peace/justice and wise authorities. Scripture references are used to shape prayer rather than prove factual claims about a people.

The template does not:

- infer that every member of a source record shares one belief or practice;
- identify hidden believers, congregations or workers;
- equate a religion or culture with spiritual resistance;
- persist prayer history, counts, streaks, rankings or scores;
- prescribe coercive political or mission methods.

## Automated device-class acceptance

The production browser matrix covers:

- desktop Chromium;
- desktop Firefox;
- desktop WebKit/Safari-class engine;
- Pixel 7 mobile Chromium emulation with touch;
- iPhone 15 mobile WebKit emulation with touch.

Phase 5 additionally certifies PWA manifest/icon availability, portrait and landscape responsive behavior, a 200%-zoom-equivalent narrow layout boundary, and offline controlled-shell relaunch in Chromium.

Existing accessibility certification remains blocking and covers WCAG-AA muted-text contrast, 44-pixel targets, visible skip/main focus, reduced motion, readable mobile form text, keyboard navigation and representative-route overflow.

### Physical-device boundary

This execution environment has no connected physical Android/iOS device and no BrowserStack/Sauce Labs/other real-device provider. Therefore **physical-hardware acceptance is not claimed**. Automated browser/device-class acceptance is release-blocking; physical hardware remains an explicitly unverified external observation rather than a fabricated PASS.

## Repository governance

Phase 5 adds:

- `.github/CODEOWNERS` for repository ownership;
- an exact-SHA release publisher that waits for production and CI evidence before creating `v2.1.1`;
- maintenance-mode policy and allowed-change boundaries;
- final content/PWA certification as a production-build gate.

GitHub currently exposes `main` as unprotected. The connected GitHub application has administration read permission but no branch-protection/ruleset write capability, so this session cannot truthfully enable the external repository setting. The release publisher compensates operationally by refusing to tag a stale or uncertified SHA, but it is not represented as a substitute for GitHub branch protection.

## Final automated release evidence

Before `v2.1.1` publication, the exact final SHA must satisfy:

- `npm ci` on Node 22.23.2;
- deterministic type/build/data/source/privacy/license/operations/Phase-5 gates;
- dependency vulnerability and license audit;
- full five-project Browser Certification;
- PeopleGroups Live Certification;
- GitHub Pages deployment and canonical production browser certification;
- deployed Worker production certification;
- success commit statuses `unreached/pages-production`, `unreached/peoplegroups-live` and `unreached/worker-production`.

The release publisher rechecks these conditions against the exact `main` SHA immediately before tag/release creation.
