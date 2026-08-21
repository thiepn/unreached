import type { ScriptureResources } from "./schemas";

export const RELIGION_NAMES: Readonly<Record<number, string>> = {
  1: "Christianity",
  2: "Buddhism",
  4: "Ethnic Religions",
  5: "Hinduism",
  6: "Islam",
  8: "Other / Smaller Religions",
  9: "Unknown",
};

export const BIBLE_STATUS: Readonly<Record<number, ScriptureResources["bibleStatus"]>> = {
  0: "unknown",
  1: "translation-needed",
  2: "translation-started",
  3: "portions",
  4: "new-testament",
  5: "complete-bible",
};

export const LANGUAGE_STATUS = {
  L: "living",
  E: "extinct",
  N: "nearly-extinct",
  H: "historical",
  A: "ancient",
  C: "constructed",
} as const;
