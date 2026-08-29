import { expect, test } from "@playwright/test";

import { installPeopleGroupsFixture } from "./peoplegroups-fixture";

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const diagnostics = await page.evaluate(() => {
    const root = document.documentElement;
    const viewport = root.clientWidth;
    const elements = [...document.querySelectorAll<HTMLElement>("body *")];
    const offenders = elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { tag: element.tagName.toLowerCase(), className: typeof element.className === "string" ? element.className : "", text: (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 100), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) };
    }).filter((item) => item.right > viewport + 1 || item.left < -1).slice(0, 12);
    return { overflow: root.scrollWidth - viewport, viewport, offenders };
  });
  expect(diagnostics.overflow, JSON.stringify(diagnostics, null, 2)).toBeLessThanOrEqual(1);
}

function isWebGlUnavailable(error: string | null): boolean {
  if (!error) return false;
  return /failed to initialize webgl|webgl creation failed|webglcontextcreationerror|exhausted gl driver|context creation/i.test(error);
}

test.beforeEach(async ({ page }) => { await installPeopleGroupsFixture(page); });

test("root shell and primary navigation render", async ({ page }) => {
  await page.goto("./#/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("link", { name: "Unreached home" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary navigation" }).first()).toBeVisible();
  await expect(page).toHaveTitle(/Unreached/);
  await expectNoHorizontalOverflow(page);
});

test("interactive map renders when WebGL is available and falls back accessibly when it is not", async ({ page }) => {
  await page.goto("./#/", { waitUntil: "domcontentloaded" });
  const map = page.locator(".world-map");
  await expect.poll(async () => map.evaluate((element) => element.getAttribute("data-map-ready") === "true" || Boolean(element.getAttribute("data-map-error"))), { timeout: 20_000 }).toBe(true);
  const diagnostics = await map.evaluate((element) => ({ ready: element.getAttribute("data-map-ready"), error: element.getAttribute("data-map-error"), stack: element.getAttribute("data-map-error-stack"), className: element.className, canvasCount: element.querySelectorAll("canvas").length }));
  if (diagnostics.ready === "true") {
    expect(diagnostics.error, JSON.stringify(diagnostics, null, 2)).toBeNull();
    await expect(map.locator(".maplibregl-canvas")).toBeVisible();
    await expect(page.locator(".map-render-warning")).toHaveCount(0);
    return;
  }
  expect(isWebGlUnavailable(diagnostics.error), JSON.stringify(diagnostics, null, 2)).toBe(true);
  await expect(page.locator(".map-render-warning")).toBeVisible();
  const mobileSheet = page.locator(".mobile-map-sheet");
  if (await mobileSheet.isVisible()) {
    await mobileSheet.locator("summary").click();
    await expect(page.locator("#mobile-country-search")).toBeVisible();
  } else {
    await expect(page.locator("#desktop-country-search")).toBeVisible();
  }
});

test("country explorer remains useful while live mission data fills in", async ({ page }) => {
  await page.goto("./#/countries");
  await expect(page.getByRole("heading", { name: "Find a country." })).toBeVisible();
  const input = page.getByPlaceholder("Search country, code or continent");
  await input.fill("Germany");
  await expect(page.getByRole("heading", { name: "Germany" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("global keyboard search finds countries and contains/restores focus", async ({ page }) => {
  await page.goto("./#/countries");
  const main = page.locator("#main-content");
  await expect(main).toBeFocused();
  await page.keyboard.press("/");
  const dialog = page.getByRole("dialog", { name: "Search Unreached" });
  await expect(dialog).toBeVisible();
  const input = dialog.getByRole("searchbox", { name: "Search peoples, countries or languages" });
  const close = dialog.getByRole("button", { name: "Close search" });
  await expect(input).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(input).toBeFocused();
  await input.fill("Germany");
  await expect(dialog.getByRole("link", { name: "Germany Europe", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(main).toBeFocused();
});

test("release transparency page contains definitions and permission state", async ({ page }) => {
  await page.goto("./#/about");
  await expect(page.getByRole("heading", { name: /Know what the map means/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Core terms" })).toBeVisible();

  const sources = page.locator('section[aria-labelledby="sources-heading"]');
  await expect(sources.getByText("PeopleGroups.org / IMB Global Research", { exact: true })).toBeVisible();
  await expect(sources.getByText("Runtime active", { exact: true })).toBeVisible();
  await expect(sources.getByText("Joshua Project API", { exact: true })).toBeVisible();
  await expect(sources.getByText("Not active", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Release 2\.1\.2 preserves the certified data boundary while reducing loading latency/ })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("saved page is local-by-default and empty-safe", async ({ page }) => {
  await page.goto("./#/saved");
  await expect(page.getByText(/local by default/i).first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("unknown routes fail visibly", async ({ page }) => {
  await page.goto("./#/this-route-does-not-exist");
  await expect(page.getByRole("heading", { name: "This route is not on the map." })).toBeVisible();
  await expect(page.getByText("404", { exact: true })).toBeVisible();
});
