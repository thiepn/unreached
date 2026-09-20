import { mkdir } from "node:fs/promises";

import { expect, test } from "@playwright/test";

import { installPeopleGroupsFixture, VISIBLE_TEST_PEID } from "./peoplegroups-fixture";

const artifactDir = "artifacts/v3-phase20";

test.beforeAll(async () => {
  await mkdir(artifactDir, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  await installPeopleGroupsFixture(page);
});

test("peak shell preserves the simple primary architecture and finished copy", async ({ page }) => {
  await page.goto("./#/regions");

  const shell = page.locator('[data-v3-shell="true"]');
  await expect(shell).toBeVisible();

  const desktopNav = page.locator("nav.v3-primary-nav");
  await expect(desktopNav.getByRole("link")).toHaveCount(3);
  await expect(desktopNav.getByRole("link", { name: "Explore" })).toHaveAttribute("href", "#/");
  await expect(desktopNav.getByRole("link", { name: "Peoples" })).toHaveAttribute("href", "#/peoples");
  await expect(desktopNav.getByRole("link", { name: "Pray" })).toHaveAttribute("href", "#/pray");

  await expect(page.getByRole("button", { name: "Search people, countries and languages" })).toBeVisible();
  await expect(page.getByRole("link", { name: "My saved people and prayer list" })).toHaveAttribute("href", "#/saved");
  await expect(page.locator("main")).not.toContainText(/Phase\s+\d+/);

  const skip = page.locator(".skip-link");
  await skip.focus();
  await skip.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("peak journey reaches prayer and private memory without ranking mechanics", async ({ page }) => {
  await page.goto("./#/regions/africa");

  const countryGrid = page.locator('[data-v3-region-country-grid="true"]');
  await expect(countryGrid).toBeVisible({ timeout: 15_000 });
  await countryGrid.locator('a[href="#/countries/BEN"]').first().click();

  await expect(page.getByRole("heading", { level: 1, name: "Benin" })).toBeVisible({ timeout: 15_000 });
  const peopleLink = page.locator('a[href="#/peoples/' + VISIBLE_TEST_PEID + '"]').first();
  await expect(peopleLink).toBeVisible();
  await peopleLink.click();

  await expect(page.getByRole("heading", { level: 1, name: "Browser Test People" })).toBeVisible({ timeout: 15_000 });
  const prayLink = page.locator('a.people-hero-pray[href="#/pray/' + VISIBLE_TEST_PEID + '"]');
  await expect(prayLink).toHaveText(/Pray for this people/);
  await prayLink.click();

  await expect(page.getByRole("heading", { level: 1, name: "Pray for Browser Test People" })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Add to private prayer list" }).click();
  await expect(page.getByRole("button", { name: "Remove from private prayer list" })).toBeVisible();

  await page.getByRole("link", { name: "My saved people and prayer list" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Saved" })).toBeVisible();
  await expect(page.locator('[data-prayer-list-peid="' + VISIBLE_TEST_PEID + '"]')).toBeVisible();

  await expect(page.getByText(/leaderboard|XP|prayer score|mission priority/i)).toHaveCount(0);
  await page.locator('[data-memory-section="prayer-list"]').screenshot({ path: artifactDir + "/peak-prayer-memory.png" });
});

test("peak mobile shell retains focus trapping, route focus, and horizontal-fit guarantees", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/regions");

  const mobileNav = page.locator("nav.v3-mobile-nav");
  await expect(mobileNav).toBeVisible();
  await expect(mobileNav.getByRole("link", { name: "Explore" })).toBeVisible();
  await expect(mobileNav.getByRole("link", { name: "Peoples" })).toBeVisible();
  await expect(mobileNav.getByRole("link", { name: "Pray" })).toBeVisible();
  await expect(mobileNav.getByRole("link", { name: "Saved" })).toBeVisible();

  const more = mobileNav.getByRole("button", { name: "More navigation" });
  await more.click();
  const dialog = page.getByRole("dialog", { name: "More navigation" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(more).toBeFocused();

  for (const route of [
    "./#/regions",
    "./#/countries/BEN",
    "./#/peoples/" + VISIBLE_TEST_PEID,
    "./#/pray/" + VISIBLE_TEST_PEID,
    "./#/saved",
  ]) {
    await page.goto(route);
    await expect(page.locator("#main-content")).toBeFocused({ timeout: 15_000 });
    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(dimensions.width).toBeLessThanOrEqual(dimensions.client + 1);
  }

  await mobileNav.screenshot({ path: artifactDir + "/peak-mobile-shell.png" });
});

test("peak shared-prayer route fails closed on invalid public payload", async ({ page }) => {
  await page.goto("./#/share/prayer?c=invalid-payload");

  const shared = page.locator('[data-phase19-shared-prayer="invalid"]');
  await expect(shared).toBeVisible();
  await expect(shared.getByRole("heading", { name: "This prayer collection link is invalid." })).toBeVisible();
  await expect(page.locator('[data-shared-prayer-peid]')).toHaveCount(0);
  await expect(page.locator("#main-content")).toBeFocused();
});
