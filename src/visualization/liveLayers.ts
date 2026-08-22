import type { LiveMissionCountrySummary, LiveMissionLayerId } from "./liveTypes";

export interface LiveMissionLegendItem {
  label: string;
  color: string;
}

export interface LiveMissionLayerDefinition {
  id: LiveMissionLayerId;
  label: string;
  shortLabel: string;
  description: string;
  methodology: string;
  legend: LiveMissionLegendItem[];
}

export const LIVE_MISSION_NO_DATA_COLOR = "#d5ddd8";

const WARM_PERCENT_LEGEND: LiveMissionLegendItem[] = [
  { label: "0–5%", color: "#d8e4d5" },
  { label: "5–25%", color: "#e8d7a7" },
  { label: "25–50%", color: "#e4ad69" },
  { label: "50–75%", color: "#d67948" },
  { label: "75–100%", color: "#a74332" },
  { label: "No data", color: LIVE_MISSION_NO_DATA_COLOR },
];

const COVERAGE_LEGEND: LiveMissionLegendItem[] = [
  { label: "0–25%", color: "#a74332" },
  { label: "25–50%", color: "#d67948" },
  { label: "50–75%", color: "#d5a04f" },
  { label: "75–99%", color: "#8ea676" },
  { label: "100%", color: "#55765f" },
  { label: "No data", color: LIVE_MISSION_NO_DATA_COLOR },
];

export const LIVE_MISSION_LAYERS: LiveMissionLayerDefinition[] = [
  {
    id: "unreached-population",
    label: "GSEC 0–3 population share",
    shortLabel: "Unreached pop.",
    description: "Share of known population in GSEC-classified people-group contexts whose GSEC value is 0–3.",
    methodology: "Population-weighted across PeopleGroups.org people-group-in-country records. Only contexts with both a population estimate and known GSEC enter the denominator. This is not a national census share.",
    legend: WARM_PERCENT_LEGEND,
  },
  {
    id: "unreached-contexts",
    label: "GSEC 0–3 context share",
    shortLabel: "Unreached groups",
    description: "Share of people-group-in-country records with known GSEC that fall in GSEC 0–3.",
    methodology: "Count of GSEC 0–3 country-context records divided by all country-context records with known GSEC. Every PGID counts once, regardless of population.",
    legend: WARM_PERCENT_LEGEND,
  },
  {
    id: "gsec-coverage",
    label: "GSEC field coverage",
    shortLabel: "GSEC coverage",
    description: "How much of the country’s PeopleGroups.org context set has a reported GSEC value.",
    methodology: "Contexts with known GSEC divided by all PeopleGroups.org people-group-in-country records for the country. This layer measures source coverage, not mission status.",
    legend: COVERAGE_LEGEND,
  },
  {
    id: "population-coverage",
    label: "Population estimate coverage",
    shortLabel: "Pop. coverage",
    description: "Share of represented PeopleGroups.org country-context records that contain a population estimate.",
    methodology: "Contexts with a reported population estimate divided by all PeopleGroups.org people-group-in-country records for the country. This is data coverage, not national population coverage.",
    legend: COVERAGE_LEGEND,
  },
  {
    id: "people-contexts",
    label: "People-group contexts",
    shortLabel: "People contexts",
    description: "Number of PeopleGroups.org people-group-in-country records represented for the country.",
    methodology: "Direct count of PGID country-context records returned by PeopleGroups.org. It is not a count of unique PEIDs worldwide or a census of ethnic identities.",
    legend: [
      { label: "1–9", color: "#d8e4d5" },
      { label: "10–24", color: "#c3d3b9" },
      { label: "25–49", color: "#d5a04f" },
      { label: "50–99", color: "#d67948" },
      { label: "100+", color: "#a74332" },
      { label: "No data", color: LIVE_MISSION_NO_DATA_COLOR },
    ],
  },
];

export function getLiveMissionLayer(id: LiveMissionLayerId): LiveMissionLayerDefinition {
  return LIVE_MISSION_LAYERS.find((layer) => layer.id === id) ?? LIVE_MISSION_LAYERS[0]!;
}

function percentColor(value: number | null, coverage = false): string {
  if (value === null) return LIVE_MISSION_NO_DATA_COLOR;
  if (coverage) {
    if (value < 25) return "#a74332";
    if (value < 50) return "#d67948";
    if (value < 75) return "#d5a04f";
    if (value < 100) return "#8ea676";
    return "#55765f";
  }
  if (value < 5) return "#d8e4d5";
  if (value < 25) return "#e8d7a7";
  if (value < 50) return "#e4ad69";
  if (value < 75) return "#d67948";
  return "#a74332";
}

function contextCountColor(value: number): string {
  if (value < 1) return LIVE_MISSION_NO_DATA_COLOR;
  if (value < 10) return "#d8e4d5";
  if (value < 25) return "#c3d3b9";
  if (value < 50) return "#d5a04f";
  if (value < 100) return "#d67948";
  return "#a74332";
}

export function liveLayerHasData(summary: LiveMissionCountrySummary | null, layer: LiveMissionLayerId): boolean {
  if (!summary) return false;
  switch (layer) {
    case "unreached-population": return summary.unreachedPopulationShare !== null;
    case "unreached-contexts": return summary.unreachedContextShare !== null;
    case "gsec-coverage": return summary.gsecCoverage !== null;
    case "population-coverage": return summary.populationCoverage !== null;
    case "people-contexts": return summary.peopleContextCount > 0;
  }
}

export function fillForLiveMissionLayer(summary: LiveMissionCountrySummary | null, layer: LiveMissionLayerId): string {
  if (!summary) return LIVE_MISSION_NO_DATA_COLOR;
  switch (layer) {
    case "unreached-population": return percentColor(summary.unreachedPopulationShare);
    case "unreached-contexts": return percentColor(summary.unreachedContextShare);
    case "gsec-coverage": return percentColor(summary.gsecCoverage, true);
    case "population-coverage": return percentColor(summary.populationCoverage, true);
    case "people-contexts": return contextCountColor(summary.peopleContextCount);
  }
}

function formatPercent(value: number | null): string {
  if (value === null) return "No data";
  if (value > 0 && value < 0.1) return "<0.1%";
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1).replace(/\.0$/, "")}%`;
}

export function formatLiveMissionLayerValue(summary: LiveMissionCountrySummary | null, layer: LiveMissionLayerId): string {
  if (!summary) return "No mission data";
  switch (layer) {
    case "unreached-population": return formatPercent(summary.unreachedPopulationShare);
    case "unreached-contexts": return formatPercent(summary.unreachedContextShare);
    case "gsec-coverage": return formatPercent(summary.gsecCoverage);
    case "population-coverage": return formatPercent(summary.populationCoverage);
    case "people-contexts": return new Intl.NumberFormat("en").format(summary.peopleContextCount);
  }
}

export function supportingCoverageForLiveLayer(summary: LiveMissionCountrySummary | null, layer: LiveMissionLayerId): number | null {
  if (!summary) return null;
  switch (layer) {
    case "unreached-population": return summary.gsecPopulationCoverage;
    case "unreached-contexts": return summary.gsecCoverage;
    case "gsec-coverage":
    case "population-coverage":
    case "people-contexts":
      return null;
  }
}
