import { ArrowLeft, ArrowRight, CheckCircle2, Compass } from "lucide-preact";

import { hrefFor } from "../app/router";
import { guidedJourneyPath, type GuidedJourneyState } from "../guided-atlas";

type GuidedJourneyStep = "country" | "people" | "prayer";

const STEP_INDEX: Record<GuidedJourneyStep, number> = {
  country: 2,
  people: 3,
  prayer: 4,
};

function regionLabel(regionId: string): string {
  return regionId
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function GuidedJourneyBanner({
  state,
  step,
  countryIso3,
  countryName,
  peopleName,
}: {
  state: GuidedJourneyState;
  step: GuidedJourneyStep;
  countryIso3: string;
  countryName: string;
  peopleName: string;
}) {
  const current = STEP_INDEX[step];
  const region = regionLabel(state.regionId);

  const previousHref = step === "country"
    ? `/regions/${state.regionId}`
    : step === "people"
      ? guidedJourneyPath(`/countries/${countryIso3}`, state.regionId, state.focusPeid)
      : guidedJourneyPath(`/peoples/${state.focusPeid}`, state.regionId, state.focusPeid);

  const nextHref = step === "country"
    ? guidedJourneyPath(`/peoples/${state.focusPeid}`, state.regionId, state.focusPeid)
    : step === "people"
      ? guidedJourneyPath(`/pray/${state.focusPeid}`, state.regionId, state.focusPeid)
      : `/regions/${state.regionId}`;

  const nextLabel = step === "country"
    ? `Continue to ${peopleName}`
    : step === "people"
      ? `Continue to prayer`
      : `Return to the ${region} guide`;

  return (
    <aside
      class="guided-journey-banner"
      aria-label="Guided mission atlas journey"
      data-guided-journey-step={step}
      data-guided-journey-region={state.regionId}
      data-guided-journey-focus={state.focusPeid}
    >
      <div class="guided-journey-banner__top">
        <div>
          <span class="eyebrow">Guided mission atlas · Step {current} of 4</span>
          <strong>{region} → {countryName} → {peopleName} → Prayer</strong>
        </div>
        <Compass size={20} aria-hidden="true" />
      </div>

      <ol class="guided-journey-banner__steps" aria-label="Journey progress">
        <li class="is-complete"><CheckCircle2 size={14} aria-hidden="true" /><span>Region</span></li>
        <li class={current >= 2 ? (current === 2 ? "is-current" : "is-complete") : ""}><span>2</span><span>Country</span></li>
        <li class={current >= 3 ? (current === 3 ? "is-current" : "is-complete") : ""}><span>3</span><span>People</span></li>
        <li class={current >= 4 ? "is-current" : ""}><span>4</span><span>Prayer</span></li>
      </ol>

      <div class="guided-journey-banner__actions">
        <a href={hrefFor(previousHref)}><ArrowLeft size={14} aria-hidden="true" /> Previous step</a>
        <a class="guided-journey-banner__next" href={hrefFor(nextHref)}>
          {nextLabel} <ArrowRight size={14} aria-hidden="true" />
        </a>
      </div>
    </aside>
  );
}
