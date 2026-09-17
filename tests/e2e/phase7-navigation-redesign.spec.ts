import { expect, test, type Page } from "@playwright/test";

function isPhone(page: Page): boolean {
  return (page.viewportSize()?.width ?? 1280) <= 760;
}

const desktopMoreTrigger = (page: Page) => page.locator(".header-actions .browse-trigger");
const mobileMoreTrigger = (page: Page) => page.locator(".mobile-nav .mobile-browse-trigger");

test("Saved is direct while Account is secondary inside More", async ({ page }) => {
  await page.goto("./#/about");

  if (isPhone(page)) {
    await expect(page.locator(".mobile-nav").getByRole("link", { name: "Saved" })).toHaveCount(1);
    await mobileMoreTrigger(page).click();
    const dialog = page.getByRole("dialog", { name: "More navigation" });
    await expect(dialog.getByRole("link", { name: /Account & sync/i })).toHaveCount(1);
    await expect(dialog.getByRole("link", { name: /^Saved/i })).toHaveCount(0);
  } else {
    await expect(page.locator(".header-actions").getByRole("link", { name: "My saved people and prayer list" })).toHaveCount(1);
    await expect(page.locator(".header-actions").getByRole("link", { name: /Account/i })).toHaveCount(0);
    await desktopMoreTrigger(page).click();
    const panel = page.locator("#desktop-more-menu");
    await expect(panel.getByRole("link", { name: /Account & sync/i })).toHaveCount(1);
    await expect(panel.getByRole("link", { name: /^Saved/i })).toHaveCount(0);
  }
});

test("desktop More supports disclosure keyboard navigation and focus return", async ({ page }) => {
  test.skip(isPhone(page), "Desktop More disclosure is replaced by the mobile modal sheet on phone layouts.");
  await page.goto("./#/about");
  const trigger = desktopMoreTrigger(page);
  await expect(trigger).toBeVisible();
  await trigger.press("ArrowDown");

  const panel = page.locator("#desktop-more-menu");
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("link", { name: /^Countries/i })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(panel.getByRole("link", { name: /^Languages/i })).toBeFocused();
  await page.keyboard.press("End");
  await expect(panel.getByRole("link", { name: /Account & sync/i })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("desktop More closes on outside interaction", async ({ page }) => {
  test.skip(isPhone(page), "Outside-click disclosure behavior is desktop/tablet only.");
  await page.goto("./#/about");
  await desktopMoreTrigger(page).click();
  await expect(page.locator("#desktop-more-menu")).toBeVisible();
  await page.locator("main#main-content").click({ position: { x: 10, y: 10 } });
  await expect(page.locator("#desktop-more-menu")).toHaveCount(0);
});

test("tablet widths retain primary navigation and utility More", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await page.goto("./#/about");
  await expect(page.locator(".desktop-nav")).toBeVisible();
  await expect(page.locator(".desktop-nav").getByRole("link", { name: "Explore" })).toBeVisible();
  await expect(desktopMoreTrigger(page)).toBeVisible();
  await expect(page.locator(".mobile-nav")).toBeHidden();
});

test("mobile More is modal and returns focus on Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/about");
  const trigger = mobileMoreTrigger(page);
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "More navigation" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(dialog.getByRole("link", { name: /^Countries/i })).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
});

test("detail routes retain their parent navigation state", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("./#/countries/USA");
  const more = desktopMoreTrigger(page);
  await expect(more).toHaveClass(/is-active/);
  await more.click();
  await expect(page.locator("#desktop-more-menu").getByRole("link", { name: /^Countries/i })).toHaveAttribute("aria-current", "page");

  await page.goto("./#/peoples/123");
  await expect(page.locator(".desktop-nav").getByRole("link", { name: "Peoples" })).toHaveAttribute("aria-current", "page");

  await page.goto("./#/pray/123");
  await expect(page.locator(".desktop-nav").getByRole("link", { name: "Pray" })).toHaveAttribute("aria-current", "page");
});

test("Reviewed Coverage is absent from normal V3 navigation", async ({ page }) => {
  await page.goto("./#/about");
  if (isPhone(page)) {
    await mobileMoreTrigger(page).click();
    await expect(page.getByRole("dialog", { name: "More navigation" }).getByRole("link", { name: /Reviewed coverage/i })).toHaveCount(0);
  } else {
    await desktopMoreTrigger(page).click();
    await expect(page.locator("#desktop-more-menu").getByRole("link", { name: /Reviewed coverage/i })).toHaveCount(0);
  }
});

test("Saved names the private continuity workspace consistently", async ({ page }) => {
  await page.goto("./#/saved");
  await expect(page.getByRole("heading", { level: 1, name: "Saved" })).toBeVisible();
  await expect(page).toHaveTitle("Saved | Unreached");

  if (isPhone(page)) {
    await expect(page.locator(".mobile-nav").getByRole("link", { name: "Saved" })).toHaveAttribute("aria-current", "page");
  } else {
    await expect(page.locator(".header-actions").getByRole("link", { name: "My saved people and prayer list" })).toHaveAttribute("aria-current", "page");
  }
});
