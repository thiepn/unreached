# U12B — PeopleGroups.org Real-Data Runtime Architecture

**Provider:** PeopleGroups.org / IMB Global Research  
**Transport:** direct read-only browser API  
**API base:** `https://peoplegroups.org/wp-json/pg/v1`  
**Static dataset mirror:** disabled

## Production transport decision

U12B selects direct browser reads as the only approved production transport for PeopleGroups.org.

The provider explicitly documents the API as free, public and read-only, requires no account or API key, invites maps, prayer tools and research applications, and publishes browser-style JavaScript `fetch` examples including full pagination. This is materially different from copying the provider database into Unreached's public static files.

The source policy therefore distinguishes four operations:

1. development ingestion
2. direct runtime read
3. public static release
4. browser redistribution

PeopleGroups.org is approved for (1) and (2). It remains blocked for (3) and (4).

## Beta contract

PeopleGroups.org labels the API beta and warns that it may change without warning. U12B treats every response as untrusted external input.

Runtime safeguards:

- Zod validation on every record/page;
- 10-second per-request timeout;
- maximum 250 records per page;
- maximum 100 pages;
- maximum 25,000 records;
- pagination and advertised-record-count consistency checks;
- duplicate `PGID` detection across the corpus;
- single-record request/response `PGID` matching;
- invalid JSON/schema drift fails closed;
- no credentials or API keys are sent.

The application must never silently reinterpret a changed provider schema.

## Identity

PeopleGroups.org provides two identity layers:

- `PGID`: one people-group record in a country/context;
- `PEID`: the people entity used to relate records across countries.

U12B canonical runtime identity is:

`people-entity:peoplegroups:<PEID>`

Public-route migration key is the numeric `PEID`. Every `PGID` remains preserved below the PEID entity as a country context.

This deliberately avoids pretending PeopleGroups.org PEIDs are Joshua Project PeopleID3 identifiers. Provider-qualified internal IDs prevent future collisions if multiple sources coexist.

## Reach / mission semantics

U12B does not convert IMB data to Joshua Project methodology.

Context records retain:

- `EvngLvl`
- GSEC code, label and description
- SPI code and description
- LPI code, name and description
- engagement status
- church-planting status
- congregation status

The only source-neutral U12B derivation is deliberately narrow:

- `EvngLvl = Less than 2%` → `unreached`
- another non-empty `EvngLvl` → `other`
- missing `EvngLvl` → `unknown`

`other` is intentionally not renamed `reached`; U12B does not claim more than the source rule proves.

A PEID entity rolls its contexts up as `unreached-only`, `other-only`, `mixed`, or `unknown`. The underlying context values remain available and are not replaced by the rollup.

## Population aggregation

People-group population is a country-context estimate.

PEID population uses:

`sum-known-country-context-populations`

Every rollup also exposes:

- known population value;
- known context count;
- total context count;
- whether coverage is complete.

Unknown populations are never converted to zero. If one context lacks population, the displayed sum is explicitly partial.

Country summaries use the denominator:

`people-group-in-country records returned by PeopleGroups.org`

They expose context count, unreached/other/unknown counts, known population, and population coverage. They are not described as percentages of all people or all residents unless a later methodology supplies a valid denominator.

## Language and religion normalization

U12B uses only source-backed identifiers/labels:

- `ROL` is retained only when syntactically valid ISO 639-3;
- language name/family remain PeopleGroups.org source values;
- religion code/name remain PeopleGroups.org values.

U12B does not import Ethnologue taxonomy or manufacture compatibility with Joshua Project religion codes.

For a multi-country PEID entity, a primary language/religion is a deterministic most-common context label, used as a discovery convenience rather than a claim of exclusive identity.

## Editorial text

`PeopleDesc` and `LocationDesc` are tagged `source-attributed-only`.

They may later be displayed only as clearly attributed provider text or passed through the U7 editorial review process. They are not automatically treated as Unreached-authored cultural/historical claims.

## Images

Runtime records intentionally do not include provider photo URLs in the public model.

U12A may retain photo references in private staging for rights review, but U12B does not download, cache, proxy or render third-party people-group images. Image rights remain per-item gated.

## Browser cache

Direct API use would otherwise require roughly 50 requests for 12,000+ records at the provider's maximum 250 records/page.

U12B therefore uses an origin-local IndexedDB page cache:

- fresh window: 24 hours;
- stale fallback window: 7 days;
- cache is private to the user's browser/origin;
- cache is not bundled with Unreached or exposed as a public dataset;
- every cached page is revalidated through the runtime schema before use;
- cache reads, writes and clears are best-effort only and can never become a prerequisite for live data access.

Load policy:

1. complete validated fresh cache → use immediately;
2. missing, corrupt or unavailable cache → fetch the live corpus;
3. successful live corpus → return it even if browser storage rejects cache writes;
4. live failure + previously validated cache younger than 7 days → show stale cache with an explicit warning;
5. live failure + no acceptable cache → fail closed with an actionable unavailable state.

## Performance budgets

Runtime guardrails:

- no API request before a real-data surface asks for the corpus;
- maximum 250 records per request;
- maximum 100 pages / 25,000 records;
- page progress callback available to UI integration;
- no raw PeopleGroups.org corpus in `dist/`;
- no third-party images in the corpus cache;
- IndexedDB rather than `localStorage` for the large record set.

U12C should add measured real-browser timing/memory budgets once the actual people explorer consumes this runtime.

## CORS and live contract certification

`tests/e2e/peoplegroups-live.spec.ts` is opt-in. For PR #24 it runs inside the already-registered Browser Certification workflow; after merge a dedicated PeopleGroups Live Certification workflow continues checking the external contract independently of normal deterministic CI.

The test loads the Unreached browser origin and performs cross-origin `fetch()` calls to:

- one known PGID;
- one paginated list request.

The test certifies:

- browser CORS access;
- HTTP success;
- core identity fields;
- exposed WordPress pagination headers;
- a corpus size above 10,000 records.

Ongoing external-data certification is kept separate from ordinary deterministic CI so transient provider downtime does not redefine unrelated application correctness.

## U12C boundary

U12B establishes and certifies the runtime architecture. It does not yet replace the existing U6 Joshua-shaped UI model or turn `public/data/peoples/status.json` to available.

U12C is responsible for integrating the provider-neutral runtime entities into the visible product, migrating filters/cards/profile pages/search/Saved/prayer surfaces, and only then activating public real-data availability.
