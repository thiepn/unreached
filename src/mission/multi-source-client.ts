import { joshuaProjectComparisonRecordSchema, type JoshuaProjectComparisonRecord } from "./joshua-project";
import type { ReviewedMissionSourceCrosswalk } from "./multi-source";

const MISSION_INTELLIGENCE_ORIGIN = "https://unreached-private-continuity.thiepn.workers.dev";
const MISSION_INTELLIGENCE_BASE = `${MISSION_INTELLIGENCE_ORIGIN}/unreached-sources`;

export class MissionSourceApiError extends Error {
  status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "MissionSourceApiError";
    this.status = status;
  }
}

export async function fetchJoshuaProjectComparison(
  link: ReviewedMissionSourceCrosswalk,
): Promise<JoshuaProjectComparisonRecord> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(
      `${MISSION_INTELLIGENCE_BASE}/joshua-project/people/${encodeURIComponent(link.joshuaPeopleId3Rog3)}`,
      {
        headers: { Accept: "application/json" },
        credentials: "omit",
        mode: "cors",
        cache: "no-store",
        signal: controller.signal,
      },
    );
    const text = await response.text();
    if (!response.ok) {
      let message = `Joshua Project comparison is unavailable (${response.status}).`;
      try {
        const parsed = JSON.parse(text) as { error?: string };
        if (parsed.error) message = parsed.error;
      } catch {
        // Preserve the safe generic error when the edge returns non-JSON.
      }
      throw new MissionSourceApiError(message, response.status);
    }

    let payload: unknown;
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      throw new MissionSourceApiError("Joshua Project comparison returned an invalid response.", response.status);
    }
    const record = joshuaProjectComparisonRecordSchema.parse(payload);
    if (
      record.peopleId3 !== link.joshuaPeopleId3
      || record.rog3 !== link.joshuaRog3
      || record.peopleId3Rog3 !== link.joshuaPeopleId3Rog3
    ) {
      throw new MissionSourceApiError("The secondary source record did not match the reviewed cross-source identity link.", 409);
    }
    return record;
  } catch (error) {
    if (error instanceof MissionSourceApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new MissionSourceApiError("Joshua Project comparison did not respond in time.");
    }
    throw new MissionSourceApiError("Joshua Project comparison is temporarily unavailable.");
  } finally {
    window.clearTimeout(timeout);
  }
}
