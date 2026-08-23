import { peopleGroupsApiPageSchema, peopleGroupsApiRecordSchema, type PeopleGroupsApiRecord } from "./types";

export const PEOPLE_GROUPS_API_BASE = "https://peoplegroups.org/wp-json/pg/v1";
export const PEOPLE_GROUPS_PAGE_SIZE = 250;
export const PEOPLE_GROUPS_MAX_PAGES = 100;
export const PEOPLE_GROUPS_MAX_RECORDS = 25_000;
export const PEOPLE_GROUPS_REQUEST_TIMEOUT_MS = 10_000;
export const PEOPLE_GROUPS_FETCH_CONCURRENCY = 6;

export class PeopleGroupsApiError extends Error {
  constructor(
    message: string,
    readonly code: "timeout" | "http" | "schema" | "bounds" | "network",
    readonly status: number | null = null,
  ) {
    super(message);
    this.name = "PeopleGroupsApiError";
  }
}

export interface PeopleGroupsPage {
  records: PeopleGroupsApiRecord[];
  page: number;
  totalPages: number;
  totalRecords: number | null;
}

export interface PeopleGroupsApiClientOptions {
  fetchImpl?: typeof fetch;
  baseUrl?: string;
  timeoutMs?: number;
}

function positiveHeader(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function requestJson(
  fetchImpl: typeof fetch,
  url: string,
  timeoutMs: number,
  outerSignal?: AbortSignal,
): Promise<Response> {
  if (outerSignal?.aborted) throw outerSignal.reason ?? new DOMException("Aborted", "AbortError");

  const controller = new AbortController();
  const onAbort = () => controller.abort(outerSignal?.reason);
  outerSignal?.addEventListener("abort", onAbort, { once: true });
  const timer = setTimeout(() => controller.abort("timeout"), timeoutMs);

  try {
    const response = await fetchImpl(url, {
      method: "GET",
      cache: "no-store",
      credentials: "omit",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new PeopleGroupsApiError(`PeopleGroups.org returned HTTP ${response.status}.`, "http", response.status);
    return response;
  } catch (error) {
    if (error instanceof PeopleGroupsApiError) throw error;
    if (controller.signal.aborted && !outerSignal?.aborted) {
      throw new PeopleGroupsApiError("PeopleGroups.org request timed out.", "timeout");
    }
    if (outerSignal?.aborted) throw error;
    throw new PeopleGroupsApiError(error instanceof Error ? error.message : "PeopleGroups.org request failed.", "network");
  } finally {
    clearTimeout(timer);
    outerSignal?.removeEventListener("abort", onAbort);
  }
}

export function createPeopleGroupsApiClient(options: PeopleGroupsApiClientOptions = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = (options.baseUrl ?? PEOPLE_GROUPS_API_BASE).replace(/\/$/, "");
  const timeoutMs = options.timeoutMs ?? PEOPLE_GROUPS_REQUEST_TIMEOUT_MS;

  async function fetchPage(page: number, signal?: AbortSignal): Promise<PeopleGroupsPage> {
    if (!Number.isInteger(page) || page < 1 || page > PEOPLE_GROUPS_MAX_PAGES) {
      throw new PeopleGroupsApiError(`Invalid PeopleGroups.org page ${page}.`, "bounds");
    }
    const url = `${baseUrl}/people-groups?page=${page}&per_page=${PEOPLE_GROUPS_PAGE_SIZE}`;
    const response = await requestJson(fetchImpl, url, timeoutMs, signal);
    let json: unknown;
    try {
      json = await response.json();
    } catch {
      throw new PeopleGroupsApiError("PeopleGroups.org returned invalid JSON.", "schema");
    }

    const parsed = peopleGroupsApiPageSchema.safeParse(json);
    if (!parsed.success) throw new PeopleGroupsApiError("PeopleGroups.org response no longer matches the certified schema.", "schema");
    if (parsed.data.length > PEOPLE_GROUPS_PAGE_SIZE) throw new PeopleGroupsApiError(`PeopleGroups.org returned more than ${PEOPLE_GROUPS_PAGE_SIZE} records in one page.`, "bounds");

    const totalPages = positiveHeader(response.headers.get("X-WP-TotalPages")) ?? page;
    const totalRecords = positiveHeader(response.headers.get("X-WP-Total"));
    if (totalPages > PEOPLE_GROUPS_MAX_PAGES) throw new PeopleGroupsApiError(`PeopleGroups.org reported ${totalPages} pages, above the safety budget.`, "bounds");
    if (totalRecords !== null && totalRecords > PEOPLE_GROUPS_MAX_RECORDS) throw new PeopleGroupsApiError(`PeopleGroups.org reported ${totalRecords} records, above the safety budget.`, "bounds");

    return { records: parsed.data, page, totalPages, totalRecords };
  }

  async function fetchByPgid(pgid: string, signal?: AbortSignal): Promise<PeopleGroupsApiRecord> {
    const normalized = pgid.trim().toUpperCase();
    if (!/^PG[0-9]+$/.test(normalized)) throw new PeopleGroupsApiError("Invalid PeopleGroups.org PGID.", "bounds");
    const response = await requestJson(fetchImpl, `${baseUrl}/people-groups/${encodeURIComponent(normalized)}`, timeoutMs, signal);
    let json: unknown;
    try {
      json = await response.json();
    } catch {
      throw new PeopleGroupsApiError("PeopleGroups.org returned invalid JSON.", "schema");
    }
    const parsed = peopleGroupsApiRecordSchema.safeParse(json);
    if (!parsed.success) throw new PeopleGroupsApiError("PeopleGroups.org record no longer matches the certified schema.", "schema");
    if (parsed.data.PGID !== normalized) throw new PeopleGroupsApiError(`PeopleGroups.org returned ${parsed.data.PGID} for requested ${normalized}.`, "schema");
    return parsed.data;
  }

  function acceptPage(first: PeopleGroupsPage, next: PeopleGroupsPage, records: PeopleGroupsApiRecord[], pgids: Set<string>): void {
    if (next.totalPages !== first.totalPages) throw new PeopleGroupsApiError("PeopleGroups.org pagination changed during the same load.", "schema");
    if (first.totalRecords !== null && next.totalRecords !== null && next.totalRecords !== first.totalRecords) {
      throw new PeopleGroupsApiError("PeopleGroups.org total record count changed during the same load.", "schema");
    }
    for (const record of next.records) {
      if (pgids.has(record.PGID)) throw new PeopleGroupsApiError(`PeopleGroups.org returned duplicate PGID ${record.PGID} across pages.`, "schema");
      pgids.add(record.PGID);
      records.push(record);
    }
    if (records.length > PEOPLE_GROUPS_MAX_RECORDS) throw new PeopleGroupsApiError("PeopleGroups.org corpus exceeded the runtime record budget.", "bounds");
  }

  async function fetchAll(options: { signal?: AbortSignal; onPage?: (page: PeopleGroupsPage) => void } = {}): Promise<PeopleGroupsApiRecord[]> {
    const first = await fetchPage(1, options.signal);
    options.onPage?.(first);
    const records = [...first.records];
    const pgids = new Set(first.records.map((record) => record.PGID));
    if (pgids.size !== first.records.length) throw new PeopleGroupsApiError("PeopleGroups.org returned duplicate PGIDs within the first page.", "schema");

    // The corpus is dozens of pages in production. Fetch independent pages in
    // small bounded batches instead of serially waiting for every network RTT.
    // Validation and progress publication are still applied in page order so
    // the fail-closed snapshot contract remains deterministic.
    for (let start = 2; start <= first.totalPages; start += PEOPLE_GROUPS_FETCH_CONCURRENCY) {
      const pageNumbers = Array.from(
        { length: Math.min(PEOPLE_GROUPS_FETCH_CONCURRENCY, first.totalPages - start + 1) },
        (_, index) => start + index,
      );
      const batch = await Promise.all(pageNumbers.map((page) => fetchPage(page, options.signal)));
      batch.sort((a, b) => a.page - b.page);
      for (const next of batch) {
        acceptPage(first, next, records, pgids);
        options.onPage?.(next);
      }
    }

    if (first.totalRecords !== null && records.length !== first.totalRecords) {
      throw new PeopleGroupsApiError(`PeopleGroups.org returned ${records.length} records but advertised ${first.totalRecords}.`, "schema");
    }
    return records;
  }

  return { fetchPage, fetchByPgid, fetchAll };
}

export type PeopleGroupsApiClient = ReturnType<typeof createPeopleGroupsApiClient>;
