import { expect, test } from "@playwright/test";

import { installPeopleGroupsFixture, VISIBLE_TEST_PEID, VISIBLE_TEST_PEOPLE } from "./peoplegroups-fixture";

test.beforeEach(async ({ page }) => { await installPeopleGroupsFixture(page); });

test("Peoples offers source-safe guided starting points and recovers from empty search", async ({ page }) => {
  await page.goto("./#/peoples", { waitUntil: "domcontentloaded" });

  const guided = page.locator(".guided-start");
  await expect(guided.getByRole("heading", { name: "Start with one source-backed profile." })).toBeVisible({ timeout: 15_000 });
  await expect(guided.locator(".guided-start-card")).toHaveCount(2);
  await expect(guided.getByText(VISIBLE_TEST_PEOPLE, { exact: true })).toBeVisible();

  await guided.locator(".guided-start__method summary").click();
  await expect(guided.getByText(/discovery heuristic, not a ranking of mission importance/i)).toBeVisible();

  const search = page.locator("#people-search");
  await search.fill("no-such-people-record");
  await expect(page.getByText("No people groups match this search.")).toBeVisible();
  await page.getByRole("button", { name: "Clear search & filters" }).click();
  await expect(guided).toBeVisible();
});

test("country guided start selects an explainable GSEC 0–3 source record", async ({ page }) => {
  await page.goto("./#/countries/BEN", { waitUntil: "domcontentloaded" });

  const start = page.locator(".country-guided-start");
  await expect(start.getByRole("heading", { name: "Understand one people in Benin." })).toBeVisible({ timeout: 15_000 });
  await expect(start.getByText(VISIBLE_TEST_PEOPLE, { exact: true })).toBeVisible();
  await expect(start.getByRole("link", { name: /Understand this profile/i })).toHaveAttribute("href", `#/peoples/${VISIBLE_TEST_PEID}`);
  await expect(start.getByRole("link", { name: /Pray for this people/i })).toHaveAttribute("href", `#/pray/${VISIBLE_TEST_PEID}`);

  await start.locator(".country-guided-start__method summary").click();
  await expect(start.getByText(/navigation heuristic, not a statement that this people is more important/i)).toBeVisible();
});

test("people profile makes Explore Understand Pray progression explicit", async ({ page }) => {
  await page.goto(`./#/peoples/${VISIBLE_TEST_PEID}`, { waitUntil: "domcontentloaded" });

  const journey = page.locator(".profile-journey");
  await expect(journey).toBeVisible({ timeout: 15_000 });
  await expect(journey.getByText("1 · Explore", { exact: true })).toBeVisible();
  await expect(journey.getByText("2 · Understand", { exact: true })).toBeVisible();
  await expect(journey.getByText("3 · Pray", { exact: true })).toBeVisible();
  await expect(journey.locator("[aria-current='step']")).toContainText("Understand");
  await expect(journey.getByText("Source context reviewed", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Pray with this context/i })).toHaveAttribute("href", `#/pray/${VISIBLE_TEST_PEID}`);
});
