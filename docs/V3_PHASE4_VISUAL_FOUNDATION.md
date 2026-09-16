# Unreached 3.0 — Phase 4 Visual Foundation Rebuild

**Phase:** 4 — Visual Foundation Rebuild  
**Status:** implementation contract  
**Depends on:** `V3_PHASE3_EDITORIAL_CONTENT_SYSTEM.md`  
**Direction:** **Modern Mission Atlas**

---

## 1. Phase outcome

Phase 4 establishes the canonical visual foundation for Unreached 3.0 without prematurely redesigning production routes.

The new foundation is intentionally isolated behind `v3-*` tokens/classes and the unlinked maintainer route:

```text
#/dev/design-system
```

This phase answers how V3 should look, feel, space, typeset, structure and respond. Phases 5–10 will apply the foundation to the real shell, Explore, geographic hierarchy, people profiles, discovery and prayer.

The current V2 page compositions remain intact in Phase 4 so visual-system work can be verified independently from product-flow rewrites.

---

## 2. Visual character

The V3 visual direction remains **Modern Mission Atlas**, but the implementation is rebuilt as a coherent system rather than another historical CSS layer.

The target character is:

- cartographic;
- editorial;
- modern;
- calm;
- precise;
- human;
- information-rich;
- restrained;
- trustworthy.

The visual benchmark is closer to a serious digital geographic publication than a generic React/SaaS dashboard.

The system should not resemble:

- a beige devotional template;
- a church presentation slide;
- a generic analytics dashboard;
- a collection of floating rounded cards;
- a game interface;
- a social feed;
- a map with decorative mission colors but unclear semantics.

---

## 3. Typography

### Editorial family

**Newsreader Variable** is reserved for:

- brand/editorial identity;
- people and place names;
- major page titles;
- section titles where publication character matters;
- large facts or quotations that benefit from editorial emphasis.

### Interface family

**Source Sans 3 Variable** is used for:

- controls;
- navigation;
- body copy;
- metadata;
- labels;
- filters;
- research/source detail;
- table/list UI.

### Canonical scale

The V3 foundation defines:

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

Large editorial sizes use responsive `clamp()` values so hierarchy survives both wide atlas screens and phones.

Body/prose line-height is deliberately generous enough for long-form contextual reading.

---

## 4. Color system

Phase 4 separates four different responsibilities.

### 4.1 Reading surfaces

```text
canvas
page
raised
muted
inverse
```

The base is a cool neutral atlas paper rather than a strong beige devotional tone.

### 4.2 Product/geographic accents

```text
forest  — product/navigation action
ocean   — geographic/informational action
terrain — place/editorial accent
```

These colors can support navigation and hierarchy.

### 4.3 Mission semantics

```text
frontier
unreached
progress
established
unknown
```

**Mission-status color is semantic, not decorative.**

Unreached orange/red must not become the app's general accent color. A button is not red merely because the product is about unreached peoples.

Status always includes readable text; color is never the sole carrier of meaning.

### 4.4 Focus/error

Keyboard focus and destructive/error semantics have their own colors rather than borrowing mission-status colors.

---

## 5. Shape language

V3 deliberately reduces generic rounded-card styling.

Canonical radii are small:

```text
control: 6px
surface: 10px
overlay: 12px
```

A fully rounded/pill shape is reserved for true compact status labels.

The default hierarchy should come from:

1. typography;
2. spacing;
3. borders/dividers;
4. surface contrast;
5. shadows only when elevation is genuinely meaningful.

This is why most editorial content remains unboxed.

---

## 6. The four surface roles

The visual system defines exactly **four surface roles**.

### Page

Default content canvas. Usually no border, shadow or artificial card boundary.

### Editorial

Bounded publication content when a contained reading object is useful.

### Utility

Filters, metadata, research controls, quiet supporting information.

### Overlay

Dialogs, menus, sheets, floating map context and other temporary elevated layers.

Feature phases should use these roles before inventing a new surface type.

---

## 7. Layout foundation

Canonical dimensions:

```text
maximum content width: 1480px
reading width:         760px
secondary rail:        320px
minimum control:       44px
```

Spacing remains based on a 4px-derived scale.

Reusable layout primitives include:

- page frame;
- reading measure;
- stacks;
- flexible clusters;
- 2/3/4-column grids;
- article + rail split;
- section dividers;
- sticky desktop metadata rail.

Editorial pages are designed to support a wide atlas/publication composition without forcing prose to span the entire screen.

---

## 8. Controls

All normal interactive controls target at least **44×44 CSS px**.

The foundation defines:

- primary button;
- secondary button;
- quiet button;
- icon button;
- text input;
- select;
- field label;
- segmented control.

Interaction rules:

- keyboard focus is always visible;
- hover is enhancement only;
- active states remain restrained;
- controls do not bounce or use gratuitous motion;
- reduced-motion users retain all functionality;
- compact visual density never reduces target size below the accessibility contract.

---

## 9. Editorial primitives

The V3 atlas needs editorial composition as a first-class visual capability.

Phase 4 defines primitives for:

- profile masthead;
- editorial section hierarchy;
- readable prose;
- essential-facts strip;
- metadata/research rail;
- source note;
- mission-status labels.

These primitives are intentionally compatible with the Phase 3 editorial schema:

```text
meaning → evidence → context → prayer → research
```

The visual system therefore does not assume that a people profile is primarily a collection of statistical cards.

---

## 10. Cartographic primitives

Phase 4 does not rebuild Explore; Phase 6 owns that.

It does establish the visual grammar that Explore will use:

- the map owns most of the workspace;
- control rails are compact;
- legends carry text as well as color;
- map overlays use the overlay surface role;
- geographic labels are quiet and legible;
- mission color stays semantic;
- mobile layouts move supporting controls below/over the map rather than preserving a desktop sidebar.

The design-system map is an abstract composition preview, not mission data.

---

## 11. Responsive behavior

### Wide desktop

Editorial layout may use a main reading column plus a sticky research/context rail.

Map composition may use a compact left rail plus a dominant map stage.

### Tablet/narrow desktop

Secondary rails collapse into the normal document flow.

The map rail moves below the map.

### Mobile

- one primary reading column;
- no persistent desktop-style sidebar;
- no horizontal page scrolling;
- fact strips stack cleanly;
- typography scales fluidly;
- map stage remains useful before supporting controls;
- control targets remain at least 44×44.

---

## 12. CSS architecture

Phase 4 adds a namespaced V3 foundation:

```text
src/styles/v3/
  tokens.css
  typography.css
  layout.css
  components.css
  atlas.css
  responsive.css
```

The V3 classes intentionally use a `v3-` prefix during migration.

This does two things:

1. proves the new system without destabilizing every existing route at once;
2. makes later migration explicit rather than allowing old and new design rules to merge silently.

The existing Phase 15 CSS architecture gate remains active. All V3 stylesheets are loaded in the certified application cascade and the accessibility layer remains last.

---

## 13. Maintainer reference route

Phase 4 adds:

```text
#/dev/design-system
```

It is intentionally absent from normal navigation.

The page demonstrates:

- typography hierarchy;
- product/geographic color roles;
- mission semantic colors;
- the four surface roles;
- buttons, fields and segmented controls;
- editorial profile composition;
- facts and source notes;
- map workspace composition;
- desktop/mobile behavior.

The route is a visual QA/reference surface, not a user-facing feature.

---

## 14. Automated acceptance

Phase 4 adds:

```bash
npm run v3:phase4-check
```

The static gate verifies:

- all canonical V3 foundation files exist;
- required typography/layout/surface/control/map primitives exist;
- the 44px control contract exists;
- mission semantic tokens exist;
- all V3 CSS files are imported;
- the design-system route exists;
- production pages do not start migrating early;
- Phase 4 remains foundation work rather than an accidental route redesign.

Browser acceptance additionally checks desktop and Pixel-class mobile rendering for:

- no horizontal overflow;
- correct bundled font families;
- 44px control targets;
- visible keyboard focus;
- map workspace fitting the viewport;
- deterministic visual evidence screenshots.

---

## 15. What Phase 4 deliberately does not do

Phase 4 **does not redesign production routes**.

It does not yet replace:

- the current app shell/navigation;
- Explore composition;
- country pages;
- people pages;
- Pray;
- Saved;
- About;
- existing route-specific CSS.

It also does not delete the older styles yet. Removing them before their owning screens are migrated would create unnecessary regression risk.

This phase creates the replacement system first.

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

**Phase 5 — Shell, Navigation & Information Architecture** should be the first production surface to consume the new V3 foundation.

Phase 5 should:

1. migrate the global shell to V3 tokens and primitives;
2. simplify primary navigation to the V3 information architecture;
3. demote editorial/research administration from normal navigation;
4. preserve accessibility/search/preload behavior while replacing its visual composition;
5. establish the final global shell that later phases inherit.

Phase 5 should not invent a parallel design language. It should consume Phase 4.
