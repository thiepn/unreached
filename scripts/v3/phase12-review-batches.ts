import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export interface Phase12ReviewBatch {
  id: string;
  issue: number;
  title: string;
  candidates: string[];
}

export interface Phase12ReviewBatchIndex {
  schemaVersion: 1;
  status: "human-review-required";
  generatedAt: string;
  notice: string;
  batches: Phase12ReviewBatch[];
}

export interface Phase12CandidateReviewAssignment {
  batchId: string;
  issue: number;
  title: string;
  issueUrl: string;
}

const root = process.cwd();
const registryPath = resolve(root, "data/v3/editorial/review-batches.json");
const candidatePattern = /^[a-z0-9][a-z0-9._-]*\.json$/;
const batchIdPattern = /^[a-z0-9][a-z0-9-]*$/;

export async function loadPhase12ReviewBatchIndex(): Promise<Phase12ReviewBatchIndex> {
  const raw = JSON.parse(await readFile(registryPath, "utf8")) as unknown;
  if (!raw || typeof raw !== "object") throw new Error("Phase 12 review-batch registry is not an object.");
  const item = raw as Record<string, unknown>;

  if (item.schemaVersion !== 1) throw new Error("Phase 12 review-batch registry must use schemaVersion 1.");
  if (item.status !== "human-review-required") {
    throw new Error("Phase 12 review-batch registry must remain human-review-required.");
  }
  if (typeof item.generatedAt !== "string" || Number.isNaN(Date.parse(item.generatedAt))) {
    throw new Error("Phase 12 review-batch registry has an invalid generatedAt timestamp.");
  }
  if (typeof item.notice !== "string" || !item.notice.toLocaleLowerCase("en").includes("not evidence review")) {
    throw new Error("Phase 12 review-batch registry must explicitly state that assignment is not evidence review.");
  }
  if (!Array.isArray(item.batches) || !item.batches.length) {
    throw new Error("Phase 12 review-batch registry has no batches.");
  }

  const batchIds = new Set<string>();
  const issues = new Set<number>();
  const assignedCandidates = new Set<string>();
  const batches: Phase12ReviewBatch[] = item.batches.map((entry, index) => {
    if (!entry || typeof entry !== "object") throw new Error(`Review batch ${index} is invalid.`);
    const value = entry as Record<string, unknown>;
    if (typeof value.id !== "string" || !batchIdPattern.test(value.id)) {
      throw new Error(`Review batch ${index} has an invalid id.`);
    }
    if (batchIds.has(value.id)) throw new Error(`Duplicate review batch id ${value.id}.`);
    batchIds.add(value.id);

    if (typeof value.issue !== "number" || !Number.isInteger(value.issue) || value.issue <= 0) {
      throw new Error(`Review batch ${value.id} has an invalid GitHub issue number.`);
    }
    if (issues.has(value.issue)) throw new Error(`GitHub issue #${value.issue} is assigned to multiple review batches.`);
    issues.add(value.issue);

    if (typeof value.title !== "string" || !value.title.trim()) {
      throw new Error(`Review batch ${value.id} has no title.`);
    }
    if (!Array.isArray(value.candidates) || !value.candidates.length) {
      throw new Error(`Review batch ${value.id} has no candidates.`);
    }

    const candidates = value.candidates.map((candidate) => String(candidate));
    for (const candidate of candidates) {
      if (!candidatePattern.test(candidate)) {
        throw new Error(`Review batch ${value.id} contains invalid candidate filename ${candidate}.`);
      }
      if (assignedCandidates.has(candidate)) {
        throw new Error(`Candidate ${candidate} is assigned to more than one human review batch.`);
      }
      assignedCandidates.add(candidate);
    }

    return {
      id: value.id,
      issue: value.issue,
      title: value.title.trim(),
      candidates,
    };
  });

  return {
    schemaVersion: 1,
    status: "human-review-required",
    generatedAt: item.generatedAt,
    notice: String(item.notice),
    batches,
  };
}

export function reviewAssignmentMap(index: Phase12ReviewBatchIndex): Map<string, Phase12CandidateReviewAssignment> {
  const result = new Map<string, Phase12CandidateReviewAssignment>();
  for (const batch of index.batches) {
    for (const candidate of batch.candidates) {
      result.set(candidate, {
        batchId: batch.id,
        issue: batch.issue,
        title: batch.title,
        issueUrl: `https://github.com/thiepn/unreached/issues/${batch.issue}`,
      });
    }
  }
  return result;
}
