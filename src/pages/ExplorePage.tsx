import { Database, Globe2, Info, Layers3, RotateCcw, Search } from "lucide-preact";
import { useCallback, useMemo, useState } from "preact/hooks";

import { useAfterFirstPaint } from "../hooks/useResponsiveWork";
import { useWorldGeography } from "../map/geography";
import type { MapCountryFeature, MapViewState } from "../map/types";
import { readMapUrlState, replaceMapUrlState } from "../map/urlState";
import { WorldMap } from "../map/WorldMap";
import {
  LIVE_MISSION_LAYERS,
  buildLiveMissionMapGeography,
  formatLiveMissionLayerValue,
  getLiveMissionLayer,
  liveMissionSummaryForMapProperties,
  supportingCoverageForLiveLayer,
  useLiveMissionVisualization,
  type LiveMissionCountrySummary,
  type LiveMissionLayerId,
} from "../visualization";

interface CountryBrowserProps {
  countries: MapCountryFeature[];
  query: string;
  selectedKey: string | null;
  summaries: Map<string, LiveMissionCountrySummary>;
  activeLayer: LiveMissionLayerId;
  showMetrics: boolean;
  onQueryChange: (value: string) => void;
  onSelect: (country: MapCountryFeature) => void;
  idPrefix: string;
}

function metricFor(country: MapCountryFeature, summaries: Map<string, LiveMissionCountrySummary>, layer: LiveMissionLayerId): string {
  return formatLiveMissionLayerValue(liveMissionSummaryForMapProperties(country.properties, summaries), layer);
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
      <div class="country-list-meta" aria-live="polite">{filtered.length} {filtered.length === 1 ? "area" : "areas"}</div>
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

function LayerSelector({ activeLayer, onChange, compact = false }: { activeLayer: LiveMissionLayerId; onChange: (layer: LiveMissionLayerId) => void; compact?: boolean }) {
  return (
    <label class={`mission-layer-select${compact ? " mission-layer-select--compact" : ""}`}>
      <span>Map view</span>
      <select
        aria-label="Mission map layer"
        value={activeLayer}
        onChange={(event) => onChange(event.currentTarget.value as LiveMissionLayerId)}
      >
        {LIVE_MISSION_LAYERS.map((layer) => <option key={layer.id} value={layer.id}>{layer.label}</option>)}
      </select>
    </label>
  );
}

function MissionLegend({ activeLayer }: { activeLayer: LiveMissionLayerId }) {
  const layer = getLiveMissionLayer(activeLayer);
  return (
    <div class="mission-legend" aria-label={`${layer.label} legend`}>
      <div class="mission-legend__heading"><strong>{layer.label}</strong><span>{layer.description}</span></div>
      <div class="mission-legend__items">
        {layer.legend.map((item) => <span key={`${activeLayer}-${item.label}`} class="mission-legend__item"><i style={{ backgroundColor: item.color }} aria-hidden="true" />{item.label}</span>)}
      </div>
      <details class="mission-methodology"><summary>Methodology</summary><p>{layer.methodology}</p></details>
    </div>
  );
}

function compactNumber(value: number): string {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function supportingCoverageText(value: number | null): string | null {
  if (value === null) return null;
  return `${Math.round(value)}% supporting source coverage`;
}

function SelectedMissionSummary({ summary, activeLayer }: { summary: LiveMissionCountrySummary; activeLayer: LiveMissionLayerId }) {
  const supportingCoverage = supportingCoverageForLiveLayer(summary, activeLayer);
  return (
    <div class="selected-mission-summary">
      <div class="selected-mission-primary">
        <span>{getLiveMissionLayer(activeLayer).label}</span>
        <strong>{formatLiveMissionLayerValue(summary, activeLayer)}</strong>
        {supportingCoverageText(supportingCoverage) ? <small>{supportingCoverageText(supportingCoverage)}</small> : null}
      </div>
      <dl class="selected-mission-grid">
        <div><dt>People contexts</dt><dd>{summary.peopleContextCount}</dd></div>
        <div><dt>GSEC 0–3</dt><dd>{summary.unreachedContextCount}</dd></div>
        <div><dt>Unknown GSEC</dt><dd>{summary.unknownContextCount}</dd></div>
        <div><dt>Known population</dt><dd>{compactNumber(summary.knownPopulation)}</dd></div>
      </dl>
      <p class="selected-area__no-data">Denominator: {summary.denominator}.</p>
    </div>
  );
}

export function ExplorePage() {
  const initialUrl = useMemo(() => readMapUrlState(), []);
  const { data, countries, loading, error } = useWorldGeography();
  const missionStart = useAfterFirstPaint();
  const mission = useLiveMissionVisualization(missionStart);
  const [selectedKey, setSelectedKey] = useState<string | null>(initialUrl.country);
  const [view, setView] = useState<MapViewState | null>(initialUrl.view);
  const [activeLayer, setActiveLayer] = useState<LiveMissionLayerId>(initialUrl.layer);
  const [query, setQuery] = useState("");
  const [resetToken, setResetToken] = useState(0);
  const [mapError, setMapError] = useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const selected = useMemo(() => countries.find((country) => country.properties.mapKey === selectedKey) ?? null, [countries, selectedKey]);
  const hovered = useMemo(() => countries.find((country) => country.properties.mapKey === hoveredKey) ?? null, [countries, hoveredKey]);
  const selectedSummary = selected ? liveMissionSummaryForMapProperties(selected.properties, mission.countriesByIso3) : null;
  const selectedRouteCode = selected ? (selected.properties.iso3 ?? selected.properties.adminA3) : null;
  const hoveredSummary = hovered ? liveMissionSummaryForMapProperties(hovered.properties, mission.countriesByIso3) : null;
  const visualizedGeography = useMemo(
    () => data ? buildLiveMissionMapGeography(data, mission.countriesByIso3, activeLayer) : null,
    [data, mission.countriesByIso3, activeLayer],
  );

  const writeUrl = useCallback((next: { country?: string | null; view?: MapViewState | null; layer?: LiveMissionLayerId }) => {
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

  const changeLayer = useCallback((layer: LiveMissionLayerId) => {
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

  const missionAvailable = mission.ready && mission.countries.length > 0;
  const missionStarting = !missionStart || (mission.loading && !missionAvailable);
  const progressText = mission.progress ? `Loading source page ${mission.progress.loadedPages} of ${mission.progress.totalPages}.` : "Loading live mission records.";

  return (
    <section class="explore-screen" aria-labelledby="explore-title">
      <aside class="explore-panel explore-panel--map" aria-label="Map controls and country list">
        <div class="eyebrow">Global Mission Atlas</div>
        <h1 id="explore-title" class="display-title">Explore the map.</h1>
        <p class="lead">Choose a country, compare one mission view at a time, then open its profile for the underlying people-group records.</p>

        <div class="control-group control-group--compact">
          <div class="control-group__heading"><Layers3 size={16} aria-hidden="true" /><span>What the map shows</span></div>
          <LayerSelector activeLayer={activeLayer} onChange={changeLayer} />
          <MissionLegend activeLayer={activeLayer} />
        </div>

        {missionStart && mission.loading && !missionAvailable ? (
          <div class="mission-data-notice" role="status"><Database size={17} aria-hidden="true" /><div><strong>Adding live mission data</strong><p>{progressText}</p></div></div>
        ) : null}

        {mission.error && !missionAvailable ? (
          <div class="mission-data-notice" role="alert"><Database size={17} aria-hidden="true" /><div><strong>Live mission data unavailable</strong><p>{mission.error}</p><button type="button" class="text-button" onClick={mission.retry}>Retry source</button></div></div>
        ) : null}

        {mission.warning ? (
          <div class="mission-data-notice" role="note"><Database size={17} aria-hidden="true" /><div><strong>{mission.stale ? "Using stale cached mission data" : "Mission source notice"}</strong><p>{mission.warning}</p></div></div>
        ) : null}

        {selected ? (
          <div class="selected-area" aria-live="polite">
            <div class="selected-area__heading"><div><span class="eyebrow">Selected area</span><h2>{selected.properties.name}</h2></div><button type="button" class="text-button" onClick={clearSelection}>Clear</button></div>
            {selectedSummary ? <SelectedMissionSummary summary={selectedSummary} activeLayer={activeLayer} /> : <p class="selected-area__no-data">Mission metrics are still loading or no PeopleGroups.org country-context summary is available for this area.</p>}
            <dl class="selected-area-geography">
              <div><dt>Map code</dt><dd>{selected.properties.iso3 ?? selected.properties.adminA3 ?? "—"}</dd></div>
              {selected.properties.continent ? <div><dt>Continent</dt><dd>{selected.properties.continent}</dd></div> : null}
            </dl>
            {selectedRouteCode && /^[A-Z]{3}$/.test(selectedRouteCode) ? <a class="country-profile-link" href={`#/countries/${selectedRouteCode}`}>Open country profile →</a> : null}
            {selected.properties.boundaryNote ? <p class="boundary-specific-note">{selected.properties.boundaryNote}</p> : null}
          </div>
        ) : null}

        <details class="country-index" open>
          <summary>Find a country</summary>
          <CountryBrowser countries={countries} query={query} selectedKey={selectedKey} summaries={mission.countriesByIso3} activeLayer={activeLayer} showMetrics={missionAvailable} onQueryChange={setQuery} onSelect={selectCountry} idPrefix="desktop" />
        </details>

        <details class="map-provenance">
          <summary>Sources & boundaries</summary>
          <div class="map-source-stack">
            {mission.status.attributions.map((attribution) => <a key={attribution.sourceId} href={attribution.url} target="_blank" rel="noreferrer">{attribution.label}</a>)}
            <span>Geography: Natural Earth</span>
          </div>
          <div class="boundary-note"><Info size={16} aria-hidden="true" /><p>Boundary display follows Natural Earth’s default de facto Admin-0 view. Mission metrics use PeopleGroups.org country-context records and are not national census statistics.</p></div>
        </details>
      </aside>

      <div class="map-stage map-stage--live" aria-label="World mission map workspace">
        <div class="map-stage__toolbar map-stage__toolbar--live">
          <button type="button" class="map-tool" onClick={resetView} aria-label="Reset world map view" title="Reset map"><RotateCcw size={18} aria-hidden="true" /></button>
        </div>

        {loading ? (
          <div class="map-state" role="status"><Globe2 size={28} aria-hidden="true" /><strong>Preparing world geography</strong><span>Loading the local Natural Earth map dataset.</span></div>
        ) : error || !data || !visualizedGeography ? (
          <div class="map-state map-state--error" role="alert"><Globe2 size={28} aria-hidden="true" /><strong>World map data unavailable</strong><span>{error ?? "The generated geography file could not be read."}</span></div>
        ) : (
          <WorldMap geography={data} visualizedGeography={visualizedGeography} selectedKey={selectedKey} initialView={initialUrl.view} resetToken={resetToken} onSelect={selectCountry} onHover={(country) => setHoveredKey(country?.properties.mapKey ?? null)} onViewChange={updateView} onError={setMapError} />
        )}

        {hovered ? (
          <div class="map-hover-readout" aria-hidden="true"><span>{hovered.properties.name}</span><strong>{missionStarting ? "Loading mission data…" : missionAvailable ? formatLiveMissionLayerValue(hoveredSummary, activeLayer) : "Mission data unavailable"}</strong></div>
        ) : null}

        <div class="map-legend-floating"><span>{getLiveMissionLayer(activeLayer).label}</span><div>{getLiveMissionLayer(activeLayer).legend.map((item) => <i key={item.label} title={item.label} style={{ backgroundColor: item.color }} />)}</div></div>

        {mapError ? <div class="map-render-warning" role="status">Interactive rendering reported an issue. The searchable area list remains available.</div> : null}

        <details class="mobile-map-sheet">
          <summary><span><small>{selected ? "Selected area" : getLiveMissionLayer(activeLayer).shortLabel}</small><strong>{selected?.properties.name ?? "Explore mission geography"}</strong></span><span aria-hidden="true">↑</span></summary>
          <div class="mobile-map-sheet__body">
            <LayerSelector activeLayer={activeLayer} onChange={changeLayer} compact />
            <MissionLegend activeLayer={activeLayer} />
            {missionStarting ? <p class="mobile-data-note">{missionStart ? progressText : "Preparing live mission data…"}</p> : null}
            {mission.error && !missionAvailable ? <p class="mobile-data-note">Live PeopleGroups.org mission data is unavailable.</p> : null}
            {selected ? (
              <div class="mobile-selection mobile-selection--country">
                <span>{selectedSummary ? `${getLiveMissionLayer(activeLayer).shortLabel}: ${formatLiveMissionLayerValue(selectedSummary, activeLayer)}` : selected.properties.iso3 ?? selected.properties.adminA3 ?? selected.properties.type}</span>
                <div>{selectedRouteCode && /^[A-Z]{3}$/.test(selectedRouteCode) ? <a class="country-profile-link" href={`#/countries/${selectedRouteCode}`}>Profile</a> : null}<button type="button" class="text-button" onClick={clearSelection}>Clear</button></div>
              </div>
            ) : null}
            <CountryBrowser countries={countries} query={query} selectedKey={selectedKey} summaries={mission.countriesByIso3} activeLayer={activeLayer} showMetrics={missionAvailable} onQueryChange={setQuery} onSelect={selectCountry} idPrefix="mobile" />
            <p class="mobile-boundary-note">Natural Earth geography. Mission metrics: PeopleGroups.org.</p>
          </div>
        </details>
      </div>
    </section>
  );
}
