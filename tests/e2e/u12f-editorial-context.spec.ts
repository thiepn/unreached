import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { expect, test } from "@playwright/test";

import { installPeopleGroupsFixture, UNCOVERED_TEST_PEID, VISIBLE_TEST_PEID } from "./peoplegroups-fixture";

const fixture = JSON.parse(await readFile(resolve(process.cwd(), "data/fixtures/context.synthetic.json"), "utf8")) as { profiles: unknown[] };

async function installEditorialFixture(page: import("@playwright/test").Page): Promise<void> {
  await page.route(/\/data\/context\/status\.json(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        schemaVersion: 2,
        available: true,
        fixture: false,
        mode: "reviewed-editorial",
        datasetUrl: "data/context/editorial.v2.json",
        reason: null,
        profileCount: fixture.profiles.length,
        identityProvider: "peoplegroups-org"
      })
    });
  });
  await page.route(/\/data\/context\/editorial\.v2\.json(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ...fixture, fixture: false })
    });
  });
}

test.beforeEach(async ({ page }) => {
  await installPeopleGroupsFixture(page);
  await installEditorialFixture(page);
});

test("reviewed editorial context attaches to an explicitly verified live PEID/PGID source record", async ({ page }) => {
  await page.goto(`./#/peoples/${VISIBLE_TEST_PEID}`);

  await expect(page.getByRole("heading", { name: "Browser Test People", exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Understand their world.", exact: true })).toBeVisible();
  await expect(page.getByText("Source-record identity verified", { exact: true })).toBeVisible();
  await expect(page.getByText(/PeopleGroups PEID 910001 · PG910001 · BEN · fon/)).toBeVisible();
  await expect(page.getByText(/not a cross-country grouping key/)).toBeVisible();
  await expect(page.getByText(/legacy numeric IDs are never matched by coincidence/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Who are they?", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Why are they unreached?", exact: true })).toBeVisible();
  await expect(page.getByText("Evidence synthesis", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Synthetic fixture validator/)).toBeVisible();
  await expect(page.locator('a[href="#/peoples/999001"]')).toHaveCount(0);
});

test("people records without reviewed editorial content keep their live source profile without fabricated filler", async ({ page }) => {
  await page.goto(`./#/peoples/${UNCOVERED_TEST_PEID}`);

  await expect(page.getByRole("heading", { name: "Second Browser People", exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Reviewed context not yet published for this source record", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Understand their world.", exact: true })).toHaveCount(0);
});
