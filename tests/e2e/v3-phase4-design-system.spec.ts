import { mkdir } from "node:fs/promises";

import { expect, test } from "@playwright/test";

test.describe("V3 Phase 4 visual foundation", () => {
  test("reference page renders the canonical atlas foundation without overflow", async ({ page }, testInfo) => {
    await page.goto("./#/dev/design-system");

    await expect(page.locator('[data-v3-design-system="true"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "Visual Foundation", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "A people profile should read like an atlas article" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "The map is a workspace, not a background illustration" })).toBeVisible();

    const displayFont = await page.locator(".v3-type-display-xl").first().evaluate((element) => getComputedStyle(element).fontFamily);
    const bodyFont = await page.locator(".v3-type-body-lg").first().evaluate((element) => getComputedStyle(element).fontFamily);
    expect(displayFont.toLocaleLowerCase()).toContain("newsreader");
    expect(bodyFont.toLocaleLowerCase()).toContain("source sans 3");

    const controlHeights = await page.locator('[data-v3-control="true"]').evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect().height),
    );
    expect(controlHeights.length).toBeGreaterThan(4);
    for (const height of controlHeights) expect(height).toBeGreaterThanOrEqual(43.5);

    const overflow = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.documentWidth).toBeLessThanOrEqual(overflow.viewportWidth + 1);

    const mapBox = await page.locator('[data-v3-map-shell="true"]').boundingBox();
    expect(mapBox).not.toBeNull();
    expect(mapBox!.width).toBeLessThanOrEqual(overflow.viewportWidth);

    await mkdir("artifacts/v3-phase4", { recursive: true });
    await page.screenshot({
      path: `artifacts/v3-phase4/design-system-${testInfo.project.name}.png`,
      fullPage: true,
      animations: "disabled",
    });
  });

  test("controls expose a visible keyboard focus treatment", async ({ page }) => {
    await page.goto("./#/dev/design-system");
    const primary = page.locator(".v3-button--primary").first();
    await primary.focus();
    await expect(primary).toBeFocused();

    const focus = await primary.evaluate((element) => {
      const style = getComputedStyle(element);
      return { width: style.outlineWidth, style: style.outlineStyle };
    });
    expect(Number.parseFloat(focus.width)).toBeGreaterThanOrEqual(2);
    expect(focus.style).not.toBe("none");
  });
});
