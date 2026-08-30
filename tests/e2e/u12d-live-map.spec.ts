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

  const picker = mobile ? mobileSheet.locator(".mission-view-picker") : page.locator(".explore-panel--phase10 .mission-view-picker");
  await expect(picker).not.toHaveAttribute("open", "");
  await picker.locator(":scope > summary").click();
  const layerSelect = picker.getByLabel("Mission map layer");
  await expect(layerSelect).toBeVisible();
  await expect(layerSelect).toHaveValue("unreached-population");

  await search.fill("Benin");
  await page.locator(".country-row:visible", { hasText: "Benin" }).first().click();

  if (!mobile) {
    await expect(page.getByRole("heading", { name: "Benin" })).toBeVisible();
    const selectedSummary = page.locator(".selected-mission-summary");
    const primaryMetric = selectedSummary.locator(".selected-mission-primary");
    await expect(primaryMetric).toContainText("Unreached population share", { timeout: 15_000 });
    await expect(primaryMetric).toContainText("100%");

    const sourceBreakdown = selectedSummary.locator(".selected-mission-details");
    await expect(sourceBreakdown).not.toHaveAttribute("open", "");
    await sourceBreakdown.locator("summary").click();
    await expect(sourceBreakdown.getByText("People contexts", { exact: true })).toBeVisible();
    await expect(sourceBreakdown.getByText("GSEC 0–3", { exact: true })).toBeVisible();
    await expect(sourceBreakdown.getByText("Known population", { exact: true })).toBeVisible();
    await expect(sourceBreakdown.getByText("170K", { exact: true })).toBeVisible();
    await expect(sourceBreakdown.getByText(/people-group-in-country records returned by PeopleGroups\.org/i)).toBeVisible();
  } else {
    await expect(mobileSheet.getByText("Benin", { exact: true }).first()).toBeVisible();
  }

  await layerSelect.selectOption("gsec-coverage");
  const currentView = mobile ? mobileSheet.locator(".mission-view-current") : page.locator(".explore-panel--phase10 .mission-view-current");
  await expect(currentView).toContainText("Mission-status data coverage");
  await expect(page.getByText("100%", { exact: true }).filter({ visible: true }).first()).toBeVisible();

  await expect(page.getByText(/Frontier/i)).toHaveCount(0);
  await expect(page.getByText(/JPScale/i)).toHaveCount(0);
  await expect(page.getByText(/Complete Bible/i)).toHaveCount(0);
});