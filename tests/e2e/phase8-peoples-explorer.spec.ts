import { expect, test } from "@playwright/test";

import { installPeopleGroupsFixture, VISIBLE_TEST_PEOPLE } from "./peoplegroups-fixture";

test.beforeEach(async ({ page }) => {
  await installPeopleGroupsFixture(page);
});

test("search is the first discovery action", async ({ page }) => {
  await page.goto("./#/peoples");
  const search = page.locator("#people-search");
  await expect(search).toBeVisible();
  await expect(page.locator(".v3-collections")).toBeVisible();

  const order = await page.evaluate(() => {
    const searchWorkspace = document.querySelector(".v3-people-find");
    const guided = document.querySelector(".v3-collections");
    if (!searchWorkspace || !guided) return "missing";
    return searchWorkspace.compareDocumentPosition(guided) & Node.DOCUMENT_POSITION_FOLLOWING ? "search-first" : "guided-first";
  });
  expect(order).toBe("search-first");

  await search.fill("Browser Test");
  await expect(page.locator(".v3-collections")).toHaveCount(0);
  await expect(page.locator(".v3-people-result")).toHaveCount(2);
});

test("quick reach status filters results and persists in URL state", async ({ page }) => {
  await page.goto("./#/peoples");
  const unreached = page.getByRole("button", { name: "Unreached source records", exact: true });
  await expect(unreached).toHaveAttribute("aria-pressed", "false");
  await unreached.click();
  await expect(unreached).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(/status=unreached-only/);
  await expect(page.locator(".v3-people-result")).toHaveCount(2);
  await expect(page.locator(".v3-people-result").first()).toContainText("Unreached");

  await page.goto("./#/about");
  await page.goBack();
  await expect(page.getByRole("button", { name: "Unreached source records", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".v3-people-result")).toHaveCount(2);
});

test("refinements stay progressive and persist in URL state", async ({ page }) => {
  await page.goto("./#/peoples");

  const panel = page.locator(".v3-discovery-refine");
  await expect(panel).not.toHaveAttribute("open", "");
  await panel.locator("summary").click();
  await panel.getByRole("combobox", { name: "Country" }).selectOption("BEN");
  await expect(page).toHaveURL(/country=BEN/);
  await expect(page.locator(".v3-people-result")).toHaveCount(2);

  await panel.getByRole("combobox", { name: "Language" }).selectOption({ label: "Yoruba" });
  await expect(page).toHaveURL(/language=/);
  await expect(page.locator(".v3-people-result")).toHaveCount(1);
  await expect(page.locator(".v3-people-result")).toContainText("Second Browser People");

  await panel.getByRole("button", { name: "Clear refinements" }).click();
  await expect(page).not.toHaveURL(/country=BEN|language=/);
  await expect(panel).not.toHaveAttribute("open", "");
  await expect(page.locator(".v3-people-result")).toHaveCount(3);
});

test("mobile discovery controls remain usable without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/peoples");
  await expect(page.locator("#people-search")).toBeVisible();
  await expect(page.getByRole("button", { name: "All people", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Unreached source records", exact: true })).toBeVisible();
  await expect(page.locator(".v3-discovery-refine")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Begin with a path, not a filter wall." })).toBeVisible();

  const overflow = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(overflow.width).toBeLessThanOrEqual(overflow.client + 1);

  const cards = page.locator(".v3-people-result");
  await expect(cards).toHaveCount(3);
  const first = await cards.first().boundingBox();
  expect(first).not.toBeNull();
  expect(first!.width).toBeLessThanOrEqual(390);
  await expect(cards.first()).toContainText(VISIBLE_TEST_PEOPLE);
});
