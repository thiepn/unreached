import { atlasRegionForCountry } from "./regions";
import type { MapCountryFeature } from "../map/types";
import {
  entityTaxonomy,
  type RuntimePeopleEntity,
} from "../providers/peoplegroups";

export type GeographicDistributionEvidence = "current-pgid" | "same-rop3-taxonomy";

export interface GeographicDistributionRecord {
  evidence: GeographicDistributionEvidence;
  peid: number;
  pgid: string;
  peopleName: string;
  countryIso3: string;
  countryName: string;
  naturalEarthRegion: string | null;
  providerRegion: string | null;
  providerSubregion: string | null;
  population: number | null;
  languageIso6393: string | null;
  languageName: string | null;
  missionClassification: "unreached" | "other" | "unknown";
  sourceUpdatedAt: string | null;
}

export interface GeographicDistributionCountry {
  iso3: string;
  name: string;
  naturalEarthRegion: string | null;
  providerRegionLabels: string[];
  providerSubregionLabels: string[];
  recordCount: number;
  includesCurrentRecord: boolean;
  knownPopulation: number;
  populationKnownRecordCount: number;
  populationCoverageComplete: boolean;
  unreachedRecordCount: number;
  otherRecordCount: number;
  unknownRecordCount: number;
  records: GeographicDistributionRecord[];
}

export interface GeographicDistributionRegion {
  name: string;
  countryCount: number;
  recordCount: number;
  knownPopulation: number;
  populationKnownRecordCount: number;
}

export interface PeopleGeographicIntelligence {
  schemaVersion: 1;
  sourcePeopleName: string | null;
  precision: "country-context";
  distributionEvidence: "current-country-only" | "cross-country-source-taxonomy";
  records: GeographicDistributionRecord[];
  countries: GeographicDistributionCountry[];
  regions: GeographicDistributionRegion[];
  knownPopulation: number;
  populationKnownRecordCount: number;
  populationCoverageComplete: boolean;
  diasporaStatus: "not-established";
  diasporaExplanation: string;
  boundaries: string[];
}

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase("en").replace(/\s+/g, " ");
}

function unique(values: Array<string | null>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value?.trim())).map((value) => value.trim()))]
    .sort((a, b) => a.localeCompare(b, "en"));
}

function regionForCountry(
  iso3: string,
  countriesByIso3: ReadonlyMap<string, MapCountryFeature>,
): string | null {
  const feature = countriesByIso3.get(iso3);
  return feature ? atlasRegionForCountry(feature)?.name ?? null : null;
}

function toDistributionRecord(
  entity: RuntimePeopleEntity,
  evidence: GeographicDistributionEvidence,
  countriesByIso3: ReadonlyMap<string, MapCountryFeature>,
): GeographicDistributionRecord {
  const context = entity.contexts[0]!;
  return {
    evidence,
    peid: entity.peid,
    pgid: context.pgid,
    peopleName: entity.displayName,
    countryIso3: context.country.iso3,
    countryName: context.country.name,
    naturalEarthRegion: regionForCountry(context.country.iso3, countriesByIso3),
    providerRegion: context.country.region,
    providerSubregion: context.country.subregion,
    population: context.population.value,
    languageIso6393: context.language.iso6393,
    languageName: context.language.name,
    missionClassification: context.reach.classification,
    sourceUpdatedAt: context.sourceUpdatedAt,
  };
}

export function buildPeopleGeographicIntelligence(
  subject: RuntimePeopleEntity,
  corpus: readonly RuntimePeopleEntity[],
  countriesByIso3: ReadonlyMap<string, MapCountryFeature> = new Map(),
): PeopleGeographicIntelligence {
  const subjectTaxonomy = entityTaxonomy(subject);
  const sourcePeopleName = subjectTaxonomy.peopleName?.trim() || null;
  const normalizedPeopleName = sourcePeopleName ? normalized(sourcePeopleName) : null;

  const records: GeographicDistributionRecord[] = [
    toDistributionRecord(subject, "current-pgid", countriesByIso3),
  ];

  if (normalizedPeopleName) {
    for (const candidate of corpus) {
      if (candidate.peid === subject.peid) continue;
      const candidateName = entityTaxonomy(candidate).peopleName;
      if (!candidateName || normalized(candidateName) !== normalizedPeopleName) continue;
      records.push(toDistributionRecord(candidate, "same-rop3-taxonomy", countriesByIso3));
    }
  }

  records.sort((a, b) =>
    Number(b.evidence === "current-pgid") - Number(a.evidence === "current-pgid")
    || a.countryName.localeCompare(b.countryName, "en")
    || a.peopleName.localeCompare(b.peopleName, "en")
    || a.pgid.localeCompare(b.pgid, "en")
  );

  const countryGroups = new Map<string, GeographicDistributionRecord[]>();
  for (const record of records) {
    const group = countryGroups.get(record.countryIso3) ?? [];
    group.push(record);
    countryGroups.set(record.countryIso3, group);
  }

  const countries: GeographicDistributionCountry[] = [...countryGroups.entries()]
    .map(([iso3, items]) => {
      const knownPopulationRecords = items.filter((item) => item.population !== null);
      return {
        iso3,
        name: items[0]!.countryName,
        naturalEarthRegion: items.find((item) => item.naturalEarthRegion)?.naturalEarthRegion ?? null,
        providerRegionLabels: unique(items.map((item) => item.providerRegion)),
        providerSubregionLabels: unique(items.map((item) => item.providerSubregion)),
        recordCount: items.length,
        includesCurrentRecord: items.some((item) => item.evidence === "current-pgid"),
        knownPopulation: knownPopulationRecords.reduce((sum, item) => sum + item.population!, 0),
        populationKnownRecordCount: knownPopulationRecords.length,
        populationCoverageComplete: knownPopulationRecords.length === items.length,
        unreachedRecordCount: items.filter((item) => item.missionClassification === "unreached").length,
        otherRecordCount: items.filter((item) => item.missionClassification === "other").length,
        unknownRecordCount: items.filter((item) => item.missionClassification === "unknown").length,
        records: items,
      };
    })
    .sort((a, b) =>
      Number(b.includesCurrentRecord) - Number(a.includesCurrentRecord)
      || b.recordCount - a.recordCount
      || a.name.localeCompare(b.name, "en")
    );

  const regionGroups = new Map<string, GeographicDistributionCountry[]>();
  for (const country of countries) {
    const name = country.naturalEarthRegion ?? "Region not resolved";
    const group = regionGroups.get(name) ?? [];
    group.push(country);
    regionGroups.set(name, group);
  }

  const regions: GeographicDistributionRegion[] = [...regionGroups.entries()]
    .map(([name, items]) => ({
      name,
      countryCount: items.length,
      recordCount: items.reduce((sum, item) => sum + item.recordCount, 0),
      knownPopulation: items.reduce((sum, item) => sum + item.knownPopulation, 0),
      populationKnownRecordCount: items.reduce((sum, item) => sum + item.populationKnownRecordCount, 0),
    }))
    .sort((a, b) => b.recordCount - a.recordCount || a.name.localeCompare(b.name, "en"));

  const populationKnownRecordCount = records.filter((item) => item.population !== null).length;

  return {
    schemaVersion: 1,
    sourcePeopleName,
    precision: "country-context",
    distributionEvidence: countries.length > 1 ? "cross-country-source-taxonomy" : "current-country-only",
    records,
    countries,
    regions,
    knownPopulation: records.reduce((sum, item) => sum + (item.population ?? 0), 0),
    populationKnownRecordCount,
    populationCoverageComplete: populationKnownRecordCount === records.length,
    diasporaStatus: "not-established",
    diasporaExplanation: "The current certified sources do not establish migration history, diaspora identity, settlement chronology, city-level distribution, or origin/destination flows for this people record. Cross-country records sharing the same ROP3 people-name field are shown only as provider-taxonomy distribution evidence.",
    boundaries: [
      "The current PGID is direct PeopleGroups.org country-context evidence.",
      "Other countries appear only when another PeopleGroups.org PGID reports the exact same normalized ROP3 people-name field.",
      "An exact ROP3 name match is a provider taxonomy relationship, not proof that all linked records form one universal ethnic population.",
      "Population values are source estimates for individual PGID records. Their sum is a represented-record total, not a census or verified global population.",
      "Natural Earth supplies continent-level geographic grouping only; it does not supply mission or diaspora assertions.",
      "No city, settlement, migration route, origin story, diaspora chronology, or population share is inferred.",
    ],
  };
}
