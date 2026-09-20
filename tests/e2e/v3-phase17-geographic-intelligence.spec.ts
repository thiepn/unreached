import { mkdir } from "node:fs/promises";

import { expect, test } from "@playwright/test";

import {
  installPeopleGroupsFixture,
  RELATED_TEST_PEID,
  UNCOVERED_TEST_PEID,
  VISIBLE_TEST_PEID,
} from "./peoplegroups-fixture";

const artifactDir = "artifacts/v3-phase17";

test.beforeAll(async () => {
  await mkdir(artifactDir, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  await installPeopleGroupsFixture(page);
});

test("geographic intelligence starts at current PGID and loads wider ROP3 distribution explicitly", async ({ page }) => {
  await page.goto("./#/peoples/" + VISIBLE_TEST_PEID);

  const panel = page.locator('[data-phase17-geographic-intelligence="true"]');
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("heading", { name: "Where does the current source place this people record?" })).toBeVisible();
  await expect(panel.getByText("Country-level evidence, not a diaspora map.", { exact: true })).toBeVisible();
  await expect(panel).toHaveAttribute("data-country-count", "1");
  await expect(panel).toHaveAttribute("data-distribution-evidence", "current-country-only");

  const benin = panel.locator(".advanced-geographic-country").filter({ hasText: "Benin" });
  await expect(benin).toBeVisible();
  await expect(benin).toContainText("Current PGID country");
  await expect(benin).toContainText("PG910001");

  const load = panel.getByRole("button", { name: "Load wider source distribution" });
  await expect(load).toBeVisible();
  await load.click();

  await expect(panel).toHaveAttribute("data-country-count", "2", { timeout: 15_000 });
  await expect(panel).toHaveAttribute("data-distribution-evidence", "cross-country-source-taxonomy");

  const nigeria = panel.locator(".advanced-geographic-country").filter({ hasText: "Nigeria" });
  await expect(nigeria).toBeVisible();
  await expect(nigeria).toContainText("Same ROP3 source taxonomy");
  await expect(nigeria).toContainText("PG910002");
  await nigeria.locator("summary").click();
  await expect(nigeria.getByRole("link", { name: /Browser Test People/ })).toHaveAttribute("href", "#/peoples/" + RELATED_TEST_PEID);

  await expect(panel.getByText("Second Browser People", { exact: true })).toHaveCount(0);
  await expect(panel.locator('a[href="#/peoples/' + UNCOVERED_TEST_PEID + '"]')).toHaveCount(0);

  await panel.screenshot({ path: artifactDir + "/source-linked-distribution.png" });
});

test("regional and population evidence remain bounded and diaspora stays unestablished", async ({ page }) => {
  await page.goto("./#/peoples/" + VISIBLE_TEST_PEID);
  const panel = page.locator('[data-phase17-geographic-intelligence="true"]');

  await panel.getByRole("button", { name: "Load wider source distribution" }).click();
  await expect(panel).toHaveAttribute("data-country-count", "2", { timeout: 15_000 });

  const stats = panel.locator(".advanced-geographic-intelligence__stats");
  await expect(stats).toContainText("2");
  await expect(stats).toContainText("1/2");
  await expect(stats).toContainText("120K");

  const regions = panel.locator(".advanced-geographic-regions");
  await expect(regions).toContainText("Africa");
  await expect(regions).toContainText("2 countries");

  const diaspora = panel.locator(".advanced-geographic-intelligence__diaspora");
  await expect(diaspora).toContainText("Diaspora evidence");
  await expect(diaspora).toContainText("Not established");
  await expect(diaspora).toContainText(/does not currently establish migration direction/i);

  const method = panel.locator(".advanced-geographic-intelligence__method");
  await method.locator("summary").click();
  await expect(method).toContainText(/not proof that all linked records form one universal ethnic population/i);
  await expect(method).toContainText(/No city, settlement, migration route/i);
});

test("source-linked country records remain inspectable without implying a diaspora population", async ({ page }) => {
  await page.goto("./#/peoples/" + VISIBLE_TEST_PEID);
  const panel = page.locator('[data-phase17-geographic-intelligence="true"]');

  await panel.getByRole("button", { name: "Load wider source distribution" }).click();
  await expect(panel).toHaveAttribute("data-country-count", "2", { timeout: 15_000 });

  const nigeria = panel.locator(".advanced-geographic-country").filter({ hasText: "Nigeria" });
  await nigeria.locator("summary").click();
  await expect(nigeria).toContainText("PG910002");
  await expect(nigeria).toContainText("PEID " + RELATED_TEST_PEID);
  await expect(nigeria).toContainText("population unknown");

  await expect(panel.getByText(/diaspora population/i)).toHaveCount(0);
  await expect(panel.getByText(/migration share/i)).toHaveCount(0);
});

test("advanced geographic intelligence remains within a narrow mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/peoples/" + VISIBLE_TEST_PEID);

  const panel = page.locator('[data-phase17-geographic-intelligence="true"]');
  await expect(panel).toBeVisible();

  await panel.getByRole("button", { name: "Load wider source distribution" }).click();
  await expect(panel).toHaveAttribute("data-country-count", "2", { timeout: 15_000 });

  const overflow = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(overflow.width).toBeLessThanOrEqual(overflow.client + 1);

  await panel.screenshot({ path: artifactDir + "/source-linked-distribution-mobile.png" });
});
