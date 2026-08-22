import type { ScriptureResources } from "../domain";

const scriptureLabels: Record<ScriptureResources["bibleStatus"], string> = {
  unknown: "Unknown",
  "translation-needed": "Translation needed",
  "translation-started": "Translation started",
  portions: "Scripture portions",
  "new-testament": "New Testament",
  "complete-bible": "Complete Bible",
};

export function formatLanguageScripture(status: ScriptureResources["bibleStatus"]): string {
  return scriptureLabels[status];
}

export function formatLanguageStatus(status: string): string {
  return status.replaceAll("-", " ").replace(/^./, (letter) => letter.toUpperCase());
}

export function formatLanguageCount(value: number): string {
  return new Intl.NumberFormat("en", { notation: value >= 1_000_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

export function formatAvailability(value: boolean | null): string {
  return value === true ? "Available" : value === false ? "Not reported available" : "Unknown";
}
