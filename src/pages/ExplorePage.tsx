import { Globe2, Info, Layers3, RotateCcw, Search } from "lucide-preact";
import { useCallback, useMemo, useState } from "preact/hooks";

import { StatusChip } from "../components/StatusChip";
import { useWorldGeography } from "../map/geography";
import type { MapCountryFeature, MapViewState } from "../map/types";
import { readMapUrlState, replaceMapUrlState } from "../map/urlState";
import { WorldMap } from "../map/WorldMap";

interface CountryBrowserProps {
  countries: MapCountryFeature[];
  query: string;
  selectedKey: string | null;
  onQueryChange: (value: string) => void;
  onSelect: (country: MapCountryFeature) => void;
  idPrefix: string;
}

function CountryBrowser({ countries, query, selectedKey, onQueryChange, onSelect, idPrefix }: CountryBrowserProps) {
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
      <div class="country-list" role="list" aria-label="Natural Earth map areas">
        {filtered.map((country) => (
          <button
            key={country.properties.mapKey}
            type="button"
            class={`country-row${selectedKey === country.properties.mapKey ? " is-selected" : ""}`}
            onClick={() => onSelect(country)}
            role="listitem"
          >
            <span>{country.properties.name}</span>
            <small>{country.properties.iso3 ?? country.properties.adminA3 ?? country.properties.type}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ExplorePage() {
  const initialUrl = useMemo(() => readMapUrlState(), []);
  const { data, countries, loading, error } = useWorldGeography();
  const [selectedKey, setSelectedKey] = useState<string | null>(initialUrl.country);
  const [view, setView] = useState<MapViewState | null>(initialUrl.view);
  const [query, setQuery] = useState("");
  const [resetToken, setResetToken] = useState(0);
  const [mapError, setMapError] = useState<string | null>(null);

  const selected = useMemo(
    () => countries.find((country) => country.properties.mapKey === selectedKey) ?? null,
    [countries, selectedKey],
  );

  const selectCountry = useCallback((country: MapCountryFeature) => {
    setSelectedKey(country.properties.mapKey);
    setMapError(null);
    replaceMapUrlState({ country: country.properties.mapKey, view });
  }, [view]);

  const updateView = useCallback((next: MapViewState) => {
    setView(next);
    replaceMapUrlState({ country: selectedKey, view: next });
  }, [selectedKey]);

  const clearSelection = useCallback(() => {
    setSelectedKey(null);
    replaceMapUrlState({ country: null, view });
  }, [view]);

  const resetView = useCallback(() => {
    setSelectedKey(null);
    setResetToken((value) => value + 1);
    replaceMapUrlState({ country: null, view: null });
  }, []);

  return (
    <section class="explore-screen" aria-labelledby="explore-title">
      <aside class="explore-panel explore-panel--map" aria-label="Map controls and country list">
        <div class="eyebrow">Global Mission Atlas</div>
        <h1 id="explore-title" class="display-title">Explore the nations.</h1>
        <p class="lead">
          Start with geography. Select a country or map area now; mission-status layers arrive in U4.
        </p>

        <div class="control-group control-group--compact">
          <div class="control-group__heading">
            <Layers3 size={16} aria-hidden="true" />
            <span>Map layer</span>
          </div>
          <div class="map-layer-foundation">
            <span>Base geography</span>
            <StatusChip tone="info">U3</StatusChip>
          </div>
          <div class="future-layers" aria-label="Mission layers coming in U4">
            <button type="button" disabled>Unreached</button>
            <button type="button" disabled>Religion</button>
            <button type="button" disabled>Scripture</button>
          </div>
        </div>

        {selected ? (
          <div class="selected-area" aria-live="polite">
            <div class="selected-area__heading">
              <div>
                <span class="eyebrow">Selected area</span>
                <h2>{selected.properties.name}</h2>
              </div>
              <button type="button" class="text-button" onClick={clearSelection}>Clear</button>
            </div>
            <dl>
              <div><dt>Map code</dt><dd>{selected.properties.iso3 ?? selected.properties.adminA3 ?? "—"}</dd></div>
              <div><dt>Type</dt><dd>{selected.properties.type}</dd></div>
              {selected.properties.continent ? <div><dt>Continent</dt><dd>{selected.properties.continent}</dd></div> : null}
            </dl>
            {selected.properties.boundaryNote ? <p class="boundary-specific-note">{selected.properties.boundaryNote}</p> : null}
          </div>
        ) : null}

        <details class="country-index" open>
          <summary>Browse map areas</summary>
          <CountryBrowser
            countries={countries}
            query={query}
            selectedKey={selectedKey}
            onQueryChange={setQuery}
            onSelect={selectCountry}
            idPrefix="desktop"
          />
        </details>

        <div class="boundary-note">
          <Info size={16} aria-hidden="true" />
          <p>
            Boundary display follows Natural Earth’s default de facto Admin-0 view. Selection here is geographic, not a statement on sovereignty.
          </p>
        </div>
      </aside>

      <div class="map-stage map-stage--live" aria-label="World map workspace">
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
        ) : error || !data ? (
          <div class="map-state map-state--error" role="alert">
            <Globe2 size={28} aria-hidden="true" />
            <strong>World map data unavailable</strong>
            <span>{error ?? "The generated geography file could not be read."}</span>
          </div>
        ) : (
          <WorldMap
            geography={data}
            selectedKey={selectedKey}
            initialView={initialUrl.view}
            resetToken={resetToken}
            onSelect={selectCountry}
            onViewChange={updateView}
            onError={setMapError}
          />
        )}

        {mapError ? (
          <div class="map-render-warning" role="status">
            Interactive rendering reported an issue. The searchable area list remains available.
          </div>
        ) : null}

        <details class="mobile-map-sheet">
          <summary>
            <span>
              <small>{selected ? "Selected area" : "Explore"}</small>
              <strong>{selected?.properties.name ?? "Browse countries and areas"}</strong>
            </span>
            <span aria-hidden="true">↑</span>
          </summary>
          <div class="mobile-map-sheet__body">
            {selected ? (
              <div class="mobile-selection">
                <span>{selected.properties.iso3 ?? selected.properties.adminA3 ?? selected.properties.type}</span>
                <button type="button" class="text-button" onClick={clearSelection}>Clear selection</button>
              </div>
            ) : null}
            <CountryBrowser
              countries={countries}
              query={query}
              selectedKey={selectedKey}
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
