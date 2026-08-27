import { expect, test, type Page } from "@playwright/test";

import { installPeopleGroupsFixture } from "./peoplegroups-fixture";

const PERSONAL_STORAGE = "unreached.personal.v2";

test.beforeEach(({ browserName }) => {
  test.skip(browserName !== "chromium", "Phase 0 observational baselines run once in Chromium; the existing release suite owns the full browser matrix.");
});

async function clearMissionCache(page: Page) {
  await page.addInitScript(() => { indexedDB.deleteDatabase("unreached-peoplegroups-v1"); });
}

async function attachBrowserBaseline(page: Page, label: string) {
  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    return {
      url: location.href,
      navigation: nav ? { domContentLoaded: Math.round(nav.domContentLoadedEventEnd), load: Math.round(nav.loadEventEnd), transferSize: nav.transferSize } : null,
      resources: { count: resources.length, transferSize: resources.reduce((sum, item) => sum + item.transferSize, 0), js: resources.filter((item) => item.name.includes(".js")).length, css: resources.filter((item) => item.name.includes(".css")).length },
    };
  });
  await test.info().attach(`${label}.json`, { body: Buffer.from(JSON.stringify(metrics, null, 2)), contentType: "application/json" });
}

test.describe("Phase 0 observational baseline", () => {
  test("core shell remains usable at desktop and records resource timing", async ({ page }) => {
    await page.goto("./#/about");
    await expect(page.locator("main#main-content")).toBeVisible();
    await expect(page.getByRole("link", { name: /Unreached/i })).toBeVisible();
    await attachBrowserBaseline(page, "desktop-shell-baseline");
  });
  test("300 saved + 100 prayer entries remain parseable as a stress fixture", async ({ page }) => {
    await page.addInitScript(({ key }) => {
      const savedPeoples = Array.from({ length: 300 }, (_, index) => { const id = 50_000 + index; return { sourcePeopleId: id, peopleGroupId: `people-entity:peoplegroups:${id}`, name: `Phase 0 saved person ${index + 1}`, largestCountryName: "Baseline Country", primaryLanguageName: "Baseline Language", classification: "unreached", frontier: false, savedAt: "2026-08-26T00:00:00.000Z" }; });
      const prayerList = Array.from({ length: 100 }, (_, index) => { const id = 70_000 + index; return { sourcePeopleId: id, peopleGroupId: `people-entity:peoplegroups:${id}`, name: `Phase 0 prayer person ${index + 1}`, countryName: "Baseline Country", languageName: "Baseline Language", addedAt: "2026-08-26T00:00:00.000Z", lastPrayedAt: null }; });
      localStorage.setItem(key, JSON.stringify({ version: 2, savedPeoples, prayerList, recent: [] }));
    }, { key: PERSONAL_STORAGE });
    await page.goto("./#/saved");
    const state = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), PERSONAL_STORAGE);
    expect(state.savedPeoples).toHaveLength(300);
    expect(state.prayerList).toHaveLength(100);
    await expect(page.locator("main#main-content")).toBeVisible();
    await attachBrowserBaseline(page, "large-personalization-baseline");
  });
  test("blocked localStorage writes are reproducible for failure-mode testing", async ({ page }) => {
    await page.addInitScript(({ key }) => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (name: string, value: string) { if (name === key) throw new DOMException("Phase 0 blocked storage fixture", "QuotaExceededError"); return original.call(this, name, value); };
    }, { key: PERSONAL_STORAGE });
    await page.goto("./#/saved");
    const result = await page.evaluate((key) => { try { localStorage.setItem(key, "test"); return "unexpected-success"; } catch (error) { return error instanceof DOMException ? error.name : "other-error"; } }, PERSONAL_STORAGE);
    expect(result).toBe("QuotaExceededError");
  });
  test("slow first-time provider leaves the shell responsive", async ({ page }) => {
    await clearMissionCache(page);
    await page.route("https://peoplegroups.org/wp-json/pg/v1/**", async (route) => { await new Promise((resolve) => setTimeout(resolve, 1_500)); await route.abort("timedout"); });
    await page.goto("./#/peoples");
    await expect(page.getByRole("link", { name: /Unreached/i })).toBeVisible();
    await expect(page.locator("main#main-content")).toBeVisible();
    await attachBrowserBaseline(page, "slow-provider-baseline");
  });
  test("search control stays compact after the sr-only regression fix", async ({ page }) => {
    await installPeopleGroupsFixture(page);
    await page.goto("./#/peoples");
    const search = page.locator(".people-search").first();
    await expect(search).toBeVisible();
    const box = await search.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeLessThan(80);
  });
});

test.describe("Phase 0 known-defect contracts", () => {
  test("skip-to-content keeps the current route and focuses the main landmark", async ({ page }) => {
    await page.goto("./#/about");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#\/about$/);
    await expect(page.locator("main#main-content")).toBeFocused();
  });
  test("mobile bottom navigation allocates one column per rendered destination", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("./#/about");
    const nav = page.locator(".mobile-nav");
    const destinations = nav.locator(".nav-link");
    const columns = await nav.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length);
    expect(columns).toBe(await destinations.count());
  });
  test("browser Back restores people-search context", async ({ page }) => {
    await installPeopleGroupsFixture(page);
    await page.goto("./#/peoples");
    const input = page.locator("#people-search");
    await expect(input).toBeVisible();
    await input.fill("Browser Test");
    await page.goto("./#/about");
    await page.goBack();
    await expect(page.locator("#people-search")).toHaveValue("Browser Test");
  });
  test("document title identifies the active route", async ({ page }) => {
    await page.goto("./#/about");
    await expect(page).toHaveTitle(/About.+Unreached/i);
  });
});
