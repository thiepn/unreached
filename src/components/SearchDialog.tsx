import { ArrowUpRight, Clock3, Globe2, Languages, Search, UsersRound, X } from "lucide-preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";

import { useLiveCountryExplorer } from "../countries";
import { buildSearchDocuments, searchDocuments, type SearchDomain } from "../discovery/search";
import { useLanguageExplorer } from "../languages";
import { useWorldGeography } from "../map/geography";
import { useLivePeopleExplorer } from "../peoples";
import { usePersonalization } from "../personalization";
import { entityTaxonomy } from "../providers/peoplegroups";

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

const FOCUSABLE_SELECTOR = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function OpenSearchDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const peoples = useLivePeopleExplorer();
  const countries = useLiveCountryExplorer();
  const languages = useLanguageExplorer();
  const geography = useWorldGeography();
  const personalization = usePersonalization();

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const id = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(id);
      previousFocusRef.current?.focus({ preventScroll: true });
      previousFocusRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter((element) => !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true");
      if (!focusable.length) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const documents = useMemo(() => {
    const geographicCountries = geography.countries.flatMap((feature) => {
      const rawIso = feature.properties.iso3 || feature.properties.adminA3;
      const iso3 = typeof rawIso === "string" ? rawIso.toUpperCase() : "";
      if (!/^[A-Z]{3}$/.test(iso3)) return [];
      const record = countries.countriesByIso3.get(iso3);
      return [{ iso3, name: record?.name ?? feature.properties.name, regionName: record?.regionName ?? feature.properties.continent ?? null }];
    });

    return buildSearchDocuments({
      peoples: peoples.peoples.map((people) => {
        const taxonomy = entityTaxonomy(people);
        return {
          sourcePeopleId: people.routeKey,
          name: people.displayName,
          primaryLanguageName: people.primaryLanguage?.name ?? null,
          primaryReligionName: people.primaryReligion?.name ?? null,
          largestCountryName: people.contexts[0]?.country.name ?? null,
          cluster: taxonomy.peopleCluster,
          affinityBloc: taxonomy.affinityBloc,
        };
      }),
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
  }, [countries.countriesByIso3, geography.countries, peoples.peoples, languages.dataset]);

  const results = useMemo(() => searchDocuments(documents, query, 18), [documents, query]);
  const grouped = useMemo(() => (["people", "country", "language"] as const).map((domain) => ({ domain, results: results.filter((result) => result.domain === domain) })).filter((group) => group.results.length), [results]);

  useEffect(() => setActiveIndex(0), [query]);

  const activate = (href: string) => {
    onClose();
    window.location.hash = href.replace(/^#/, "");
  };

  const loadingSource = peoples.loading || countries.loading;
  const sourceError = peoples.error ?? countries.error;

  return (
    <div class="search-overlay" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section ref={dialogRef} class="search-dialog" role="dialog" aria-modal="true" aria-labelledby="global-search-heading">
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
          {loadingSource ? <p class="search-empty">Loading live PeopleGroups.org search records{peoples.progress ? `… ${peoples.progress.loadedPages}/${peoples.progress.totalPages}` : "…"}</p> : null}
          {sourceError ? <p class="search-empty">Live people/country search is temporarily unavailable: {sourceError}</p> : null}

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
          ) : query.trim() && !loadingSource ? (
            <div class="search-empty search-empty--query"><Search size={22} aria-hidden="true" /><strong>No current result matches “{query}”.</strong><p>People and country results come from the live PeopleGroups.org runtime corpus; country geography remains sourced from Natural Earth.</p></div>
          ) : null}
        </div>

        <footer class="search-dialog__footer"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>Enter</kbd> open</span><span>People/country search uses the current runtime corpus.</span></footer>
      </section>
    </div>
  );
}

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <OpenSearchDialog onClose={onClose} />;
}
