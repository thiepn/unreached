import {
  createMissionClassificationAssertion,
  type MissionClassificationAssertion,
} from "../../mission/classification";

export const PEOPLE_GROUPS_SOURCE_ID = "peoplegroups-org-api";
export const PEOPLE_GROUPS_IMB_GSEC_METHODOLOGY_ID = "imb-gsec-2026";

export const PEOPLE_GROUPS_IMB_UNREACHED_DEFINITION =
  "PeopleGroups.org / IMB classifies GSEC 0–3 as unreached. GSEC 0 represents no evangelical Christians, churches or major evangelical resources; GSEC 1–3 represent less than 2% evangelical Christian presence with differing recent church-planting activity. GSEC 4–6 do not meet this unreached rule.";

type PeopleGroupsClassificationInput = {
  gsec: number | null;
  label: string | null;
  sourceUpdatedAt: string | null;
};

/**
 * Convert source-native IMB GSEC into the narrow V3 classification boundary.
 *
 * This function does not infer Joshua Project status, Christian-adherent
 * percentages, frontier status, or a generic "reached" state.
 */
export function classifyPeopleGroupsGsec(
  input: PeopleGroupsClassificationInput,
): MissionClassificationAssertion {
  const classification = input.gsec === null
    ? "unknown"
    : input.gsec <= 3
      ? "unreached"
      : "not-unreached";

  return createMissionClassificationAssertion({
    sourceId: PEOPLE_GROUPS_SOURCE_ID,
    methodologyId: PEOPLE_GROUPS_IMB_GSEC_METHODOLOGY_ID,
    classification,
    sourceCode: input.gsec,
    sourceLabel: input.label,
    definition: PEOPLE_GROUPS_IMB_UNREACHED_DEFINITION,
    basis: input.gsec === null
      ? ["The provider record does not contain a known GSEC value; classification remains unknown."]
      : input.gsec <= 3
        ? [
            `Provider GSEC is ${input.gsec}.`,
            "Under the IMB GSEC model, levels 0–3 are the source-defined unreached range.",
          ]
        : [
            `Provider GSEC is ${input.gsec}.`,
            "Under the IMB GSEC model, levels 4–6 are outside the source-defined unreached range.",
          ],
    sourceUpdatedAt: input.sourceUpdatedAt,
  });
}
