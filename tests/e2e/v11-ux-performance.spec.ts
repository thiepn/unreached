import { expect, test } from "@playwright/test";

import { installPeopleGroupsFixture, VISIBLE_TEST_PEID, VISIBLE_TEST_PEOPLE } from "./peoplegroups-fixture";

function isCorpusRequest(url: string): boolean {
  return /peoplegroups\.org\/wp-json\/pg\/v1\/people-groups(?:\?|$)/.test(url);
}

test("opening global Search is instant and does not load the remote corpus until a query is typed", async ({ page }) => {
  let providerRequests = 0;
  await installPeopleGroupsFixture(page);
  page.on("request", (request) => {
    if (isCorpusRequest(request.url())) providerRequests += 1;
  });

  await page.goto("./#/about");
  await page.keyboard.press("/");
  const dialog = page.getByRole("dialog", { name: "Search Unreached" });
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(250);
  expect(providerRequests).toBe(0);
  await expect(dialog.getByText(/full remote corpus is loaded only when you need it/i)).toBeVisible();

  const search = dialog.getByRole("searchbox", { name: "Search peoples, countries or languages" });
  await search.fill(String(VISIBLE_TEST_PEID));
  await expect.poll(() => providerRequests).toBeGreaterThan(0);
  await expect(dialog.getByRole("link", { name: new RegExp(VISIBLE_TEST_PEOPLE) }).first()).toBeVisible({ timeout: 15_000 });
});

test("people profile keeps source context before prayer while deep source detail stays opt-in", async ({ page }) => {
  await installPeopleGroupsFixture(page);
  await page.goto(`./#/peoples/${VISIBLE_TEST_PEID}`);
  await expect(page.getByRole("heading", { name: VISIBLE_TEST_PEOPLE, exact: true, level: 1 })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Understand the source context" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Pray with this context/ })).toBeVisible();
  await expect(page.locator(".people-metric-grid--essential .people-metric")).toHaveCount(4);
  const details = page.locator(".people-disclosure--sources").filter({ hasText: "Detailed data, sources & methodology" });
  await expect(details).not.toHaveAttribute("open", "");
});

test("country index is progressively bounded", async ({ page }) => {
  await installPeopleGroupsFixture(page);
  await page.goto("./#/countries");
  await expect(page.getByRole("heading", { name: "Find a country." })).toBeVisible();
  await expect(page.locator(".country-card")).toHaveCount(48);
  await expect(page.getByRole("button", { name: "Show 48 more" })).toBeVisible();
});
