import type { DataQuality, ScriptureResources } from "../domain";

export function formatPeopleCount(value: number | null): string {
  if (value === null) return "Unknown";
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function formatPeoplePercent(value: number | null): string {
  if (value === null) return "Unknown";
  if (value > 0 && value < 0.1) return "<0.1%";
  return `${new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(value)}%`;
}

export function formatPeopleScripture(value: ScriptureResources["bibleStatus"]): string {
  return ({
    unknown: "Unknown",
    "translation-needed": "Translation needed",
    "translation-started": "Translation started",
    portions: "Portions",
    "new-testament": "New Testament",
    "complete-bible": "Complete Bible",
  } as const)[value];
}

export function formatDataQuality(value: DataQuality): string {
  return ({ exact: "Exact", estimated: "Estimated", rounded: "Rounded", unknown: "Quality unknown" } as const)[value];
}

export function formatBooleanAvailability(value: boolean | null): string {
  if (value === null) return "Unknown";
  return value ? "Available" : "Not reported available";
}
