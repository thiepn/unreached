# Unreached 3.0 — Phase 3 Editorial Content System

**Phase:** 3 — Editorial Content System  
**Status:** implementation contract  
**Depends on:** `V3_PHASE2_MISSION_KNOWLEDGE_MODEL.md`  
**Canonical structured-data boundary:** Phase 2 mission model

---

## 1. Phase outcome

Phase 3 establishes the editorial layer that sits above structured mission data.

The application now has a formal way to distinguish:

1. a **Reviewed profile** — published contextual material that has passed the editorial standard;
2. an **Enhanced profile** — limited sourced editorial context layered over structured mission data;
3. a **Source profile** — structured mission data only, with no invented narrative depth.

This distinction is required because Unreached should never imply that every people profile has been researched to the same depth.

The data flow is now:

```text
external source record
        ↓
provider adapter
        ↓
Phase 2 mission model
        ↓
Phase 3 editorial profile + claims + citations + review state
        ↓
future V3 people/country/prayer surfaces
```

The Phase 2 mission model remains the source for structured identity, population, language, religion, mission classification and resource observations. Editorial content adds human-readable context; it does not replace or silently override structured source truth.

---

## 2. Editorial depth tiers

### 2.1 Reviewed profile

A reviewed profile contains substantial published contextual material with explicit citations and completed review checks.

The Phase 3 contract requires at minimum:

- a human-readable overview;
- gospel-access context;
- at least one additional human-context section such as identity, geography, history/culture, or religion/community;
- multiple sourced claims;
- contextual prayer prompts tied to reviewed claims;
- source metadata;
- freshness handling for current claims;
- explicit research gaps for dimensions that have not yet received reviewed treatment.

A reviewed profile means **the material that is published has been reviewed**. It does not mean that the profile is a complete encyclopedia article or that all eight possible editorial dimensions are filled.

That distinction is deliberate. Phase 3 does not generate filler prose merely to make a profile look complete.

### 2.2 Enhanced profile

An enhanced profile contains a smaller amount of sourced editorial context, with at least two sourced sections/claims, but has not yet met the reviewed publication depth contract.

This tier is useful for gradual expansion without falsely promoting partial research to the highest editorial depth.

### 2.3 Source profile

A source profile contains **no editorial claims, sections, prayer prompts, or editorial sources**.

It exists to say truthfully:

> Structured source data exists for this people/context, but reviewed editorial context has not been published yet.

The source tier is intentionally incapable of masquerading as researched editorial content.

---

## 3. Canonical editorial schema

Phase 3 introduces:

```text
src/editorial/
  schemas.ts
  policy.ts
  legacy-context-adapter.ts
  index.ts
```

The editorial profile contains:

```text
identity target
people-context targets
editorial depth tier
title + deck
sections
claims
sources
prayer prompts
research gaps
legacy migration reference, when applicable
review metadata
```

### Section vocabulary

The V3 editorial system supports these dimensions:

- `overview`
- `identity-context`
- `geography-context`
- `culture-history`
- `language-context`
- `religion-community`
- `gospel-context`
- `scripture-access`

The schema does not require every reviewed profile to populate every section. Missing researched dimensions are represented in `researchGaps`.

---

## 4. Claims and citations

Editorial prose is not treated as a free text blob detached from evidence.

Material claims carry:

- claim ID;
- editorial section membership;
- claim kind: fact, synthesis, or interpretation;
- evidence level A/B/C;
- certainty;
- stable/current temporal class;
- citation IDs;
- `asOf` and `reviewAfter` for current claims;
- sensitivity classification;
- interpretation note where required.

### Evidence rules

- Level A may use one strong direct source.
- Level B synthesis requires at least two cited sources.
- Level C must be explicitly labeled interpretation, may not claim high certainty, and requires an interpretation note.
- Published restricted claims are blocked.
- Current claims without freshness metadata are blocked.
- Stale current claims are blocked by the Phase 3 gate.

Every cited source has title, publisher when known, HTTPS URL, source type, access date, publication date when known, and optional locator.

---

## 5. Editorial safety rules

The publication gate rejects stereotype shortcuts and unsupported spiritual explanations.

Examples of prohibited shortcuts include language equivalent to:

- primitive/backward characterization;
- describing a religion as inherently hostile;
- claiming a culture itself is spiritually resistant;
- saying a people is unreached merely because it is Muslim, Hindu, Buddhist, or another religion;
- claiming nobody has heard the gospel when the evidence does not establish that.

Religion labels are aggregate research context, not descriptions of every person's belief or practice.

Sensitive or restricted material cannot be published in the public editorial layer.

---

## 6. Prayer integration

Phase 3 defines prayer as part of the editorial model without turning prayer into gamification.

Prayer prompts must:

- connect to reviewed contextual claims;
- use calm, respectful language;
- avoid stereotypes and demeaning generalizations;
- avoid scores, streaks, leaderboards, competitive language, or spiritual-performance pressure;
- distinguish a prayer request from a factual claim.

The migrated seed profiles use a small reviewed template set whose basis claim IDs remain attached to each prompt. Phase 10 may redesign the prayer experience, but it should consume this contextual contract rather than generate unsupported people-specific claims.

---

## 7. Explicit research gaps

Editorial depth is never inferred from an empty UI.

Each profile may carry explicit `researchGaps` such as:

```text
culture-history — no separately reviewed section yet
geography-context — no separately reviewed section yet
language-context — structured source data exists, editorial treatment not yet reviewed
```

This makes incompleteness visible to maintainers and prevents future interfaces from implying equivalent research depth across the entire atlas.

A section may not simultaneously be published and listed as a research gap.

---

## 8. Migration of the current reviewed corpus

The current production repository already contains twelve reviewed contextual shards under:

```text
public/data/context/profiles/
```

Phase 3 does not rewrite their factual claims. Instead, `legacy-context-adapter.ts` provides a transitional bridge into the V3 editorial identity vocabulary:

```text
people-entity:peoplegroups:<PEID>
        ↓
people:peoplegroups:<PEID>

PGxxxxxx
        ↓
people-context:peoplegroups:pgxxxxxx
```

Existing claims, citations, evidence levels, freshness dates, sensitivity rules and review metadata are preserved.

The adapter may reorganize reviewed material into V3 editorial sections, but it must not invent factual claims to fill missing sections.

---

## 9. Ten reviewed exemplars

Phase 3 establishes ten reviewed exemplars in:

```text
data/v3/editorial/exemplars.json
```

The seed set covers:

- Fon — Benin
- Hui — China
- Uyghur — China
- Somali — Somalia
- Southern Pashtun — Afghanistan
- Bengali Sunni — Bangladesh
- Kazakh — Kazakhstan
- Tajik — Tajikistan
- Rohingya — Myanmar
- Wolof — Senegal

These are **seed reviewed exemplars for the editorial system and future UI design**, not a claim that their final Phase 8/12 atlas articles can no longer be improved.

The remaining current reviewed shards must also remain structurally adaptable; the exemplar list simply creates a hard minimum design/test corpus of ten reviewed profiles.

---

## 10. Automated publication gate

Phase 3 adds:

```bash
npm run v3:phase3-check
```

The gate verifies:

- all current reviewed profile shards parse and adapt into the V3 editorial model;
- at least ten configured exemplars satisfy the reviewed tier contract;
- Phase 2 people/context identity formats are used;
- sources and claim IDs are unique;
- all citations resolve;
- synthesis/interpretation evidence rules hold;
- current claims are not stale;
- restricted claims cannot publish;
- sections cannot reference missing claims;
- prayer prompts cannot reference missing basis claims;
- research gaps do not collide with published sections;
- source-only profiles cannot contain fake editorial prose;
- stereotype/manipulation language gates remain active.

The production build runs the Phase 3 gate after the Phase 1 and Phase 2 gates.

---

## 11. Development-only editorial preview

Phase 3 adds:

```bash
npm run v3:editorial-preview
```

This generates:

```text
artifacts/v3-phase3/editorial-preview.html
artifacts/v3-phase3/editorial-preview.json
```

The preview is for maintainers to inspect section hierarchy, citations, prayer prompts, research gaps and profile depth before a production people-profile redesign exists.

It is not a public product route and does not alter current V2 runtime behavior.

---

## 12. Phase 3 acceptance criteria

Phase 3 is complete when:

- [x] reviewed/enhanced/source depth tiers are defined;
- [x] provider-independent editorial schemas exist;
- [x] claim-level citations, freshness and sensitivity metadata are enforced;
- [x] research gaps are explicit rather than filled with invented prose;
- [x] prayer prompts are connected to reviewed claims and use non-gamified language;
- [x] the current reviewed corpus can cross the Phase 2 identity boundary without rewriting facts;
- [x] ten reviewed exemplars pass the V3 publication gate;
- [x] a development-only preview can be generated;
- [x] source-only profiles are structurally prevented from pretending to be reviewed editorial profiles;
- [x] the production build blocks Phase 3 editorial integrity regressions.

---

## 13. Phase 4 handoff

Gate A of `V3_ROADMAP.md` is now satisfied:

- Phase 1 resolved the canonical launch source strategy;
- Phase 2 established the normalized mission knowledge model and provenance boundary;
- Phase 3 established editorial depth tiers, citation rules, review state and a representative reviewed content corpus.

**Phase 4 — Visual Foundation Rebuild** may therefore proceed without encoding unresolved source or editorial semantics into the design system.
