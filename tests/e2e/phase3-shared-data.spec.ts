import { expect, test } from "@playwright/test";

import { installPeopleGroupsFixture, VISIBLE_TEST_PEID, VISIBLE_TEST_PEOPLE } from "./peoplegroups-fixture";

test.describe("Phase 3 shared data architecture", () => {
  test.use({ serviceWorkers: "block" });

  test("reuses geography across Explore and global search", async ({ page }) => {
    await installPeopleGroupsFixture(page);
    let geographyRequests = 0;
    let peopleGroupsRequests = 0;

    page.on("request", (request) => {
      const url = request.url();
      if (url.includes("/maps/world-countries.geojson")) geographyRequests += 1;
      if (/peoplegroups\.org\/wp-json\/pg\/v1\/people-groups(?:\?|$)/.test(url)) peopleGroupsRequests += 1;
    });

    await page.goto("./#/");
    await expect(page.locator("main")).toContainText("Explore");
    await expect.poll(() => geographyRequests).toBe(1);

    await page.getByRole("button", { name: "Search people, countries and languages" }).click();
    await page.getByRole("searchbox", { name: "Search peoples, countries or languages" }).fill(VISIBLE_TEST_PEOPLE);
    await expect(page.getByText(VISIBLE_TEST_PEOPLE, { exact: true }).first()).toBeVisible();

    expect(geographyRequests).toBe(1);
    expect(peopleGroupsRequests).toBeLessThanOrEqual(1);
  });

  test("reuses one editorial publication across profile and coverage routes", async ({ page }) => {
    await installPeopleGroupsFixture(page);
    let editorialStatusRequests = 0;

    page.on("request", (request) => {
      if (request.url().includes("/data/context/status.json")) editorialStatusRequests += 1;
    });

    await page.goto(`./#/peoples/${VISIBLE_TEST_PEID}`);
    await expect(page.getByRole("heading", { name: VISIBLE_TEST_PEOPLE }).first()).toBeVisible();
    await expect.poll(() => editorialStatusRequests).toBe(1);

    await page.evaluate(() => { window.location.hash = "/coverage"; });
    await expect(page.locator("main")).toContainText("Reviewed");
    await page.waitForTimeout(150);

    expect(editorialStatusRequests).toBe(1);
  });
});
