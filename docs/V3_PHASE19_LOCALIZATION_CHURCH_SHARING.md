# V3 Phase 19 — Localization & Church Sharing

**Status:** implemented on a post-3.0 stacked branch above Phase 18; production activation remains blocked by V3 Gate D.  
**Reviewed:** 2026-09-20

## Goal

Phase 19 establishes a quality localization foundation and adds privacy-safe shared prayer collections for churches and small groups.

The phase has two linked outcomes:

1. a typed, quality-gated localization architecture;
2. a serverless church-sharing flow that exposes only intentionally shared public identifiers.

## Gate D remains binding

Phase 19 inherits all earlier V3 release gates. Engineering completion does not certify Unreached 3.0, bypass the Phase 12 reviewed-profile threshold, or make post-3.0 phases production-eligible before Gate D is satisfied.

## Localization foundation

Phase 19 introduces `src/i18n` as the first typed localization boundary.

Current certified locales:

- English (`en`);
- German (`de`).

The initial fully localized product domain is the shared-prayer collection experience.

The rest of the existing application remains English-first. Phase 19 does not falsely claim that every pre-existing route is translated.

### Catalog quality rules

Every supported locale must:

- expose the exact same message keys;
- preserve the exact same placeholder names per key;
- contain no HTML markup;
- resolve unknown/unsupported locale input to the canonical English fallback;
- use locale-aware `Intl` formatting when formatting is introduced.

Translations are plain text rendered by the UI. No translation string is injected as raw HTML.

### Translation scope

People names, country names, language names, provider labels and source IDs remain source data. They are not silently machine-translated.

Collection titles are user-authored and intentionally shared exactly as entered.

## Church prayer sharing

The sender builds a collection from their private prayer list.

The share payload contains exactly:

- schema version;
- intentional collection title;
- recipient display locale;
- selected public PeopleGroups PEIDs.

Maximum collection size: 12 PEIDs.

The payload intentionally does **not** contain:

- people names;
- country names;
- language names;
- personal notes;
- prayer-list timestamps;
- latest-prayed timestamps;
- prayer memory/history;
- Saved membership;
- recently viewed history;
- account email;
- account ID;
- private-sync metadata;
- sync revisions;
- authentication state;
- analytics identifiers.

The link is therefore a public reference list, not an export of personalization state.

## Sender intent

A collection title is visible in the generated URL payload and is therefore intentionally public to anyone who receives the link.

The builder explicitly explains that the title and selected public PEIDs are shared.

No collection is generated until the user presses **Generate share link**.

## Serverless link format

Shared collections use the route:

`#/share/prayer?c=<base64url-payload>`

The payload is:

- versioned;
- schema-validated;
- bounded in size;
- base64url encoded for transport only;
- not encrypted.

The link is never uploaded to a dedicated Unreached sharing service.

Phase 19 adds:

- no D1 table;
- no Worker storage;
- no sharing API;
- no share analytics;
- no public collection directory;
- no account-linked share history.

## Recipient resolution

When a shared link is opened:

1. the payload is decoded and validated;
2. current PeopleGroups.org runtime data is loaded;
3. each PEID is resolved against the current live corpus;
4. only records still eligible for Prayer 3.0 receive a prayer link.

If a PEID:

- no longer exists, it is shown as missing;
- exists but is no longer current GSEC 0–3, it is shown as no longer prayer-eligible.

The shared link therefore never freezes or republishes an outdated mission classification.

## No automatic import

Opening a shared collection does not:

- add people to the recipient's private prayer list;
- save people;
- create prayer history;
- create prayer-memory records;
- enable sync;
- create an account;
- emit a public activity event.

Recipients may choose to open individual prayer/profile routes and use normal private controls from there.

## Localization of shared collections

The sender chooses English or German for the recipient-facing collection UI.

The encoded locale controls only the localized UI copy.

Source data remains source data, and the user-authored title is preserved.

## Privacy relationship to existing personalization

Existing personalization remains unchanged:

- prayer list: private/local by default, optionally private-synced;
- personal notes: local-only;
- prayer memory: local-only;
- recent visits: local-only.

Phase 19 does not add shared collections to `PersonalizationState`, `SyncItem`, private sync, or account state.

## Certification

Phase 19 adds:

- `npm run v3:phase19-check`;
- blocking integration into `npm run build`;
- `npm run v3:phase19-visual`;
- dedicated Phase 19 GitHub Actions workflow;
- desktop/mobile browser acceptance.

Certification verifies:

- English/German catalog key parity;
- placeholder parity;
- no HTML-bearing catalog messages;
- safe locale fallback;
- share-payload schema/version/size bounds;
- payload contains only title, locale, version and PEIDs;
- notes/history/timestamps/account/sync fields cannot appear in encoded output;
- duplicate and malformed IDs fail validation;
- current-source re-resolution;
- stale/ineligible PEIDs are not offered as prayer links;
- no automatic recipient import;
- no sharing persistence/server/sync boundary;
- mobile overflow safety.

## Explicit non-goals

Phase 19 does not:

- claim complete whole-app localization;
- machine-translate provider/source data;
- share private notes or prayer history;
- create public user profiles;
- create social feeds;
- create public prayer activity;
- create cloud-hosted prayer collection records;
- add share tracking;
- change mission classification;
- change Prayer 3.0 eligibility;
- weaken Phase 12–18 or Gate D.
