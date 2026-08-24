# v1.5 — Editorial Coverage Expansion & Regional Balance

## Purpose

v1.4 made reviewed editorial context discoverable. v1.5 expands the reviewed publication from six to twelve source-record profiles and exposes the geographic distribution of that editorial work so coverage gaps remain visible.

The release is deliberately not a ranking system. Editorial coverage measures only where Unreached has completed its own review process.

## Coverage expansion

Six Tier-3 reviewed profiles are added:

| Profile | PEID / PGID | Country | Language | Editorial region |
| --- | --- | --- | --- | --- |
| Kazakh | 24277 / PG024277 | Kazakhstan | `kaz` | Central Asia |
| Tajik | 24529 / PG024529 | Tajikistan | `tgk` | Central Asia |
| Rohingya | 22052 / PG022052 | Myanmar | `ben` | Southeast Asia |
| Wolof | 14267 / PG014267 | Senegal | `wol` | West Africa |
| Kurd, Northern (Kurmanji) | 24567 / PG024567 | Türkiye | `kmr` | West Asia |
| Javanese Transmigrants | 46650 / PG046650 | Indonesia | `jav` | Southeast Asia |

Together with v1.3's six profiles, the reviewed publication now contains twelve source-record profiles.

## Regional coverage model

v1.5 adds a small editorial-only regional taxonomy used for coverage navigation and gap reporting:

- Central Asia
- East Asia
- Horn of Africa
- South Asia
- Southeast Asia
- West Africa
- West Asia

These are broad editorial navigation groupings. They do not replace PeopleGroups.org regions, Natural Earth geography, political boundaries, or any mission-status taxonomy.

The coverage page shows profile and country counts by editorial region and allows a visitor to filter the publication by region. The interface explicitly states that regional spread is not a quota, ranking, or evidence that a represented region has greater mission priority.

## Evidence model

Each new profile:

- targets one exact current PeopleGroups.org PEID/PGID source record;
- declares explicit provider PEID, PGID, country, language and name evidence;
- uses at least two sources;
- includes at least one Level-B cross-source synthesis claim;
- retains current-claim `asOf` and `reviewAfter` dates;
- distinguishes source-record religious classifications from individual beliefs;
- separates GSEC status from language-resource availability;
- avoids treating ethnicity, culture or religion as an inherent cause of unreached status;
- remains Tier 3 and fail-closed under the existing editorial integrity policy.

The six additions use PeopleGroups.org as the mission-status and runtime identity provider plus a second contextual source from UNESCO, Encyclopaedia Iranica, UNHCR or Minority Rights Group.

## Sensitive-context handling

The Rohingya profile adds humanitarian displacement/statelessness context from UNHCR. That evidence is classified under `conflict-displacement` and is presented as an access condition, not as the sole explanation for GSEC status.

The Kurmanji profile explicitly notes wider religious diversity among Kurdish communities in Türkiye so the PeopleGroups source-record religion field is not generalized to every Kurd.

The Javanese Transmigrants profile keeps UNESCO's Yogyakarta material as broad Javanese cultural context and explicitly does not infer that every transmigrant community shares the same cultural practices.

## Source taxonomy

The editorial source schema now distinguishes two additional evidence classes:

- `humanitarian`
- `cultural-heritage`

This allows UN humanitarian reporting and UNESCO heritage material to remain visibly different from mission research, human-rights reporting and general reference sources.

## Release gates

`scripts/context/v15-check.ts` requires:

1. package version `1.5.0`;
2. status, manifest and shard count of exactly twelve;
3. all twelve required PEIDs and exact declared PGID/country/language anchors;
4. explicit provider PEID/PGID identity evidence and no numeric-coincidence matching;
5. published Tier-3 review state for every profile;
6. at least two sources, five claims, two evidence dimensions and one cross-source Level-B synthesis for each v1.5 addition;
7. at least seven explicit editorial regions with no unmapped production profile;
8. regional-balance guardrail language in the coverage browser.

The existing PeopleGroups live workflow then fetches every profile by PGID and verifies the actual current PEID, name, country and language returned by the public API. This live step is the authoritative identity check; the release does not accept PEID/PGID numeric similarity as evidence by itself.

## Browser certification

`tests/e2e/v15-editorial-expansion.spec.ts` verifies:

- twelve reviewed coverage cards;
- local-first coverage loading with zero PeopleGroups full-corpus requests;
- seven-region coverage reporting;
- Central Asia and Southeast Asia filtering;
- canonical routing into a newly reviewed profile;
- visible editorial safeguards against cultural/religious causal shortcuts.

## Remaining limitation

Twelve profiles are still a small editorial sample compared with the live PeopleGroups corpus. The distribution is broader than v1.4 but is not globally representative: the current reviewed set is concentrated in Africa and Asia and does not yet provide comparable publication depth across all world regions.
