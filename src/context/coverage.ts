export const EDITORIAL_COVERAGE_REGIONS = {
  AFG: "South Asia",
  BEN: "West Africa",
  BGD: "South Asia",
  CHN: "East Asia",
  IDN: "Southeast Asia",
  KAZ: "Central Asia",
  MMR: "Southeast Asia",
  SEN: "West Africa",
  SOM: "Horn of Africa",
  TJK: "Central Asia",
  TUR: "West Asia",
} as const;

export type EditorialCoverageRegion = (typeof EDITORIAL_COVERAGE_REGIONS)[keyof typeof EDITORIAL_COVERAGE_REGIONS] | "Other";

export function editorialCoverageRegionFor(iso3: string): EditorialCoverageRegion {
  return EDITORIAL_COVERAGE_REGIONS[iso3 as keyof typeof EDITORIAL_COVERAGE_REGIONS] ?? "Other";
}
