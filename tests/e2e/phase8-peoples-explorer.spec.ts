import { expect, test } from "@playwright/test";

import { installPeopleGroupsFixture } from "./peoplegroups-fixture";

test.beforeEach(async ({ page }) => {
  await installPeopleGroupsFixture(page);
});

test("search is the first discovery action", async ({ page }) => {
  await page.goto("./#/peoples");
  const search = page.locator("#people-search");
  await expect(search).toBeVisible();
  await expect(page.locator(".guided-start")).toBeVisible();

  const order = await page.evaluate(() => {
    const searchWrap = document.querySelector(".people-search-wrap");
    const guided = document.querySelector(".guided-start");
    if (!searchWrap || !guided) return "missing";
    return searchWrap.compareDocumentPosition(guided) & Node.DOCUMENT_POSITION_FOLLOWING ? "search-first" : "guided-first";
  });
  expect(order).toBe("search-first");

  await search.fill("Browser Test");
  await expect(page.locator(".guided-start")).toHaveCount(0);
  await expect(page.locator(".people-editorial-discovery--secondary")).toHaveCount(0);
  await expect(page.locator(".people-card--explorer")).toHaveCount(2);
});

test("quick reach status filters results and persists in URL state", async ({ page }) => {
  await page.goto("./#/peoples");
  const other = page.getByRole("button", { name: "Other", exact: true });
  await expect(other).toHaveAttribute("aria-pressed", "false");
  await other.click();
  await expect(other).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(/status=other-only/);
  await expect(page.locator(".people-card--explorer")).toHaveCount(1);
  await expect(page.locator(".people-card--explorer")).toContainText("Browser Test People");

  await page.goto("./#/about");
  await page.goBack();
  await expect(page.getByRole("button", { name: "Other", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".people-card--explorer")).toHaveCount(1);
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

test("mobile discovery controls remain usable without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/peoples");
  await expect(page.locator("#people-search")).toBeVisible();
  await expect(page.locator(".people-status-choices")).toBeVisible();
  await expect(page.getByRole("button", { name: "Unreached", exact: true })).toBeVisible();
  await expect(page.locator(".people-sort-control--compact select")).toBeVisible();

  const overflow = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(overflow.width).toBeLessThanOrEqual(overflow.client);

  const cards = page.locator(".people-card--explorer");
  await expect(cards).toHaveCount(3);
  const first = await cards.first().boundingBox();
  expect(first).not.toBeNull();
  expect(first!.width).toBeLessThanOrEqual(390);
});
