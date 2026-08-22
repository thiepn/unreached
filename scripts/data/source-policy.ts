import { z } from "zod";

export const sourceEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  provider: z.string().min(1),
  canonicalUrl: z.string().url(),
  termsUrl: z.string().url().optional(),
  contentTypes: z.array(z.string().min(1)).min(1),
  status: z.enum(["approved", "conditional", "per-item", "permission-required", "prohibited"]),
  commercialUse: z.boolean().nullable(),
  publicRedistribution: z.string().min(1),
  cacheStatus: z.string().min(1),
  attributionRequired: z.boolean().nullable(),
  attributionText: z.string().min(1).optional(),
  developmentIngestionAllowed: z.boolean(),
  runtimeReadAllowed: z.boolean().default(false),
  publicReleaseAllowed: z.boolean(),
  browserRedistributionAllowed: z.boolean(),
  requirements: z.array(z.string().min(1)),
  permissionGate: z.string().min(1).optional(),
  termsReviewedAt: z.string().min(1),
});

export const sourceRegistrySchema = z.object({
  schemaVersion: z.literal(2),
  reviewedAt: z.string().min(1),
  sources: z.array(sourceEntrySchema).min(1),
});

export type SourceRegistry = z.infer<typeof sourceRegistrySchema>;
export type SourceUseMode = "development-ingestion" | "runtime-read" | "public-release" | "browser-redistribution";

export function assertSourceUseAllowed(registry: SourceRegistry, sourceId: string, mode: SourceUseMode): void {
  const source = registry.sources.find((item) => item.id === sourceId);
  if (!source) throw new Error(`Unregistered data source: ${sourceId}`);

  const allowed = mode === "development-ingestion"
    ? source.developmentIngestionAllowed
    : mode === "runtime-read"
      ? source.runtimeReadAllowed
      : mode === "public-release"
        ? source.publicReleaseAllowed
        : source.browserRedistributionAllowed;

  if (!allowed) {
    throw new Error(`Source ${sourceId} is not approved for ${mode}. Status: ${source.status}`);
  }
}
