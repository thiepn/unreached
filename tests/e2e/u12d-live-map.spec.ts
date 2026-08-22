import { expect, test } from "@playwright/test";

import { installPeopleGroupsFixture } from "./peoplegroups-fixture";

test.beforeEach(async ({ page }) => {
  await installPeopleGroupsFixture(page);
});

test("mission atlas renders source-native PeopleGroups layers and country context", async ({ page }) => {
  await page.goto("./#/", { waitUntil: "domcontentloaded" });

  await expect(page.getByText("GSEC 0–3 population share", { exact: true }).first()).toBeVisible();
  const search = page.locator("#desktop-country-search");
  await search.fill("Benin");
  await page.locator(".country-row", { hasText: "Benin" }).first().click();

  await expect(page.getByRole("heading", { name: "Benin" })).toBeVisible();
  await expect(page.getByText("People contexts").first()).toBeVisible();
  await expect(page.getByText("GSEC 0–3").first()).toBeVisible();
  await expect(page.getByText("170K", { exact: true })).toBeVisible();
  await expect(page.getByText(/people-group-in-country records returned by PeopleGroups\.org/i)).toBeVisible();

  await page.getByRole("radio", { name: "GSEC coverage" }).first().click();
  await expect(page.getByText("100%", { exact: true }).first()).toBeVisible();

  await expect(page.getByText(/Frontier/i)).toHaveCount(0);
  await expect(page.getByText(/JPScale/i)).toHaveCount(0);
  await expect(page.getByText(/Complete Bible/i)).toHaveCount(0);
});
