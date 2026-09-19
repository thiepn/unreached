import { BookOpen, Globe2, Languages, Link2 } from "lucide-preact";
import { useEffect, useMemo, useState } from "preact/hooks";

import { hrefFor } from "../app/router";
import {
  coRepresentedLanguages,
  languageEvidenceStateLabel,
  languageResourceCombinations,
  languageResourceEvidence,
  relatedFamilyLanguages,
} from "../languages/intelligence";
import type { LiveLanguageBreakdownItem, LiveLanguageRecord } from "../languages/live";
import { formatLanguageCount } from "../languages/format";

const CONTEXT_BATCH_SIZE = 16;
const RELATED_LANGUAGE_LIMIT = 8;

function labelsText(items: readonly LiveLanguageBreakdownItem[]): string {
  if (!items.length) return "No source labels";
  return items.map((item) => `${item.label} (${item.contextCount})`).join(" · ");
}

function sourceValue(value: string | number | null): string {
  return value === null ? "Not reported" : String(value);
}

function sourceDate(value: string | null): string {
  if (!value) return "Not supplied";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not supplied";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export function LanguageIntelligencePanel({
  record,
  languages,
}: {
  record: LiveLanguageRecord;
  languages: readonly LiveLanguageRecord[];
}) {
  const evidence = useMemo(() => languageResourceEvidence(record), [record]);
  const combinations = useMemo(() => languageResourceCombinations(record), [record]);
  const familyLanguages = useMemo(() => relatedFamilyLanguages(record, languages), [record, languages]);
  const countryLanguages = useMemo(() => coRepresentedLanguages(record, languages), [record, languages]);
  const [visibleContextCount, setVisibleContextCount] = useState(CONTEXT_BATCH_SIZE);

  useEffect(() => {
    setVisibleContextCount(CONTEXT_BATCH_SIZE);
  }, [record.iso6393]);

  const visibleContexts = record.contexts.slice(0, visibleContextCount);
  const remainingContexts = Math.max(0, record.contexts.length - visibleContexts.length);

  return (
    <section
      class="language-intelligence"
      aria-labelledby="language-intelligence-heading"
      data-phase15-language-intelligence="true"
    >
      <div class="language-intelligence__heading">
        <div>
          <span class="eyebrow">Scripture & language intelligence</span>
          <h2 id="language-intelligence-heading">Read the evidence behind the resource labels.</h2>
        </div>
        <BookOpen size={22} aria-hidden="true" />
      </div>

      <div class="language-intelligence-boundary" role="note">
        <strong>Source evidence, not a translation-status database.</strong>
        <p>PeopleGroups.org reports Bible availability, Jesus Film availability and total evangelical-resource counts for individual PGID country contexts. Unreached preserves those source values and their disagreements. It does not turn them into inferred “portions,” “New Testament,” “complete Bible,” dialect-fit, literacy, comprehension or actual-use claims.</p>
      </div>

      <div class="language-intelligence-summary-grid" aria-label="Language resource evidence summary">
        <article>
          <span>Bible availability reporting</span>
          <strong>{languageEvidenceStateLabel(evidence.bible)}</strong>
          <small>{labelsText(evidence.bible.labels)}</small>
        </article>
        <article>
          <span>Jesus Film reporting</span>
          <strong>{languageEvidenceStateLabel(evidence.jesusFilm)}</strong>
          <small>{labelsText(evidence.jesusFilm.labels)}</small>
        </article>
        <article>
          <span>Resource-count reporting</span>
          <strong>{languageEvidenceStateLabel(evidence.totalResources)}</strong>
          <small>{labelsText(evidence.totalResources.labels)}</small>
        </article>
        <article>
          <span>Language-family reporting</span>
          <strong>{languageEvidenceStateLabel(evidence.family)}</strong>
          <small>{labelsText(evidence.family.labels)}</small>
        </article>
      </div>

      <div class="language-intelligence-grid">
        <section class="language-intelligence-card" aria-labelledby="resource-combinations-heading">
          <div class="language-section__heading">
            <div><span class="eyebrow">Observed combinations</span><h3 id="resource-combinations-heading">Resource fields together</h3></div>
            <Link2 size={18} aria-hidden="true" />
          </div>
          <p>These combinations describe what the same PeopleGroups.org country-context record reported. They are descriptive co-occurrences, not evidence that one resource caused another.</p>
          <ul class="language-intelligence-combinations">
            {combinations.map((item, index) => (
              <li key={`${item.bibleAvailability ?? "null"}-${item.jesusFilmAvailability ?? "null"}-${item.totalResources ?? "null"}-${index}`}>
                <strong>{item.contextCount} {item.contextCount === 1 ? "context" : "contexts"}</strong>
                <span>Bible: {sourceValue(item.bibleAvailability)} · Jesus Film: {sourceValue(item.jesusFilmAvailability)} · Resource total: {sourceValue(item.totalResources)}</span>
                <small>{item.countries.join(", ")}{item.peopleNames.length ? ` · ${item.peopleNames.slice(0, 3).join(", ")}${item.peopleNames.length > 3 ? "…" : ""}` : ""}</small>
              </li>
            ))}
          </ul>
        </section>

        <section class="language-intelligence-card" aria-labelledby="family-context-heading">
          <div class="language-section__heading">
            <div><span class="eyebrow">Language family</span><h3 id="family-context-heading">Related source labels</h3></div>
            <Languages size={18} aria-hidden="true" />
          </div>
          <p>Relationships below mean that PeopleGroups.org reports the same language-family label. A shared family label does not establish mutual intelligibility, dialect equivalence or interchangeable Scripture resources.</p>
          {familyLanguages.length ? (
            <div class="language-intelligence-links">
              {familyLanguages.slice(0, RELATED_LANGUAGE_LIMIT).map((language) => (
                <a href={hrefFor(`/languages/${language.iso6393}`)} key={language.iso6393}>
                  <strong>{language.name}</strong>
                  <span>{language.iso6393.toUpperCase()} · {language.sharedFamilyLabels.join(", ")}</span>
                  <small>{language.contextCount} source contexts · {language.countryCount} {language.countryCount === 1 ? "country" : "countries"}</small>
                </a>
              ))}
            </div>
          ) : <p class="language-empty">No other current language record shares the reported family label.</p>}
          {familyLanguages.length > RELATED_LANGUAGE_LIMIT ? <small class="language-intelligence-more">{familyLanguages.length - RELATED_LANGUAGE_LIMIT} more same-family source records are available through language search.</small> : null}
        </section>
      </div>

      <section class="language-intelligence-card language-intelligence-card--wide" aria-labelledby="country-language-context-heading">
        <div class="language-section__heading">
          <div><span class="eyebrow">Same-country language context</span><h3 id="country-language-context-heading">Other primary languages represented nearby</h3></div>
          <Globe2 size={18} aria-hidden="true" />
        </div>
        <p>These languages appear as the primary language of other PeopleGroups.org records in one or more of the same countries. This shows geographic language diversity only; it does not mean the people represented here are bilingual or that resources transfer between languages.</p>
        {countryLanguages.length ? (
          <div class="language-intelligence-links language-intelligence-links--countries">
            {countryLanguages.slice(0, RELATED_LANGUAGE_LIMIT).map((language) => (
              <a href={hrefFor(`/languages/${language.iso6393}`)} key={language.iso6393}>
                <strong>{language.name}</strong>
                <span>{language.iso6393.toUpperCase()} · shared {language.sharedCountries.map((country) => country.name).join(", ")}</span>
                <small>{language.contextCountInSharedCountries} source {language.contextCountInSharedCountries === 1 ? "context" : "contexts"} · {formatLanguageCount(language.knownPopulationInSharedCountries)} represented population where reported</small>
              </a>
            ))}
          </div>
        ) : <p class="language-empty">No other current ISO-coded language record is represented in the same source countries.</p>}
        {countryLanguages.length > RELATED_LANGUAGE_LIMIT ? <small class="language-intelligence-more">{countryLanguages.length - RELATED_LANGUAGE_LIMIT} more co-represented language records are available through language search.</small> : null}
      </section>

      <details class="language-intelligence-evidence">
        <summary>PGID evidence behind these statements · {record.contexts.length} {record.contexts.length === 1 ? "record" : "records"}</summary>
        <div class="language-intelligence-evidence__body">
          <p>Each row is one PeopleGroups.org people-group-in-country record reporting {record.iso6393.toUpperCase()} as its primary-language code. Missing fields remain missing.</p>
          <div class="language-intelligence-table-wrap">
            <table class="language-intelligence-table">
              <thead>
                <tr>
                  <th>People record</th>
                  <th>Country</th>
                  <th>Bible</th>
                  <th>Jesus Film</th>
                  <th>Resources</th>
                  <th>Source updated</th>
                </tr>
              </thead>
              <tbody>
                {visibleContexts.map((context) => (
                  <tr key={context.pgid}>
                    <th scope="row">
                      <a href={hrefFor(`/peoples/${context.peid}`)}>{context.peopleName}</a>
                      <small>{context.pgid}</small>
                    </th>
                    <td>{context.countryName}</td>
                    <td>{sourceValue(context.bibleAvailability)}</td>
                    <td>{sourceValue(context.jesusFilmAvailability)}</td>
                    <td>{sourceValue(context.totalResources)}</td>
                    <td>{sourceDate(context.sourceUpdatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {remainingContexts ? (
            <div class="result-load-more result-load-more--detail">
              <button type="button" onClick={() => setVisibleContextCount((current) => Math.min(current + CONTEXT_BATCH_SIZE, record.contexts.length))}>
                Show {Math.min(CONTEXT_BATCH_SIZE, remainingContexts)} more
              </button>
              <span>{remainingContexts} remaining</span>
            </div>
          ) : null}
        </div>
      </details>
    </section>
  );
}
