import { expect, test } from "@playwright/test";

import { installPeopleGroupsFixture, VISIBLE_TEST_PEID, VISIBLE_TEST_PEOPLE } from "./peoplegroups-fixture";

function peopleGroupsRequestKind(url: string): "record" | "corpus" | null {
  if (/peoplegroups\.org\/wp-json\/pg\/v1\/people-groups\/PG[0-9]+$/.test(url)) return "record";
  if (/peoplegroups\.org\/wp-json\/pg\/v1\/people-groups(?:\?|$)/.test(url)) return "corpus";
  return null;
}

test.describe("Phase 4 route-specific PeopleGroups loading", () => {
  test.use({ serviceWorkers: "block" });

  test("direct people profile fetches one record and does not activate the corpus", async ({ page }) => {
    await installPeopleGroupsFixture(page);
    let recordRequests = 0;
    let corpusRequests = 0;
    page.on("request", (request) => {
      const kind = peopleGroupsRequestKind(request.url());
      if (kind === "record") recordRequests += 1;
      if (kind === "corpus") corpusRequests += 1;
    });

    await page.goto(`./#/peoples/${VISIBLE_TEST_PEID}`);
    await expect(page.getByRole("heading", { name: VISIBLE_TEST_PEOPLE }).first()).toBeVisible();
    await expect(page.locator(".people-profile")).toHaveAttribute("data-people-data-source", "network");
    await expect(page.locator(".people-profile")).toHaveAttribute("data-people-pgid", "PG910001");

    expect(recordRequests).toBe(1);
    expect(corpusRequests).toBe(0);
  });

  test("focused prayer reuses the route record without activating the corpus", async ({ page }) => {
    await installPeopleGroupsFixture(page);
    let recordRequests = 0;
    let corpusRequests = 0;
    page.on("request", (request) => {
      const kind = peopleGroupsRequestKind(request.url());
      if (kind === "record") recordRequests += 1;
      if (kind === "corpus") corpusRequests += 1;
    });

    await page.goto(`./#/peoples/${VISIBLE_TEST_PEID}`);
    await expect(page.getByRole("heading", { name: VISIBLE_TEST_PEOPLE }).first()).toBeVisible();
    await page.evaluate((peid) => { window.location.hash = `/pray/${peid}`; }, VISIBLE_TEST_PEID);
    await expect(page.getByRole("heading", { name: `Pray for ${VISIBLE_TEST_PEOPLE}` })).toBeVisible();
    await expect(page.locator(".prayer-focus")).toHaveAttribute("data-prayer-pgid", "PG910001");

    expect(recordRequests).toBe(1);
    expect(corpusRequests).toBe(0);
  });

  test("a fresh route record survives reload through IndexedDB without another network request", async ({ page }) => {
    await installPeopleGroupsFixture(page);
    let recordRequests = 0;
    page.on("request", (request) => {
      if (peopleGroupsRequestKind(request.url()) === "record") recordRequests += 1;
    });

    await page.goto(`./#/peoples/${VISIBLE_TEST_PEID}`);
    await expect(page.locator(".people-profile")).toHaveAttribute("data-people-data-source", "network");
    expect(recordRequests).toBe(1);

    await page.reload();
    await expect(page.getByRole("heading", { name: VISIBLE_TEST_PEOPLE }).first()).toBeVisible();
    await expect(page.locator(".people-profile")).toHaveAttribute("data-people-data-source", "cache-fresh");
    expect(recordRequests).toBe(1);
  });

  test("full corpus promotion replaces the route snapshot with the canonical Phase 3 entity", async ({ page }) => {
    await installPeopleGroupsFixture(page);
    let recordRequests = 0;
    let corpusRequests = 0;
    page.on("request", (request) => {
      const kind = peopleGroupsRequestKind(request.url());
      if (kind === "record") recordRequests += 1;
      if (kind === "corpus") corpusRequests += 1;
    });

    await page.goto(`./#/peoples/${VISIBLE_TEST_PEID}`);
    await expect(page.locator(".people-profile")).toHaveAttribute("data-people-data-source", "network");

    await page.evaluate(() => { window.location.hash = "/peoples"; });
    await expect(page.locator("#people-search")).toBeVisible();
    await expect.poll(() => corpusRequests).toBe(1);

    await page.evaluate((peid) => { window.location.hash = `/peoples/${peid}`; }, VISIBLE_TEST_PEID);
    await expect(page.locator(".people-profile")).toHaveAttribute("data-people-data-source", "corpus");
    await expect(page.locator(".people-profile")).toHaveAttribute("data-people-pgid", "PG910001");
    expect(recordRequests).toBe(1);
  });

  test("PEID route keys are converted to certified zero-padded PGIDs", async ({ page }) => {
    let requestedRecord = "";
    let corpusRequests = 0;
    await page.route(/https:\/\/peoplegroups\.org\/wp-json\/pg\/v1\/people-groups\/PG[0-9]+$/, async (route) => {
      requestedRecord = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          PEID: 12319,
          PGID: "PG012319",
          NmDisp: "Fon",
          ISOalpha3: "BEN",
          Ctry: "Benin",
          Pop: 2100000,
          ROL: "fon",
          Lang: "Fon",
          GSEC: 2,
          UpdatedDate: "2026-08-23T00:00:00.000Z",
        }),
      });
    });
    await page.route(/https:\/\/peoplegroups\.org\/wp-json\/pg\/v1\/people-groups(?:\?.*)?$/, async (route) => {
      corpusRequests += 1;
      await route.fulfill({ status: 500, body: "corpus should not be requested" });
    });

    await page.goto("./#/peoples/12319");
    await expect(page.getByRole("heading", { name: "Fon" }).first()).toBeVisible();
    expect(requestedRecord.endsWith("/people-groups/PG012319")).toBe(true);
    expect(corpusRequests).toBe(0);
  });
});
