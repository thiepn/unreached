# Unreached — Global Map Architecture

**Phase:** U3 — Global Map Foundation  
**Status:** production foundation

## Purpose

U3 provides geographic navigation only. Mission choropleths, gospel-access scales, religion layers, Scripture layers, and frontier overlays belong to U4.

The map must remain useful as a browser interface even when WebGL is unavailable. The geographic list and map are therefore two views over the same local GeoJSON rather than separate products.

## Runtime architecture

```text
Natural Earth v5.1.1
        ↓ build time
source-policy check
        ↓
property stripping + normalization
        ↓
public/maps/world-countries.geojson
        ↓
Vite build / GitHub Pages
        ↓
useWorldGeography()
      ↙           ↘
MapLibre map    searchable area list
```

There are no runtime requests to Natural Earth, Mapbox, Google Maps, or an external tile server. MapLibre renders the locally generated GeoJSON over a plain application-owned background.

## Source

- Source: Natural Earth
- Dataset: Admin 0 – Countries
- Scale: 1:110m
- Pinned version: 5.1.1
- Project source id: `natural-earth`
- Public-domain source; use is still checked through the U2 source registry

The generated browser file is deliberately not committed. `npm run geography:build` downloads the pinned source, validates the source policy, strips unused attributes, and writes the compact local artifact.

## Preserved map properties

Each feature keeps only:

- stable `mapKey`
- ISO A3 when available
- Natural Earth Admin-0 A3 when available
- English display name
- Natural Earth area/type label
- boundary note when supplied
- sovereignty label when supplied
- continent
- Polygon/MultiPolygon geometry

The map does not import Natural Earth population or economic statistics. Mission/population data comes through the U2 domain pipeline instead.

## Stable map keys

Map keys prefer:

1. valid ISO A3;
2. valid Natural Earth `ADM0_A3`;
3. Natural Earth feature id fallback.

Duplicate fallback keys are disambiguated during generation. Map keys are geographic identifiers, not the canonical mission-data IDs defined in U2. U4/U5 will own the explicit join layer between geography and mission records.

## Boundary policy

Natural Earth states that its default Admin-0 presentation is **de facto**, according to control rather than de jure claims. Unreached therefore:

- displays this fact in the Explore UI;
- retains relevant Natural Earth break/boundary notes;
- does not describe map selection as recognition of sovereignty;
- does not silently redraw disputed boundaries in U3.

Any future alternative boundary viewpoints require an explicit documented source and UI disclosure.

## Map behavior

The map supports:

- mouse/touch pan and zoom;
- keyboard map navigation supplied by MapLibre;
- hover feedback;
- click/tap area selection;
- selected-area highlighting;
- fit-to-selected-area;
- reset-to-world view;
- bounded world extent;
- disabled world copies;
- reduced-motion-aware camera transitions.

## URL state

Map state lives inside the existing hash route:

```text
#/explore?country=TUR&view=35.100,39.000,3.20
```

Supported parameters:

- `country`: stable map key
- `view`: longitude, latitude, zoom

The router ignores the query component when resolving the page. Map camera updates use `history.replaceState` so ordinary panning does not flood browser history.

## Accessibility

The visual map is not the only path to geographic content.

Desktop and mobile both expose a searchable list generated from the same features. Area buttons select and focus the same map state. If MapLibre cannot initialize or reports a rendering problem, the list remains available.

Other foundations:

- 44px minimum interactive controls;
- visible keyboard focus;
- textual selected-area metadata;
- map has an accessible interaction label;
- no information is communicated solely by hover or color.

## Responsive ownership

Desktop:

- left rail owns search, selection details, and accessible area list;
- map owns geographic navigation;
- rail and map have independent scroll/interaction ownership.

Mobile:

- map receives the primary viewport;
- an expandable bottom sheet owns search/list/selection;
- the persistent site bottom navigation remains outside the map.

## Performance policy

U3 intentionally uses the 1:110m Natural Earth dataset. The build strips the source's large attribute set before delivery, and the map renders no labels, raster tiles, terrain, 3D, or mission overlays yet.

U4 must add mission visualization without replacing this geographic source or introducing thousands of DOM map markers.
