import { createHash } from "node:crypto";
import type { NormalizedDataset } from "../../src/domain/index.js";

export const ENTITY_KEYS = ["regions", "religions", "countries", "peopleGroups", "peopleGroupsInCountries", "languages"] as const;
export type EntityKey = typeof ENTITY_KEYS[number];

export interface BuiltChunk {
  entity: EntityKey;
  path: string;
  recordCount: number;
  sha256: string;
  json: string;
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function buildChunks(dataset: NormalizedDataset, chunkSize = 250): BuiltChunk[] {
  if (!Number.isInteger(chunkSize) || chunkSize < 1) throw new Error("chunkSize must be a positive integer");
  const chunks: BuiltChunk[] = [];

  for (const entity of ENTITY_KEYS) {
    const records = [...dataset[entity]].sort((a, b) => a.id.localeCompare(b.id));
    for (let offset = 0; offset < records.length; offset += chunkSize) {
      const slice = records.slice(offset, offset + chunkSize);
      const index = String(Math.floor(offset / chunkSize)).padStart(4, "0");
      const json = `${JSON.stringify(slice)}\n`;
      chunks.push({ entity, path: `chunks/${entity}-${index}.json`, recordCount: slice.length, sha256: sha256(json), json });
    }
  }

  return chunks;
}
