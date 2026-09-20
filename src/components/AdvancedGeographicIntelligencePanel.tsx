import { Database, Globe2, MapPinned, UsersRound } from "lucide-preact";
import { useMemo, useState } from "preact/hooks";

import { hrefFor } from "../app/router";
import {
  buildPeopleGeographicIntelligence,
  type GeographicDistributionCountry,
} from "../geography/intelligence";
import type { MapCountryFeature } from "../map/types";
import { formatPeopleCount, usePeopleProfileCorpus, type PeopleProfileRecord } from "../peoples";

function populationLabel(country: GeographicDistributionCountry): string {
  if (!country.populationKnownRecordCount) return "Population not reported";
  const value = formatPeopleCount(country.knownPopulation);
  return country.populationCoverageComplete
    ? value + " represented population estimate"
    : value + " known · " + country.populationKnownRecordCount + "/" + country.recordCount + " records report population";
}

function classificationLabel(country: GeographicDistributionCountry): string {
  const parts = [];
  if (country.unreachedRecordCount) parts.push(country.unreachedRecordCount + " GSEC 0–3");
  if (country.otherRecordCount) parts.push(country.otherRecordCount + " GSEC 4–6");
  if (country.unknownRecordCount) parts.push(country.unknownRecordCount + " unknown");
  return parts.join(" · ") || "Mission status unknown";
}

export function AdvancedGeographicIntelligencePanel({
  record,
  countriesByIso3,
}: {
  record: PeopleProfileRecord;
  countriesByIso3: ReadonlyMap<string, MapCountryFeature>;
}) {
  const [loadWider, setLoadWider] = useState(false);
  const corpus = usePeopleProfileCorpus(loadWider);
  const corpusEntities = corpus.ready ? corpus.entities : [record];
  const intelligence = useMemo(
    () => buildPeopleGeographicIntelligence(record, corpusEntities, countriesByIso3),
    [record, corpusEntities, countriesByIso3],
  );

  const hasWiderEvidence = intelligence.records.some((item) => item.evidence === "same-rop3-taxonomy");

  return (
    <section
      class="advanced-geographic-intelligence"
      aria-labelledby="advanced-geography-heading"
      data-phase17-geographic-intelligence="true"
      data-distribution-evidence={intelligence.distributionEvidence}
      data-country-count={intelligence.countries.length}
    >
      <div class="advanced-geographic-intelligence__heading">
        <div>
          <span class="eyebrow">Advanced geographic intelligence</span>
          <h2 id="advanced-geography-heading">Where does the current source place this people record?</h2>
        </div>
        <Globe2 size={22} aria-hidden="true" />
      </div>

      <p class="advanced-geographic-intelligence__intro">
        This view starts with the current PGID country context. Wider distribution appears only when another PeopleGroups.org record reports the exact same ROP3 people-name field.
      </p>

      <div class="advanced-geographic-intelligence__boundary" role="note">
        <strong>Country-level evidence, not a diaspora map.</strong>
        <p>{intelligence.diasporaExplanation}</p>
      </div>

      <div class="advanced-geographic-intelligence__stats" aria-label="Geographic evidence summary">
        <div><span>Source-linked records</span><strong>{intelligence.records.length}</strong></div>
        <div><span>Countries represented</span><strong>{intelligence.countries.length}</strong></div>
        <div><span>Natural Earth regions</span><strong>{intelligence.regions.length}</strong></div>
        <div>
          <span>Population coverage</span>
          <strong>{intelligence.populationKnownRecordCount}/{intelligence.records.length}</strong>
          <small>{intelligence.populationKnownRecordCount ? formatPeopleCount(intelligence.knownPopulation) + " summed known estimates" : "No linked population estimates"}</small>
        </div>
      </div>

      {!corpus.ready ? (
        <div class="advanced-geographic-intelligence__load">
          <Database size={18} aria-hidden="true" />
          <div>
            <strong>Current country context is available now.</strong>
            <p>Cross-country source-linked distribution requires the complete PeopleGroups.org corpus because matching ROP3 records may exist outside this profile's country.</p>
          </div>
          <button type="button" onClick={() => setLoadWider(true)} disabled={corpus.loading}>
            {corpus.loading ? "Loading wider source context…" : "Load wider source distribution"}
          </button>
        </div>
      ) : null}

      {corpus.error && !corpus.ready ? (
        <div class="advanced-geographic-intelligence__notice" role="status">
          <strong>Wider distribution context is unavailable.</strong>
          <p>{corpus.error} The current PGID country context remains valid.</p>
        </div>
      ) : null}

      {corpus.ready && !hasWiderEvidence ? (
        <div class="advanced-geographic-intelligence__notice" role="note">
          <strong>No cross-country ROP3 match is present in the current corpus.</strong>
          <p>This means only that no other loaded PGID reports the exact same ROP3 people-name field. It does not prove the people are absent from other countries or that no diaspora exists.</p>
        </div>
      ) : null}

      <div class="advanced-geographic-intelligence__layout">
        <div class="advanced-geographic-intelligence__countries">
          <div class="advanced-geographic-intelligence__section-heading">
            <div><span class="eyebrow">Source-linked distribution</span><h3>Country contexts</h3></div>
            <MapPinned size={18} aria-hidden="true" />
          </div>

          {intelligence.countries.map((country) => (
            <article class="advanced-geographic-country" key={country.iso3}>
              <div class="advanced-geographic-country__head">
                <div>
                  <span>{country.includesCurrentRecord ? "Current PGID country" : "Same ROP3 source taxonomy"}</span>
                  <h4><a href={hrefFor("/countries/" + country.iso3)}>{country.name}</a></h4>
                  <p>{country.naturalEarthRegion ?? "Natural Earth region unresolved"} · {country.iso3}</p>
                </div>
                <strong>{country.recordCount} {country.recordCount === 1 ? "record" : "records"}</strong>
              </div>
              <div class="advanced-geographic-country__facts">
                <span>{populationLabel(country)}</span>
                <span>{classificationLabel(country)}</span>
              </div>
              <details>
                <summary>Source records ({country.records.length})</summary>
                <div class="advanced-geographic-country__records">
                  {country.records.map((item) => (
                    <a href={hrefFor("/peoples/" + item.peid)} key={item.pgid}>
                      <strong>{item.peopleName}</strong>
                      <span>{item.pgid} · PEID {item.peid}</span>
                      <small>{item.languageName ?? item.languageIso6393 ?? "Language not reported"}{item.population === null ? " · population unknown" : " · " + formatPeopleCount(item.population)}</small>
                    </a>
                  ))}
                </div>
              </details>
            </article>
          ))}
        </div>

        <aside class="advanced-geographic-intelligence__rail">
          <section>
            <div class="advanced-geographic-intelligence__section-heading">
              <div><span class="eyebrow">Regional context</span><h3>Continents represented</h3></div>
              <Globe2 size={18} aria-hidden="true" />
            </div>
            <div class="advanced-geographic-regions">
              {intelligence.regions.map((region) => (
                <div key={region.name}>
                  <strong>{region.name}</strong>
                  <span>{region.countryCount} {region.countryCount === 1 ? "country" : "countries"} · {region.recordCount} source {region.recordCount === 1 ? "record" : "records"}</span>
                  <small>{region.populationKnownRecordCount ? formatPeopleCount(region.knownPopulation) + " summed known estimates" : "Population not reported"}</small>
                </div>
              ))}
            </div>
          </section>

          <section class="advanced-geographic-intelligence__diaspora">
            <div class="advanced-geographic-intelligence__section-heading">
              <div><span class="eyebrow">Diaspora evidence</span><h3>Not established</h3></div>
              <UsersRound size={18} aria-hidden="true" />
            </div>
            <p>The certified source set does not currently establish migration direction, diaspora identity, origin/destination history, settlement dates, or city-level communities for this profile.</p>
          </section>
        </aside>
      </div>

      <details class="advanced-geographic-intelligence__method">
        <summary>How to interpret this geography</summary>
        <ul>{intelligence.boundaries.map((item) => <li key={item}>{item}</li>)}</ul>
      </details>
    </section>
  );
}
