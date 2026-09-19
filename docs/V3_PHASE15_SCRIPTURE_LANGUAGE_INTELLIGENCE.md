# V3 Phase 15 — Scripture & Language Intelligence

**Status:** implemented on a post-3.0 stacked branch above Phase 14; production activation remains blocked by V3 Gate D.  
**Reviewed:** 2026-09-20

## Goal

Phase 15 turns the existing Languages & Resources surface into a deeper, source-evidence intelligence layer without pretending Unreached has a complete Bible-translation database or a linguistic census.

The canonical source remains PeopleGroups.org / IMB. Phase 15 works only with fields already exposed by the approved public read-only API and already present in the runtime corpus.

## Gate D remains binding

Phase 15 is stacked on Phase 14 and inherits all earlier V3 release gates. Engineering completion does not certify Unreached 3.0, bypass the Phase 12 reviewed-profile threshold, or make Phases 13–15 production-eligible before Gate D is satisfied.

## Source boundary

The PeopleGroups.org API currently exposes:

- `ROL` — ISO 639-3 language code;
- `Lang` — primary language name;
- `LangFamily` — language-family label;
- `Bible` — Bible availability source label;
- `Jesus` — Jesus Film availability source label;
- `ResTot` — total evangelical resources reported;
- `UpdatedDate` — source update timestamp.

PeopleGroups.org's GSEC field documentation describes Scripture/media fields as resource availability in a people's heart language. Phase 15 therefore treats these values as provider resource indicators attached to PGID country-context records.

It does **not** convert them into stronger milestones such as:

- Scripture portions;
- New Testament availability;
- complete Bible availability;
- translation progress;
- dialect fit;
- literacy or comprehension;
- actual access or use.

## ProgressBible and Ethnologue remain excluded

Phase 15 does not query, scrape, bundle or proxy ProgressBible registered data.

The existing source policy continues to require written permission before ProgressBible registered data may be incorporated into this public product.

Ethnologue proprietary linguistic content also remains excluded pending an appropriate license or permission.

Phase 15 therefore uses no new direct language-data provider.

## Evidence coverage and consistency

Every resource field is summarized with two independent properties.

### Coverage

- **complete** — every PGID context for the ISO-coded language reports a value;
- **partial** — some but not all contexts report a value;
- **none** — no context reports a value.

### Consistency

- **uniform** — all reported values are the same source label;
- **mixed** — more than one source label is reported;
- **unknown** — no reported value exists.

A source label such as `Unknown` is still preserved as a reported provider value when the API returns that literal label. A missing/null field remains missing.

Mixed labels are never collapsed into a language-wide verdict.

## PGID evidence matrix

Each language profile can disclose the exact source records behind the resource summaries.

For every PGID context Phase 15 shows:

- people record and PEID/PGID identity;
- country;
- Bible source label;
- Jesus Film source label;
- resource-total field;
- provider update date.

The table progressively reveals records on large language profiles and preserves the existing one-PGID/one-PEID certified runtime identity.

## Resource relationships

Phase 15 groups the Bible, Jesus Film and resource-total values that occur together on the same PGID record.

These are **descriptive co-occurrences only**.

Unreached does not infer:

- causation;
- ministry effectiveness;
- sequencing;
- resource dependency;
- translation completeness.

## Language-family intelligence

Phase 15 exposes other current language records sharing one or more PeopleGroups.org `LangFamily` labels.

A shared provider family label means only that the provider reports the same family label. It is not proof of:

- mutual intelligibility;
- dialect equivalence;
- interchangeable Scripture/media resources;
- a genealogical claim stronger than the source label itself.

If one ISO language has mixed family labels across source contexts, that disagreement stays visible.

## Same-country language context

Phase 15 also identifies other ISO-coded primary languages represented by PeopleGroups.org records in the same countries.

This is a geographic co-presence relationship only.

It must not be described as evidence that:

- the represented people are bilingual;
- one language can substitute for another;
- resources are usable across those languages;
- one language is dominant in the country.

## Public UI

The language profile gains a **Scripture & language intelligence** section before the existing people/country detail grid.

It provides:

- evidence-quality summaries for Bible, Jesus Film, resource totals and language-family labels;
- observed resource-field combinations;
- same-family source-label relationships;
- same-country language context;
- expandable PGID evidence.

The older raw-label Bible/media panel remains as a compact source summary rather than being replaced.

## Certification

Phase 15 adds:

- `npm run v3:phase15-check`;
- blocking integration into `npm run build`;
- `npm run v3:phase15-visual`;
- a dedicated Phase 15 GitHub Actions workflow;
- desktop/mobile browser acceptance.

Certification verifies:

- complete/partial/no coverage semantics;
- uniform/mixed/unknown consistency;
- exact raw source-label preservation;
- PGID evidence identity;
- resource co-occurrence grouping;
- family relationships use source labels only;
- same-country relationships do not imply bilingualism;
- ProgressBible and Ethnologue remain blocked;
- no fabricated Scripture milestone enters the runtime model or UI;
- mobile layouts remain usable without page-level horizontal overflow.

## Explicit non-goals

Phase 15 does not:

- become a ProgressBible mirror;
- become an Ethnologue replacement;
- claim translation-progress completeness;
- infer Scripture portions, New Testament or complete Bible status;
- infer mutual intelligibility;
- infer bilingualism;
- infer dialect compatibility;
- infer actual resource use;
- persist Joshua Project data;
- create a universal language or Scripture priority score;
- weaken Phase 12, Phase 13, Phase 14 or Gate D.

## Phase 16 handoff

**Phase 16 — Mission Knowledge Graph** may build explicit, typed relationships among people records, countries, languages, source taxonomies, reviewed editorial entities and mission evidence.

Phase 16 must consume the source-scoped relationship semantics established here rather than turning same-family or same-country relationships into stronger unstated claims.
