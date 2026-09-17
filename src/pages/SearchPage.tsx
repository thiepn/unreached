import { ArrowRight, Compass, Database, Globe2, Languages, MapPinned, Search, UsersRound } from "lucide-preact";
import { useLayoutEffect, useMemo, useState } from "preact/hooks";

import { readHashSearchParams, replaceHashSearchParams, setOptionalHashParam } from "../app/hash-state";
import { hrefFor } from "../app/router";
import { useEditorialContext } from "../context";
import { searchDocuments, type SearchDomain } from "../discovery/search";
import { useSharedSearchDocuments } from "../discovery/shared";
import { useDebouncedValue } from "../hooks/useResponsiveWork";

type SearchScope = "all" | SearchDomain;

const scopes: Array<{ id: SearchScope; label: string }> = [
  { id: "all", label: "All" },
  { id: "people", label: "Peoples" },
  { id: "region", label: "Regions" },
  { id: "country", label: "Countries" },
  { id: "language", label: "Languages" },
];

function initialState(): { query: string; scope: SearchScope } {
  const params = readHashSearchParams();
  const rawScope = params.get("scope") as SearchScope | null;
  return {
    query: params.get("q") ?? "",
    scope: scopes.some((item) => item.id === rawScope) ? rawScope! : "all",
  };
}

function iconFor(domain: SearchDomain) {
  if (domain === "region") return MapPinned;
  if (domain === "country") return Globe2;
  if (domain === "language") return Languages;
  return UsersRound;
}

function domainLabel(domain: SearchDomain): string {
  if (domain === "region") return "Region";
  if (domain === "country") return "Country";
  if (domain === "language") return "Language";
  return "People";
}

function sourcePeopleId(id: string): number | null {
  if (!id.startsWith("people:")) return null;
  const value = Number(id.slice("people:".length));
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

export function SearchPage() {
  const initial = useMemo(initialState, []);
  const [query, setQuery] = useState(initial.query);
  const [scope, setScope] = useState<SearchScope>(initial.scope);
  const debouncedQuery = useDebouncedValue(query, 90);
  const shared = useSharedSearchDocuments(true);
  const editorial = useEditorialContext(true);

  useLayoutEffect(() => {
    const params = new URLSearchParams();
    setOptionalHashParam(params, "q", query);
    setOptionalHashParam(params, "scope", scope, "all");
    replaceHashSearchParams(params);
  }, [query, scope]);

  const results = useMemo(() => {
    const searchable = scope === "all" ? shared.documents : shared.documents.filter((document) => document.domain === scope);
    return searchDocuments(searchable, debouncedQuery, 80);
  }, [shared.documents, debouncedQuery, scope]);

  const grouped = useMemo(() => {
    const domains: SearchDomain[] = ["people", "region", "country", "language"];
    return domains
      .map((domain) => ({ domain, results: results.filter((result) => result.domain === domain) }))
      .filter((group) => group.results.length > 0);
  }, [results]);

  return (
    <section class="v3-search-page" aria-labelledby="search-page-title" data-v3-search="true">
      <header class="v3-search-hero">
        <div>
          <span class="v3-type-label">Search the atlas</span>
          <h1 id="search-page-title" class="v3-type-display-xl">Find a people or place.</h1>
          <p class="v3-type-body-lg v3-reading">Search across people groups, world regions, countries and languages. Direct results jump to the same definitive atlas destinations used by Explore.</p>
        </div>
        <Compass size={40} aria-hidden="true" />
      </header>

      <div class="v3-search-workspace">
        <label class="v3-search-field" for="atlas-search-input">
          <Search size={22} aria-hidden="true" />
          <span class="sr-only">Search the atlas</span>
          <input
            id="atlas-search-input"
            type="search"
            value={query}
            onInput={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search peoples, regions, countries or languages…"
            autoComplete="off"
          />
        </label>

        <div class="v3-search-scopes" role="group" aria-label="Search scope">
          {scopes.map((item) => (
            <button
              key={item.id}
              type="button"
              class={scope === item.id ? "is-active" : ""}
              aria-pressed={scope === item.id}
              onClick={() => setScope(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {shared.loading ? (
        <div class="v3-discovery-state" role="status">
          <Database size={18} aria-hidden="true" />
          <span>Preparing the live people and language index{shared.progress ? `… ${shared.progress.loadedPages}/${shared.progress.totalPages}` : "…"}</span>
        </div>
      ) : null}
      {shared.error ? <div class="v3-discovery-state v3-discovery-state--error" role="alert">Search data is temporarily incomplete: {shared.error}</div> : null}

      {!query.trim() ? (
        <section class="v3-search-start" aria-labelledby="search-start-title">
          <span class="v3-type-label">Ways in</span>
          <h2 id="search-start-title" class="v3-type-heading-xl">Browse before you know a name.</h2>
          <div class="v3-search-start__links">
            <a href={hrefFor("/peoples")}><UsersRound size={20} aria-hidden="true" /><span><strong>Discover peoples</strong><small>Guided collections and a simpler people browser</small></span><ArrowRight size={18} aria-hidden="true" /></a>
            <a href={hrefFor("/regions")}><MapPinned size={20} aria-hidden="true" /><span><strong>Explore regions</strong><small>World → Region → Country → People</small></span><ArrowRight size={18} aria-hidden="true" /></a>
            <a href={hrefFor("/countries")}><Globe2 size={20} aria-hidden="true" /><span><strong>Browse countries</strong><small>Geographic context with current source records</small></span><ArrowRight size={18} aria-hidden="true" /></a>
          </div>
        </section>
      ) : grouped.length ? (
        <div class="v3-search-results" aria-live="polite">
          <div class="v3-search-results__summary"><strong>{results.length}</strong> result{results.length === 1 ? "" : "s"} for “{debouncedQuery}”</div>
          {grouped.map((group) => (
            <section class="v3-search-group" key={group.domain} aria-labelledby={`search-group-${group.domain}`}>
              <div class="v3-search-group__heading">
                <h2 id={`search-group-${group.domain}`}>{domainLabel(group.domain)}{group.results.length === 1 ? "" : "s"}</h2>
                <span>{group.results.length}</span>
              </div>
              <div class="v3-search-result-list">
                {group.results.map((result) => {
                  const Icon = iconFor(result.domain);
                  const peid = sourcePeopleId(result.id);
                  const reviewed = peid !== null && editorial.profilesByPeid.has(peid);
                  return (
                    <a class="v3-search-result" href={result.href} key={result.id}>
                      <Icon size={20} aria-hidden="true" />
                      <span class="v3-search-result__copy">
                        <strong>{result.label}</strong>
                        <small>{result.secondary ?? domainLabel(result.domain)}</small>
                      </span>
                      {result.domain === "people" ? (
                        <span class={`v3-depth-tag ${reviewed ? "is-reviewed" : "is-source"}`}>{reviewed ? "Reviewed context" : "Source profile"}</span>
                      ) : <span class="v3-search-result__domain">{domainLabel(result.domain)}</span>}
                      <ArrowRight size={18} aria-hidden="true" />
                    </a>
                  );
                })}
              </div>
            </section>
          ))}
          {results.some((result) => result.domain === "people") ? (
            <p class="v3-search-depth-note">“Reviewed context” describes editorial research depth. It does not indicate that a people group is more important, more urgent or more worthy of prayer.</p>
          ) : null}
        </div>
      ) : debouncedQuery.trim() && !shared.loading ? (
        <div class="v3-search-empty">
          <Search size={24} aria-hidden="true" />
          <h2>No matching atlas entry</h2>
          <p>Try a people name, country, region, language, ISO code or PeopleGroups source ID.</p>
          <button type="button" class="v3-button v3-button--secondary" onClick={() => { setQuery(""); setScope("all"); }}>Clear search</button>
        </div>
      ) : null}
    </section>
  );
}
