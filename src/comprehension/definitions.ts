export type ComprehensionTerm =
  | "people-group"
  | "unreached"
  | "gsec"
  | "population-estimate"
  | "evangelical-level"
  | "bible-resource-status";

export interface ComprehensionDefinition {
  label: string;
  short: string;
  detail: string;
}

const DEFINITIONS: Record<ComprehensionTerm, ComprehensionDefinition> = {
  "people-group": {
    label: "People group",
    short: "A community represented by the source as a distinct people-group record.",
    detail: "Unreached keeps the provider's record identity intact. Similar names in different countries are not automatically merged into one worldwide people identity.",
  },
  unreached: {
    label: "Unreached",
    short: "A mission-status label Unreached shows when the source places a people-group record in GSEC 0–3.",
    detail: "This classification describes reported Christian presence and mission status. It is not a statement about the worth, character, or spiritual sincerity of the people themselves.",
  },
  gsec: {
    label: "GSEC",
    short: "A source classification used to describe the status of evangelical Christianity among a people-group record.",
    detail: "Unreached maps GSEC 0–3 to the user-facing label Unreached, GSEC 4–6 to Other GSEC status, and leaves missing values unknown. The exact source code remains available in detailed data.",
  },
  "population-estimate": {
    label: "Population estimate",
    short: "The population estimate reported for this people-group record in this country.",
    detail: "It is not automatically a worldwide ethnic-population total or a national census figure.",
  },
  "evangelical-level": {
    label: "Evangelical presence",
    short: "The evangelical-presence label reported by the source.",
    detail: "Unreached preserves the provider value instead of converting a categorical label into a percentage or a different mission classification.",
  },
  "bible-resource-status": {
    label: "Bible resource status",
    short: "The Bible-availability value reported by the source for this record.",
    detail: "Unreached does not reinterpret raw provider labels as portions, New Testament, or complete Bible milestones unless a separate mapping has been explicitly certified.",
  },
};

export function definitionFor(term: ComprehensionTerm): ComprehensionDefinition {
  return DEFINITIONS[term];
}
