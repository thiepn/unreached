import { mkdir } from "node:fs/promises";

import { expect, test } from "@playwright/test";

import { installPeopleGroupsFixture, VISIBLE_TEST_PEOPLE } from "./peoplegroups-fixture";

const artifactDir = "artifacts/v3-phase7";

test.beforeAll(async () => {
  await mkdir(artifactDir, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  await installPeopleGroupsFixture(page);
});

test("country directory starts with regions", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("./#/countries", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { level: 1, name: "Explore countries." })).toBeVisible();
  const regions = page.locator(".v3-country-region-strip");
  await expect(regions).toBeVisible();
  await expect(regions.getByRole("link", { name: /Africa/i })).toBeVisible();
  await expect(regions.getByRole("link", { name: /Asia/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Find a country" })).toBeVisible();
  await expect(page.locator("#countries-search")).toHaveAttribute("placeholder", "Search country, code or region");

  await page.screenshot({ path: `${artifactDir}/desktop-countries.png`, fullPage: false });
});

test("region route continues into countries", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("./#/regions/africa", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { level: 1, name: "Africa" })).toBeVisible();
  await expect(page.getByText("Continue into a country", { exact: true })).toBeVisible();
  const grid = page.locator("[data-v3-region-country-grid]");
  await expect(grid).toBeVisible();
  const benin = grid.getByRole("link", { name: /Benin/i });
  await expect(benin).toBeVisible();
  await expect(benin).toContainText("2");
  await expect(benin).toContainText("People groups");
  await expect(benin).toHaveAttribute("href", "#/countries/BEN");
});

test("country breadcrumb is World Region Country", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("./#/countries/BEN", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { level: 1, name: "Benin" })).toBeVisible({ timeout: 15_000 });
  const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(breadcrumb.getByRole("link", { name: "World" })).toHaveAttribute("href", "#/regions");
  await expect(breadcrumb.getByRole("link", { name: "Africa" })).toHaveAttribute("href", "#/regions/africa");
  await expect(breadcrumb.getByText("Benin", { exact: true })).toBeVisible();
});

test("country continues into people", async ({ page }) => {
  await page.goto("./#/countries/BEN", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1, name: "Benin" })).toBeVisible({ timeout: 15_000 });

  await expect(page.getByText("Country → People", { exact: true })).toBeVisible();
  const people = page.locator(".country-largest-people-list");
  const link = people.getByRole("link", { name: new RegExp(VISIBLE_TEST_PEOPLE) });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", "#/peoples/910001");
  await expect(page.getByRole("link", { name: /Pray for this country’s peoples/ })).toHaveAttribute("href", "#/pray?country=BEN");
});

test("geographic hierarchy stays usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of ["/regions", "/regions/africa", "/countries", "/countries/BEN"]) {
    await page.goto(`./#${route}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("#main-content")).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.scrollWidth, route).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  }

  await page.goto("./#/regions/africa", { waitUntil: "domcontentloaded" });
  await expect(page.locator("[data-v3-region-country-grid]").getByRole("link", { name: /Benin/i })).toBeVisible();
  await page.screenshot({ path: `${artifactDir}/mobile-region-africa.png`, fullPage: false });
});
