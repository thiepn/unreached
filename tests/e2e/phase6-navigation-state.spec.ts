import { expect, test } from "@playwright/test";

import { installPeopleGroupsFixture, VISIBLE_TEST_PEOPLE } from "./peoplegroups-fixture";

test.describe("Phase 6 URL-backed discovery state", () => {
  test.beforeEach(async ({ page }) => {
    await installPeopleGroupsFixture(page);
  });

  test("People search and filters survive profile navigation and Back", async ({ page }) => {
    await page.goto("./#/peoples");
    const search = page.locator("#people-search");
    await expect(search).toBeVisible();
    await search.fill("Browser Test");
    const unreached = page.getByRole("button", { name: "Unreached", exact: true });
    await unreached.click();
    const country = page.locator(".people-primary-context-filters").getByRole("combobox", { name: "Country" });
    await country.selectOption("BEN");

    await expect(page).toHaveURL(/#\/peoples\?.*q=Browser\+Test/);
    await expect(page).toHaveURL(/status=unreached-only/);
    await expect(page).toHaveURL(/country=BEN/);

    await page.getByRole("link", { name: new RegExp(VISIBLE_TEST_PEOPLE) }).first().click();
    await expect(page).toHaveURL(/#\/peoples\/910001$/);
    await page.goBack();

    await expect(page.locator("#people-search")).toHaveValue("Browser Test");
    await expect(page.getByRole("button", { name: "Unreached", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".people-primary-context-filters").getByRole("combobox", { name: "Country" })).toHaveValue("BEN");
    await expect(page.locator(".people-filter-panel--advanced")).not.toHaveAttribute("open", "");
  });

  test("Countries and Languages restore query, filters, sort and page from URLs", async ({ page }) => {
    await page.goto("./#/countries?q=Benin&page=2");
    await expect(page.locator("#countries-search")).toHaveValue("Benin");
    await expect(page).toHaveURL(/q=Benin/);
    await expect(page).toHaveURL(/page=2/);

    await page.goto("./#/languages?q=Fon&reach=has-unreached&sort=people-count-desc&page=2");
    await expect(page.locator(".language-search input")).toHaveValue("Fon");
    await page.locator(".language-filter-panel > summary").click();
    await expect(page.locator(".language-filter-grid label").filter({ hasText: "Mission context" }).locator("select")).toHaveValue("has-unreached");
    await expect(page.locator(".language-filter-grid label").filter({ hasText: "Sort" }).locator("select")).toHaveValue("people-count-desc");
    await expect(page).toHaveURL(/page=2/);
  });

  test("Reviewed Coverage and Prayer initialize from hash query state", async ({ page }) => {
    await page.goto("./#/coverage?q=Kazakh&region=Central%20Asia");
    await expect(page.locator("#editorial-coverage-search")).toHaveValue("Kazakh");
    await expect(page.locator(".editorial-coverage-controls label").filter({ hasText: "Region" }).locator("select")).toHaveValue("Central Asia");

    await page.goto("./#/pray?country=BEN&q=Browser");
    await expect(page.locator("#prayer-search")).toHaveValue("Browser");
    await expect(page.locator(".prayer-scope-banner")).toContainText("BEN");
    await expect(page).toHaveURL(/country=BEN/);
    await expect(page).toHaveURL(/q=Browser/);
  });
});

test.describe("Phase 6 router and search contracts", () => {
  test.beforeEach(async ({ page }) => {
    await installPeopleGroupsFixture(page);
  });

  test("fresh direct route loads establish main-content keyboard focus", async ({ page }) => {
    await page.goto("./#/countries");
    await expect(page.locator("#main-content")).toBeFocused();
  });

  test("zero-valued people and prayer routes are not silently treated as list routes", async ({ page }) => {
    await page.goto("./#/peoples/0");
    await expect(page.getByRole("heading", { name: "This route is not on the map." })).toBeVisible();
    await expect(page).toHaveTitle(/Page Not Found.+Unreached/i);

    await page.goto("./#/pray/0");
    await expect(page.getByRole("heading", { name: "This route is not on the map." })).toBeVisible();
  });

  test("global-search arrows follow the visual grouped order and keep the active row in view", async ({ page }) => {
    await page.goto("./#/about");
    await page.locator("#main-content").focus();
    await page.keyboard.press("/");
    const search = page.getByRole("searchbox", { name: "Search peoples, countries or languages" });
    await expect(search).toBeVisible();
    await search.fill("Benin");

    const rows = page.locator(".search-result-row");
    await expect(rows.first()).toBeVisible();
    const firstId = await rows.nth(0).getAttribute("id");
    const secondId = await rows.nth(1).getAttribute("id");
    expect(firstId).toBeTruthy();
    expect(secondId).toBeTruthy();
    await expect(search).toHaveAttribute("aria-activedescendant", firstId!);

    await search.press("ArrowDown");
    await expect(search).toHaveAttribute("aria-activedescendant", secondId!);
    await expect(rows.nth(1)).toHaveClass(/is-active/);
  });
});