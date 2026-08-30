import { Database, Globe2, Info, RotateCcw, Search } from "lucide-preact";
import { useCallback, useMemo, useState } from "preact/hooks";

import { useAfterFirstPaint } from "../hooks/useResponsiveWork";
import { useWorldGeography } from "../map/geography";
import type { MapCountryFeature, MapViewState } from "../map/types";
import { readMapUrlState, replaceMapUrlState } from "../map/urlState";
import { WorldMap } from "../map/WorldMap";
import {
  buildLiveMissionMapGeography,
  formatLiveMissionLayerValue,
  getLiveMissionLayer,
  liveMissionSummaryForMapProperties,
  supportingCoverageForLiveLayer,
  useLiveMissionVisualization,
  type LiveMissionCountrySummary,
  type LiveMissionLayerId,
} from "../visualization";

const MISSION_VIEW_IDS: LiveMissionLayerId[] = ["unreached-population", "unreached-contexts"];
const RESEARCH_VIEW_IDS: LiveMissionLayerId[] = ["gsec-coverage", "population-coverage", "people-contexts"];

function mapLayerLabel(layer: LiveMissionLayerId): string {
  switch (layer) {
    case "unreached-population": return "Unreached population share";
    case "unreached-contexts": return "Unreached people-group share";
    case "gsec-coverage": return "Mission-status data coverage";
    case "population-coverage": return "Population-data coverage";
    case "people-contexts": return "Source people-group records";
  }
}

function mapLayerShortLabel(layer: LiveMissionLayerId): string {
  switch (layer) {
    case "unreached-population": return "Unreached population";
    case "unreached-contexts": return "Unreached groups";
    case "gsec-coverage": return "Mission-status coverage";
    case "population-coverage": return "Population coverage";
    case "people-contexts": return "Source records";
  }
}

function mapLayerMeaning(layer: LiveMissionLayerId): string {
  switch (layer) {
    case "unreached-population":
      return "Shows the share of represented source population belonging to people-group records classified as unreached.";
    case "unreached-contexts":
      return "Shows the share of source people-group records with known mission status that are classified as unreached.";
    case "gsec-coverage":
      return "Research view showing how much of the source record set has a reported mission-status value.";
    case "population-coverage":
      return "Research view showing how much of the source record set has a reported population estimate.";
    case "people-contexts":
      return "Research view counting the source people-group-in-country records represented for each country.";
  }
}

function primaryMapCaveat(layer: LiveMissionLayerId): string | null {
  if (layer === "unreached-population") {
    return "Based on source records with known population and mission status. Not national census data.";
  }
  if (layer === "unreached-contexts") {
    return "Every source people-group-in-country record counts once, regardless of population.";
  }
  return null;
}

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
      <span>Choose view</span>
      <select
        aria-label="Mission map layer"
        value={activeLayer}
        onChange={(event) => onChange(event.currentTarget.value as LiveMissionLayerId)}
      >
        <optgroup label="Mission views">
          {MISSION_VIEW_IDS.map((layer) => <option key={layer} value={layer}>{mapLayerLabel(layer)}</option>)}
        </optgroup>
        <optgroup label="Data & research views">
          {RESEARCH_VIEW_IDS.map((layer) => <option key={layer} value={layer}>{mapLayerLabel(layer)}</option>)}
        </optgroup>
      </select>
    </label>
  );
}

function MissionViewCurrent({ activeLayer }: { activeLayer: LiveMissionLayerId }) {
  const research = RESEARCH_VIEW_IDS.includes(activeLayer);
  const caveat = primaryMapCaveat(activeLayer);
  return (
    <div class="mission-view-current" data-map-view-kind={research ? "research" : "mission"}>
      <span>{research ? "Research map view" : "Current map view"}</span>
      <strong>{mapLayerLabel(activeLayer)}</strong>
      <p>{mapLayerMeaning(activeLayer)}</p>
      {caveat ? <small>{caveat}</small> : null}
    </div>
  );
}

function MissionViewPicker({ activeLayer, onChange, compact = false }: { activeLayer: LiveMissionLayerId; onChange: (layer: LiveMissionLayerId) => void; compact?: boolean }) {
  return (
    <details class="mission-view-picker">
      <summary>Change map view</summary>
      <div>
        <p>Start with the mission views. Open a data-and-research view only when you need source coverage or record-count information.</p>
        <LayerSelector activeLayer={activeLayer} onChange={onChange} compact={compact} />
      </div>
    </details>
  );
}

function MissionViewInfo({ activeLayer }: { activeLayer: LiveMissionLayerId }) {
  const layer = getLiveMissionLayer(activeLayer);
  return (
    <details class="mission-view-info">
      <summary>About this view</summary>
      <div>
        <p>{layer.description}</p>
        <p><strong>Method:</strong> {layer.methodology}</p>
      </div>
    </details>
  );
}

function MissionMapKey({ activeLayer, compact = false }: { activeLayer: LiveMissionLayerId; compact?: boolean }) {
  const layer = getLiveMissionLayer(activeLayer);
  return (
    <div class={`mission-map-key${compact ? " mission-map-key--compact" : ""}`} aria-label={`${mapLayerLabel(activeLayer)} map key`}>
      <strong>{compact ? "Map key" : mapLayerShortLabel(activeLayer)}</strong>
      <div class="mission-map-key__items">
        {layer.legend.map((item) => (
          <span key={`${activeLayer}-${item.label}`} class="mission-map-key__item">
            <i style={{ backgroundColor: item.color }} aria-hidden="true" />
            <span>{item.label}</span>
          </span>
        ))}
      </div>
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
  const caveat = primaryMapCaveat(activeLayer);
  return (
    <div class="selected-mission-summary selected-mission-summary--phase10 selected-mission-summary--comprehension">
      <p class="selected-mission-meaning">{mapLayerMeaning(activeLayer)}</p>
      <div class="selected-mission-primary">
        <span>{mapLayerLabel(activeLayer)}</span>
        <strong>{formatLiveMissionLayerValue(summary, activeLayer)}</strong>
        {caveat ? <small>{caveat}</small> : null}
      </div>
      <details class="selected-mission-details">
        <summary>Source breakdown</summary>
        <dl class="selected-mission-grid">
          <div><dt>People contexts</dt><dd>{summary.peopleContextCount}</dd></div>
          <div><dt>GSEC 0–3</dt><dd>{summary.unreachedContextCount}</dd></div>
          <div><dt>Unknown GSEC</dt><dd>{summary.unknownContextCount}</dd></div>
          <div><dt>Known population</dt><dd>{compactNumber(summary.knownPopulation)}</dd></div>
          {supportingCoverageText(supportingCoverage) ? <div><dt>Supporting data coverage</dt><dd>{supportingCoverageText(supportingCoverage)}</dd></div> : null}
        </dl>
        <p class="selected-area__no-data">Denominator: {summary.denominator}.</p>
      </details>
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
  const countryActionsAvailable = selectedRouteCode && /^[A-Z]{3}$/.test(selectedRouteCode);

  return (
    <section class="explore-screen explore-screen--phase10 explore-screen--comprehension" aria-labelledby="explore-title">
      <aside class="explore-panel explore-panel--map explore-panel--phase10" aria-label="Map controls and country list">
        <div class="explore-panel__intro">
          <div class="eyebrow">Explore</div>
          <h1 id="explore-title" class="display-title">Explore unreached peoples.</h1>
          <p class="lead">See where represented people-group records are classified as unreached, then open a country to understand the people behind the map.</p>
        </div>

        <div class="control-group control-group--compact mission-view-control">
          <MissionViewCurrent activeLayer={activeLayer} />
          <MissionViewPicker activeLayer={activeLayer} onChange={changeLayer} />
          <MissionViewInfo activeLayer={activeLayer} />
        </div>

        <div class="mission-data-status">
          {missionStart && mission.loading && !missionAvailable ? (
            <div class="mission-data-notice" role="status"><Database size={17} aria-hidden="true" /><div><strong>Adding live mission data</strong><p>{progressText}</p></div></div>
          ) : null}

          {mission.error && !missionAvailable ? (
            <div class="mission-data-notice" role="alert"><Database size={17} aria-hidden="true" /><div><strong>Live mission data unavailable</strong><p>{mission.error}</p><button type="button" class="text-button" onClick={mission.retry}>Retry source</button></div></div>
          ) : null}

          {mission.warning ? (
            <div class="mission-data-notice" role="note"><Database size={17} aria-hidden="true" /><div><strong>{mission.stale ? "Using stale cached mission data" : "Mission source notice"}</strong><p>{mission.warning}</p></div></div>
          ) : null}
        </div>

        {selected ? (
          <div class="selected-area selected-area--phase10" aria-live="polite">
            <div class="selected-area__heading"><div><span class="eyebrow">Selected country</span><h2>{selected.properties.name}</h2></div><button type="button" class="text-button" onClick={clearSelection}>Clear</button></div>
            {selectedSummary ? <SelectedMissionSummary summary={selectedSummary} activeLayer={activeLayer} /> : <p class="selected-area__no-data">Mission metrics are still loading or no PeopleGroups.org country-context summary is available for this area.</p>}
            <div class="selected-area__actions">
              {countryActionsAvailable ? <a class="country-profile-link" href={`#/countries/${selectedRouteCode}`}>Open country profile →</a> : null}
              {countryActionsAvailable ? <a class="country-prayer-link" href={`#/pray?country=${encodeURIComponent(selectedRouteCode)}`}>Pray for this country’s peoples →</a> : null}
              <span>{selected.properties.iso3 ?? selected.properties.adminA3 ?? selected.properties.type}{selected.properties.continent ? ` · ${selected.properties.continent}` : ""}</span>
            </div>
            {selected.properties.boundaryNote ? <p class="boundary-specific-note">{selected.properties.boundaryNote}</p> : null}
          </div>
        ) : null}

        <section key="country-index" class="country-index country-index--primary" aria-labelledby="country-index-heading">
          <div class="country-index__heading">
            <strong id="country-index-heading">Find a country</strong>
            <span>Search or select directly on the map</span>
          </div>
          <CountryBrowser countries={countries} query={query} selectedKey={selectedKey} summaries={mission.countriesByIso3} activeLayer={activeLayer} showMetrics={missionAvailable} onQueryChange={setQuery} onSelect={selectCountry} idPrefix="desktop" />
        </section>

        <details key="map-provenance" class="map-provenance">
          <summary>Sources & boundaries</summary>
          <div class="map-source-stack">
            {mission.status.attributions.map((attribution) => <a key={attribution.sourceId} href={attribution.url} target="_blank" rel="noreferrer">{attribution.label}</a>)}
            <span>Geography: Natural Earth</span>
          </div>
          <div class="boundary-note"><Info size={16} aria-hidden="true" /><p>Boundary display follows Natural Earth’s default de facto Admin-0 view. Mission metrics use PeopleGroups.org country-context records and are not national census statistics.</p></div>
        </details>
      </aside>

      <div class="map-stage map-stage--live map-stage--phase10" aria-label="World mission map workspace">
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

        <div class="mission-map-key-floating"><MissionMapKey activeLayer={activeLayer} /></div>

        {mapError ? <div class="map-render-warning" role="status">Interactive rendering reported an issue. The searchable area list remains available.</div> : null}

        <details class="mobile-map-sheet mobile-map-sheet--phase10">
          <summary><span><small>{selected ? "Selected country" : mapLayerShortLabel(activeLayer)}</small><strong>{selected?.properties.name ?? "Explore mission geography"}</strong></span><span aria-hidden="true">↑</span></summary>
          <div class="mobile-map-sheet__body">
            <div class="mobile-map-sheet__controls">
              <MissionViewCurrent activeLayer={activeLayer} />
              <MissionViewPicker activeLayer={activeLayer} onChange={changeLayer} compact />
              <MissionMapKey activeLayer={activeLayer} compact />
              <MissionViewInfo activeLayer={activeLayer} />
            </div>
            {missionStarting ? <p class="mobile-data-note">{missionStart ? progressText : "Preparing live mission data…"}</p> : null}
            {mission.error && !missionAvailable ? <p class="mobile-data-note">Live PeopleGroups.org mission data is unavailable.</p> : null}
            {selected ? (
              <div class="mobile-selection mobile-selection--country">
                <span>{selectedSummary ? `${mapLayerShortLabel(activeLayer)}: ${formatLiveMissionLayerValue(selectedSummary, activeLayer)}` : selected.properties.iso3 ?? selected.properties.adminA3 ?? selected.properties.type}</span>
                <div>{countryActionsAvailable ? <a class="country-profile-link" href={`#/countries/${selectedRouteCode}`}>Profile</a> : null}<button type="button" class="text-button" onClick={clearSelection}>Clear</button></div>
              </div>
            ) : null}
            <CountryBrowser countries={countries} query={query} selectedKey={selectedKey} summaries={mission.countriesByIso3} activeLayer={activeLayer} showMetrics={missionAvailable} onQueryChange={setQuery} onSelect={selectCountry} idPrefix="mobile" />
            <p class="mobile-boundary-note">Natural Earth geography · PeopleGroups.org mission metrics</p>
          </div>
        </details>
      </div>
    </section>
  );
}
