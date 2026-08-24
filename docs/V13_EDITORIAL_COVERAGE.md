# v1.3 Editorial Context Coverage

## Purpose

v1.3 expands the reviewed editorial **Understand** layer without converting Unreached into an automatically generated cultural encyclopedia. Editorial publication remains deliberately small, source-record-specific, cited, reviewable, and fail-closed.

## Release set

| Profile | PEID | PGID | Country | Language |
| --- | ---: | --- | --- | --- |
| Fon | 12319 | PG012319 | BEN | fon |
| Hui | 7206 | PG007206 | CHN | cmn |
| Uyghur | 24104 | PG024104 | CHN | uig |
| Somali | 11954 | PG011954 | SOM | som |
| Southern Pashtun | 24009 | PG024009 | AFG | pbt |
| Bengali Sunni Muslims | 1156 | PG001156 | BGD | ben |

This is a publication set, not a representative sample and not a statement that these six peoples are more important than others.

## Evidence design

Profiles may combine three kinds of material:

1. **Current provider facts** — PeopleGroups.org source-record identity, language, aggregate religion label, GSEC and raw resource availability.
2. **Stable contextual facts** — carefully scoped history/identity material from reference, academic, international, official or human-rights sources.
3. **Current access conditions** — sourced legal, conflict, displacement or access context where it materially helps explain the environment around a source record.

Current access conditions are never presented as the experience of every individual or as the sole cause of a provider mission-status classification.

## Claim levels

- **A — Sourced fact:** directly supported by the cited source.
- **B — Evidence synthesis:** requires at least two distinct cited sources.
- **C — Interpretation:** must be explicitly labeled interpretation, cannot claim high certainty, and requires an interpretation note.

Every current claim has an `asOf` date and a `reviewAfter` date. v1.3 current claims are scheduled for review by **24 February 2027**.

## Identity gate

A published profile must match the current PeopleGroups runtime using explicit:

- PEID;
- PGID;
- people name;
- country ISO3;
- language ISO 639-3.

Numeric coincidence is never acceptable identity evidence. The live certification workflow fetches each declared PGID and rejects the release if the current provider record no longer matches the editorial anchors.

## Publication format

v1.3 uses:

- `public/data/context/status.json`
- `public/data/context/manifest.v1.json`
- `public/data/context/profiles/*.json`

Each shard contains the profile and only the editorial source metadata required by that profile. Runtime materialization recreates the validated `EditorialContextDataset` model used by the existing UI.

The release fails if the manifest has duplicate URLs, count mismatches, fixture packages, duplicate PEIDs, missing required release profiles, invalid claims, stale published current claims, missing citations, incomplete review metadata, or broken identity anchors.

## Editorial guardrails

Published profiles must not:

- infer spiritual resistance from culture, ethnicity, nationality, or religion;
- say that every individual shares an aggregate religion or mission-status label;
- invent church, evangelical, access, Scripture, or media statistics;
- infer Joshua Project Frontier/JPScale semantics from IMB fields;
- convert generic Bible/resource availability into translation-completeness milestones;
- copy a country-level legal/conflict condition onto every individual;
- use legacy numeric IDs as a shortcut to PeopleGroups PEIDs;
- publish restricted/sensitive individual-level information.

## Source notes

The six-profile release draws on PeopleGroups.org plus selected contextual sources including UNESCO, Minority Rights Group, OHCHR, UNHCR, Library of Congress, USCIRF and a Chinese government reference. Source perspective is explicitly scoped where relevant; for example, the Chinese government Hui reference is used only for broad identity/history context and not for contested political interpretation.

## Release gates

v1.3 is complete only when the exact release head passes:

- TypeScript and deterministic production build;
- context schema/policy/publication validation;
- all six required PEIDs present;
- live PeopleGroups editorial identity preflight;
- complete PeopleGroups corpus certification;
- Chromium, Firefox, WebKit, mobile Chromium and mobile WebKit certification;
- browser PeopleGroups API/CORS verification;
- post-merge Pages deployment;
- deployed manifest/shard validation;
- browser certification against the deployed site.
