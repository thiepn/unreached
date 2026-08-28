import { expect, test, type Page } from "@playwright/test";

import { installPeopleGroupsFixture } from "./peoplegroups-fixture";

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) throw new Error(`Expected six-digit hex color, received ${hex}`);
  return [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16)) as [number, number, number];
}

function luminance(hex: string): number {
  const channels = hexToRgb(hex).map((channel) => channel / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function contrast(a: string, b: string): number {
  const first = luminance(a);
  const second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

async function installPrivateSyncUnavailable(page: Page) {
  await page.route("**/unreached-sync/health", async (route) => route.fulfill({
    status: 503,
    contentType: "application/json",
    body: JSON.stringify({ error: "certification-offline" }),
  }));
}

test.beforeEach(async ({ page }) => {
  await installPeopleGroupsFixture(page);
  await installPrivateSyncUnavailable(page);
});

test("muted text meets WCAG AA contrast on canonical paper surfaces", async ({ page }) => {
  await page.goto("./#/saved");
  const colors = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      muted: style.getPropertyValue("--ink-2").trim(),
      paper0: style.getPropertyValue("--paper-0").trim(),
      paper1: style.getPropertyValue("--paper-1").trim(),
    };
  });
  expect(contrast(colors.muted, colors.paper0)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(colors.muted, colors.paper1)).toBeGreaterThanOrEqual(4.5);
});

test("visible primary interactive targets are at least 44px", async ({ page }) => {
  await page.goto("./#/saved");
  const undersized = await page.evaluate(() => {
    const selector = "button, summary, input:not([type=hidden]), select, textarea, .nav-link, .browse-link, .icon-action, .button";
    return [...document.querySelectorAll<HTMLElement>(selector)]
      .filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { tag: element.tagName, text: (element.textContent ?? element.getAttribute("aria-label") ?? "").trim().slice(0, 80), width: rect.width, height: rect.height };
      })
      .filter((item) => item.width < 43.5 || item.height < 43.5);
  });
  expect(undersized).toEqual([]);
});

test("skip navigation exposes visible focus on exactly one main landmark", async ({ page }) => {
  await page.goto("./#/countries");
  const main = page.locator("#main-content");
  const skip = page.locator(".skip-link");

  await expect(page.locator("main")).toHaveCount(1);
  await expect(main).toBeVisible();

  // Route changes intentionally focus main for SPA navigation. Certify that
  // behavior first, then use real reverse keyboard traversal to reach the
  // document-start skip link without resetting the browser's tab origin.
  await expect(main).toBeFocused();
  let focusStyle = await main.evaluate((element) => {
    const style = getComputedStyle(element);
    return { outlineStyle: style.outlineStyle, outlineWidth: Number.parseFloat(style.outlineWidth) };
  });
  expect(focusStyle.outlineStyle).not.toBe("none");
  expect(focusStyle.outlineWidth).toBeGreaterThanOrEqual(3);

  let reachedSkip = false;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await page.keyboard.press("Shift+Tab");
    reachedSkip = await page.evaluate(() => document.activeElement?.classList.contains("skip-link") === true);
    if (reachedSkip) break;
  }
  expect(reachedSkip).toBe(true);
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(main).toBeFocused();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe("#/countries");

  focusStyle = await main.evaluate((element) => {
    const style = getComputedStyle(element);
    return { outlineStyle: style.outlineStyle, outlineWidth: Number.parseFloat(style.outlineWidth) };
  });
  expect(focusStyle.outlineStyle).not.toBe("none");
  expect(focusStyle.outlineWidth).toBeGreaterThanOrEqual(3);
});

test("reduced-motion preference collapses transitions and animations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./#/countries");
  const motion = await page.locator(".nav-link").first().evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      transitionSeconds: style.transitionDuration.split(",").map((value) => Number.parseFloat(value) * (value.includes("ms") ? 0.001 : 1)),
      animationIterations: style.animationIterationCount,
    };
  });
  expect(Math.max(...motion.transitionSeconds)).toBeLessThanOrEqual(0.001);
  expect(motion.animationIterations === "1" || motion.animationIterations === "none").toBe(true);
});

test("mobile form text and critical microcopy stay readable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/countries");

  const formSizes = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>("input, select, textarea")]
    .filter((element) => element.getBoundingClientRect().width > 0)
    .map((element) => ({ tag: element.tagName, size: Number.parseFloat(getComputedStyle(element).fontSize) })));
  for (const item of formSizes) expect(item.size, item.tag).toBeGreaterThanOrEqual(16);

  const microcopy = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>(".eyebrow, .rail-label, .status-chip, .map-foundation__kicker, .browse-menu__label, .mobile-nav .nav-link, .filter-row > span:nth-child(2)")]
    .filter((element) => element.getBoundingClientRect().width > 0)
    .map((element) => ({ text: (element.textContent ?? "").trim().slice(0, 80), size: Number.parseFloat(getComputedStyle(element).fontSize) })));
  for (const item of microcopy) expect(item.size, item.text).toBeGreaterThanOrEqual(12);
});

test("primary keyboard paths remain operable", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("./#/countries");

  const main = page.locator("#main-content");
  // Direct route loads intentionally schedule main focus in requestAnimationFrame.
  // Wait for that lifecycle to finish before moving focus into keyboard controls.
  await expect(main).toBeFocused();

  const browse = page.getByRole("button", { name: "Browse" });
  await browse.focus();
  await expect(browse).toBeFocused();
  await page.keyboard.press("ArrowDown");
  const panel = page.locator("#desktop-browse-menu");
  await expect(panel).toBeVisible();
  await expect(panel.locator(".browse-link").first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(browse).toBeFocused();

  await page.keyboard.press("/");
  const search = page.getByRole("dialog", { name: "Search Unreached" });
  await expect(search).toBeVisible();
  await expect(search.getByRole("searchbox", { name: "Search peoples, countries or languages" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(search).toBeHidden();

  await page.goto("./#/saved");
  await expect.poll(() => page.evaluate(() => location.hash)).toBe("#/saved");
  const summary = page.locator("details summary").first();
  await expect(summary).toBeVisible();
  await summary.focus();
  await expect(summary).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(summary.locator("..")).toHaveAttribute("open", "");
});

test("representative mobile routes do not overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const routes = ["/", "/peoples", "/countries", "/languages", "/pray", "/saved", "/account", "/about"];

  for (const route of routes) {
    await page.goto(`./#${route}`);
    await expect(page.locator("#main-content")).toBeVisible();
    await expect(page.locator("main")).toHaveCount(1);
    const dimensions = await page.evaluate(() => ({
      route: location.hash,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.scrollWidth, JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  }
});
