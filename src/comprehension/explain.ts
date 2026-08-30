import type { RuntimePeopleContext, RuntimePeopleEntity } from "../providers/peoplegroups";

export function peopleMeaning(record: RuntimePeopleEntity): string {
  const context = record.contexts[0]!;
  if (context.reach.classification === "unreached") {
    return `A people-group record in ${context.country.name} that the current mission-data source classifies as unreached.`;
  }
  if (context.reach.classification === "other") {
    return `A people-group record in ${context.country.name} that the current source does not classify within its unreached range.`;
  }
  return `A people-group record in ${context.country.name} whose mission-status classification is not reported by the current source.`;
}

export function reachExplanation(context: RuntimePeopleContext): string {
  if (context.reach.classification === "unreached") {
    return "The current source places this record within its unreached mission-status range. Unreached preserves that classification instead of estimating a new status.";
  }
  if (context.reach.classification === "other") {
    return "The current source places this record outside its unreached mission-status range. The app preserves that distinction instead of renaming the record “reached.”";
  }
  return "The current source does not report the classification field needed for this status, so Unreached does not infer a mission status.";
}

export function evangelicalLevelExplanation(value: string | null): string {
  if (!value) return "No evangelical-presence label is reported for this source record.";
  return `The source reports “${value}.” Unreached preserves this wording rather than converting it into a new percentage or category.`;
}

export function bibleResourceExplanation(value: string | null): string {
  if (!value) return "No Bible-availability value is reported for this source record.";
  return `The source reports “${value}.” This is shown as a provider availability label, not as a normalized translation-completeness claim.`;
}
