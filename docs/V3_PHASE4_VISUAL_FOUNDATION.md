# Unreached 3.0 — Phase 4 Visual Foundation Rebuild

**Phase:** 4 — Visual Foundation Rebuild  
**Status:** implementation contract  
**Depends on:** `V3_PHASE3_EDITORIAL_CONTENT_SYSTEM.md`  
**Direction:** **Modern Mission Atlas**

---

## 1. Phase outcome

Phase 4 establishes the canonical visual foundation for Unreached 3.0 without prematurely redesigning production routes.

The new foundation is isolated behind `v3-*` tokens/classes and the unlinked maintainer route:

```text
#/dev/design-system
```

This phase defines how V3 should look, feel, space, typeset, structure and respond. Phases 5–10 apply that foundation to the actual shell, Explore, geography, people profiles, discovery and prayer.

The current V2 page compositions remain intact so the new visual system can be verified independently from product-flow rewrites.

---

## 2. Visual character

The V3 direction is **Modern Mission Atlas**: cartographic, editorial, modern, calm, precise, human, information-rich, restrained and trustworthy.

The benchmark is a serious digital geographic publication rather than a generic React/SaaS dashboard. The system should not resemble a beige devotional template, church presentation slide, social feed, game interface, collection of floating rounded cards, or map whose mission colors are decorative rather than meaningful.

---

## 3. Typography

### Editorial family

**Newsreader Variable** is reserved for brand/editorial identity, people and place names, major page titles, publication-oriented section titles, and selected large facts.

### Interface family

**Source Sans 3 Variable** is used for controls, navigation, body copy, metadata, labels, filters, research/source detail and table/list UI.

The canonical responsive scale is:

```text
display-xl
display-lg
heading-xl
heading-lg
heading-md
body-lg
body
body-sm
meta
label
prose
```

Editorial sizes use responsive `clamp()` values. Prose keeps a generous line height and controlled reading measure for sustained contextual reading.

---

## 4. Color system

Phase 4 separates four responsibilities.

### Reading surfaces

```text
canvas
page
raised
muted
inverse
```

The base is a cool neutral atlas paper rather than a strong beige devotional tone.

### Product/geographic accents

```text
forest  — product/navigation action
ocean   — geographic/informational action
terrain — place/editorial accent
```

### Mission semantics

```text
frontier
unreached
progress
established
unknown
```

**Mission-status color is semantic, not decorative.** Unreached orange/red is not the product's generic accent color. Status always includes readable text; color is never the sole carrier of meaning.

### Focus/error

Keyboard focus and destructive/error semantics have separate colors rather than borrowing mission-status colors.

---

## 5. Shape language

V3 deliberately reduces generic rounded-card styling.

```text
control: 6px
surface: 10px
overlay: 12px
```

A fully rounded/pill shape is reserved for true compact status labels.

Hierarchy should come from typography, spacing, borders/dividers and surface contrast before shadows. Most editorial content therefore remains unboxed.

---

## 6. The four surface roles

The visual system defines exactly **four surface roles**:

1. **Page** — default content canvas, normally without artificial card boundaries.
2. **Editorial** — bounded publication content when a contained reading object is useful.
3. **Utility** — filters, metadata, research controls and quiet supporting information.
4. **Overlay** — dialogs, menus, sheets and temporary map context.

Feature phases should use these four surface roles before inventing another one.

---

## 7. Layout foundation

Canonical dimensions:

```text
maximum content width: 1480px
reading width:         760px
secondary rail:        320px
minimum control:       44px
```

Spacing follows a 4px-derived scale. Reusable layout primitives include page frame, reading measure, stacks, flexible clusters, 2/3/4-column grids, article + rail split, section dividers and a sticky desktop metadata rail.

Editorial pages can therefore use a wide atlas/publication composition without forcing prose across the full viewport.

---

## 8. Controls

All normal interactive controls target at least **44×44 CSS px**.

The foundation defines primary, secondary and quiet buttons; icon buttons; text input; select; field label; and segmented control.

Interaction rules:

- keyboard focus is always visible;
- hover is enhancement only;
- active states remain restrained;
- controls do not bounce or use gratuitous motion;
- reduced-motion users retain all functionality;
- compact visual density never reduces the accessibility target size.

---

## 9. Editorial primitives

Phase 4 defines first-class publication primitives for profile masthead, editorial section hierarchy, readable prose, essential-facts strip, metadata/research rail, source note and mission-status labels.

These primitives are compatible with the Phase 3 editorial sequence:

```text
meaning → evidence → context → prayer → research
```

The system does not assume that a people profile is primarily a collection of statistical cards.

---

## 10. Cartographic primitives

Phase 4 does not rebuild Explore; Phase 6 owns that. It establishes the visual grammar Explore will later consume:

- the map owns most of the workspace;
- control rails stay compact;
- legends carry text as well as color;
- map overlays use the overlay surface role;
- geographic labels are quiet and legible;
- mission color stays semantic;
- mobile supporting controls move below/over the map rather than preserving a desktop sidebar.

The design-system map is an abstract composition preview, not mission data.

---

## 11. Responsive behavior

### Wide desktop

Editorial layouts may use a main reading column plus sticky research/context rail. Map compositions may use a compact rail plus dominant map stage.

### Tablet/narrow desktop

Secondary rails collapse into normal document flow and the map rail moves below the map.

### Mobile

- one primary reading column;
- no persistent desktop-style sidebar;
- no horizontal page scrolling;
- fact strips stack cleanly;
- typography scales fluidly;
- the map remains useful before supporting controls;
- control targets stay at least 44×44.

---

## 12. CSS architecture

Phase 4 adds the semantic foundation directory:

```text
src/styles/atlas-foundation/
  tokens.css
  typography.css
  layout.css
  components.css
  atlas.css
  responsive.css
```

The directory name is intentionally semantic rather than release-numbered. The existing CSS architecture gate rejects update/version-number stylesheet paths, so the foundation does not weaken that protection merely to call the directory `v3`.

The classes and custom properties retain a `v3-` prefix during migration. That namespace makes adoption explicit while later production screens are moved one by one.

This approach does two things:

1. proves the replacement system without destabilizing every existing route at once;
2. prevents old and new design rules from blending silently during migration.

All atlas-foundation stylesheets are loaded in the certified application cascade and the shared accessibility layer remains last.

---

## 13. Maintainer reference route

Phase 4 adds:

```text
#/dev/design-system
```

It is intentionally absent from normal navigation. The page demonstrates typography, product/geographic color roles, mission semantic colors, the four surface roles, controls, editorial profile composition, facts/source notes, map-workspace composition and desktop/mobile behavior.

The route is a visual QA/reference surface, not a user-facing feature.

---

## 14. Automated acceptance

Phase 4 adds:

```bash
npm run v3:phase4-check
npm run v3:phase4-visual
```

The static gate verifies that canonical foundation files exist; typography/layout/surface/control/map primitives exist; the 44px contract and mission semantic tokens exist; all foundation CSS is imported; the design-system route exists; and production pages have not started migrating early.

Browser acceptance checks desktop and Pixel-class mobile rendering for no horizontal overflow, correct bundled font families, 44px controls, visible keyboard focus, map workspace sizing and deterministic screenshot evidence.

---

## 15. What Phase 4 deliberately does not do

Phase 4 **does not redesign production routes**.

It does not yet replace the current app shell/navigation, Explore composition, country pages, people pages, Pray, Saved, About, or existing route-specific CSS.

The older styles are not deleted before their owning screens migrate. Phase 4 creates the replacement system first.

---

## 16. Phase 4 acceptance criteria

Phase 4 is complete when:

- [x] a coherent namespaced V3 token system exists;
- [x] editorial and interface type scales are defined;
- [x] page/reading/rail/grid layout primitives exist;
- [x] the four surface roles are implemented;
- [x] canonical controls satisfy the 44×44 target contract;
- [x] mission semantic colors are separate from product accents;
- [x] editorial profile primitives exist;
- [x] cartographic workspace primitives exist;
- [x] desktop/tablet/mobile behaviors are defined;
- [x] reduced-motion behavior is preserved;
- [x] the unlinked reference route demonstrates the full foundation;
- [x] static and browser acceptance gates validate the system;
- [x] production route migration is explicitly deferred.

---

## 17. Phase 5 handoff

**Phase 5 — Shell, Navigation & Information Architecture** is the first production surface that should consume the new foundation.

Phase 5 should migrate the global shell to these tokens/primitives; simplify primary navigation to the V3 information architecture; demote editorial/research administration from normal navigation; preserve accessibility/search/preload behavior; and establish the final global shell inherited by later phases.

Phase 5 should not invent a parallel design language. It should consume Phase 4.
