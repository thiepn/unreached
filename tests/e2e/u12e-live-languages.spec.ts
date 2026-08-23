import { expect, test } from "@playwright/test";

import { installPeopleGroupsFixture } from "./peoplegroups-fixture";

test.beforeEach(async ({ page }) => {
  await installPeopleGroupsFixture(page);
});

test("live language explorer preserves raw PeopleGroups resource semantics", async ({ page }) => {
  await page.goto("./#/languages");
  await expect(page.getByRole("heading", { name: /Follow gospel access through the languages people report/i })).toBeVisible();

  const fon = page.getByRole("link", { name: /Fon/ }).first();
  await expect(fon).toBeVisible({ timeout: 15_000 });
  await expect(fon).toContainText("FON");
  await expect(fon).toContainText("1");
  await fon.click();

  await expect(page.getByRole("heading", { name: "Fon", exact: true })).toBeVisible();
  await expect(page.getByText("ISO 639-3 · FON", { exact: true })).toBeVisible();
  await expect(page.getByText(/2 PeopleGroups\.org country-context records/)).toBeVisible();
  const metrics = page.locator(".language-metric-grid");
  await expect(metrics.getByText("120,000", { exact: true })).toBeVisible();
  await expect(metrics.getByText(/1\/2 contexts report population/)).toBeVisible();
  await expect(page.getByText("Bible source labels", { exact: true })).toBeVisible();
  const bibleBreakdown = page.locator(".language-resource-breakdown").first();
  await expect(bibleBreakdown.getByText("Available", { exact: true })).toBeVisible();
  await expect(bibleBreakdown.getByText("Unknown", { exact: true })).toBeVisible();
  await expect(page.getByText(/PGID country-context records reporting this ISO 639-3 language/)).toBeVisible();
  await expect(page.getByText(/not converted into “portions,” “New Testament,” or “complete Bible,”/i)).toBeVisible();

  await expect(page.getByText("Complete Bible", { exact: true })).toHaveCount(0);
  await expect(page.getByText("New Testament", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Frontier", { exact: true })).toHaveCount(0);
  await expect(page.getByText("JPScale", { exact: true })).toHaveCount(0);
});

test("global search indexes live ISO language records", async ({ page }) => {
  await page.goto("./#/countries");
  await page.keyboard.press("/");
  const dialog = page.getByRole("dialog", { name: "Search Unreached" });
  const search = dialog.getByRole("searchbox", { name: "Search peoples, countries or languages" });
  await search.fill("fon");
  const result = dialog.locator('a[href="#/languages/fon"]');
  await expect(result).toBeVisible({ timeout: 15_000 });
  await expect(result).toContainText("Fon");
  await result.click();
  await expect(page.getByRole("heading", { name: "Fon", exact: true })).toBeVisible();
});
