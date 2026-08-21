# Unreached — Design System

**Phase:** U1  
**Direction:** **Modern Mission Atlas**

## 1. Design principle

Unreached should resemble an editorial geographic publication and serious atlas, not a generic SaaS dashboard, chat interface, beige devotional template, church slide deck, or collection of floating rounded cards.

Maps and information hierarchy are the visual identity.

## 2. Visual character

Cartographic, editorial, calm, precise, human, information-rich, restrained, trustworthy.

The interface must comfortably support both a world map and a thoughtful people-group essay.

## 3. Typography

### Newsreader Variable — editorial

Use for brand, people names, country names, major titles, prayer introductions, and editorial emphasis.

### Source Sans 3 Variable — interface

Use for navigation, controls, statistics, filters, metadata, tables, source labels, and body text.

Both fonts are bundled locally. No runtime Google Fonts request is required.

## 4. Palette

### Paper

- `paper-0` — primary reading surface
- `paper-1` — page/map frame background
- `paper-2` — secondary structural fill

### Ink

- `ink-0` — primary type
- `ink-1` — body/secondary type
- `ink-2` — metadata/muted labels

### Geography

- ocean — informational/geographic actions
- forest — primary navigation/product accent
- sand — geographic/limited-progress accent

### Mission status

Mission-status colors are semantic, not decorative:

- frontier — deep red
- unreached — orange-red
- progress — gold
- established — green

## 5. Shape language

Large rounded surfaces are deliberately limited. Most panels are square or subtly rounded; borders define information regions; pills are reserved for compact status labels; map controls use small utilitarian radii.

## 6. Layout

### Desktop map

```text
header
──────────────────────────────
context/control rail | map
                     |
```

The map owns most of the viewport.

### Desktop editorial

```text
editorial content       metadata / related rail
```

### Mobile map

```text
header
────────────
map
map
map
────────────
bottom sheet
────────────
bottom navigation
```

No persistent desktop-style sidebar on mobile.

## 7. Spacing

Use the tokenized 4px-derived scale: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`.

## 8. Interaction

- minimum target: 44×44 CSS px;
- default transition: 120ms;
- larger state changes: 220ms;
- `prefers-reduced-motion` must preserve functionality;
- hover enhances but never exclusively reveals information;
- disabled foundation controls clearly indicate future data phases.

## 9. Data presentation

Statistics must be labeled, sourceable, and explicitly approximate where appropriate. U1 displays no fake mission statistics. Status chips always contain text rather than relying on color alone.

## 10. Map principles for U3/U4

- quiet base geography;
- mission data carries emphasis;
- legends remain accessible;
- disputed boundaries are handled deliberately;
- color scales must remain distinguishable without perfect color vision;
- list alternatives expose the same content.

## 11. Accessibility

Preserve high text contrast, visible keyboard focus, semantic text alongside color, readable line lengths, responsive text without forced zoom, no horizontal page scrolling, 44px minimum targets, and unambiguous selected states.

## 12. U1 component baseline

- site header;
- desktop navigation;
- mobile navigation;
- brand mark;
- icon action;
- status chip;
- editorial heading;
- planned-capability rail;
- map control rail;
- segmented control;
- filter row;
- map workspace shell;
- mobile sheet affordance;
- not-found state.

Future components should reuse tokens before inventing new values.
