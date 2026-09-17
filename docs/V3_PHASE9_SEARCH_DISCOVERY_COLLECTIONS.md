# Unreached 3.0 — Phase 9 Search, Discovery & Collections

**Phase:** 9 — Search, Discovery & Collections  
**Status:** implementation contract  
**Depends on:** Phase 8 Definitive People Profile

---

## 1. Phase outcome

Phase 9 makes the definitive people profile from Phase 8 the canonical destination of discovery.

The product now supports two complementary ways to find context:

1. **direct search** when the reader already knows a people, place or language;
2. **guided discovery** when the reader wants a useful place to begin without confronting a large filter dashboard.

The product journey remains:

```text
World → Region → Country → People → Context → Prayer
```

Direct search can jump into any step of that journey without replacing the geographic hierarchy.

---

## 2. Search is a first-class destination

Phase 9 introduces:

```text
#/search
```

and a dedicated `SearchPage`.

Search covers four domains in one index:

- people groups;
- atlas regions;
- countries;
- languages.

People results preserve the stable definitive-profile URL:

```text
#/peoples/:PEID
```

Region results use the Phase 7 Natural Earth atlas-region identity. Country and language results continue to their existing canonical routes.

The existing keyboard-accessible quick-search dialog remains available for immediate jumps. It now includes regions and hands off to the full Search destination when the reader wants a broader search experience.

---

## 3. One search model, source-aware destinations

`src/discovery/search.ts` remains a lightweight client-side document index rather than becoming a second mission-data model.

The shared search corpus is assembled from existing runtime sources:

- people: current PeopleGroups/IMB runtime entities;
- regions: Phase 7 Natural Earth region identity;
- countries: current atlas geography, enriched by the existing live country runtime where available;
- languages: current language runtime derived from PeopleGroups records.

Search does not merge incompatible mission assertions, invent a universal people identity or introduce a new external data source.

Exact label matches continue to outrank prefixes and looser text matches. This is search relevance, not mission importance.

---

## 4. Editorial depth is visible but not ranked

People results show either:

- **Reviewed context** — a published editorial profile currently exists; or
- **Source profile** — the definitive profile is currently source-only.

This distinction describes research depth.

**Review depth is not importance.** A reviewed profile is not more spiritually important, more urgent or more worthy of prayer than a source-only profile. The interface states this explicitly anywhere the distinction could otherwise be misread as a ranking.

No search relevance score includes editorial tier.

---

## 5. Peoples becomes a discovery surface

The Phase 0 route contract assigned `#/peoples` to Phase 9. It is rebuilt here around a simpler hierarchy:

1. one primary people search field;
2. two immediate quick filters: all people or current unreached source records;
3. optional **Refine results** disclosure;
4. guided collections when no search/refinement is active;
5. a straightforward live-catalog result grid.

The old visible wall of status, country, language, religion, Bible-resource, population and sorting controls is not preserved as the default experience.

Optional refinement still supports:

- source mission status;
- country;
- language;
- reported religion;
- ordering;
- reviewed editorial depth.

Bible-resource labels and population thresholds are intentionally removed from the ordinary filter surface. Those source facts remain available in definitive profiles and later domain-specific exploration.

---

## 6. Guided collections

Phase 9 introduces three transparent discovery collections.

### Reviewed context

Shows profiles for which reviewed editorial context is currently published.

Selection is alphabetical and exists to expose available research depth. It is not a ranking.

### Across regions

Shows current GSEC 0–3 source records across distinct atlas regions where possible, then distinct countries when more entries are needed.

Selection is deterministic and alphabetic within geographic groups. It uses **no mission-priority score** and no population magnitude ranking.

### Language pathways

Shows current GSEC 0–3 source records with distinct reported primary-language labels.

The goal is to encourage movement between people and language context, not to rank languages or peoples.

Each collection publishes its selection-method note directly in the interface.

---

## 7. What Phase 9 deliberately does not do

Phase 9 does not:

- create an urgency score;
- rank peoples by mission importance;
- turn reviewed coverage into priority;
- merge repeated people names into one universal ethnic identity;
- introduce Joshua Project or another new mission source;
- redesign prayer sessions;
- create personal/custom collections;
- add private notes, prayer history or long-term memory;
- normalize Scripture translation completeness beyond current source labels.

Personal collections and memory belong to Phase 11. Prayer redesign belongs to Phase 10.

---

## 8. Accessibility and mobile behavior

Search and discovery use the Phase 4 Modern Mission Atlas foundation.

The Phase 9 layer preserves:

- semantic headings and landmarks;
- 44px minimum interactive controls;
- visible focus treatment through the canonical accessibility layer;
- keyboard-operable search scope and refinement controls;
- responsive single-column layouts on small screens;
- no required horizontal scrolling at supported mobile widths.

The existing quick-search dialog keeps focus trapping, Escape-to-close and arrow/Enter result navigation.

---

## 9. Source truth

Phase 9 changes no mission calculation or source semantics.

The following remain unchanged:

- PeopleGroups.org / IMB is the 3.0 launch mission source;
- GSEC 0–3 is the source-scoped unreached classification;
- GSEC 4–6 remains a different source status rather than being silently labeled reached;
- missing status remains unknown;
- Natural Earth owns atlas-region geography;
- editorial depth remains independent from mission classification;
- people profile URLs remain source-identity based and stable.

---

## 10. Automated acceptance

Phase 9 adds:

```bash
npm run v3:phase9-check
npm run v3:phase9-discovery-visual
```

Static certification verifies:

- Search is a routed primary surface;
- people, region, country and language domains all exist in unified search;
- source-ID search preserves definitive people URLs;
- atlas-region identity comes from Phase 7 geography;
- reviewed/source depth is labeled without priority semantics;
- guided collections publish transparent methods;
- guided collections do not sort by population magnitude;
- Peoples exposes optional refinement rather than the old default filter wall;
- Phase 9 styles load before the final accessibility layer.

Browser certification verifies:

- full search returns people, region, country and language results from deterministic fixtures;
- direct people results open the definitive profile URL;
- guided collections appear on an unfiltered Peoples page;
- reviewed/source depth labeling is visible;
- refinement is collapsed by default when inactive;
- mobile Search and Peoples do not overflow horizontally.

---

## 11. Phase 10 handoff

**Phase 10 — Prayer 3.0** can now assume that people discovery has one stable endpoint and one clear way into prayer.

Phase 10 should rebuild the prayer experience around:

- one useful daily entry point;
- people-specific prayer focus grounded in the definitive profile;
- reviewed contextual prompts when available;
- source-only prayer without invented cultural claims;
- calm continuity rather than streaks, scores or pressure.
