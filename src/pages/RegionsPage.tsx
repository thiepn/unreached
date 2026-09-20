import { ArrowRight, Database, Globe2, MapPinned } from "lucide-preact";
import { useMemo } from "preact/hooks";

import { hrefFor } from "../app/router";
import { formatCount } from "../countries";
import { buildAtlasRegions } from "../geography/regions";
import { useAfterFirstPaint } from "../hooks/useResponsiveWork";
import { useWorldGeography } from "../map/geography";
import { useLiveMissionVisualization } from "../visualization";

export function RegionsPage() {
  const geography = useWorldGeography();
  const missionStart = useAfterFirstPaint();
  const mission = useLiveMissionVisualization(missionStart);
  const regions = useMemo(
    () => buildAtlasRegions(geography.countries, mission.countriesByIso3),
    [geography.countries, mission.countriesByIso3],
  );

  return (
    <section class="v3-geography-page v3-regions-page" aria-labelledby="regions-title">
      <header class="v3-geography-hero">
        <div>
          <span class="v3-type-label">World atlas</span>
          <h1 id="regions-title" class="v3-type-display-xl">Explore by region.</h1>
          <p class="v3-type-body-lg v3-reading">Move from the world into a geographic region, then into countries and the people represented there. Each region now includes a source-grounded guided reading and optional Region → Country → People → Prayer learning paths. Region identity comes from Natural Earth geography; mission context remains source-scoped PeopleGroups.org / IMB data.</p>
        </div>
        <Globe2 size={40} aria-hidden="true" />
      </header>

      {geography.loading ? <div class="v3-geography-state" role="status">Preparing world geography…</div> : null}
      {geography.error ? <div class="v3-geography-state v3-geography-state--error" role="alert">{geography.error}</div> : null}
      {missionStart && mission.loading && !mission.ready ? <div class="v3-geography-state v3-geography-state--quiet" role="status"><Database size={17} aria-hidden="true" /> Adding mission context…</div> : null}

      {!geography.loading && !geography.error ? (
        <>
          <div class="v3-region-grid" data-v3-region-grid="true">
            {regions.map((region) => (
              <a class="v3-region-card" href={hrefFor(`/regions/${region.id}`)} key={region.id}>
                <div class="v3-region-card__heading">
                  <span><MapPinned size={17} aria-hidden="true" /> Region</span>
                  <ArrowRight size={18} aria-hidden="true" />
                </div>
                <h2>{region.name}</h2>
                <p>{region.countryCount} navigable countries and areas{mission.ready ? ` · ${region.missionCountryCount} with current mission source records` : ""}</p><span class="v3-region-card__guide-note">Guided regional reading inside</span>
                <dl class="v3-region-card__facts">
                  <div><dt>Countries</dt><dd>{region.countryCount}</dd></div>
                  <div><dt>People groups represented</dt><dd>{mission.ready ? region.peopleContextCount : "—"}</dd></div>
                  <div><dt>Represented population</dt><dd>{mission.ready ? formatCount(region.knownRepresentedPopulation) : "—"}</dd></div>
                </dl>
              </a>
            ))}
          </div>

          <div class="v3-geography-note">
            <strong>What “region” means here</strong>
            <p>Phase 7 uses Natural Earth’s continent field as the canonical atlas-region grouping. PeopleGroups provider region/subregion labels remain source context and are not promoted into universal geographic identity.</p>
          </div>
        </>
      ) : null}
    </section>
  );
}
