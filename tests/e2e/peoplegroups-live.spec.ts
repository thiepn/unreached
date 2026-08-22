import { expect, test } from "@playwright/test";

const LIVE = process.env.PEOPLEGROUPS_LIVE_CHECK === "1";

test.skip(!LIVE, "PeopleGroups.org live certification runs only in the dedicated external-data workflow.");

test("production browser origin can read and validate PeopleGroups.org API", async ({ page }) => {
  await page.goto("./#/", { waitUntil: "domcontentloaded" });

  const result = await page.evaluate(async () => {
    const singleUrl = "https://peoplegroups.org/wp-json/pg/v1/people-groups/PG012345";
    const pageUrl = "https://peoplegroups.org/wp-json/pg/v1/people-groups?page=1&per_page=1";

    const single = await fetch(singleUrl, { method: "GET", mode: "cors", credentials: "omit", cache: "no-store" });
    const singleBody = single.ok ? await single.json() as Record<string, unknown> : null;

    const list = await fetch(pageUrl, { method: "GET", mode: "cors", credentials: "omit", cache: "no-store" });
    const listBody = list.ok ? await list.json() as Array<Record<string, unknown>> : null;

    return {
      singleStatus: single.status,
      singleBody,
      listStatus: list.status,
      listBody,
      total: list.headers.get("X-WP-Total"),
      totalPages: list.headers.get("X-WP-TotalPages"),
    };
  });

  expect(result.singleStatus).toBe(200);
  expect(result.singleBody?.PGID).toBe("PG012345");
  expect(result.singleBody?.PEID).toBeTruthy();
  expect(result.singleBody?.NmDisp).toBeTruthy();
  expect(result.singleBody?.ISOalpha3).toMatch(/^[A-Z]{3}$/);

  expect(result.listStatus).toBe(200);
  expect(Array.isArray(result.listBody)).toBe(true);
  expect(result.listBody).toHaveLength(1);
  expect(Number(result.total)).toBeGreaterThan(10_000);
  expect(Number(result.totalPages)).toBeGreaterThan(1);
});
