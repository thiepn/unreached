import { ArrowUpRight, Clock3, Globe2, Languages, Search, UsersRound, X } from "lucide-preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";

import { searchDocuments, type SearchDomain } from "../discovery/search";
import { useSharedSearchDocuments } from "../discovery/shared";
import { useDebouncedValue } from "../hooks/useResponsiveWork";
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

const FOCUSABLE_SELECTOR = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function OpenSearchDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const debouncedQuery = useDebouncedValue(query, 90);
  const searchActive = query.trim().length > 0;
  const sharedSearch = useSharedSearchDocuments(searchActive);
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

  const results = useMemo(() => searchDocuments(sharedSearch.documents, debouncedQuery, 18), [sharedSearch.documents, debouncedQuery]);
  const grouped = useMemo(() => (["people", "country", "language"] as const).map((domain) => ({ domain, results: results.filter((result) => result.domain === domain) })).filter((group) => group.results.length), [results]);

  useEffect(() => setActiveIndex(0), [debouncedQuery]);

  const activate = (href: string) => {
    onClose();
    window.location.hash = href.replace(/^#/, "");
  };

  return (
    <div class="search-overlay" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section ref={dialogRef} class="search-dialog" role="dialog" aria-modal="true" aria-labelledby="global-search-heading">
        <header class="search-dialog__header">
          <div><span class="eyebrow">Find anything</span><h2 id="global-search-heading">Search Unreached</h2></div>
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
            placeholder="People, country, language or ID…"
            aria-label="Search peoples, countries or languages"
            aria-activedescendant={results[activeIndex] ? `search-result-${results[activeIndex]!.id}` : undefined}
          />
          <kbd>Esc</kbd>
        </div>

        <div class="search-dialog__body">
          {sharedSearch.loading ? <p class="search-empty">Loading live people and language records{sharedSearch.progress ? `… ${sharedSearch.progress.loadedPages}/${sharedSearch.progress.totalPages}` : "…"}</p> : null}
          {sharedSearch.error ? <p class="search-empty">Live people and language search is temporarily unavailable: {sharedSearch.error}</p> : null}

          {!query.trim() ? (
            <section class="search-recents" aria-labelledby="search-recent-heading">
              <div class="search-section-label" id="search-recent-heading"><Clock3 size={14} aria-hidden="true" /> Recent</div>
              {personalization.state.recent.length ? personalization.state.recent.slice(0, 8).map((item) => {
                const Icon = item.kind === "country" ? Globe2 : item.kind === "language" ? Languages : UsersRound;
                return <a href={item.href} class="search-recent-row" key={`${item.kind}:${item.key}`} onClick={onClose}><Icon size={17} aria-hidden="true" /><span><strong>{item.label}</strong><small>{item.secondary ?? item.kind}</small></span><ArrowUpRight size={14} aria-hidden="true" /></a>;
              }) : <p class="search-empty">Type above to search. The full remote corpus is loaded only when you need it.</p>}
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
                      <a id={`search-result-${result.id}`} href={result.href} class={`search-result-row${index === activeIndex ? " is-active" : ""}`} key={result.id} onMouseEnter={() => setActiveIndex(index)} onClick={onClose}>
                        <Icon size={18} aria-hidden="true" /><span><strong>{result.label}</strong><small>{result.secondary ?? result.domain}</small></span><ArrowUpRight size={14} aria-hidden="true" />
                      </a>
                    );
                  })}
                </section>
              ))}
            </div>
          ) : debouncedQuery.trim() && !sharedSearch.loading ? (
            <div class="search-empty search-empty--query"><Search size={22} aria-hidden="true" /><strong>No current result matches “{debouncedQuery}”.</strong><p>Country geography is local; people and language results use the live PeopleGroups.org runtime corpus.</p></div>
          ) : null}
        </div>

        <footer class="search-dialog__footer"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>Enter</kbd> open</span><span>Live corpus loads on demand.</span></footer>
      </section>
    </div>
  );
}

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <OpenSearchDialog onClose={onClose} />;
}
