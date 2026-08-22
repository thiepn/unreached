# PeopleGroups.org Data Source Contract

**Phase:** U12 — Production Data Activation  
**Provider:** International Mission Board (IMB) Global Research Department  
**Source:** PeopleGroups.org public API  
**Reviewed:** 22 August 2026

## Why this source is being evaluated

PeopleGroups.org publishes a free, public, read-only API for more than 12,000 people-group records and explicitly presents maps, prayer tools, research applications, profile cards, unreached filtering and country summaries as supported use cases. No API key or account is required.

Official documentation:

- <https://peoplegroups.org/using-the-api/>
- <https://peoplegroups.org/downloads/>

This makes PeopleGroups.org a materially different candidate from sources whose terms prohibit product inclusion or whose API terms do not give enough confidence for a substantial static browser mirror.

## U12A decision

U12A does **not** publish or bundle the PeopleGroups.org dataset yet.

The source registry currently permits:

- development ingestion for schema and mapping work;
- fixture-based adapter validation;
- source-semantic research.

The source registry currently blocks:

- generated production datasets derived from PeopleGroups.org;
- a static browser-accessible mirror of the complete API dataset;
- durable public caching whose redistribution status has not been explicitly reviewed.

The official API page clearly invites application use, including client-side examples that page through all records. However, the site footer also states copyright ownership and the API page does not, by itself, state a conventional open-data license for bulk redistribution. Unreached therefore keeps static redistribution fail-closed until the release mode is reviewed explicitly.

## Identity model

PeopleGroups.org exposes two identifiers with different roles:

- `PGID` — the primary identifier for one people-group record in a country, e.g. `PG012345`;
- `PEID` — People Group Entity ID, used to relate the people across countries.

U12A preserves both rather than forcing either identifier into the existing Joshua Project route model.

The staging adapter emits:

- `sourceRecordId = PGID`;
- `peopleEntityId = PEID`.

A later domain migration must decide how canonical cross-source people identity works before production routes are changed.

## Mission-status semantics

PeopleGroups.org publishes source-specific fields including:

- `EvngLvl` — evangelical-level description;
- `GSEC`, `GSECbrf`, `GSEClng` — Great Commission Status of Evangelization;
- `SPI`, `SPIdesc` — Strategic Priority Index / engagement progress;
- `LPI`, `LPIname`, `LPIdesc` — Lostness Priority Index.

These fields are **not** Joshua Project `JPScale`, `LeastReached`, or `Frontier` values.

U12A therefore preserves them under an explicit `imb-peoplegroups` methodology object. It does not:

- manufacture `jpScale`;
- manufacture `frontier`;
- infer an exact evangelical percentage from `Less than 2%` or another category;
- overwrite the existing Joshua Project definitions.

If Unreached later presents a source-neutral `unreached` classification across multiple providers, that classification must have a separately documented methodology and must retain the source classification alongside it.

## Scripture/resource semantics

PeopleGroups.org exposes fields such as `Bible`, `Jesus`, and `ResTot`.

`Bible = Available` is not automatically equivalent to:

- Bible portions;
- New Testament;
- complete Bible;
- practical access in a preferred language.

U12A keeps the source label as `bibleAvailability` and does not map it into Unreached's translation-completeness enum.

## Population and geography

`Pop` is retained as an estimated source value.

Coordinates are accepted only when both latitude and longitude are present and valid. Invalid coordinates fail closed. The existing U6 rule against presenting approximate coordinates as precise settlement claims remains in force.

## Editorial text

`PeopleDesc` and `LocationDesc` are staged as source editorial fields. They do not automatically satisfy the U7 evidence/review standard for publication as Unreached-authored contextual claims.

Before publication, U12 must define whether these fields are:

- shown as explicitly attributed source descriptions;
- incorporated into reviewed editorial profiles with claim-level citations;
- excluded from the public UI.

## Photos

`PicURL` and `PicCrdt` are references only.

The staging adapter marks every photo reference `redistributionApproved: false`. Some returned photo URLs and credits point to Joshua Project or other third-party rights holders. U12 does not infer image rights from the PeopleGroups.org data API permission.

No image may be downloaded, bundled or republished until its individual rights are verified under the existing U0 media policy.

## Freshness and provenance

`UpdatedDate` is retained as the source freshness timestamp when present.

Staging records carry field-level provenance containing:

- source ID;
- source record ID;
- raw source field;
- retrieval timestamp;
- source update timestamp;
- any normalization performed.

Transformations are intentionally minimal and documented. ISO codes may be normalized syntactically, but mission or resource meaning is not silently reinterpreted.

## U12B production-activation requirements

Before any real PeopleGroups.org data appears in production, U12B must complete all of the following:

1. Confirm the exact permitted release mode: direct runtime API reads, generated static data, or both.
2. Verify browser CORS behavior and API reliability from the deployed `thiepn.dev/unreached/` origin.
3. Decide whether production should depend on a third-party runtime API or use a legally approved build-time snapshot.
4. Define canonical `PGID` / `PEID` / existing people-route identity migration.
5. Define source-neutral versus source-specific mission classifications.
6. Define country aggregation rules and denominator/coverage semantics.
7. Define language and religion normalization without importing proprietary taxonomy.
8. Keep external photos disabled unless individually rights-cleared.
9. Add availability, timeout, stale-data and schema-change failure states.
10. Pass the complete U2–U12 validation and deployed-browser certification chain.

Until those gates pass, the current V1 production publication status remains unchanged.
