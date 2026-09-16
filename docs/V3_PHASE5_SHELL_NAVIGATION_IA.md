# Unreached 3.0 — Phase 5 Shell, Navigation & Information Architecture

**Phase:** 5 — Shell, Navigation & Information Architecture  
**Status:** implementation contract  
**Depends on:** `V3_PHASE4_VISUAL_FOUNDATION.md`

---

## 1. Phase outcome

Phase 5 is the first production-facing migration onto the Unreached 3.0 visual foundation.

It replaces the global application chrome and navigation hierarchy without redesigning the individual product routes yet.

The shell must make the product structure understandable before a user learns any provider or research terminology.

The public hierarchy is:

```text
Primary
  Explore
  Peoples
  Pray

Direct utilities
  Search
  Saved
  More

More
  Explore more
    Countries
    Languages
  Reference
    Sources & methodology
  Personal
    Account & sync
```

On mobile, `Saved` becomes a direct bottom-navigation destination:

```text
Explore · Peoples · Pray · Saved · More
```

---

## 2. Primary-navigation rule

The primary navigation contains exactly three product destinations:

1. **Explore** — geographic discovery;
2. **Peoples** — direct people-group discovery;
3. **Pray** — the prayer practice.

These are the three product actions that should be visible without opening a menu.

Countries and Languages remain important atlas structures, but they are supporting discovery dimensions rather than peers to the three primary product modes.

---

## 3. Search and Saved

Search remains globally available in the header and through:

```text
/
Ctrl+K
Cmd+K
```

Saved is promoted from the old `My lists` utility wording in navigation to the shorter public label **Saved**. The destination page may continue to use the descriptive title **My lists** until Phase 11 redesigns personal continuity.

Saved is not duplicated inside More.

---

## 4. More navigation

The More menu is supporting information architecture rather than a second primary-navigation bar.

It contains:

### Explore more

- Countries
- Languages

### Reference

- Sources & methodology

### Personal

- Account & sync

The menu supports:

- pointer interaction;
- Arrow Down / Arrow Up opening from the trigger;
- Arrow Up / Arrow Down movement through links;
- Home / End movement;
- Escape close with focus return;
- outside-click close on desktop;
- focus trapping and body-scroll locking in the mobile sheet.

---

## 5. Reviewed Coverage is demoted

`#/coverage` remains a valid route because the editorial/research infrastructure still uses it.

However, **Reviewed Coverage is no longer part of normal user navigation**.

It is editorial/data-quality tooling and should not compete with normal atlas destinations.

This is an information-architecture change, not route deletion.

---

## 6. Account and sync are secondary

Account/private-sync controls remain available, but they are moved out of permanent header chrome and into More → Personal.

This keeps optional infrastructure from competing visually with the core product loop.

Private sync behavior itself is unchanged.

---

## 7. Data status is exceptional-state UI

The shell no longer spends permanent header space telling users that healthy data is healthy.

Normal states are visually suppressed:

- idle;
- live;
- fresh cache;
- ordinary refresh in progress.

The header surfaces data status only when it materially changes what the user should understand:

- offline with no cache;
- stale data;
- offline with previously loaded data;
- provider/data unavailable.

This preserves transparency without turning normal engineering state into constant product chrome.

---

## 8. V3 shell visual migration

Phase 5 consumes Phase 4 rather than creating another design language.

The shell uses:

- V3 atlas paper surfaces;
- Newsreader brand identity;
- Source Sans 3 navigation and controls;
- restrained rectangular controls;
- V3 focus treatment;
- V3 overlay/menu surfaces;
- 44px minimum targets;
- semantic forest action emphasis rather than mission-status red/orange.

The shell stylesheet lives at:

```text
src/styles/atlas-foundation/shell.css
```

It intentionally loads after the Phase 4 responsive foundation and before the canonical accessibility layer.

---

## 9. Responsive shell

### Desktop

```text
brand | Explore Peoples Pray | Search Saved More
```

The content is centered inside the 1480px atlas frame.

### Tablet / narrow desktop

Primary navigation remains available. Utility labels collapse to icons before the primary product hierarchy disappears.

### Mobile

The top bar contains brand + Search, with exceptional data status when needed.

The fixed bottom navigation is:

```text
Explore | Peoples | Pray | Saved | More
```

More opens a modal bottom sheet rather than exposing a desktop dropdown or persistent sidebar.

---

## 10. Preserved behavior

Phase 5 deliberately preserves:

- hash routing;
- route preloading;
- direct deep links;
- search keyboard shortcuts;
- search dialog behavior;
- skip navigation;
- route-focus behavior;
- Saved storage behavior;
- account/private-sync behavior;
- offline runtime;
- PeopleGroups runtime;
- all existing route URLs.

No source semantics, mission calculations, or route content are changed.

---

## 11. Automated acceptance

Phase 5 adds:

```bash
npm run v3:phase5-check
npm run v3:phase5-shell-visual
```

Static certification verifies:

- Explore / Peoples / Pray are the only primary destinations;
- Saved is direct;
- Countries / Languages / Sources / Account live inside More;
- Reviewed Coverage is absent from normal navigation;
- Account is not permanent header chrome;
- mobile has five direct bottom-navigation positions;
- the V3 shell stylesheet is loaded before the final accessibility layer;
- healthy data states are visually suppressed;
- legacy navigation certification has been reconciled with the V3 hierarchy.

Browser certification verifies:

- desktop shell hierarchy;
- tablet primary-navigation continuity;
- mobile five-item bottom navigation;
- More menu/sheet keyboard and focus behavior;
- Saved active state;
- no normal-navigation link to Reviewed Coverage;
- no horizontal shell overflow;
- deterministic desktop/mobile visual evidence.

---

## 12. Non-goals

Phase 5 does **not** redesign:

- Explore content or map controls;
- Countries or country detail content;
- Peoples explorer;
- people profile article structure;
- Search result design;
- Pray content;
- Saved page content;
- Account page content;
- About/source content.

Those routes continue to render inside the new global shell until their owning V3 phases migrate them.

---

## 13. Phase 5 acceptance criteria

- [x] production shell consumes the Phase 4 visual foundation;
- [x] primary navigation is limited to Explore / Peoples / Pray;
- [x] Search and Saved remain direct utilities;
- [x] More contains Countries / Languages / Sources & methodology / Account & sync;
- [x] Reviewed Coverage is removed from normal navigation;
- [x] Account is demoted from permanent header chrome;
- [x] mobile navigation is Explore / Peoples / Pray / Saved / More;
- [x] keyboard disclosure/focus contracts are preserved;
- [x] healthy data status is removed from permanent visual chrome;
- [x] tablet navigation does not disappear;
- [x] 44px target and reduced-motion contracts remain intact;
- [x] static and browser acceptance gates exist;
- [x] route URLs and route content remain unchanged.

---

## 14. Phase 6 handoff

**Phase 6 — Explore 3.0** is now the next production migration.

It should inherit the Phase 5 shell unchanged and rebuild the world-discovery surface around the Phase 4 cartographic primitives:

1. map dominates the viewport;
2. one clear default mission view;
3. simple legend and search;
4. country selection gives a few human-readable facts and major peoples;
5. methodology remains available but secondary;
6. mobile uses a map-first bottom-sheet composition;
7. research layers move behind a secondary control.

Phase 6 should not reopen the global information architecture unless real usability evidence demonstrates a problem.
