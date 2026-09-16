import { mkdir } from "node:fs/promises";

import { expect, test } from "@playwright/test";

const artifactDir = "artifacts/v3-phase5";

test.beforeAll(async () => {
  await mkdir(artifactDir, { recursive: true });
});

test("desktop shell exposes only the three primary product destinations", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("./#/about");

  const primary = page.locator(".desktop-nav");
  await expect(primary).toBeVisible();
  await expect(primary.getByRole("link", { name: "Explore" })).toBeVisible();
  await expect(primary.getByRole("link", { name: "Peoples" })).toBeVisible();
  await expect(primary.getByRole("link", { name: "Pray" })).toBeVisible();
  await expect(primary.getByRole("link")).toHaveCount(3);

  const utilities = page.locator(".header-actions");
  await expect(utilities.getByRole("button", { name: "Search people, countries and languages" })).toBeVisible();
  await expect(utilities.getByRole("link", { name: "My saved people and prayer list" })).toBeVisible();
  await expect(utilities.getByRole("button", { name: "More navigation" })).toBeVisible();
  await expect(utilities.getByRole("link", { name: /Account/i })).toHaveCount(0);

  await page.screenshot({ path: `${artifactDir}/desktop-shell.png`, fullPage: false });
});

test("More contains secondary atlas and personal destinations but not Reviewed Coverage", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("./#/about");
  const trigger = page.getByRole("button", { name: "More navigation" });
  await trigger.press("ArrowDown");

  const panel = page.locator("#desktop-more-menu");
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("link", { name: /^Countries/i })).toBeVisible();
  await expect(panel.getByRole("link", { name: /^Languages/i })).toBeVisible();
  await expect(panel.getByRole("link", { name: /Sources & methodology/i })).toBeVisible();
  await expect(panel.getByRole("link", { name: /Account & sync/i })).toBeVisible();
  await expect(panel.getByRole("link", { name: /Reviewed coverage/i })).toHaveCount(0);
  await expect(panel.getByRole("link", { name: /^Saved/i })).toHaveCount(0);

  await expect(panel.getByRole("link", { name: /^Countries/i })).toBeFocused();
  await page.keyboard.press("End");
  await expect(panel.getByRole("link", { name: /Account & sync/i })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("healthy data status does not occupy permanent header chrome", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("./#/about");
  await expect(page.locator(".header-actions .data-state")).toBeHidden();
});

test("tablet preserves primary navigation before utility labels collapse", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await page.goto("./#/about");
  await expect(page.locator(".desktop-nav")).toBeVisible();
  await expect(page.locator(".desktop-nav").getByRole("link", { name: "Explore" })).toBeVisible();
  await expect(page.getByRole("button", { name: "More navigation" })).toBeVisible();
  await expect(page.locator(".mobile-nav")).toBeHidden();
});

test("mobile bottom navigation is Explore Peoples Pray Saved More", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/saved");

  const nav = page.locator(".mobile-nav");
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("link", { name: "Explore" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Peoples" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Pray" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Saved" })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("button", { name: "More navigation" })).toBeVisible();
  await expect(nav.locator(":scope > *")).toHaveCount(5);

  await expect(page.locator(".header-actions").getByRole("button", { name: "Search people, countries and languages" })).toBeVisible();
  await expect(page.locator(".header-actions").getByRole("link", { name: "My saved people and prayer list" })).toBeHidden();

  await nav.getByRole("button", { name: "More navigation" }).click();
  const sheet = page.getByRole("dialog", { name: "More navigation" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("link", { name: /^Countries/i })).toBeFocused();
  await expect(sheet.getByRole("link", { name: /Account & sync/i })).toBeVisible();
  await expect(sheet.getByRole("link", { name: /Reviewed coverage/i })).toHaveCount(0);

  await page.screenshot({ path: `${artifactDir}/mobile-shell.png`, fullPage: false });
});

test("desktop and mobile shell stay within the viewport", async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 900, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("./#/about");
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  }
});
