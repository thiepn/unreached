import type {
  FieldProvenance,
  NormalizedMissionModel,
  PeopleContext,
} from "./schemas";

export interface MissionModelInvariantIssue {
  code: string;
  message: string;
}

function duplicateIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  return [...duplicates];
}

function allContextProvenance(context: PeopleContext): FieldProvenance[] {
  return [
    ...context.provenance,
    context.population.provenance,
    context.coordinates.provenance,
    context.geography.regionLabel.provenance,
    context.geography.subregionLabel.provenance,
    context.geography.locationDescription.provenance,
    context.language.name.provenance,
    context.language.family.provenance,
    context.religion.code.provenance,
    context.religion.name.provenance,
    context.religion.displayName.provenance,
    context.mission.classification.provenance,
    context.mission.evangelicalPresence.provenance,
    context.mission.engagementStatus.provenance,
    context.mission.churchPlanting.provenance,
    context.mission.congregationExists.provenance,
    ...context.mission.sourceIndicators.map((indicator) => indicator.provenance),
    context.resources.bibleAvailability.provenance,
    context.resources.jesusFilmAvailability.provenance,
    context.resources.totalReported.provenance,
    context.sourceDescriptions.people.provenance,
    context.sourceDescriptions.location.provenance,
  ];
}

export function validateMissionModelInvariants(model: NormalizedMissionModel): MissionModelInvariantIssue[] {
  const issues: MissionModelInvariantIssue[] = [];
  const sourceIds = new Set(model.sourceSnapshots.map((snapshot) => snapshot.sourceId));

  for (const duplicate of duplicateIds(model.sourceSnapshots.map((snapshot) => snapshot.sourceId))) {
    issues.push({ code: "duplicate-source-snapshot", message: `Duplicate source snapshot for ${duplicate}.` });
  }

  const entityCollections = [
    ["people", model.people.map((item) => item.id)],
    ["people-context", model.peopleContexts.map((item) => item.id)],
    ["country", model.countries.map((item) => item.id)],
    ["region", model.regions.map((item) => item.id)],
    ["language", model.languages.map((item) => item.id)],
    ["religion", model.religions.map((item) => item.id)],
  ] as const;
  for (const [kind, ids] of entityCollections) {
    for (const duplicate of duplicateIds([...ids])) {
      issues.push({ code: `duplicate-${kind}-id`, message: `Duplicate ${kind} id ${duplicate}.` });
    }
  }

  const peopleIds = new Set(model.people.map((item) => item.id));
  const countryIds = new Set(model.countries.map((item) => item.id));
  const regionIds = new Set(model.regions.map((item) => item.id));
  const languageIds = new Set(model.languages.map((item) => item.id));
  const religionIds = new Set(model.religions.map((item) => item.id));

  const sourceRecordKeys = new Set<string>();
  for (const context of model.peopleContexts) {
    if (!peopleIds.has(context.peopleId)) {
      issues.push({ code: "missing-people-reference", message: `${context.id} references missing ${context.peopleId}.` });
    }
    if (!countryIds.has(context.countryId)) {
      issues.push({ code: "missing-country-reference", message: `${context.id} references missing ${context.countryId}.` });
    }
    if (context.regionId !== null && !regionIds.has(context.regionId)) {
      issues.push({ code: "missing-region-reference", message: `${context.id} references missing ${context.regionId}.` });
    }
    if (context.language.languageId !== null && !languageIds.has(context.language.languageId)) {
      issues.push({ code: "missing-language-reference", message: `${context.id} references missing ${context.language.languageId}.` });
    }
    if (context.religion.religionId !== null && !religionIds.has(context.religion.religionId)) {
      issues.push({ code: "missing-religion-reference", message: `${context.id} references missing ${context.religion.religionId}.` });
    }

    const sourceRecordKey = `${context.sourceRecord.sourceId}:${context.sourceRecord.recordId}`;
    if (sourceRecordKeys.has(sourceRecordKey)) {
      issues.push({ code: "duplicate-source-record", message: `Source record ${sourceRecordKey} was normalized more than once.` });
    }
    sourceRecordKeys.add(sourceRecordKey);

    if (!sourceIds.has(context.sourceRecord.sourceId)) {
      issues.push({ code: "missing-source-snapshot", message: `${context.id} references unregistered snapshot source ${context.sourceRecord.sourceId}.` });
    }
    if (context.mission.classification.assertion.sourceId !== context.sourceRecord.sourceId) {
      issues.push({ code: "classification-source-mismatch", message: `${context.id} classification source does not match its source record.` });
    }

    for (const provenance of allContextProvenance(context)) {
      if (!sourceIds.has(provenance.source.sourceId)) {
        issues.push({ code: "provenance-source-missing", message: `${context.id} provenance references source ${provenance.source.sourceId} without a snapshot.` });
      }
    }
  }

  for (const country of model.countries) {
    if (country.id !== `country:${country.iso3}`) {
      issues.push({ code: "country-id-mismatch", message: `${country.id} does not match ISO3 ${country.iso3}.` });
    }
  }
  for (const language of model.languages) {
    if (language.id !== `language:${language.iso6393}`) {
      issues.push({ code: "language-id-mismatch", message: `${language.id} does not match ISO 639-3 ${language.iso6393}.` });
    }
  }
  for (const region of model.regions) {
    if (region.parentRegionId === region.id) {
      issues.push({ code: "self-parent-region", message: `${region.id} cannot be its own parent.` });
    }
  }

  for (const entity of [...model.people, ...model.countries, ...model.regions, ...model.languages, ...model.religions]) {
    for (const provenance of entity.provenance) {
      if (!sourceIds.has(provenance.source.sourceId)) {
        issues.push({ code: "entity-provenance-source-missing", message: `${entity.id} provenance references source ${provenance.source.sourceId} without a snapshot.` });
      }
    }
  }

  return issues;
}

export function assertMissionModelInvariants(model: NormalizedMissionModel): NormalizedMissionModel {
  const issues = validateMissionModelInvariants(model);
  if (issues.length > 0) {
    throw new Error(`Normalized mission model invariant failure:\n${issues.map((issue) => `- ${issue.code}: ${issue.message}`).join("\n")}`);
  }
  return model;
}
