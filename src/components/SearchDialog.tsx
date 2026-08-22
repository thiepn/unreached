import { ArrowUpRight, Clock3, Globe2, Languages, Search, UsersRound, X } from "lucide-preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";

import { useCountryExplorer } from "../countries";
import { buildSearchDocuments, searchDocuments, type SearchDomain } from "../discovery/search";
import { useLanguageExplorer } from "../languages";
import { useWorldGeography } from "../map/geography";
import { usePeopleExplorer } from "../peoples";
import { usePersonalization } from "../personalization";

function domainIcon(domain: SearchDomain) {
  if (domain === "country") return Globe2;
  if (domain === "language") return Languages;
  return UsersRound;
}

function domainLabel(domain: SearchDomain): string {
  if (domain === "country") return "Countries";
  if (domain === "language") return "Languages";
  return "Peoples";
}

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const peoples = usePeopleExplorer();
  const countries = useCountryExplorer();
  const languages = useLanguageExplorer();
  const geography = useWorldGeography();
  const personalization = usePersonalization();

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    const id = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const documents = useMemo(() => {
    const countryRecords = countries.countriesByIso3;
    const geographicCountries = geography.countries.flatMap((feature) => {
      const rawIso = feature.properties.iso3 || feature.properties.adminA3;
      const iso3 = typeof rawIso === "string" ? rawIso.toUpperCase() : "";
      if (!/^[A-Z]{3}$/.test(iso3)) return [];
      const record = countryRecords.get(iso3);
      return [{ iso3, name: record?.name ?? feature.properties.name, regionName: record?.regionName ?? feature.properties.continent ?? null }];
    });

    return buildSearchDocuments({
      peoples: (peoples.dataset?.peoples ?? []).map((people) => ({
        sourcePeopleId: people.sourcePeopleId,
        name: people.name,
        primaryLanguageName: people.primaryLanguage?.name ?? null,
        primaryReligionName: people.primaryReligion?.name ?? null,
        largestCountryName: people.largestCountry?.name ?? null,
        cluster: people.cluster,
        affinityBloc: people.affinityBloc,
      })),
      countries: geographicCountries,
      languages: (languages.dataset?.languages ?? []).map((language) => ({
        iso6393: language.iso6393,
        name: language.name,
        familyName: language.familyName,
        branchName: language.branchName,
        countryNames: language.countries.map((country) => country.name),
        peopleNames: language.peoples.map((people) => people.name),
      })),
    });
  }, [countries.countriesByIso3, geography.countries, peoples.dataset, languages.dataset]);

  const results = useMemo(() => searchDocuments(documents, query, 18), [documents, query]);
  const grouped = useMemo(() => (["people", "country", "language"] as const).map((domain) => ({ domain, results: results.filter((result) => result.domain === domain) })).filter((group) => group.results.length), [results]);

  useEffect(() => setActiveIndex(0), [query]);

  if (!open) return null;

  const activate = (href: string) => {
    onClose();
    window.location.hash = href.replace(/^#/, "");
  };

  return (
    <div class="search-overlay" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section class="search-dialog" role="dialog" aria-modal="true" aria-labelledby="global-search-heading">
        <header class="search-dialog__header">
          <div>
            <span class="eyebrow">Global discovery</span>
            <h2 id="global-search-heading">Search Unreached</h2>
          </div>
          <button type="button" class="search-close" aria-label="Close search" onClick={onClose}><X size={19} aria-hidden="true" /></button>
        </header>

        <div class="search-input-wrap">
          <Search size={19} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onInput={(event) => setQuery(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" && results.length) { event.preventDefault(); setActiveIndex((index) => (index + 1) % results.length); }
              if (event.key === "ArrowUp" && results.length) { event.preventDefault(); setActiveIndex((index) => (index - 1 + results.length) % results.length); }
              if (event.key === "Enter" && results[activeIndex]) { event.preventDefault(); activate(results[activeIndex]!.href); }
            }}
            type="search"
            placeholder="Search peoples, countries or languages…"
            aria-label="Search peoples, countries or languages"
            aria-activedescendant={results[activeIndex] ? `search-result-${results[activeIndex]!.id}` : undefined}
          />
          <kbd>Esc</kbd>
        </div>

        <div class="search-dialog__body">
          {!query.trim() ? (
            <section class="search-recents" aria-labelledby="search-recent-heading">
              <div class="search-section-label" id="search-recent-heading"><Clock3 size={14} aria-hidden="true" /> Recent exploration</div>
              {personalization.state.recent.length ? personalization.state.recent.slice(0, 8).map((item) => {
                const Icon = item.kind === "country" ? Globe2 : item.kind === "language" ? Languages : UsersRound;
                return <a href={item.href} class="search-recent-row" key={`${item.kind}:${item.key}`} onClick={onClose}><Icon size={17} aria-hidden="true" /><span><strong>{item.label}</strong><small>{item.secondary ?? item.kind}</small></span><ArrowUpRight size={14} aria-hidden="true" /></a>;
              }) : <p class="search-empty">Start exploring people, country or language profiles. Recent items stay only in this browser.</p>}
            </section>
          ) : grouped.length ? (
            <div class="search-groups">
              {grouped.map((group) => (
                <section class="search-group" key={group.domain} aria-label={domainLabel(group.domain)}>
                  <div class="search-section-label">{domainLabel(group.domain)}</div>
                  {group.results.map((result) => {
                    const index = results.indexOf(result);
                    const Icon = domainIcon(result.domain);
                    return (
                      <a
                        id={`search-result-${result.id}`}
                        href={result.href}
                        class={`search-result-row${index === activeIndex ? " is-active" : ""}`}
                        key={result.id}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={onClose}
                      >
                        <Icon size={18} aria-hidden="true" />
                        <span><strong>{result.label}</strong><small>{result.secondary ?? result.domain}</small></span>
                        <ArrowUpRight size={14} aria-hidden="true" />
                      </a>
                    );
                  })}
                </section>
              ))}
            </div>
          ) : (
            <div class="search-empty search-empty--query"><Search size={22} aria-hidden="true" /><strong>No published result matches “{query}”.</strong><p>Country geography remains searchable from Natural Earth. People and language results appear as their approved datasets are published.</p></div>
          )}
        </div>

        <footer class="search-dialog__footer"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>Enter</kbd> open</span><span>Search reflects currently published datasets.</span></footer>
      </section>
    </div>
  );
}
