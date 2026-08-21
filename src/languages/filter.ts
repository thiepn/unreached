import type { LanguageExplorerRecord } from "./types";

export type LanguageStatusFilter = "all" | LanguageExplorerRecord["status"];
export type ScriptureFilter = "all" | LanguageExplorerRecord["scripture"]["bibleStatus"];
export type LanguageFocusFilter = "all" | "translation-needed" | "no-complete-bible" | "audio-available" | "jesus-film" | "unreached-peoples";
export type LanguageSort = "name" | "people-count-desc" | "represented-population-desc" | "scripture-need-first";

export interface LanguageFilterState {
  query: string;
  status: LanguageStatusFilter;
  scripture: ScriptureFilter;
  focus: LanguageFocusFilter;
  sort: LanguageSort;
}

const scriptureNeedRank: Record<LanguageExplorerRecord["scripture"]["bibleStatus"], number> = {
  "translation-needed": 0,
  "translation-started": 1,
  portions: 2,
  "new-testament": 3,
  "complete-bible": 4,
  unknown: 5,
};

function matchesFocus(record: LanguageExplorerRecord, focus: LanguageFocusFilter): boolean {
  if (focus === "all") return true;
  if (focus === "translation-needed") return record.scripture.bibleStatus === "translation-needed";
  if (focus === "no-complete-bible") return record.scripture.bibleStatus !== "complete-bible" && record.scripture.bibleStatus !== "unknown";
  if (focus === "audio-available") return record.scripture.hasAudioRecordings === true;
  if (focus === "jesus-film") return record.scripture.hasJesusFilm === true;
  return record.unreachedPeopleGroupCount > 0;
}

export function filterLanguages(records: LanguageExplorerRecord[], state: LanguageFilterState): LanguageExplorerRecord[] {
  const query = state.query.trim().toLocaleLowerCase("en");
  const filtered = records.filter((record) => {
    if (state.status !== "all" && record.status !== state.status) return false;
    if (state.scripture !== "all" && record.scripture.bibleStatus !== state.scripture) return false;
    if (!matchesFocus(record, state.focus)) return false;
    if (!query) return true;
    const haystack = [
      record.name,
      record.iso6393,
      record.familyName,
      record.branchName,
      record.primaryReligion?.name,
      ...record.countries.map((country) => country.name),
      ...record.peoples.map((people) => people.name),
    ].filter(Boolean).join(" ").toLocaleLowerCase("en");
    return haystack.includes(query);
  });

  return filtered.sort((a, b) => {
    if (state.sort === "people-count-desc") return b.peopleGroupCount - a.peopleGroupCount || a.name.localeCompare(b.name);
    if (state.sort === "represented-population-desc") return b.knownRepresentedPopulation - a.knownRepresentedPopulation || a.name.localeCompare(b.name);
    if (state.sort === "scripture-need-first") return scriptureNeedRank[a.scripture.bibleStatus] - scriptureNeedRank[b.scripture.bibleStatus] || a.name.localeCompare(b.name);
    return a.name.localeCompare(b.name);
  });
}
