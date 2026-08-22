import { expect, test } from "@playwright/test";

const LIVE = process.env.PEOPLEGROUPS_LIVE_CHECK === "1";

test.skip(!LIVE, "PeopleGroups.org live certification runs only in the dedicated external-data workflow.");

test("browser origin can read and validate PeopleGroups.org API", async ({ page }) => {
  await page.goto("./#/", { waitUntil: "domcontentloaded" });

  const result = await page.evaluate(async () => {
    const pageUrl = "https://peoplegroups.org/wp-json/pg/v1/people-groups?page=1&per_page=1";
    const list = await fetch(pageUrl, { method: "GET", mode: "cors", credentials: "omit", cache: "no-store" });
    const listBody = list.ok ? await list.json() as Array<Record<string, unknown>> : null;
    const discoveredPgid = typeof listBody?.[0]?.PGID === "string" ? listBody[0].PGID : null;

    let singleStatus: number | null = null;
    let singleBody: Record<string, unknown> | null = null;
    if (discoveredPgid) {
      const singleUrl = `https://peoplegroups.org/wp-json/pg/v1/people-groups/${encodeURIComponent(discoveredPgid)}`;
      const single = await fetch(singleUrl, { method: "GET", mode: "cors", credentials: "omit", cache: "no-store" });
      singleStatus = single.status;
      singleBody = single.ok ? await single.json() as Record<string, unknown> : null;
    }

    return {
      listStatus: list.status,
      listBody,
      total: list.headers.get("X-WP-Total"),
      totalPages: list.headers.get("X-WP-TotalPages"),
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
