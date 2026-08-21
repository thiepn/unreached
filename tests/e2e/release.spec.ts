import { expect, test } from "@playwright/test";

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test("root shell and primary navigation render", async ({ page }) => {
  await page.goto("./#/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("link", { name: "Unreached home" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary navigation" }).first()).toBeVisible();
  await expect(page).toHaveTitle(/Unreached/);
  await expectNoHorizontalOverflow(page);
});

test("country explorer remains useful while mission data is gated", async ({ page }) => {
  await page.goto("./#/countries");
  await expect(page.getByRole("heading", { name: "From nations to peoples." })).toBeVisible();
  const input = page.getByPlaceholder("Search country, code or continent");
  await input.fill("Germany");
  await expect(page.getByRole("heading", { name: "Germany" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("global keyboard search finds geographic countries", async ({ page }) => {
  await page.goto("./#/countries");
  await page.keyboard.press("/");
  await expect(page.getByRole("dialog", { name: "Search Unreached" })).toBeVisible();
  const input = page.getByRole("searchbox", { name: "Search peoples, countries or languages" });
  await input.fill("Germany");
  await expect(page.getByRole("link", { name: /Germany/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Search Unreached" })).toBeHidden();
});

test("release transparency page contains definitions and permission state", async ({ page }) => {
  await page.goto("./#/about");
  await expect(page.getByRole("heading", { name: /Know what the map means/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Core terms" })).toBeVisible();
  await expect(page.getByText("Joshua Project API", { exact: true })).toBeVisible();
  await expect(page.getByText("Release gated", { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("saved page is private-browser local and empty-safe", async ({ page }) => {
  await page.goto("./#/saved");
  await expect(page.getByText(/browser/i).first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("unknown routes fail visibly", async ({ page }) => {
  await page.goto("./#/this-route-does-not-exist");
  await expect(page.getByText(/not found/i).first()).toBeVisible();
});
