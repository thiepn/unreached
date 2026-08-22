import type { ScriptureResources } from "../domain";

export function formatCount(value: number | null): string {
  if (value === null) return "Unknown";
  return new Intl.NumberFormat("en", { notation: value >= 100000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

export function formatPercent(value: number | null, digits = 1): string {
  if (value === null) return "Unknown";
  return `${value.toFixed(value < 1 ? Math.max(1, digits) : digits)}%`;
}

export function formatScriptureStatus(status: ScriptureResources["bibleStatus"]): string {
  switch (status) {
    case "translation-needed": return "Translation needed";
    case "translation-started": return "Translation started";
    case "portions": return "Portions";
    case "new-testament": return "New Testament";
    case "complete-bible": return "Complete Bible";
    default: return "Unknown";
  }
}
