import { ArrowRight, BookOpenText, Compass, Globe2, MapPinned } from "lucide-preact";
import { useMemo } from "preact/hooks";

import { hrefFor } from "../app/router";
import {
  buildGuidedRegionAtlas,
  type GuidedRegionAtlas,
} from "../guided-atlas";
import type { AtlasRegionSummary } from "../geography/regions";
import type { RuntimePeopleEntity } from "../providers/peoplegroups";
import type { LiveMissionCountrySummary } from "../visualization/liveTypes";

export function GuidedRegionAtlasPanel({
  region,
  missionByIso3,
  peoples,
  reviewedPeids,
}: {
  region: AtlasRegionSummary;
  missionByIso3: ReadonlyMap<string, LiveMissionCountrySummary>;
  peoples: readonly RuntimePeopleEntity[];
  reviewedPeids: ReadonlySet<number>;
}) {
  const guide = useMemo<GuidedRegionAtlas>(
    () => buildGuidedRegionAtlas({ region, missionByIso3, peoples, reviewedPeids }),
    [region, missionByIso3, peoples, reviewedPeids],
  );

  return (
    <section
      class="guided-region-atlas"
      aria-labelledby="guided-region-atlas-heading"
      data-phase18-guided-atlas="true"
      data-region-guide={guide.regionId}
      data-guided-pathway-count={guide.pathways.length}
    >
      <div class="guided-region-atlas__heading">
        <div>
          <span class="eyebrow">Guided mission atlas</span>
          <h2 id="guided-region-atlas-heading">{guide.essay.title}</h2>
        </div>
        <BookOpenText size={24} aria-hidden="true" />
      </div>

      <article class="guided-region-atlas__essay">
        {guide.essay.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <dl>
          {guide.essay.facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}
        </dl>
        <small>{guide.essay.methodNote}</small>
      </article>

      <div class="guided-region-atlas__journey-heading">
        <div>
          <span class="eyebrow">Choose a learning path</span>
          <h3>Region → Country → People → Prayer</h3>
          <p>Each path follows current source data through the existing atlas. The path order is for learning clarity, not mission ranking.</p>
        </div>
        <Compass size={20} aria-hidden="true" />
      </div>

      {guide.pathways.length ? (
        <div class="guided-region-atlas__pathways">
          {guide.pathways.map((pathway) => (
            <article class="guided-region-pathway" key={pathway.id}>
              <div class="guided-region-pathway__header">
                <div>
                  <span>{pathway.editorialDepth === "reviewed" ? "Reviewed context available" : "Source-grounded profile"}</span>
                  <h4>{pathway.countryName} → {pathway.peopleName}</h4>
                </div>
                <MapPinned size={18} aria-hidden="true" />
              </div>

              <ol>
                {pathway.steps.map((step, index) => (
                  <li key={step.id}>
                    <span>{index + 1}</span>
                    <div>
                      <strong>{step.label}</strong>
                      <small>{step.id === "region"
                        ? "Regional source reading"
                        : step.id === "country"
                          ? "Country source context"
                          : step.id === "people"
                            ? "People profile and evidence"
                            : "Focused prayer guide"}</small>
                    </div>
                  </li>
                ))}
              </ol>

              <a class="guided-region-pathway__start" href={hrefFor(pathway.steps[1]!.href)}>
                Begin with {pathway.countryName} <ArrowRight size={16} aria-hidden="true" />
              </a>
            </article>
          ))}
        </div>
      ) : (
        <div class="guided-region-atlas__empty" role="note">
          <Globe2 size={18} aria-hidden="true" />
          <p>No current GSEC 0–3 source record in this region is available for a guided Country → People → Prayer path. The regional reading and ordinary country exploration remain available.</p>
        </div>
      )}

      <details class="guided-region-atlas__method">
        <summary>How pathways are selected</summary>
        <p>{guide.selectionMethod}</p>
        <ul>{guide.boundaries.map((boundary) => <li key={boundary}>{boundary}</li>)}</ul>
      </details>
    </section>
  );
}
