import { expect, test } from "@playwright/test";

import { installPeopleGroupsFixture } from "./peoplegroups-fixture";

test.beforeEach(async ({ page }) => { await installPeopleGroupsFixture(page); });

test("mission atlas renders source-native PeopleGroups layers and country context", async ({ page }) => {
  await page.goto("./#/", { waitUntil: "domcontentloaded" });

  const desktopSearch = page.locator("#desktop-country-search");
  const mobileSearch = page.locator("#mobile-country-search");
  const mobileSheet = page.locator(".mobile-map-sheet");
  const mobile = await mobileSheet.isVisible();
  const search = mobile ? mobileSearch : desktopSearch;

  if (mobile) {
    await mobileSheet.locator("summary").first().click();
  }
  await expect(search).toBeVisible();

  const layerSelect = page.getByLabel("Mission map layer").filter({ visible: true }).first();
  await expect(layerSelect).toBeVisible();
  await expect(layerSelect).toHaveValue("unreached-population");

  await search.fill("Benin");
  await page.locator(".country-row:visible", { hasText: "Benin" }).first().click();

  if (!mobile) {
    await expect(page.getByRole("heading", { name: "Benin" })).toBeVisible();
    await expect(page.getByText("People contexts").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("GSEC 0–3").first()).toBeVisible();
    await expect(page.getByText("170K", { exact: true })).toBeVisible();
    await expect(page.getByText(/people-group-in-country records returned by PeopleGroups\.org/i)).toBeVisible();
  } else {
    await expect(mobileSheet.getByText("Benin", { exact: true }).first()).toBeVisible();
  }

  await layerSelect.selectOption("gsec-coverage");
  await expect(page.getByText("100%", { exact: true }).filter({ visible: true }).first()).toBeVisible();

  await expect(page.getByText(/Frontier/i)).toHaveCount(0);
  await expect(page.getByText(/JPScale/i)).toHaveCount(0);
  await expect(page.getByText(/Complete Bible/i)).toHaveCount(0);
});