import {
  ChevronRight,
  Filter,
  Layers3,
  LocateFixed,
  SlidersHorizontal
} from "lucide-preact";

import { StatusChip } from "../components/StatusChip";

export function ExplorePage() {
  return (
    <section class="explore-screen" aria-labelledby="explore-title">
      <aside class="explore-panel" aria-label="Map controls">
        <div class="eyebrow">Global Mission Atlas</div>
        <h1 id="explore-title" class="display-title">
          Explore the peoples.
        </h1>
        <p class="lead">
          The map foundation is ready for the verified geographic and mission
          datasets introduced in U2–U4.
        </p>

        <div class="control-group">
          <div class="control-group__heading">
            <Layers3 size={16} aria-hidden="true" />
            <span>Map layer</span>
          </div>
          <div class="segmented-control" aria-label="Map layer preview">
            <button type="button" class="is-selected">Unreached</button>
            <button type="button" disabled>Religion</button>
            <button type="button" disabled>Scripture</button>
          </div>
        </div>

        <div class="control-group">
          <div class="control-group__heading">
            <Filter size={16} aria-hidden="true" />
            <span>Filters</span>
          </div>
          <button type="button" class="filter-row" disabled>
            <span>Region</span><span>All regions</span><ChevronRight size={16} aria-hidden="true" />
          </button>
          <button type="button" class="filter-row" disabled>
            <span>Religion</span><span>All</span><ChevronRight size={16} aria-hidden="true" />
          </button>
          <button type="button" class="filter-row" disabled>
            <span>Population</span><span>Any size</span><ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>

        <div class="foundation-note">
          <StatusChip tone="info">U1 foundation</StatusChip>
          <p>
            Controls are intentionally non-data-bearing until the normalized
            dataset exists. No placeholder mission statistics are shown.
          </p>
        </div>
      </aside>

      <div class="map-stage" aria-label="Map workspace foundation">
        <div class="map-stage__toolbar">
          <button type="button" class="map-tool" disabled aria-label="Locate me">
            <LocateFixed size={18} aria-hidden="true" />
          </button>
          <button type="button" class="map-tool" disabled aria-label="Map filters">
            <SlidersHorizontal size={18} aria-hidden="true" />
          </button>
        </div>

        <div class="map-foundation" role="img" aria-label="Map engine placeholder">
          <div class="map-foundation__grid" aria-hidden="true" />
          <div class="map-foundation__label">
            <span class="map-foundation__kicker">Cartographic workspace</span>
            <strong>Global map engine arrives in U3</strong>
            <span>
              Natural Earth geometry and mission layers will replace this
              foundation without changing the page architecture.
            </span>
          </div>
        </div>

        <button class="mobile-sheet-handle" type="button" disabled>
          <span>Explore controls</span>
          <span aria-hidden="true">↑</span>
        </button>
      </div>
    </section>
  );
}
