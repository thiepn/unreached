import { expect, test } from "@playwright/test";

const LIVE = process.env.PEOPLEGROUPS_LIVE_CHECK === "1";

test.skip(!LIVE, "PeopleGroups.org live certification runs only in the dedicated external-data workflow.");

test("browser origin can read and validate PeopleGroups.org API", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("./#/", { waitUntil: "domcontentloaded" });

  const result = await page.evaluate(async () => {
    const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

    async function fetchJsonWithRetry(url: string) {
      let lastError = "unknown error";
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 6_000);
        try {
          const response = await fetch(url, {
            method: "GET",
            mode: "cors",
            credentials: "omit",
            cache: "no-store",
            signal: controller.signal,
          });
          if (response.status === 200) {
            return {
              status: response.status,
              body: await response.json() as unknown,
              total: response.headers.get("X-WP-Total"),
              totalPages: response.headers.get("X-WP-TotalPages"),
            };
          }
          lastError = `HTTP ${response.status}`;
        } catch (error) {
          lastError = error instanceof Error ? error.message : String(error);
        } finally {
          window.clearTimeout(timeout);
        }

        if (attempt < 3) await sleep(attempt * 2_000);
      }
      throw new Error(`PeopleGroups browser CORS request failed after 3 attempts: ${lastError}`);
    }

    const pageUrl = "https://peoplegroups.org/wp-json/pg/v1/people-groups?page=1&per_page=1";
    const list = await fetchJsonWithRetry(pageUrl);
    const listBody = Array.isArray(list.body) ? list.body as Array<Record<string, unknown>> : null;
    const discoveredPgid = typeof listBody?.[0]?.PGID === "string" ? listBody[0].PGID : null;

    let singleStatus: number | null = null;
    let singleBody: Record<string, unknown> | null = null;
    if (discoveredPgid) {
      const singleUrl = `https://peoplegroups.org/wp-json/pg/v1/people-groups/${encodeURIComponent(discoveredPgid)}`;
      const single = await fetchJsonWithRetry(singleUrl);
      singleStatus = single.status;
      singleBody = single.body && !Array.isArray(single.body) ? single.body as Record<string, unknown> : null;
    }

    return {
      listStatus: list.status,
      listBody,
      total: list.total,
      totalPages: list.totalPages,
      discoveredPgid,
      singleStatus,
      singleBody,
    };
  });

  expect(result.listStatus).toBe(200);
  expect(Array.isArray(result.listBody)).toBe(true);
  expect(result.listBody).toHaveLength(1);
  expect(result.discoveredPgid).toMatch(/^PG[0-9]+$/);
  expect(Number(result.total)).toBeGreaterThan(10_000);
  expect(Number(result.totalPages)).toBeGreaterThan(1);

  expect(result.singleStatus).toBe(200);
  expect(result.singleBody?.PGID).toBe(result.discoveredPgid);
  expect(result.singleBody?.PEID).toBeTruthy();
  expect(result.singleBody?.NmDisp).toBeTruthy();
  expect(result.singleBody?.ISOalpha3).toMatch(/^[A-Z]{3}$/);
});
