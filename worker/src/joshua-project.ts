const API_ROOT = "https://api.joshuaproject.net";

export class JoshuaSourceError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "JoshuaSourceError";
    this.status = status;
  }
}

interface ApprovedJoshuaLink {
  peopleId3: number;
  rog3: string;
  peopleId3Rog3: string;
}

const APPROVED_LINKS = new Map<string, ApprovedJoshuaLink>([
  ["12140CH", { peopleId3: 12140, rog3: "CH", peopleId3Rog3: "12140CH" }],
  ["15755CH", { peopleId3: 15755, rog3: "CH", peopleId3Rog3: "15755CH" }],
  ["14327AF", { peopleId3: 14327, rog3: "AF", peopleId3Rog3: "14327AF" }],
]);

function objectRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const result = String(value).trim();
  return result ? result : null;
}

function numberValue(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}

function yesNo(value: unknown): boolean | null {
  if (value === true || value === 1 || value === "1" || value === "Y" || value === "Yes") return true;
  if (value === false || value === 0 || value === "0" || value === "N" || value === "No") return false;
  return null;
}

function expectedRecord(payload: unknown): Record<string, unknown> | null {
  if (Array.isArray(payload)) return payload.length === 1 ? objectRecord(payload[0]) : null;
  return objectRecord(payload);
}

export function isApprovedJoshuaComparisonId(value: string): boolean {
  return APPROVED_LINKS.has(value);
}

export async function fetchJoshuaComparisonRecord(id: string, apiKey: string | undefined): Promise<Record<string, unknown>> {
  const link = APPROVED_LINKS.get(id);
  if (!link) throw new JoshuaSourceError(404, "No reviewed Joshua Project identity link exists for this record.");
  if (!apiKey?.trim()) throw new JoshuaSourceError(503, "Joshua Project comparison is not configured on this deployment.");

  const url = new URL(`/v1/people_groups/${link.peopleId3Rog3}.json`, API_ROOT);
  url.searchParams.set("api_key", apiKey.trim());

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      redirect: "follow",
    });
  } catch {
    throw new JoshuaSourceError(502, "Joshua Project could not be reached.");
  }
  if (!response.ok) throw new JoshuaSourceError(502, `Joshua Project returned HTTP ${response.status}.`);

  let payload: unknown;
  try {
    payload = await response.json() as unknown;
  } catch {
    throw new JoshuaSourceError(502, "Joshua Project returned invalid JSON.");
  }
  const row = expectedRecord(payload);
  if (!row) throw new JoshuaSourceError(502, "Joshua Project returned an unexpected record shape.");

  const peopleId3 = numberValue(row.PeopleID3);
  const rog3 = text(row.ROG3);
  const peopleId3Rog3 = text(row.PeopleID3ROG3) ?? (peopleId3 !== null && rog3 ? `${peopleId3}${rog3}` : null);
  if (peopleId3 !== link.peopleId3 || rog3 !== link.rog3 || peopleId3Rog3 !== link.peopleId3Rog3) {
    throw new JoshuaSourceError(409, "Joshua Project returned a record that does not match the reviewed identity link.");
  }

  const peopleName = text(row.PeopNameInCountry) ?? text(row.PeopNameAcrossCountries);
  const countryName = text(row.Ctry);
  if (!peopleName || !countryName) throw new JoshuaSourceError(502, "Joshua Project returned an incomplete identity record.");

  return {
    source: "joshua-project-api",
    peopleId3: link.peopleId3,
    rog3: link.rog3,
    peopleId3Rog3: link.peopleId3Rog3,
    peopleName,
    countryName,
    percentAdherents: numberValue(row.PercentAdherents),
    percentEvangelical: numberValue(row.PercentEvangelical),
    jpScale: numberValue(row.JPScale),
    leastReached: yesNo(row.LeastReached),
    frontier: yesNo(row.Frontier),
    retrievedAt: new Date().toISOString(),
    sourceProfileUrl: `https://joshuaproject.net/people_groups/${link.peopleId3}/${link.rog3}`,
  };
}
