import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export interface Phase12EvidenceAuditEntry {
  candidate: string;
  document: string;
  checkedAt: string;
  status: "pre-review-only";
}

export interface Phase12EvidenceAuditIndex {
  schemaVersion: 1;
  status: "pre-review-only";
  generatedAt: string;
  notice: string;
  entries: Phase12EvidenceAuditEntry[];
}

const root = process.cwd();
const indexPath = resolve(root, "data/v3/editorial/evidence-audits.json");
const candidateNamePattern = /^[a-z0-9][a-z0-9._-]*\.json$/;
const documentPattern = /^docs\/V3_PHASE12_[A-Z0-9_]+_EVIDENCE_AUDIT\.md$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export async function loadPhase12EvidenceAuditIndex(): Promise<Phase12EvidenceAuditIndex> {
  const raw = JSON.parse(await readFile(indexPath, "utf8")) as unknown;
  if (!raw || typeof raw !== "object") throw new Error("Phase 12 evidence-audit index is not an object.");
  const item = raw as Record<string, unknown>;
  if (item.schemaVersion !== 1) throw new Error("Phase 12 evidence-audit index must use schemaVersion 1.");
  if (item.status !== "pre-review-only") throw new Error("Phase 12 evidence-audit index must remain pre-review-only.");
  if (typeof item.generatedAt !== "string" || Number.isNaN(Date.parse(item.generatedAt))) {
    throw new Error("Phase 12 evidence-audit index has an invalid generatedAt timestamp.");
  }
  if (typeof item.notice !== "string" || !item.notice.toLocaleLowerCase("en").includes("not maintainer approval")) {
    throw new Error("Phase 12 evidence-audit index must state that it is not maintainer approval.");
  }
  if (!Array.isArray(item.entries) || !item.entries.length) {
    throw new Error("Phase 12 evidence-audit index has no entries.");
  }

  const seenCandidates = new Set<string>();
  const seenDocuments = new Set<string>();
  const entries: Phase12EvidenceAuditEntry[] = item.entries.map((entry, index) => {
    if (!entry || typeof entry !== "object") throw new Error(`Evidence-audit entry ${index} is invalid.`);
    const value = entry as Record<string, unknown>;
    if (typeof value.candidate !== "string" || !candidateNamePattern.test(value.candidate)) {
      throw new Error(`Evidence-audit entry ${index} has an invalid candidate.`);
    }
    if (typeof value.document !== "string" || !documentPattern.test(value.document)) {
      throw new Error(`Evidence-audit entry ${index} has an invalid document path.`);
    }
    if (typeof value.checkedAt !== "string" || !datePattern.test(value.checkedAt)) {
      throw new Error(`Evidence-audit entry ${index} has an invalid checkedAt date.`);
    }
    if (value.status !== "pre-review-only") {
      throw new Error(`Evidence-audit entry ${index} must remain pre-review-only.`);
    }
    if (seenCandidates.has(value.candidate)) throw new Error(`Duplicate evidence audit for candidate ${value.candidate}.`);
    if (seenDocuments.has(value.document)) throw new Error(`Evidence audit document ${value.document} is mapped twice.`);
    seenCandidates.add(value.candidate);
    seenDocuments.add(value.document);
    return {
      candidate: value.candidate,
      document: value.document,
      checkedAt: value.checkedAt,
      status: "pre-review-only",
    };
  });

  return {
    schemaVersion: 1,
    status: "pre-review-only",
    generatedAt: item.generatedAt,
    notice: String(item.notice),
    entries,
  };
}

export function evidenceAuditMap(index: Phase12EvidenceAuditIndex): Map<string, Phase12EvidenceAuditEntry> {
  return new Map(index.entries.map((entry) => [entry.candidate, entry]));
}
