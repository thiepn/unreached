import { z } from "zod";

const nullableSourceCodeSchema = z.union([z.string().min(1), z.number().finite()]).nullable();
const nullableTimestampSchema = z.string().min(1).refine(
  (value) => !Number.isNaN(Date.parse(value)),
  "Invalid source timestamp",
).nullable();

/**
 * Product-level classification vocabulary.
 *
 * `not-unreached` is intentionally narrower than `reached`: a provider saying
 * that a record does not meet its unreached rule does not justify a stronger,
 * provider-independent claim about gospel access or church health.
 */
export const missionClassificationValueSchema = z.enum([
  "unreached",
  "not-unreached",
  "unknown",
]);

/**
 * A source-scoped missiological assertion. This is deliberately smaller than
 * the normalized mission knowledge model that Phase 2 will introduce.
 *
 * The boundary prevents provider adapters from returning an unqualified
 * `unreached` boolean/value without the methodology and source definition that
 * produced it.
 */
export const missionClassificationAssertionSchema = z.object({
  sourceId: z.string().min(1),
  methodologyId: z.string().min(1),
  classification: missionClassificationValueSchema,
  sourceCode: nullableSourceCodeSchema,
  sourceLabel: z.string().trim().min(1).nullable(),
  definition: z.string().trim().min(1),
  basis: z.array(z.string().trim().min(1)).min(1),
  sourceUpdatedAt: nullableTimestampSchema,
});

export type MissionClassificationValue = z.infer<typeof missionClassificationValueSchema>;
export type MissionClassificationAssertion = z.infer<typeof missionClassificationAssertionSchema>;

export function createMissionClassificationAssertion(
  input: MissionClassificationAssertion,
): MissionClassificationAssertion {
  return missionClassificationAssertionSchema.parse(input);
}
