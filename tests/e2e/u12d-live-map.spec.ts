import { expect, test } from "@playwright/test";

import { installPeopleGroupsFixture } from "./peoplegroups-fixture";

test.beforeEach(async ({ page }) => { await installPeopleGroupsFixture(page); });

test("mission atlas renders source-native PeopleGroups layers and country context", async ({ page }) => {
  await page.goto("./#/", { waitUntil: "domcontentloaded" });

  const desktopSearch = page.locator("#desktop-country-search");
  const mobileSearch = page.locator("#mobile-country-search");
  const mobileSheet = page.locator(".mobile-map-sheet");
  const mobile = (page.viewportSize()?.width ?? 1280) <= 760;
  const search = mobile ? mobileSearch : desktopSearch;

  if (mobile) {
    await expect(mobileSheet).toBeVisible();
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
    const selectedSummary = page.locator(".selected-mission-summary");
    await expect(selectedSummary.locator(".selected-mission-primary")).toContainText("170K", { timeout: 15_000 });
    const sourceBreakdown = selectedSummary.locator(".selected-mission-details");
    await expect(sourceBreakdown).not.toHaveAttribute("open", "");
    await sourceBreakdown.locator("summary").click();
    await expect(sourceBreakdown.getByText("People contexts", { exact: true })).toBeVisible();
    await expect(sourceBreakdown.getByText("GSEC 0–3", { exact: true })).toBeVisible();
    await expect(sourceBreakdown.getByText(/people-group-in-country records returned by PeopleGroups\.org/i)).toBeVisible();
  } else {
    await expect(mobileSheet.getByText("Benin", { exact: true }).first()).toBeVisible();
  }

  await layerSelect.selectOption("gsec-coverage");
  await expect(page.getByText("100%", { exact: true }).filter({ visible: true }).first()).toBeVisible();

  await expect(page.getByText(/Frontier/i)).toHaveCount(0);
  await expect(page.getByText(/JPScale/i)).toHaveCount(0);
  await expect(page.getByText(/Complete Bible/i)).toHaveCount(0);
});