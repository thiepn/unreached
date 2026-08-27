import { expect, test } from "@playwright/test";

import { installPeopleGroupsFixture, VISIBLE_TEST_PEID, VISIBLE_TEST_PEOPLE } from "./peoplegroups-fixture";

test.beforeEach(async ({ page }) => {
  await installPeopleGroupsFixture(page);
});

test("search is primary and reach status stays immediately available", async ({ page }) => {
  await page.goto("./#/peoples");
  const search = page.getByRole("searchbox", { name: "Search people groups" });
  await expect(search).toBeVisible();
  await expect(page.getByRole("group", { name: "Reach status" })).toBeVisible();
  await search.fill(VISIBLE_TEST_PEOPLE);
  await expect(page.getByRole("heading", { name: VISIBLE_TEST_PEOPLE })).toBeVisible();
});

test("advanced filters stay progressive and expose removable active filters", async ({ page }) => {
  await page.goto("./#/peoples");
  const panel = page.locator(".people-filter-panel--advanced");
  await expect(panel).not.toHaveAttribute("open", "");
  await panel.locator("summary").click();
  await panel.getByRole("combobox", { name: "Country" }).selectOption("BEN");

  await expect(page).toHaveURL(/country=BEN/);
  await expect(page.locator(".people-filter-count")).toHaveText("1");
  const activeFilters = page.locator(".people-active-filters");
  await expect(activeFilters).toBeVisible();
  await expect(activeFilters.getByRole("button", { name: /Benin/ })).toBeVisible();
  await expect(page.locator(".people-card--explorer")).toHaveCount(2);

  await activeFilters.getByRole("button", { name: /Benin/ }).click();
  await expect(page).not.toHaveURL(/country=BEN/);
  await expect(page.locator(".people-active-filters")).toHaveCount(0);
  await expect(page.locator(".people-card--explorer")).toHaveCount(3);
});

test("result progression remains bounded and preserves URL-backed pages", async ({ page }) => {
  await page.goto("./#/peoples");
  await expect(page.locator(".people-card--explorer")).toHaveCount(3);
  await expect(page.locator(".people-result-count")).toContainText("3");

  await page.goto("./#/peoples?q=Fon");
  await expect(page.locator("#people-search")).toHaveValue("Fon");
  await expect(page.getByRole("heading", { name: VISIBLE_TEST_PEOPLE })).toBeVisible();
  await expect(page).toHaveURL(/q=Fon/);
});

test("profile navigation remains keyed by PEID", async ({ page }) => {
  await page.goto("./#/peoples");
  const card = page.locator(".people-card--explorer").filter({ hasText: VISIBLE_TEST_PEOPLE });
  await expect(card).toBeVisible();
  await expect(card.getByRole("link", { name: /Open profile/ })).toHaveAttribute("href", `#/peoples/${VISIBLE_TEST_PEID}`);
});
