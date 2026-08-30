import { expect, test } from "@playwright/test";

import { installPeopleGroupsFixture, VISIBLE_TEST_PEID, VISIBLE_TEST_PEOPLE } from "./peoplegroups-fixture";

test.beforeEach(async ({ page }) => {
  await installPeopleGroupsFixture(page);
});

test("newcomer sees meaning before technical identifiers", async ({ page }) => {
  await page.goto(`./#/peoples/${VISIBLE_TEST_PEID}`);

  await expect(page.getByRole("heading", { name: VISIBLE_TEST_PEOPLE, exact: true, level: 1 })).toBeVisible();
  await expect(page.getByText("A people-group record in Benin that the current mission-data source classifies as unreached.", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Why is this people group marked unreached?" })).toBeVisible();
  await expect(page.locator(".people-profile-hero").getByText(/PEID|PGID|GSEC/)).toHaveCount(0);
});

test("primary overview is limited to four understandable facts", async ({ page }) => {
  await page.goto(`./#/peoples/${VISIBLE_TEST_PEID}`);

  const metrics = page.locator(".people-metric-grid--essential .people-metric");
  await expect(metrics).toHaveCount(4);
  await expect(metrics.nth(0)).toContainText("120K");
  await expect(metrics.nth(1)).toContainText("Traditional Religion");
  await expect(metrics.nth(2)).toContainText("Fon");
  await expect(metrics.nth(3)).toContainText("Available");

  await expect(page.getByText("GSEC code", { exact: true })).toBeHidden();
});

test("mission terminology can be explained in place", async ({ page }) => {
  await page.goto(`./#/peoples/${VISIBLE_TEST_PEID}`);

  const help = page.getByText("What does unreached mean?", { exact: true });
  await expect(help).toBeVisible();
  await help.click();
  await expect(page.getByText("A mission-status label Unreached shows when the source places a people-group record in GSEC 0–3.", { exact: true })).toBeVisible();
});

test("prayer is a first-class action without hiding research depth", async ({ page }) => {
  await page.goto(`./#/peoples/${VISIBLE_TEST_PEID}`);

  const primaryPrayer = page.getByRole("link", { name: /Pray for this people/ });
  await expect(primaryPrayer).toBeVisible();
  await expect(primaryPrayer).toHaveAttribute("href", `#/pray/${VISIBLE_TEST_PEID}`);

  const research = page.getByText("Detailed data, sources & methodology", { exact: true });
  await expect(research).toBeVisible();
  await research.click();
  await expect(page.getByText(`PEID ${VISIBLE_TEST_PEID} · PGID PG910001 · BEN`, { exact: true })).toBeVisible();
  await expect(page.locator(".people-disclosure--sources").getByText("2 · Initial Church Planting", { exact: true })).toBeVisible();
});

test("comprehension-first profile remains usable at narrow mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(`./#/peoples/${VISIBLE_TEST_PEID}`);
  await expect(page.getByRole("heading", { name: VISIBLE_TEST_PEOPLE, exact: true, level: 1 })).toBeVisible();

  const overflow = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(overflow.width).toBeLessThanOrEqual(overflow.client);
});
