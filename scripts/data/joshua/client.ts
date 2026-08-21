const API_ROOT = "https://api.joshuaproject.net";

export type JoshuaResource = "countries" | "languages" | "peopleGroups" | "peopleGroupsGlobal" | "regions" | "totals" | "dailyUnreached";

const RESOURCE_PATH: Record<JoshuaResource, string> = {
  countries: "/v1/countries.json",
  languages: "/v1/languages.json",
  peopleGroups: "/v1/people_groups.json",
  peopleGroupsGlobal: "/v1/people_groups_global.json",
  regions: "/v1/regions.json",
  totals: "/v1/totals.json",
  dailyUnreached: "/v1/people_groups/daily_unreached.json",
};

export function requireJoshuaApiKey(env: NodeJS.ProcessEnv = process.env): string {
  const key = env.JOSHUA_PROJECT_API_KEY?.trim();
  if (!key) throw new Error("JOSHUA_PROJECT_API_KEY is required for build-time Joshua Project requests.");
  return key;
}

export async function fetchJoshuaResource(
  resource: JoshuaResource,
  parameters: Record<string, string | number | boolean | undefined> = {},
  apiKey = requireJoshuaApiKey(),
): Promise<unknown> {
  const url = new URL(RESOURCE_PATH[resource], API_ROOT);
  url.searchParams.set("api_key", apiKey);
  for (const [key, value] of Object.entries(parameters)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!response.ok) throw new Error(`Joshua Project request failed with HTTP ${response.status}.`);
  return response.json() as Promise<unknown>;
}
