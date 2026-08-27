# Phase 9 — People profile journey redesign

Phase 9 changes the people profile from an action-first page into a context-first journey.

## Goal

A profile must establish the source identity and contextual evidence before inviting the user into focused prayer. The page should make a clear distinction between structured PeopleGroups.org facts, provider-authored description, personal actions, and deeper provenance.

## Required sequence

1. **Identify** — people-group name, reach status, country, religion, language, PEID and PGID.
2. **Orient** — four essential source metrics: population estimate, GSEC, country and language.
3. **Understand** — structured source record first, followed by provider description when available.
4. **Act from context** — focused prayer for eligible GSEC 0–3 records and local save/remove action.
5. **Go deeper** — related source records, taxonomy/methodology and raw-resource-label explanation.

The prayer/save action stage must never precede the structured source record or provider context stage in the rendered profile.

## Provider-description absence

When PeopleGroups.org does not provide descriptive text, the profile says so explicitly. Unreached must not synthesize a community narrative to fill that gap.

## Prayer eligibility

The existing eligibility rule is preserved:

- records with at least one unreached context can enter the focused GSEC 0–3 prayer flow;
- other records do not receive a prayer CTA;
- saving remains available for both cases.

The primary eligible CTA is **Pray with this context**, intentionally reinforcing that prayer follows the source context rather than replacing it.

## Responsive contract

At narrow widths:

- overview and action headings collapse to one column;
- the Explore → Understand → Pray journey becomes a vertical stack;
- prayer/save actions become full-width controls;
- the action stage may extend to the page edge but must not create horizontal overflow.

## Certification

Static enforcement: `scripts/peoples/phase9-check.ts`.

Browser enforcement: `tests/e2e/phase9-people-profile.spec.ts` verifies:

- source context renders before the prayer action stage;
- eligible records expose the contextual prayer next step;
- non-eligible records retain saving without a prayer CTA;
- the mobile journey does not introduce horizontal overflow.

Phase 9 is included in `npm run people:check` and therefore the production build gate.
