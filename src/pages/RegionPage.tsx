import { ArrowLeft, ArrowRight, Database, Globe2, MapPinned, UsersRound } from "lucide-preact";
import { useMemo } from "preact/hooks";

import { hrefFor } from "../app/router";
import { formatCount } from "../countries";
import { buildAtlasRegions, findAtlasRegion, routeCodeForCountry } from "../geography/regions";
import { useAfterFirstPaint } from "../hooks/useResponsiveWork";
import { useWorldGeography } from "../map/geography";
import { formatLiveMissionLayerValue, useLiveMissionVisualization } from "../visualization";

export function RegionPage({ regionId }: { regionId: string }) {
  const geography = useWorldGeography();
  const missionStart = useAfterFirstPaint();
  const mission = useLiveMissionVisualization(missionStart);
  const regions = useMemo(
    () => buildAtlasRegions(geography.countries, mission.countriesByIso3),
    [geography.countries, mission.countriesByIso3],
  );
  const region = findAtlasRegion(regions, regionId);

  if (geography.loading) return <section class="v3-geography-page v3-geography-state" role="status">Preparing region geography…</section>;
  if (geography.error) return <section class="v3-geography-page v3-geography-state v3-geography-state--error" role="alert">{geography.error}</section>;
  if (!region) {
    return (
      <section class="v3-geography-page v3-geography-state">
        <span class="v3-type-label">World atlas</span>
        <h1 class="v3-type-display-lg">Region not found.</h1>
        <a class="v3-geography-back" href={hrefFor("/regions")}><ArrowLeft size={16} aria-hidden="true" /> Back to regions</a>
      </section>
    );
  }

  return (
    <article class="v3-geography-page v3-region-page">
      <nav class="v3-geography-breadcrumb" aria-label="Breadcrumb">
        <a href={hrefFor("/regions")}>World regions</a>
        <span>/</span>
        <span aria-current="page">{region.name}</span>
      </nav>

      <header class="v3-geography-hero v3-region-hero">
        <div>
          <span class="v3-type-label">Region</span>
          <h1 class="v3-type-display-xl">{region.name}</h1>
          <p class="v3-type-body-lg v3-reading">Explore countries in {region.name}, then continue into the people represented in each country. Geographic membership comes from Natural Earth; mission figures summarize the current PeopleGroups.org / IMB country-context records.</p>
        </div>
        <MapPinned size={40} aria-hidden="true" />
      </header>

      <div class="v3-region-summary" aria-label={`${region.name} atlas summary`}>
        <div><strong>{region.countryCount}</strong><span>countries and areas</span></div>
        <div><strong>{mission.ready ? region.missionCountryCount : "—"}</strong><span>with mission-source records</span></div>
        <div><strong>{mission.ready ? region.peopleContextCount : "—"}</strong><span>people groups represented</span></div>
        <div><strong>{mission.ready ? formatCount(region.knownRepresentedPopulation) : "—"}</strong><span>represented population with estimates</span></div>
      </div>

      {missionStart && mission.loading && !mission.ready ? <div class="v3-geography-state v3-geography-state--quiet" role="status"><Database size={17} aria-hidden="true" /> Adding mission context…</div> : null}
      {mission.warning ? <div class="v3-geography-state v3-geography-state--quiet" role="status">{mission.warning}</div> : null}

      <section class="v3-region-countries" aria-labelledby="region-countries-heading">
        <div class="v3-geography-section-heading">
          <div><span class="v3-type-label">Countries</span><h2 id="region-countries-heading" class="v3-type-heading-xl">Continue into a country</h2></div>
          <Globe2 size={24} aria-hidden="true" />
        </div>
        <p class="v3-type-body v3-reading">Countries are alphabetical. Mission percentages are source-derived context summaries, not national census shares and not a ranking of mission importance.</p>

        <div class="v3-country-grid" data-v3-region-country-grid="true">
          {region.countries.map((country) => {
            const code = routeCodeForCountry(country)!;
            const summary = mission.countriesByIso3.get(code) ?? null;
            return (
              <a class="v3-country-card" href={hrefFor(`/countries/${code}`)} key={code}>
                <div class="v3-country-card__heading">
                  <span>{code}</span>
                  <ArrowRight size={17} aria-hidden="true" />
                </div>
                <h3>{summary?.name ?? country.properties.name}</h3>
                {summary ? (
                  <>
                    <strong class="v3-country-card__mission-value">{formatLiveMissionLayerValue(summary, "unreached-population")}</strong>
                    <span class="v3-country-card__mission-label">represented population in source records classified as unreached</span>
                    <dl>
                      <div><dt>People groups</dt><dd>{summary.peopleContextCount}</dd></div>
                      <div><dt>Unreached</dt><dd>{summary.unreachedContextCount}</dd></div>
                      <div><dt>Known represented population</dt><dd>{formatCount(summary.knownPopulation)}</dd></div>
                    </dl>
                  </>
                ) : <p>No current PeopleGroups.org country-context summary is available.</p>}
              </a>
            );
          })}
        </div>
      </section>

      <footer class="v3-geography-note">
        <UsersRound size={18} aria-hidden="true" />
        <div><strong>Next step: people</strong><p>Country pages lead into individual people profiles and prayer. Phase 8 will rebuild the definitive people profile inside this geographic hierarchy.</p></div>
      </footer>
    </article>
  );
}
