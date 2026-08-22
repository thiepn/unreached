import { Database, Globe2, Info, Layers3, RotateCcw, Search } from "lucide-preact";
import { useCallback, useMemo, useState } from "preact/hooks";

import { useWorldGeography } from "../map/geography";
import type { MapCountryFeature, MapViewState } from "../map/types";
import { readMapUrlState, replaceMapUrlState } from "../map/urlState";
import { WorldMap } from "../map/WorldMap";
import {
  MISSION_LAYERS,
  buildMissionMapGeography,
  coverageForLayer,
  formatLayerValue,
  getMissionLayer,
  summaryForMapProperties,
  useMissionVisualization,
  type CountryMissionSummary,
  type MissionLayerId,
} from "../visualization";

interface CountryBrowserProps {
  countries: MapCountryFeature[];
  query: string;
  selectedKey: string | null;
  summaries: Map<string, CountryMissionSummary>;
  activeLayer: MissionLayerId;
  showMetrics: boolean;
  onQueryChange: (value: string) => void;
  onSelect: (country: MapCountryFeature) => void;
  idPrefix: string;
}

function metricFor(country: MapCountryFeature, summaries: Map<string, CountryMissionSummary>, layer: MissionLayerId): string {
  return formatLayerValue(summaryForMapProperties(country.properties, summaries), layer);
}

function CountryBrowser({ countries, query, selectedKey, summaries, activeLayer, showMetrics, onQueryChange, onSelect, idPrefix }: CountryBrowserProps) {
  const normalized = query.trim().toLocaleLowerCase("en");
  const filtered = normalized
    ? countries.filter((country) => {
        const p = country.properties;
        return [p.name, p.iso3, p.adminA3, p.continent].some((value) => value?.toLocaleLowerCase("en").includes(normalized));
      })
    : countries;

  return (
    <div class="country-browser">
      <label class="country-search" for={`${idPrefix}-country-search`}>
        <Search size={17} aria-hidden="true" />
        <span class="sr-only">Search map areas</span>
        <input
          id={`${idPrefix}-country-search`}
          type="search"
          value={query}
          onInput={(event) => onQueryChange(event.currentTarget.value)}
          placeholder="Search countries or areas"
          autoComplete="off"
        />
      </label>
      <div class="country-list-meta" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "area" : "areas"}
      </div>
      <div class="country-list" role="list" aria-label="Mission map areas">
        {filtered.map((country) => (
          <button
            key={country.properties.mapKey}
            type="button"
            class={`country-row${selectedKey === country.properties.mapKey ? " is-selected" : ""}`}
            onClick={() => onSelect(country)}
            role="listitem"
          >
            <span>{country.properties.name}</span>
            <small>{showMetrics ? metricFor(country, summaries, activeLayer) : country.properties.iso3 ?? country.properties.adminA3 ?? country.properties.type}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function LayerSelector({ activeLayer, onChange, compact = false }: { activeLayer: MissionLayerId; onChange: (layer: MissionLayerId) => void; compact?: boolean }) {
  return (
    <div class={`mission-layer-selector${compact ? " mission-layer-selector--compact" : ""}`} role="radiogroup" aria-label="Mission map layer">
      {MISSION_LAYERS.map((layer) => (
        <button
          key={layer.id}
          type="button"
          role="radio"
          aria-checked={activeLayer === layer.id}
          class={activeLayer === layer.id ? "is-selected" : ""}
          onClick={() => onChange(layer.id)}
        >
          {layer.shortLabel}
        </button>
      ))}
    </div>
  );
}

function MissionLegend({ activeLayer }: { activeLayer: MissionLayerId }) {
  const layer = getMissionLayer(activeLayer);
  return (
    <div class="mission-legend" aria-label={`${layer.label} legend`}>
      <div class="mission-legend__heading">
        <strong>{layer.label}</strong>
        <span>{layer.description}</span>
      </div>
      <div class="mission-legend__items">
        {layer.legend.map((item) => (
          <span key={`${activeLayer}-${item.label}`} class="mission-legend__item">
            <i style={{ backgroundColor: item.color }} aria-hidden="true" />
            {item.label}
          </span>
        ))}
      </div>
      <details class="mission-methodology">
        <summary>How this layer is calculated</summary>
        <p>{layer.methodology}</p>
      </details>
    </div>
  );
}

function compactNumber(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function coverageText(value: number | null): string {
  if (value === null) return "Coverage unknown";
  return `${Math.round(value)}% population coverage`;
}

function SelectedMissionSummary({ summary, activeLayer }: { summary: CountryMissionSummary; activeLayer: MissionLayerId }) {
  const activeCoverage = coverageForLayer(summary, activeLayer);
  return (
    <div class="selected-mission-summary">
      <div class="selected-mission-primary">
        <span>{getMissionLayer(activeLayer).label}</span>
        <strong>{formatLayerValue(summary, activeLayer)}</strong>
        <small>{coverageText(activeCoverage)}</small>
      </div>
      <dl class="selected-mission-grid">
        <div><dt>People groups</dt><dd>{summary.peopleGroupCount}</dd></div>
        <div><dt>Unreached groups</dt><dd>{summary.unreachedGroupCount}</dd></div>
        <div><dt>Frontier groups</dt><dd>{summary.frontierGroupCount}</dd></div>
        <div><dt>Known population</dt><dd>{compactNumber(summary.knownPopulation)}</dd></div>
      </dl>
    </div>
  );
}

export function ExplorePage() {
  const initialUrl = useMemo(() => readMapUrlState(), []);
  const { data, countries, loading, error } = useWorldGeography();
  const mission = useMissionVisualization();
  const [selectedKey, setSelectedKey] = useState<string | null>(initialUrl.country);
  const [view, setView] = useState<MapViewState | null>(initialUrl.view);
  const [activeLayer, setActiveLayer] = useState<MissionLayerId>(initialUrl.layer);
  const [query, setQuery] = useState("");
  const [resetToken, setResetToken] = useState(0);
  const [mapError, setMapError] = useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const selected = useMemo(
    () => countries.find((country) => country.properties.mapKey === selectedKey) ?? null,
    [countries, selectedKey],
  );
  const hovered = useMemo(
    () => countries.find((country) => country.properties.mapKey === hoveredKey) ?? null,
    [countries, hoveredKey],
  );
  const selectedSummary = selected ? summaryForMapProperties(selected.properties, mission.countriesByIso3) : null;
  const selectedRouteCode = selected ? (selected.properties.iso3 ?? selected.properties.adminA3) : null;
  const hoveredSummary = hovered ? summaryForMapProperties(hovered.properties, mission.countriesByIso3) : null;
  const visualizedGeography = useMemo(
    () => data ? buildMissionMapGeography(data, mission.dataset, activeLayer) : null,
    [data, mission.dataset, activeLayer],
  );

  const writeUrl = useCallback((next: { country?: string | null; view?: MapViewState | null; layer?: MissionLayerId }) => {
    replaceMapUrlState({
      country: next.country === undefined ? selectedKey : next.country,
      view: next.view === undefined ? view : next.view,
      layer: next.layer ?? activeLayer,
    });
  }, [selectedKey, view, activeLayer]);

  const selectCountry = useCallback((country: MapCountryFeature) => {
    setSelectedKey(country.properties.mapKey);
    setMapError(null);
    writeUrl({ country: country.properties.mapKey });
  }, [writeUrl]);

  const updateView = useCallback((next: MapViewState) => {
    setView(next);
    writeUrl({ view: next });
  }, [writeUrl]);

  const changeLayer = useCallback((layer: MissionLayerId) => {
    setActiveLayer(layer);
    writeUrl({ layer });
  }, [writeUrl]);

  const clearSelection = useCallback(() => {
    setSelectedKey(null);
    writeUrl({ country: null });
  }, [writeUrl]);

  const resetView = useCallback(() => {
    setSelectedKey(null);
    setResetToken((value) => value + 1);
    replaceMapUrlState({ country: null, view: null, layer: activeLayer });
  }, [activeLayer]);

  const missionAvailable = mission.dataset !== null;

  return (
    <section class="explore-screen" aria-labelledby="explore-title">
      <aside class="explore-panel explore-panel--map" aria-label="Map controls and country list">
        <div class="eyebrow">Global Mission Atlas</div>
        <h1 id="explore-title" class="display-title">Explore the nations.</h1>
        <p class="lead">Switch mission lenses, inspect countries, and distinguish verified values from missing data.</p>

        <div class="control-group control-group--compact">
          <div class="control-group__heading">
            <Layers3 size={16} aria-hidden="true" />
            <span>Mission layer</span>
          </div>
          <LayerSelector activeLayer={activeLayer} onChange={changeLayer} />
          <MissionLegend activeLayer={activeLayer} />
        </div>

        {!mission.loading && !missionAvailable ? (
          <div class="mission-data-notice" role="note">
            <Database size={17} aria-hidden="true" />
            <div>
              <strong>Mission data not published in this build</strong>
              <p>{mission.error ?? mission.status?.reason ?? "The map engine is ready, but source-derived mission data is not available."}</p>
            </div>
          </div>
        ) : null}

        {selected ? (
          <div class="selected-area" aria-live="polite">
            <div class="selected-area__heading">
              <div>
                <span class="eyebrow">Selected area</span>
                <h2>{selected.properties.name}</h2>
              </div>
              <button type="button" class="text-button" onClick={clearSelection}>Clear</button>
            </div>
            {selectedSummary ? <SelectedMissionSummary summary={selectedSummary} activeLayer={activeLayer} /> : (
              <p class="selected-area__no-data">No publishable mission summary is available for this map area.</p>
            )}
            <dl class="selected-area-geography">
              <div><dt>Map code</dt><dd>{selected.properties.iso3 ?? selected.properties.adminA3 ?? "—"}</dd></div>
              {selected.properties.continent ? <div><dt>Continent</dt><dd>{selected.properties.continent}</dd></div> : null}
            </dl>
            {selectedRouteCode && /^[A-Z]{3}$/.test(selectedRouteCode) ? <a class="country-profile-link" href={`#/countries/${selectedRouteCode}`}>Open country profile →</a> : null}
            {selected.properties.boundaryNote ? <p class="boundary-specific-note">{selected.properties.boundaryNote}</p> : null}
          </div>
        ) : null}

        <details class="country-index" open>
          <summary>Browse map areas</summary>
          <CountryBrowser
            countries={countries}
            query={query}
            selectedKey={selectedKey}
            summaries={mission.countriesByIso3}
            activeLayer={activeLayer}
            showMetrics={missionAvailable}
            onQueryChange={setQuery}
            onSelect={selectCountry}
            idPrefix="desktop"
          />
        </details>

        <div class="map-source-stack">
          {mission.status?.attributions.map((attribution) => (
            <a key={attribution.sourceId} href={attribution.url} target="_blank" rel="noreferrer">{attribution.label}</a>
          ))}
          <span>Geography: Natural Earth</span>
        </div>

        <div class="boundary-note">
          <Info size={16} aria-hidden="true" />
          <p>Boundary display follows Natural Earth’s default de facto Admin-0 view. Selection here is geographic, not a statement on sovereignty.</p>
        </div>
      </aside>

      <div class="map-stage map-stage--live" aria-label="World mission map workspace">
        <div class="map-stage__toolbar map-stage__toolbar--live">
          <button type="button" class="map-tool" onClick={resetView} aria-label="Reset world map view" title="Reset map">
            <RotateCcw size={18} aria-hidden="true" />
          </button>
        </div>

        {loading ? (
          <div class="map-state" role="status">
            <Globe2 size={28} aria-hidden="true" />
            <strong>Preparing world geography</strong>
            <span>Loading the local Natural Earth map dataset.</span>
          </div>
        ) : error || !data || !visualizedGeography ? (
          <div class="map-state map-state--error" role="alert">
            <Globe2 size={28} aria-hidden="true" />
            <strong>World map data unavailable</strong>
            <span>{error ?? "The generated geography file could not be read."}</span>
          </div>
        ) : (
          <WorldMap
            geography={data}
            visualizedGeography={visualizedGeography}
            selectedKey={selectedKey}
            initialView={initialUrl.view}
            resetToken={resetToken}
            onSelect={selectCountry}
            onHover={(country) => setHoveredKey(country?.properties.mapKey ?? null)}
            onViewChange={updateView}
            onError={setMapError}
          />
        )}

        {hovered ? (
          <div class="map-hover-readout" aria-hidden="true">
            <span>{hovered.properties.name}</span>
            <strong>{missionAvailable ? formatLayerValue(hoveredSummary, activeLayer) : "Mission data unavailable"}</strong>
          </div>
        ) : null}

        <div class="map-legend-floating">
          <span>{getMissionLayer(activeLayer).label}</span>
          <div>{getMissionLayer(activeLayer).legend.map((item) => <i key={item.label} title={item.label} style={{ backgroundColor: item.color }} />)}</div>
        </div>

        {mapError ? (
          <div class="map-render-warning" role="status">Interactive rendering reported an issue. The searchable area list remains available.</div>
        ) : null}

        <details class="mobile-map-sheet">
          <summary>
            <span>
              <small>{selected ? "Selected area" : getMissionLayer(activeLayer).shortLabel}</small>
              <strong>{selected?.properties.name ?? "Explore mission geography"}</strong>
            </span>
            <span aria-hidden="true">↑</span>
          </summary>
          <div class="mobile-map-sheet__body">
            <LayerSelector activeLayer={activeLayer} onChange={changeLayer} compact />
            <MissionLegend activeLayer={activeLayer} />
            {!mission.loading && !missionAvailable ? <p class="mobile-data-note">Mission data publication is currently release-gated.</p> : null}
            {selected ? (
              <div class="mobile-selection mobile-selection--country">
                <span>{selectedSummary ? `${getMissionLayer(activeLayer).shortLabel}: ${formatLayerValue(selectedSummary, activeLayer)}` : selected.properties.iso3 ?? selected.properties.adminA3 ?? selected.properties.type}</span>
                <div>
                  {selectedRouteCode && /^[A-Z]{3}$/.test(selectedRouteCode) ? <a class="country-profile-link" href={`#/countries/${selectedRouteCode}`}>Profile</a> : null}
                  <button type="button" class="text-button" onClick={clearSelection}>Clear</button>
                </div>
              </div>
            ) : null}
            <CountryBrowser
              countries={countries}
              query={query}
              selectedKey={selectedKey}
              summaries={mission.countriesByIso3}
              activeLayer={activeLayer}
              showMetrics={missionAvailable}
              onQueryChange={setQuery}
              onSelect={selectCountry}
              idPrefix="mobile"
            />
            <p class="mobile-boundary-note">Natural Earth de facto boundary presentation.</p>
          </div>
        </details>
      </div>
    </section>
  );
}
