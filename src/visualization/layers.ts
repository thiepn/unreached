import type { CountryMissionSummary, MissionLayerId } from "./types";

export interface LegendItem {
  label: string;
  color: string;
}

export interface MissionLayerDefinition {
  id: MissionLayerId;
  label: string;
  shortLabel: string;
  description: string;
  methodology: string;
  legend: LegendItem[];
}

export const NO_DATA_COLOR = "#d5ddd8";

const RELIGION_COLORS: Record<string, string> = {
  "religion:1": "#587895",
  "religion:2": "#b69143",
  "religion:4": "#71875e",
  "religion:5": "#c8793c",
  "religion:6": "#4f8774",
  "religion:8": "#7c688e",
  "religion:9": NO_DATA_COLOR,
};

const SCRIPTURE_COLORS: Record<CountryMissionSummary["scriptureStatus"], string> = {
  unknown: NO_DATA_COLOR,
  "translation-needed": "#9d362c",
  "translation-started": "#c86143",
  portions: "#d5a04f",
  "new-testament": "#8ea676",
  "complete-bible": "#55765f",
};

export const MISSION_LAYERS: MissionLayerDefinition[] = [
  {
    id: "unreached",
    label: "Unreached population share",
    shortLabel: "Unreached",
    description: "Share of known, classified people-group population that belongs to groups the source classifies as unreached.",
    methodology: "Population-weighted aggregation of people-group-in-country classifications. Unknown classifications are excluded from the denominator.",
    legend: [
      { label: "0–5%", color: "#d8e4d5" },
      { label: "5–25%", color: "#e8d7a7" },
      { label: "25–50%", color: "#e4ad69" },
      { label: "50–75%", color: "#d67948" },
      { label: "75–100%", color: "#a74332" },
      { label: "No data", color: NO_DATA_COLOR },
    ],
  },
  {
    id: "frontier",
    label: "Frontier population share",
    shortLabel: "Frontier",
    description: "Share of population with a known frontier flag that belongs to people groups marked frontier.",
    methodology: "Population-weighted aggregation. Records with unknown frontier status are excluded from the denominator.",
    legend: [
      { label: "0%", color: "#d9e5da" },
      { label: "0–10%", color: "#ead7ad" },
      { label: "10–35%", color: "#dfaa68" },
      { label: "35–70%", color: "#c96943" },
      { label: "70–100%", color: "#87362f" },
      { label: "No data", color: NO_DATA_COLOR },
    ],
  },
  {
    id: "evangelical",
    label: "Evangelical presence",
    shortLabel: "Evangelical",
    description: "Population-weighted evangelical percentage among people groups with both population and evangelical estimates.",
    methodology: "Weighted mean. Records without a known percentage or population are excluded and coverage is reported separately.",
    legend: [
      { label: "<0.1%", color: "#8e342b" },
      { label: "0.1–1%", color: "#bd5f43" },
      { label: "1–5%", color: "#d5a15b" },
      { label: "5–10%", color: "#99ad80" },
      { label: "10%+", color: "#557963" },
      { label: "No data", color: NO_DATA_COLOR },
    ],
  },
  {
    id: "religion",
    label: "Primary religion",
    shortLabel: "Religion",
    description: "The primary religion associated with the largest known people-group population represented in the country dataset.",
    methodology: "Population-weighted dominant category. This is a people-group aggregation, not a census claim about every resident.",
    legend: [
      { label: "Christianity", color: RELIGION_COLORS["religion:1"] ?? NO_DATA_COLOR },
      { label: "Buddhism", color: RELIGION_COLORS["religion:2"] ?? NO_DATA_COLOR },
      { label: "Ethnic religions", color: RELIGION_COLORS["religion:4"] ?? NO_DATA_COLOR },
      { label: "Hinduism", color: RELIGION_COLORS["religion:5"] ?? NO_DATA_COLOR },
      { label: "Islam", color: RELIGION_COLORS["religion:6"] ?? NO_DATA_COLOR },
      { label: "Other", color: RELIGION_COLORS["religion:8"] ?? NO_DATA_COLOR },
      { label: "No data", color: NO_DATA_COLOR },
    ],
  },
  {
    id: "scripture",
    label: "Scripture availability",
    shortLabel: "Scripture",
    description: "Population-weighted median Scripture status across represented people groups with known status.",
    methodology: "Weighted median of source Scripture-status categories. Unknown statuses are excluded; coverage is reported separately.",
    legend: [
      { label: "Translation needed", color: SCRIPTURE_COLORS["translation-needed"] },
      { label: "Translation started", color: SCRIPTURE_COLORS["translation-started"] },
      { label: "Portions", color: SCRIPTURE_COLORS.portions },
      { label: "New Testament", color: SCRIPTURE_COLORS["new-testament"] },
      { label: "Complete Bible", color: SCRIPTURE_COLORS["complete-bible"] },
      { label: "No data", color: NO_DATA_COLOR },
    ],
  },
];

export function getMissionLayer(id: MissionLayerId): MissionLayerDefinition {
  return MISSION_LAYERS.find((layer) => layer.id === id) ?? MISSION_LAYERS[0]!;
}

function percentColor(value: number | null, thresholds: Array<[number, string]>, fallback: string): string {
  if (value === null) return NO_DATA_COLOR;
  for (const [limit, color] of thresholds) if (value < limit) return color;
  return fallback;
}

export function layerHasData(summary: CountryMissionSummary | null, layer: MissionLayerId): boolean {
  if (!summary) return false;
  switch (layer) {
    case "unreached": return summary.unreachedShare !== null;
    case "frontier": return summary.frontierShare !== null;
    case "evangelical": return summary.evangelicalPercent !== null;
    case "religion": return summary.primaryReligionId !== null;
    case "scripture": return summary.scriptureStatus !== "unknown";
  }
}

export function fillForLayer(summary: CountryMissionSummary | null, layer: MissionLayerId): string {
  if (!summary) return NO_DATA_COLOR;
  switch (layer) {
    case "unreached":
      return percentColor(summary.unreachedShare, [[5, "#d8e4d5"], [25, "#e8d7a7"], [50, "#e4ad69"], [75, "#d67948"]], "#a74332");
    case "frontier":
      return percentColor(summary.frontierShare, [[0.0001, "#d9e5da"], [10, "#ead7ad"], [35, "#dfaa68"], [70, "#c96943"]], "#87362f");
    case "evangelical":
      return percentColor(summary.evangelicalPercent, [[0.1, "#8e342b"], [1, "#bd5f43"], [5, "#d5a15b"], [10, "#99ad80"]], "#557963");
    case "religion": return summary.primaryReligionId ? RELIGION_COLORS[summary.primaryReligionId] ?? "#7c688e" : NO_DATA_COLOR;
    case "scripture": return SCRIPTURE_COLORS[summary.scriptureStatus];
  }
}

function formatPercent(value: number | null): string {
  if (value === null) return "No data";
  if (value > 0 && value < 0.1) return "<0.1%";
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1).replace(/\.0$/, "")}%`;
}

const SCRIPTURE_LABELS: Record<CountryMissionSummary["scriptureStatus"], string> = {
  unknown: "No data",
  "translation-needed": "Translation needed",
  "translation-started": "Translation started",
  portions: "Portions",
  "new-testament": "New Testament",
  "complete-bible": "Complete Bible",
};

export function formatLayerValue(summary: CountryMissionSummary | null, layer: MissionLayerId): string {
  if (!summary) return "No mission data";
  switch (layer) {
    case "unreached": return formatPercent(summary.unreachedShare);
    case "frontier": return formatPercent(summary.frontierShare);
    case "evangelical": return formatPercent(summary.evangelicalPercent);
    case "religion": return summary.primaryReligionName ?? "No data";
    case "scripture": return SCRIPTURE_LABELS[summary.scriptureStatus];
  }
}

export function coverageForLayer(summary: CountryMissionSummary | null, layer: MissionLayerId): number | null {
  if (!summary) return null;
  switch (layer) {
    case "unreached": return summary.coverage.classification;
    case "frontier": return summary.coverage.frontier;
    case "evangelical": return summary.coverage.evangelical;
    case "religion": return summary.coverage.religion;
    case "scripture": return summary.coverage.scripture;
  }
}
