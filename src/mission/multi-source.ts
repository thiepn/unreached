import { z } from "zod";

import {
  createMissionClassificationAssertion,
  missionClassificationAssertionSchema,
  type MissionClassificationAssertion,
} from "./classification";

export const missionSourceComparisonStateSchema = z.enum(["agreement", "disagreement", "incomplete"]);
export type MissionSourceComparisonState = z.infer<typeof missionSourceComparisonStateSchema>;

export const missionSourceComparisonSchema = z.object({
  state: missionSourceComparisonStateSchema,
  assertions: z.array(missionClassificationAssertionSchema).length(2),
  explanation: z.string().min(1),
});

export type MissionSourceComparison = z.infer<typeof missionSourceComparisonSchema>;

/**
 * Compare two source-scoped mission classifications without manufacturing a
 * provider-independent verdict. Agreement only means the two current source
 * assertions use the same product-level label; it does not mean their
 * definitions, estimates, segmentation or update cadence are identical.
 */
export function compareMissionAssertions(
  primary: MissionClassificationAssertion,
  secondary: MissionClassificationAssertion,
): MissionSourceComparison {
  const left = createMissionClassificationAssertion(primary);
  const right = createMissionClassificationAssertion(secondary);

  if (left.classification === "unknown" || right.classification === "unknown") {
    return missionSourceComparisonSchema.parse({
      state: "incomplete",
      assertions: [left, right],
      explanation: "At least one source does not currently provide a usable classification. Unreached keeps the missing value explicit instead of filling it from the other provider.",
    });
  }

  if (left.classification === right.classification) {
    return missionSourceComparisonSchema.parse({
      state: "agreement",
      assertions: [left, right],
      explanation: "The two current source records point to the same product-level classification. Their underlying definitions and source measurements remain distinct and are shown separately.",
    });
  }

  return missionSourceComparisonSchema.parse({
    state: "disagreement",
    assertions: [left, right],
    explanation: "The sources currently classify this matched record differently. That is not treated as data corruption: provider definitions, estimates, segmentation and update cadence can differ, so Unreached preserves both assertions instead of choosing a winner.",
  });
}

export interface ReviewedMissionSourceCrosswalk {
  peopleGroupsPeid: number;
  peopleGroupsPgid: string;
  peopleGroupsCountryIso3: string;
  joshuaPeopleId3: number;
  joshuaRog3: string;
  joshuaPeopleId3Rog3: string;
  reviewedName: string;
  reviewedAt: string;
  evidence: readonly string[];
}

const CROSSWALKS: readonly ReviewedMissionSourceCrosswalk[] = [
  {
    peopleGroupsPeid: 7206,
    peopleGroupsPgid: "PG007206",
    peopleGroupsCountryIso3: "CHN",
    joshuaPeopleId3: 12140,
    joshuaRog3: "CH",
    joshuaPeopleId3Rog3: "12140CH",
    reviewedName: "Hui of China",
    reviewedAt: "2026-09-17",
    evidence: [
      "PeopleGroups.org PG007206 / PEID 7206: Hui of China, Mandarin Chinese (cmn)",
      "Joshua Project PeopleID3 12140 / ROG3 CH: Hui in China",
      "Manual country, people-name and language-context review; no numeric-ID equivalence assumed",
    ],
  },
  {
    peopleGroupsPeid: 24104,
    peopleGroupsPgid: "PG024104",
    peopleGroupsCountryIso3: "CHN",
    joshuaPeopleId3: 15755,
    joshuaRog3: "CH",
    joshuaPeopleId3Rog3: "15755CH",
    reviewedName: "Uyghur of China",
    reviewedAt: "2026-09-17",
    evidence: [
      "PeopleGroups.org PG024104 / PEID 24104: Uyghur of China, Uyghur (uig)",
      "Joshua Project PeopleID3 15755 / ROG3 CH: Uyghur in China",
      "Manual country, people-name and language-context review; no numeric-ID equivalence assumed",
    ],
  },
  {
    peopleGroupsPeid: 24009,
    peopleGroupsPgid: "PG024009",
    peopleGroupsCountryIso3: "AFG",
    joshuaPeopleId3: 14327,
    joshuaRog3: "AF",
    joshuaPeopleId3Rog3: "14327AF",
    reviewedName: "Southern Pashtun of Afghanistan",
    reviewedAt: "2026-09-17",
    evidence: [
      "PeopleGroups.org PG024009 / PEID 24009: Southern Pashtuns of Afghanistan, Southern Pashto (pbt)",
      "Joshua Project PeopleID3 14327 / ROG3 AF: Southern Pashtun in Afghanistan",
      "Manual country, people-name and language-context review; no numeric-ID equivalence assumed",
    ],
  },
] as const;

export const REVIEWED_MISSION_SOURCE_CROSSWALKS = CROSSWALKS;

export function reviewedMissionSourceCrosswalk(
  peopleGroupsPeid: number,
  peopleGroupsPgid: string,
  countryIso3: string,
): ReviewedMissionSourceCrosswalk | null {
  return CROSSWALKS.find((entry) =>
    entry.peopleGroupsPeid === peopleGroupsPeid
    && entry.peopleGroupsPgid === peopleGroupsPgid
    && entry.peopleGroupsCountryIso3 === countryIso3,
  ) ?? null;
}
