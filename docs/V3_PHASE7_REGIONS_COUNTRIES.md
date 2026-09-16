# Unreached 3.0 — Phase 7 Regions & Countries

**Phase:** 7 — Regions & Countries  
**Status:** implementation contract  
**Depends on:** Phase 6 Explore 3.0

---

## 1. Phase outcome

Phase 7 establishes the geographic learning journey:

```text
World → Region → Country → People
```

The world map remains the main discovery surface. Regions and countries now provide a durable geographic path between the world view and the definitive people profile planned for Phase 8.

The phase does not introduce a new mission source or a new mission metric.

---

## 2. Canonical region identity

The first V3 atlas-region taxonomy is intentionally conservative.

A **region** is the Natural Earth continent value attached to a navigable Admin-0 country/area feature. Current examples include Africa, Asia, Europe, North America, South America, Oceania, and Antarctica.

The route ID is a stable product slug derived from that geography label, for example:

```text
Africa        → #/regions/africa
North America → #/regions/north-america
```

This choice is deliberately different from promoting a mission provider's free-text geography into universal product identity.

### Important boundary

PeopleGroups region/subregion labels such as `Regn` and `RegnSub` remain **source context**. They may appear as provider-supplied supporting information on a country page, but they do not define the canonical V3 region graph.

This preserves the Phase 2 rule that product geography must not silently inherit a provider taxonomy.

---

## 3. Region model

`src/geography/regions.ts` owns the geographic grouping.

Each `AtlasRegionSummary` contains:

- stable region ID;
- display name;
- navigable countries/areas;
- country count;
- count of countries with current mission-source summaries;
- represented people-group count;
- unreached people-group count;
- known represented population;
- represented unreached population.

Geographic membership is Natural Earth-derived. Mission totals are current PeopleGroups.org / IMB country-context aggregates layered over those countries.

Missing mission data remains missing. A country with no mission summary still remains a valid geographic country in its region.

---

## 4. Regions index

`#/regions` is now a first-class atlas route.

The page answers:

1. What broad parts of the world can I explore?
2. How many navigable countries/areas are in each region?
3. How much current mission-source context is represented there?
4. Where do I go next?

It does not rank regions by urgency, spiritual value, or mission importance.

---

## 5. Region detail

`#/regions/:region` continues directly into countries.

A region page contains:

- geographic identity;
- country/area count;
- mission-source coverage count;
- represented people-group count;
- known represented population;
- an alphabetical country directory;
- each country's current default-map result where available;
- direct country links.

Country ordering is alphabetical rather than an implied mission-priority ranking.

---

## 6. Country directory

`#/countries` is rebuilt as a region-first atlas directory.

The page begins with region navigation before the full country search.

Users can therefore either follow:

```text
World → Africa → Benin
```

or jump directly through country search when they already know the place they want.

Country search understands country name, code, and canonical region.

---

## 7. Country detail

Country detail remains content-rich but now clearly sits inside the geographic hierarchy.

The breadcrumb becomes:

```text
World → Region → Country
```

The page keeps the comprehension-first country contract:

1. country identity;
2. three understandable mission/source facts;
3. people before technical tables;
4. largest represented unreached peoples;
5. language/religion/resource context;
6. prayer and map continuations;
7. detailed provider/source research behind disclosure.

The people section explicitly completes the next geographic step:

```text
Country → People
```

Phase 8 owns the destination profile itself.

---

## 8. Mission semantics

Phase 7 does not alter any Phase 1–6 mission calculation.

The default country map value remains:

- PeopleGroups.org / IMB source semantics;
- GSEC 0–3 classified as unreached;
- population weighted across source country-context records with known population and mission status;
- not national census population;
- not Joshua Project country unreached-population percentage.

Region totals are sums of the same current source-scoped country summaries. They are not new independent mission estimates.

---

## 9. Country source boundary

The Phase 7 pages no longer import PeopleGroups provider modules directly.

`src/countries/live.ts` exposes a transitional atlas-facing boundary:

- `useAtlasCountryExplorer`;
- `AtlasCountryRuntimeRecord`;
- `ATLAS_COUNTRY_SOURCE`.

This does not pretend the legacy runtime record has already become a multi-source normalized country entity. It simply keeps provider imports behind the country module while the 3.0 launch remains PeopleGroups/IMB-first.

Later multi-source work can replace this adapter without rewriting region/country route components.

---

## 10. Visual system

Phase 7 adds:

```text
src/styles/atlas-foundation/geography.css
```

The geographic surfaces use the established Phase 4 system:

- publication-led typography;
- atlas paper surfaces;
- restrained borders;
- minimal elevation;
- semantic forest/ocean accents;
- 44px interaction targets;
- responsive single-column mobile layouts;
- visible focus;
- reduced-motion compatibility.

The page migration allowlist now includes Explore plus the four Phase 7 region/country pages. Unowned production pages remain protected from accidental V3 class leakage.

---

## 11. Accessibility and fallback behavior

The hierarchy remains usable without map interaction.

Users can navigate entirely through links:

```text
Regions → Region → Country → People
```

The pages preserve:

- one application main landmark;
- keyboard-accessible links and disclosures;
- readable mobile controls;
- no page-level horizontal overflow;
- geographic content even when current mission data is unavailable.

---

## 12. Automated acceptance

Phase 7 adds:

```bash
npm run v3:phase7-check
npm run v3:phase7-geography-visual
```

Static acceptance verifies:

- Natural Earth owns canonical region identity;
- PeopleGroups region text is not used as canonical geography;
- region routes are registered;
- region and country pages do not directly import the PeopleGroups provider module;
- country source access goes through the country boundary;
- country directory starts with regions;
- country breadcrumb is World → Region → Country;
- country continues into people;
- Phase 7 stylesheet ownership and migration allowlist are explicit.

Browser acceptance verifies:

- region-first country discovery;
- Africa region → Benin country continuity;
- World → Africa → Benin breadcrumb;
- Benin → represented people profile continuity;
- mobile region/country pages remain within the viewport;
- deterministic desktop/mobile screenshots are produced.

---

## 13. Non-goals

Phase 7 does not add:

- subnational geography;
- diaspora maps;
- provider crosswalks;
- cross-source region reconciliation;
- regional mission-priority rankings;
- regional editorial essays;
- new map formulas;
- definitive people-profile redesign.

Those belong to later phases.

---

## 14. Phase 7 acceptance criteria

- [x] `#/regions` exists;
- [x] `#/regions/:region` exists;
- [x] canonical region identity is geography-owned;
- [x] PeopleGroups region/subregion labels remain source-scoped;
- [x] Countries starts with region discovery;
- [x] Region pages continue directly into countries;
- [x] Country breadcrumb expresses World → Region → Country;
- [x] Country page continues into represented people;
- [x] region/country pages use the V3 visual foundation;
- [x] route components avoid direct PeopleGroups provider imports;
- [x] source semantics and calculations are unchanged;
- [x] mobile and keyboard routes remain usable;
- [x] automated static/browser gates exist.

---

## 15. Phase 8 handoff

**Phase 8 — Definitive People Profile** now receives a stable geographic context:

```text
World
  ↓
Region
  ↓
Country
  ↓
People
```

The people profile should preserve that context while becoming the definitive human-centered destination for identity, culture/history, language, religion/community, geographic context, source-defined gospel access, Scripture/resource context, reviewed editorial evidence, prayer, and research provenance.

Phase 8 should not reopen region identity or the global geographic hierarchy unless a correctness defect is found.
