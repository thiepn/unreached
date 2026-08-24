# v1.4 — Editorial Discovery & Coverage Navigation

## Purpose

v1.3 turns reviewed editorial context into a multi-profile publication. v1.4 makes that publication discoverable without changing the meaning of mission data or turning editorial availability into a priority score.

The release adds navigation around the reviewed publication layer; it does not add new people-group claims, infer mission urgency, or modify PeopleGroups.org semantics.

## Product surfaces

### Reviewed coverage browser

`#/coverage` is a dedicated local-first index of every currently published reviewed contextual profile.

It provides:

- reviewed-profile count;
- represented-country count;
- Tier-3 publication count;
- search by people name, country, language, PEID, or PGID;
- country filtering;
- direct navigation into the canonical PEID people profile.

The page is built from the reviewed editorial manifest/shards and Natural Earth geography. It does not activate the full PeopleGroups.org corpus merely to show editorial coverage.

### People Explorer integration

The live People Explorer now:

- marks source records that have a reviewed contextual article;
- links directly to the dedicated reviewed-coverage browser;
- offers an explicit `Reviewed context only` filter;
- preserves the existing default population/GSEC/name sort behavior.

Editorial availability is therefore discoverable but never silently promoted into ranking logic.

### Country integration

Country discovery surfaces list reviewed contextual articles whose explicit editorial identity includes that country ISO3 anchor. These links are derived only from published reviewed identities.

The country panel explicitly states that this is publication coverage, not a ranking of mission importance.

### Article-to-article navigation

Every reviewed editorial article now exposes:

- its position in the alphabetically ordered reviewed publication set;
- a link back to all reviewed coverage;
- previous reviewed profile;
- next reviewed profile.

A live people record without a reviewed article instead receives a direct recovery link to the reviewed-coverage browser when editorial coverage is available.

## Semantic guardrails

v1.4 preserves the existing data contract:

- `has reviewed context` means only that Unreached currently publishes a reviewed contextual article for the exact verified PEID/PGID source record;
- it does **not** mean more important, more urgent, more unreached, higher priority, or better researched by PeopleGroups.org;
- editorial coverage does not alter GSEC, population, religion, language, resource, or prayer semantics;
- no Frontier/JPScale value is inferred;
- no Scripture-completeness category is inferred from generic resource labels;
- no culture or religion is treated as an inherent cause of unreached status;
- identity continues to require explicit provider PEID/PGID/name/country/language evidence and forbids numeric-coincidence matching.

## Performance boundary

The dedicated reviewed-coverage browser loads only:

1. editorial context status;
2. the reviewed manifest and its bounded profile shards;
3. local Natural Earth geography.

It must make zero PeopleGroups.org full-corpus requests until the user navigates into a runtime-data surface such as People Explorer or a people/country profile.

## Release certification

`tests/e2e/v14-editorial-discovery.spec.ts` certifies:

1. the reviewed-coverage route renders all six v1.3 reviewed profiles;
2. the route does not activate PeopleGroups.org runtime loading;
3. coverage is explicitly described as editorial publication coverage rather than priority;
4. search narrows the reviewed publication correctly;
5. People Explorer visibly annotates and filters reviewed records;
6. country pages expose reviewed profiles tied to that country;
7. reviewed people profiles expose previous/next/all-coverage navigation.

v1.4 remains stacked on the v1.3 editorial-coverage branch until v1.3 is merged. After v1.3 lands, v1.4 should be rebased or retargeted to `main` before final promotion.
