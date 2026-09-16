import { mkdir } from "node:fs/promises";

import { expect, test } from "@playwright/test";

import { installPeopleGroupsFixture, VISIBLE_TEST_PEOPLE } from "./peoplegroups-fixture";

const artifactDir = "artifacts/v3-phase6";

test.beforeAll(async () => {
  await mkdir(artifactDir, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  await installPeopleGroupsFixture(page);
});

test("map owns most of the desktop workspace", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("./#/", { waitUntil: "domcontentloaded" });

  const rail = page.locator(".explore-v3__rail");
  const map = page.locator(".explore-v3__map");
  await expect(rail).toBeVisible();
  await expect(map).toBeVisible();
  await expect(page.getByRole("heading", { name: "Explore unreached peoples." })).toBeVisible();

  const layout = await page.evaluate(() => {
    const rail = document.querySelector<HTMLElement>(".explore-v3__rail")!;
    const map = document.querySelector<HTMLElement>(".explore-v3__map")!;
    return {
      viewport: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      railWidth: rail.getBoundingClientRect().width,
      mapWidth: map.getBoundingClientRect().width,
    };
  });
  expect(layout.mapWidth).toBeGreaterThan(layout.railWidth * 2);
  expect(layout.mapWidth / layout.viewport).toBeGreaterThan(0.7);
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewport + 1);

  const current = page.locator(".explore-v3__rail .mission-view-current");
  await expect(current).toContainText("Unreached population share");
  await expect(current).toContainText("Not national census data.");
  await expect(page.locator('.mission-map-key:visible')).toHaveCount(1);

  await page.screenshot({ path: `${artifactDir}/desktop-explore.png`, fullPage: false });
});

test("country selection explains the map and reveals people behind it", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("./#/", { waitUntil: "domcontentloaded" });

  const search = page.locator("#desktop-country-search");
  await expect(search).toBeVisible();
  await search.fill("Benin");
  const benin = page.locator(".explore-v3__rail .country-row", { hasText: "Benin" }).first();
  await expect(benin).toBeVisible();
  await benin.click();

  const selected = page.locator(".explore-v3__selected");
  await expect(selected).toBeVisible();
  await expect(selected).toContainText("Benin");
  await expect(selected.locator(".selected-mission-summary--comprehension")).toBeVisible({ timeout: 15_000 });
  await expect(selected.locator(".selected-mission-meaning")).toContainText("classified as unreached");

  const facts = selected.locator(".explore-v3__country-facts");
  await expect(facts).toContainText("2");
  await expect(facts).toContainText("unreached people groups represented");
  await expect(facts).toContainText("170K");
  await expect(facts).toContainText("represented population with estimates");

  const people = selected.locator(".explore-v3__people-list");
  await expect(people.getByRole("link", { name: new RegExp(VISIBLE_TEST_PEOPLE) })).toBeVisible();
  await expect(people.getByRole("link", { name: /Second Browser People/ })).toBeVisible();
  await expect(people.getByRole("link")).toHaveCount(2);

  const breakdown = selected.locator(".selected-mission-details");
  await expect(breakdown).not.toHaveAttribute("open", "");
  await expect(breakdown.locator(".selected-mission-grid")).not.toBeVisible();
  await expect(selected.getByRole("link", { name: "Explore country →" })).toHaveAttribute("href", "#/countries/BEN");
  await expect(selected.getByRole("link", { name: "Pray for its peoples →" })).toHaveAttribute("href", "#/pray?country=BEN");
});

test("research views remain opt in and URL compatible", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto("./#/", { waitUntil: "domcontentloaded" });

  const picker = page.locator(".explore-v3__rail .mission-view-picker");
  await expect(picker).not.toHaveAttribute("open", "");
  await expect(picker.locator("select")).not.toBeVisible();
  await picker.locator("summary").click();
  const select = picker.locator("select");
  await expect(select).toBeVisible();
  await expect(select).toContainText("Unreached people-group share");
  await expect(select).toContainText("Mission-status data coverage");
  await expect(select).toContainText("Source people-group records");

  await select.selectOption("gsec-coverage");
  await expect(page).toHaveURL(/layer=gsec-coverage/);
  await expect(page.locator(".mission-view-current").first()).toHaveAttribute("data-map-view-kind", "research");
  await expect(page.locator(".mission-view-current").first()).toContainText("Mission-status data coverage");
});

test("mobile selection opens the explanatory sheet", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/", { waitUntil: "domcontentloaded" });

  await expect(page.locator(".explore-v3__rail")).toBeHidden();
  await expect(page.locator(".explore-v3__map")).toBeVisible();
  const sheet = page.locator(".explore-v3__mobile-sheet");
  await expect(sheet).toBeVisible();
  await expect(sheet).not.toHaveAttribute("open", "");

  await page.getByRole("button", { name: "Find a country on the map" }).click();
  await expect(sheet).toHaveAttribute("open", "");
  const search = sheet.locator("#mobile-country-search");
  await expect(search).toBeFocused();
  await search.fill("Benin");
  const benin = sheet.locator(".country-row", { hasText: "Benin" }).first();
  await benin.click();

  await expect(sheet).toHaveAttribute("open", "");
  await expect(sheet.locator(".explore-v3__mobile-country-heading")).toContainText("Benin");
  await expect(sheet.locator(".selected-mission-summary--comprehension")).toBeVisible({ timeout: 15_000 });
  await expect(sheet.locator(".explore-v3__people-list").getByRole("link", { name: new RegExp(VISIBLE_TEST_PEOPLE) })).toBeVisible();
  await expect(sheet.locator(".mission-map-key--compact")).toBeVisible();
  await expect(page.locator('.mission-map-key:visible')).toHaveCount(1);

  await page.screenshot({ path: `${artifactDir}/mobile-explore-selected.png`, fullPage: false });
});

test("country finder remains usable when map rendering is only an enhancement", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 720 });
  await page.goto("./#/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#country-index-heading")).toHaveText("Find a country");
  await expect(page.locator("#desktop-country-search")).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse all →" })).toHaveAttribute("href", "#/countries");
});

test("Explore stays inside desktop and mobile viewports", async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 900, height: 800 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("./#/", { waitUntil: "domcontentloaded" });
    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(dimensions.width).toBeLessThanOrEqual(dimensions.client + 1);
  }
});
