# Phase 4 — Route-specific loading

Phase 4 removes the full-corpus requirement from direct PeopleGroups detail routes while preserving the Phase 3 shared-corpus architecture for collection and aggregate experiences.

## Route loading contract

Direct routes now use the existing certified PeopleGroups.org single-record endpoint:

- `/peoples/:peid`
- `/pray/:peid`

The current live identity audit established that every current PGID numeric suffix equals its PEID. A route PEID is therefore converted to a six-digit PGID, for example PEID `12319` → `PG012319`, and requested through `GET /people-groups/PG012319`.

That mapping is not trusted blindly. Every returned record is schema-validated and must match both the expected PGID and PEID. An identity mismatch fails closed.

## Dedicated route-record cache

Route records use a separate IndexedDB object store named `records` inside `unreached-peoplegroups-v1`.

The route cache follows the same freshness policy as the full corpus:

- up to 24 hours: fresh local record;
- older than 24 hours: stale, explicitly labeled fallback;
- up to 7 days: eligible as a stale fallback when live refresh fails;
- storage failures never make a valid network response unusable.

A successful direct route therefore does not need to download, parse, validate, or materialize the 12,000+ record corpus.

## Relationship to the Phase 3 corpus

The route-record store is deliberately not a second partial corpus. It owns only individually requested records.

If the Phase 3 full corpus has already been loaded, detail routes use its canonical entity immediately and do not make a single-record request.

If a route record is loaded first and the full corpus is loaded later, the detail hook switches to the canonical Phase 3 entity. Before doing so it verifies PEID, route key, and PGID identity. A mismatch is surfaced as an error rather than silently combining incompatible generations.

This keeps collection/search/map/country/language derivations coherent while making direct profiles substantially cheaper.

## Surfaces that remain full-corpus

Full-corpus loading remains intentional for experiences whose product behavior actually requires broad or aggregate data, including:

- People Explorer lists and filtering;
- country and language aggregation;
- map/mission visualization;
- global people/language search;
- Prayer index/daily selection;
- guided multi-person prayer sessions that validate a set of current records.

Those surfaces continue to use the Phase 3 singleton corpus and shared derived indexes.

## Saved and Recent continuity

Saved and Recent entries already navigate to `/peoples/:peid` or `/pray/:peid`. They therefore receive the route-specific loading behavior automatically without changing the privacy-preserving local snapshots stored by personalization.

A saved snapshot is still only continuity metadata. The live route record remains authoritative when opened.

## Certification

Phase 4 adds blocking deterministic checks for:

- certified PEID → zero-padded PGID conversion;
- one-record network loading;
- fresh record-cache reuse;
- explicit stale offline fallback;
- response identity mismatch rejection;
- detail pages avoiding full-corpus hooks;
- IndexedDB transaction completion semantics.

Browser certification additionally proves:

1. a cold direct people profile makes one single-record request and zero corpus requests;
2. focused prayer reuses that route record without activating the corpus;
3. a page reload reuses the fresh IndexedDB route cache without another network request;
4. loading the full People Explorer afterward promotes the detail view to the canonical Phase 3 corpus entity;
5. a PEID such as `12319` requests `PG012319` exactly.

Phase 4 changes data-loading granularity, not provider semantics, reach methodology, personalization policy, or public route identity.
