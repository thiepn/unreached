import { expect, test, type Page } from "@playwright/test";

function isPhone(page: Page): boolean {
  return (page.viewportSize()?.width ?? 1280) <= 760;
}

const desktopBrowseTrigger = (page: Page) => page.locator(".desktop-nav .browse-trigger");
const mobileMoreTrigger = (page: Page) => page.locator(".mobile-nav .mobile-browse-trigger");

test("Account is a utility and is not duplicated inside Browse", async ({ page }) => {
  await page.goto("./#/about");
  await expect(page.locator(".header-actions").getByRole("link", { name: "Account and private sync" })).toHaveCount(1);

  if (isPhone(page)) {
    await mobileMoreTrigger(page).click();
    const dialog = page.getByRole("dialog", { name: "Browse more sections" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("link", { name: /Account/i })).toHaveCount(0);
  } else {
    await desktopBrowseTrigger(page).click();
    const panel = page.locator("#desktop-browse-menu");
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("link", { name: /Account/i })).toHaveCount(0);
  }
});

test("desktop Browse supports disclosure keyboard navigation and focus return", async ({ page }) => {
  test.skip(isPhone(page), "Desktop Browse disclosure is replaced by the mobile modal sheet on phone layouts.");
  await page.goto("./#/about");
  const trigger = desktopBrowseTrigger(page);
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("link", { name: /Reviewed coverage/i })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("link", { name: /^Countries/i })).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.getByRole("link", { name: /About & sources/i })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#desktop-browse-menu")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("desktop Browse closes on outside interaction", async ({ page }) => {
  test.skip(isPhone(page), "Outside-click disclosure behavior is desktop/tablet only.");
  await page.goto("./#/about");
  await desktopBrowseTrigger(page).click();
  await expect(page.locator("#desktop-browse-menu")).toBeVisible();
  await page.locator("main#main-content").click({ position: { x: 10, y: 10 } });
  await expect(page.locator("#desktop-browse-menu")).toHaveCount(0);
});

test("tablet widths retain primary navigation", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await page.goto("./#/about");
  await expect(page.locator(".desktop-nav")).toBeVisible();
  await expect(page.locator(".desktop-nav").getByRole("link", { name: "Explore" })).toBeVisible();
  await expect(desktopBrowseTrigger(page)).toBeVisible();
  await expect(page.locator(".mobile-nav")).toBeHidden();
});

test("mobile More is modal and returns focus on Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/about");
  const trigger = mobileMoreTrigger(page);
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Browse more sections" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(dialog.getByRole("link", { name: /Reviewed coverage/i })).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
});

test("detail routes retain their parent navigation state", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("./#/countries/USA");
  const browse = desktopBrowseTrigger(page);
  await expect(browse).toHaveClass(/is-active/);
  await browse.click();
  await expect(page.locator("#desktop-browse-menu").getByRole("link", { name: /^Countries/i })).toHaveAttribute("aria-current", "page");

  await page.goto("./#/peoples/123");
  await expect(page.locator(".desktop-nav").getByRole("link", { name: "Peoples" })).toHaveAttribute("aria-current", "page");

  await page.goto("./#/pray/123");
  await expect(page.locator(".desktop-nav").getByRole("link", { name: "Pray" })).toHaveAttribute("aria-current", "page");
});

test("My lists names the saved and prayer workspace consistently", async ({ page }) => {
  await page.goto("./#/saved");
  await expect(page.getByRole("heading", { level: 1, name: "My lists" })).toBeVisible();
  await expect(page).toHaveTitle("My Lists | Unreached");
  await expect(page.locator(".header-actions").getByRole("link", { name: "My saved people and prayer list" })).toHaveAttribute("aria-current", "page");
});
