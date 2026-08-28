import { expect, test, type Page } from "@playwright/test";

async function hasMapLibreCss(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    function containsMapLibreRule(rules: CSSRuleList): boolean {
      for (const rule of Array.from(rules)) {
        if (
          rule instanceof CSSStyleRule
          && rule.selectorText.includes(".maplibregl-canvas-container.maplibregl-interactive")
        ) return true;
        const nested = (rule as CSSRule & { cssRules?: CSSRuleList }).cssRules;
        if (nested && containsMapLibreRule(nested)) return true;
      }
      return false;
    }

    return Array.from(document.styleSheets).some((sheet) => {
      try {
        return containsMapLibreRule(sheet.cssRules);
      } catch {
        return false;
      }
    });
  });
}

async function openVisibleAreaList(page: Page): Promise<void> {
  let search = page.locator('input[placeholder="Search countries or areas"]:visible').first();
  if (!(await search.isVisible())) {
    const mobileSummary = page.locator("details.mobile-map-sheet > summary:visible").first();
    if (await mobileSummary.isVisible()) await mobileSummary.click();
    search = page.locator('input[placeholder="Search countries or areas"]:visible').first();
  }

  await expect(search).toBeVisible();
  await expect(page.locator('[role="list"][aria-label="Mission map areas"]:visible').first()).toBeVisible();
}

test.describe("Phase 15 CSS architecture", () => {
  test("MapLibre CSS is loaded only with the lazy Explore route and the searchable area list remains available", async ({ page }) => {
    await page.goto("./#/about");
    await expect(page.getByRole("heading", { name: "Know what the map means—and what it cannot prove." })).toBeVisible();
    await expect.poll(() => hasMapLibreCss(page)).toBe(false);

    await page.evaluate(() => {
      window.location.hash = "#/explore";
    });
    await expect(page.getByRole("heading", { name: "Explore the map." })).toBeVisible({ timeout: 15_000 });
    await expect.poll(() => hasMapLibreCss(page)).toBe(true);
    await openVisibleAreaList(page);

    await page.goBack();
    await expect(page.getByRole("heading", { name: "Know what the map means—and what it cannot prove." })).toBeVisible();

    await page.goForward();
    await expect(page.getByRole("heading", { name: "Explore the map." })).toBeVisible({ timeout: 15_000 });
    await expect.poll(() => hasMapLibreCss(page)).toBe(true);
    await openVisibleAreaList(page);
  });
});
