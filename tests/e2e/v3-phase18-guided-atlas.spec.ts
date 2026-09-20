import { mkdir } from "node:fs/promises";

import { expect, test } from "@playwright/test";

import { installPeopleGroupsFixture, VISIBLE_TEST_PEID } from "./peoplegroups-fixture";

const artifactDir = "artifacts/v3-phase18";

test.beforeAll(async () => {
  await mkdir(artifactDir, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  await installPeopleGroupsFixture(page);
});

test("regional guide creates a source-grounded Region to Country to People to Prayer journey", async ({ page }) => {
  await page.goto("./#/regions/africa");

  const guide = page.locator('[data-phase18-guided-atlas="true"]');
  await expect(guide).toBeVisible({ timeout: 15_000 });
  await expect(guide.getByRole("heading", { name: "Reading Africa through the atlas" })).toBeVisible();
  await expect(guide).toContainText("not a regional census population");
  await expect(guide).toContainText("not mission ranking");
  await expect(guide).toHaveAttribute("data-guided-pathway-count", "1");

  const start = guide.getByRole("link", { name: /Begin with Benin/ });
  await expect(start).toHaveAttribute("href", "#/countries/BEN?journey=africa&focus=" + VISIBLE_TEST_PEID);
  await start.click();

  const countryJourney = page.locator('[data-guided-journey-step="country"]');
  await expect(countryJourney).toBeVisible({ timeout: 15_000 });
  await expect(countryJourney).toContainText("Step 2 of 4");
  await expect(countryJourney).toContainText("Africa → Benin → Browser Test People → Prayer");

  const toPeople = countryJourney.getByRole("link", { name: /Continue to Browser Test People/ });
  await expect(toPeople).toHaveAttribute("href", "#/peoples/" + VISIBLE_TEST_PEID + "?journey=africa&focus=" + VISIBLE_TEST_PEID);
  await toPeople.click();

  const peopleJourney = page.locator('[data-guided-journey-step="people"]');
  await expect(peopleJourney).toBeVisible({ timeout: 15_000 });
  await expect(peopleJourney).toContainText("Step 3 of 4");

  const toPrayer = peopleJourney.getByRole("link", { name: "Continue to prayer" });
  await expect(toPrayer).toHaveAttribute("href", "#/pray/" + VISIBLE_TEST_PEID + "?journey=africa&focus=" + VISIBLE_TEST_PEID);
  await toPrayer.click();

  const prayerJourney = page.locator('[data-guided-journey-step="prayer"]');
  await expect(prayerJourney).toBeVisible({ timeout: 15_000 });
  await expect(prayerJourney).toContainText("Step 4 of 4");
  await expect(prayerJourney.getByRole("link", { name: /Return to the Africa guide/ })).toHaveAttribute("href", "#/regions/africa");

  await page.screenshot({ path: artifactDir + "/guided-journey-prayer.png", fullPage: true });
});

test("regional guide explains deterministic non-ranking pathway selection", async ({ page }) => {
  await page.goto("./#/regions/africa");

  const guide = page.locator('[data-phase18-guided-atlas="true"]');
  await expect(guide).toBeVisible({ timeout: 15_000 });

  const method = guide.locator(".guided-region-atlas__method");
  await method.locator("summary").click();
  await expect(method).toContainText(/Countries are ordered alphabetically/i);
  await expect(method).toContainText(/reviewed editorial profile is preferred for learning depth/i);
  await expect(method).toContainText(/not mission-priority ranking/i);
  await expect(method).toContainText(/no guided-atlas progress history is stored or synced/i);
});

test("mismatched or stale guided URL state fails closed", async ({ page }) => {
  await page.goto("./#/countries/BEN?journey=asia&focus=" + VISIBLE_TEST_PEID);
  await expect(page.locator('[data-guided-journey-step="country"]')).toHaveCount(0);

  await page.goto("./#/countries/BEN?journey=africa&focus=999999");
  await expect(page.locator('[data-guided-journey-step="country"]')).toHaveCount(0);

  await page.goto("./#/peoples/" + VISIBLE_TEST_PEID + "?journey=asia&focus=" + VISIBLE_TEST_PEID);
  await expect(page.locator('[data-guided-journey-step="people"]')).toHaveCount(0);

  await page.goto("./#/pray/" + VISIBLE_TEST_PEID + "?journey=asia&focus=" + VISIBLE_TEST_PEID);
  await expect(page.locator('[data-guided-journey-step="prayer"]')).toHaveCount(0);
});

test("guided atlas remains usable on a narrow mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/regions/africa");

  const guide = page.locator('[data-phase18-guided-atlas="true"]');
  await expect(guide).toBeVisible({ timeout: 15_000 });

  let overflow = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(overflow.width).toBeLessThanOrEqual(overflow.client + 1);

  await guide.getByRole("link", { name: /Begin with Benin/ }).click();
  await expect(page.locator('[data-guided-journey-step="country"]')).toBeVisible({ timeout: 15_000 });

  overflow = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(overflow.width).toBeLessThanOrEqual(overflow.client + 1);

  await page.screenshot({ path: artifactDir + "/guided-atlas-mobile.png", fullPage: true });
});
