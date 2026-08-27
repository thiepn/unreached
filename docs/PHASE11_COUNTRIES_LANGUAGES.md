# Phase 11 — Countries & Languages consistency

Phase 11 makes Country and Language exploration follow the same record, navigation, and accessibility rules.

## Goals

- Never silently discard a valid PeopleGroups.org record from a detail view.
- Keep large record tables responsive by progressively revealing records in fixed-size batches.
- Use the same PEID/PGID identity semantics on Country and Language pages.
- Keep the application shell as the only `main` landmark.
- Make visible counts, remaining counts, and source denominators explicit.
- Preserve horizontal containment on narrow screens.

## Progressive record contract

Country and Language detail pages both start with 40 people records when more are available.

Each table must show:

- `Showing X of Y` before the table;
- a `Show N more` control when records remain;
- the exact remaining count;
- all records after the user expands the final batch.

The initial cap is a rendering budget, not a data cap. No record may disappear merely because its index is greater than 40.

Country previously used `unreachedPeople.slice(0, 40)` with no disclosure or continuation control. Phase 11 replaces that behavior with explicit progressive disclosure. Language detail previously rendered its complete people-record array in one pass; it now uses the same 40-record contract.

## Record identity contract

The current certified PeopleGroups.org runtime treats PEID and PGID as a one-to-one source-record identity. Country and Language pages therefore use the same wording:

- PEID/PGID identifies the current provider record;
- repeated people names are not merged into an inferred cross-country identity;
- country-specific population, GSEC, language, religion, and resource fields remain source-record context.

The obsolete Country-page statement that a PEID can appear in multiple countries is prohibited by the Phase 11 static gate.

## Landmark contract

`AppShell` owns the document's `main` landmark. Country and Language profile layouts use ordinary structural containers inside that landmark; neither page may render another `<main>` element.

## Secondary capped lists

The Country profile's `Major source languages` panel remains intentionally concise at 12 entries. When more than 12 source-language aggregations exist, the UI now states `Showing 12 of N` and links to the full Languages explorer. The cap is therefore visible rather than silent.

## Certification

Static certification: `scripts/countries/phase11-check.ts`

It blocks:

- nested Country/Language `<main>` landmarks;
- the obsolete cross-country PEID claim;
- mismatched detail batch sizes;
- silent Country truncation at 40;
- all-at-once Language people rendering;
- missing progressive-record UI tokens;
- undisclosed Country language-list capping;
- omission of the Phase 11 stylesheet.

Browser certification: `tests/e2e/phase11-countries-languages.spec.ts`

A synthetic 65-record PeopleGroups.org corpus verifies:

1. Country initially renders 40 of 65 unreached records and can reveal all 65.
2. Language initially renders 40 of 65 people records and can reveal all 65.
3. Both pages expose the same one-to-one PEID/PGID wording.
4. Each page leaves exactly one document `main` landmark.
5. Country and Language table wrappers do not create document-level horizontal overflow at a 390px viewport.

The Phase 11 static check is part of `npm run build`; the browser test is part of the repository-wide `npm run e2e` matrix.
