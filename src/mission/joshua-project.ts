import { z } from "zod";

import { createMissionClassificationAssertion, type MissionClassificationAssertion } from "./classification";

const nullableNumber = z.preprocess(
  (value) => value === null || value === undefined || value === "" ? null : Number(value),
  z.number().finite().nullable(),
);
const nullableString = z.preprocess(
  (value) => value === null || value === undefined || value === "" ? null : String(value).trim(),
  z.string().min(1).nullable(),
);
const nullableYesNo = z.preprocess((value) => {
  if (value === true || value === 1 || value === "1" || value === "Y" || value === "Yes") return true;
  if (value === false || value === 0 || value === "0" || value === "N" || value === "No") return false;
  if (value === null || value === undefined || value === "") return null;
  return value;
}, z.boolean().nullable());

export const joshuaProjectComparisonRecordSchema = z.object({
  source: z.literal("joshua-project-api"),
  peopleId3: z.number().int().positive(),
  rog3: z.string().trim().min(2).max(4),
  peopleId3Rog3: z.string().trim().min(3).max(32),
  peopleName: z.string().trim().min(1),
  countryName: z.string().trim().min(1),
  percentAdherents: nullableNumber,
  percentEvangelical: nullableNumber,
  jpScale: nullableNumber,
  leastReached: nullableYesNo,
  frontier: nullableYesNo,
  retrievedAt: z.string().refine((value) => !Number.isNaN(Date.parse(value))),
  sourceProfileUrl: z.string().url(),
});

export type JoshuaProjectComparisonRecord = z.infer<typeof joshuaProjectComparisonRecordSchema>;

function percentageBasis(label: string, value: number | null): string | null {
  return value === null ? null : `${label}: ${value}% (source estimate)`;
}

export function joshuaProjectMissionAssertion(
  input: JoshuaProjectComparisonRecord,
): MissionClassificationAssertion {
  const record = joshuaProjectComparisonRecordSchema.parse(input);
  const classification = record.leastReached === true
    ? "unreached"
    : record.leastReached === false
      ? "not-unreached"
      : "unknown";
  const basis = [
    `Joshua Project source field LeastReached: ${record.leastReached === null ? "unknown" : record.leastReached ? "yes" : "no"}`,
    record.jpScale === null ? null : `Joshua Project Progress Scale: ${record.jpScale}`,
    percentageBasis("Christian adherents", record.percentAdherents),
    percentageBasis("Evangelicals", record.percentEvangelical),
  ].filter((item): item is string => item !== null);

  return createMissionClassificationAssertion({
    sourceId: "joshua-project-api",
    methodologyId: "joshua-project-least-reached-v1",
    classification,
    sourceCode: record.jpScale,
    sourceLabel: record.leastReached === null ? "LeastReached not supplied" : record.leastReached ? "LeastReached: Yes" : "LeastReached: No",
    definition: "Joshua Project defines an unreached people group using its current people-group methodology, including the 5% Christian-adherent and 2% evangelical thresholds. Unreached retains the provider's LeastReached result instead of recalculating it from rounded percentages.",
    basis,
    sourceUpdatedAt: null,
  });
}

export function formatJoshuaEstimate(value: number | null): string {
  if (value === null) return "Unknown";
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 }).format(value)}%`;
}
