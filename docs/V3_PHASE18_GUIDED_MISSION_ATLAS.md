# V3 Phase 18 — Guided Mission Atlas

**Status:** implemented on a post-3.0 stacked branch above Phase 17; production activation remains blocked by V3 Gate D.  
**Reviewed:** 2026-09-20

## Goal

Phase 18 adds a coherent guided learning layer to the existing atlas without replacing normal exploration.

The guided journey is:

**Region → Country → People → Prayer**

It is a teaching sequence, not a mission-priority ranking.

## Gate D remains binding

Phase 18 inherits all earlier V3 release gates. Engineering completion does not certify Unreached 3.0, bypass the Phase 12 reviewed-profile threshold, or make post-3.0 phases production-eligible before Gate D is satisfied.

## Regional reading

Every region page gains a source-grounded regional essay.

The essay is generated only from:

- Natural Earth continent grouping and country count;
- current PeopleGroups.org country-context counts;
- current GSEC 0–3 source-record counts;
- known represented population estimates.

The prose may explain what those values mean and their limitations.

It must not generate unsourced regional claims about:

- culture;
- politics;
- history;
- conflict;
- migration;
- religion beyond current source labels;
- missionary strategy;
- spiritual receptivity;
- urgency or priority.

The regional essay therefore functions as a readable explanation of current atlas evidence, not as a synthetic encyclopedia article.

## Guided pathways

A region may expose up to six learning pathways.

A pathway always follows:

1. read the region;
2. explore one country;
3. study one current GSEC 0–3 people record;
4. continue into focused prayer for that same record.

### Country selection

Eligible countries are those in the Natural Earth region with at least one current PeopleGroups.org entity classified `unreached-only`.

Countries are sorted alphabetically.

When more than six are eligible, six are sampled at stable, evenly spaced positions through that alphabetical list.

This sampling exists only to keep the guide readable while avoiding a mission-priority ranking.

It is not based on:

- population;
- unreached count;
- percentage;
- GSEC severity;
- prayer activity;
- saved status;
- engagement;
- historical change;
- source disagreement;
- geographic proximity;
- model score.

### People selection inside a country

Within a selected country:

1. reviewed editorial profiles are preferred because they provide deeper cited learning context;
2. if no reviewed profile is available, the alphabetically first current GSEC 0–3 source record is used.

Reviewed coverage is therefore a **teaching-depth criterion only**.

It is not a claim that a reviewed people group has greater need, importance, urgency, strategic value, or spiritual priority.

## Journey state

Guided journey state is carried only in the URL query:

- `journey=<region-id>`
- `focus=<PEID>`

No guided-atlas progress is written to:

- localStorage;
- sessionStorage;
- IndexedDB;
- private sync;
- Worker storage;
- D1;
- analytics or telemetry.

The URL contains only public atlas identifiers. Leaving the guided links naturally leaves the guided experience.

## Cross-page validation

The guided banner is rendered only when the URL state matches the current source-backed record.

### Country page

The banner appears only when:

- the Natural Earth region matches `journey`;
- the requested `focus` PEID exists in the current country source records.

### People page

The banner appears only when:

- the page PEID matches `focus`;
- the profile's Natural Earth region matches `journey`.

### Prayer page

The banner appears only when:

- the prayer PEID matches `focus`;
- the current country resolves to the requested Natural Earth region.

Hand-edited or stale journey parameters therefore fail closed.

## Prayer boundary

The final journey step uses the existing Prayer 3.0 eligibility boundary.

Only a current GSEC 0–3 source record is eligible for a generated guided pathway, so the prayer destination is valid when the pathway is constructed.

Phase 18 does not alter prayer wording, prayer scoring, prayer history, or mission classification.

## Existing atlas remains primary

The guided atlas is additive.

Users may continue to:

- browse regions normally;
- open any country;
- search any people;
- use maps;
- browse languages;
- pray independently.

Phase 18 does not replace primary navigation or force users through a course.

## Certification

Phase 18 adds:

- `npm run v3:phase18-check`;
- blocking integration into `npm run build`;
- `npm run v3:phase18-visual`;
- dedicated Phase 18 GitHub Actions workflow;
- desktop/mobile browser acceptance.

Certification verifies:

- regional prose contains only source-derived atlas statements;
- stable pathway sampling;
- no population/priority ranking in pathway selection;
- reviewed-profile preference is teaching-depth only;
- URL-only journey state;
- Country → People → Prayer parameter continuity;
- stale/mismatched journey state fails closed;
- no guided progress persistence or sync surface;
- mobile overflow safety.

## Explicit non-goals

Phase 18 does not:

- rank mission fields;
- recommend the “most important” people;
- create a missionary strategy engine;
- create a course-completion score;
- store journey completion;
- generate unsourced cultural essays;
- change prayer eligibility;
- add a new external data provider;
- replace normal atlas exploration;
- weaken Phase 12–17 or Gate D.
