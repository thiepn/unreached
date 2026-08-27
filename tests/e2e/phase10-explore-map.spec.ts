import { expect, test } from "@playwright/test";

import { installPeopleGroupsFixture } from "./peoplegroups-fixture";

test.beforeEach(async ({ page }) => {
  await installPeopleGroupsFixture(page);
});

test("desktop exposes one visible map key", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 760 });
  await page.goto("./#/", { waitUntil: "domcontentloaded" });

  await expect(page.locator(".explore-panel--phase10")).toBeVisible();
  await expect(page.locator(".mission-map-key-floating .mission-map-key")).toBeVisible();
  await expect(page.locator(".mobile-map-sheet .mission-map-key")).not.toBeVisible();
  await expect(page.locator(".map-legend-floating")).toHaveCount(0);
  await expect(page.locator(".explore-panel--phase10 .mission-map-key")).toHaveCount(0);

  const visibleKeys = page.locator('.mission-map-key:visible');
  await expect(visibleKeys).toHaveCount(1);
});

test("selected country keeps detailed breakdown opt in", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 760 });
  await page.goto("./#/", { waitUntil: "domcontentloaded" });

  const search = page.locator("#desktop-country-search");
  await expect(search).toBeVisible();
  await search.fill("Benin");

  const benin = page.locator(".explore-panel--phase10 .country-row", { hasText: "Benin" }).first();
  await expect(benin).toBeVisible();
  await benin.click();

  await expect(page.locator(".selected-area--phase10")).toContainText("Benin");
  const details = page.locator(".selected-mission-details");
  await expect(details).toBeVisible();
  await expect(details).not.toHaveAttribute("open", "");
  await expect(details.locator(".selected-mission-grid")).not.toBeVisible();

  await details.locator("summary").click();
  await expect(details).toHaveAttribute("open", "");
  await expect(details.locator(".selected-mission-grid")).toBeVisible();
  await expect(details).toContainText("People contexts");
  await expect(details).toContainText("GSEC 0–3");
});

test("mobile sheet owns the only visible map key", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/", { waitUntil: "domcontentloaded" });

  await expect(page.locator(".mission-map-key-floating")).not.toBeVisible();
  const sheet = page.locator(".mobile-map-sheet--phase10");
  await expect(sheet).toBeVisible();
  await sheet.locator(":scope > summary").click();

  await expect(sheet).toHaveAttribute("open", "");
  await expect(sheet.locator(".mission-map-key--compact")).toBeVisible();
  await expect(page.locator('.mission-map-key:visible')).toHaveCount(1);
});

test("mobile map sheet does not overflow horizontally", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/", { waitUntil: "domcontentloaded" });

  const sheet = page.locator(".mobile-map-sheet--phase10");
  await sheet.locator(":scope > summary").click();
  await expect(sheet.locator("#mobile-country-search")).toBeVisible();

  const diagnostics = await page.evaluate(() => {
    const root = document.documentElement;
    const sheet = document.querySelector<HTMLElement>(".mobile-map-sheet--phase10");
    const key = document.querySelector<HTMLElement>(".mobile-map-sheet--phase10 .mission-map-key--compact");
    const search = document.querySelector<HTMLElement>("#mobile-country-search");
    const rect = (element: HTMLElement | null) => {
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return { left: box.left, right: box.right, width: box.width };
    };
    return {
      viewport: root.clientWidth,
      scrollWidth: root.scrollWidth,
      sheet: rect(sheet),
      key: rect(key),
      search: rect(search),
    };
  });

  expect(diagnostics.scrollWidth).toBeLessThanOrEqual(diagnostics.viewport);
  for (const item of [diagnostics.sheet, diagnostics.key, diagnostics.search]) {
    expect(item).not.toBeNull();
    if (!item) continue;
    expect(item.left).toBeGreaterThanOrEqual(0);
    expect(item.right).toBeLessThanOrEqual(390);
    expect(item.width).toBeLessThanOrEqual(390);
  }
});
