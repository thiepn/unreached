import { ArrowUpRight, Languages } from "lucide-preact";

import { hrefFor } from "../app/router";
import { formatLanguageScripture, useLanguageExplorer } from "../languages";
import { usePeopleExplorer } from "../peoples";

export function PeopleLanguageConnection({ sourcePeopleId }: { sourcePeopleId: number }) {
  const people = usePeopleExplorer();
  const record = people.peopleBySourceId.get(sourcePeopleId) ?? null;
  if (!record?.primaryLanguage) return null;
  return (
    <aside class="language-connection-panel" aria-label="Language profile">
      <Languages size={19} aria-hidden="true" />
      <div><span class="eyebrow">Language connection</span><strong>{record.primaryLanguage.name}</strong><small>{record.primaryLanguage.iso6393.toUpperCase()} · {formatLanguageScripture(record.primaryLanguage.scripture.bibleStatus)}</small></div>
      <a href={hrefFor(`/languages/${record.primaryLanguage.iso6393}`)}>Open language profile <ArrowUpRight size={14} aria-hidden="true" /></a>
    </aside>
  );
}

export function CountryLanguageConnections({ iso3 }: { iso3: string }) {
  const explorer = useLanguageExplorer();
  if (!explorer.dataset) return null;
  const code = iso3.toUpperCase();
  const related = explorer.dataset.languages.filter((language) => language.countries.some((country) => country.iso3 === code)).sort((a, b) => {
    const popA = a.countries.find((country) => country.iso3 === code)?.knownPopulation ?? 0;
    const popB = b.countries.find((country) => country.iso3 === code)?.knownPopulation ?? 0;
    return popB - popA || a.name.localeCompare(b.name);
  }).slice(0, 12);
  if (!related.length) return null;
  return (
    <aside class="country-language-connections" aria-labelledby="country-language-connections-heading">
      <div><span class="eyebrow">Languages & Scripture</span><h2 id="country-language-connections-heading">Explore language profiles</h2><p>Language relationships are derived from published country-specific people records.</p></div>
      <div class="country-language-link-grid">{related.map((language) => <a href={hrefFor(`/languages/${language.iso6393}`)} key={language.languageId}><strong>{language.name}</strong><span>{language.iso6393.toUpperCase()} · {formatLanguageScripture(language.scripture.bibleStatus)}</span></a>)}</div>
      <a class="inline-link" href={hrefFor("/languages")}>Browse all languages <ArrowUpRight size={14} aria-hidden="true" /></a>
    </aside>
  );
}
