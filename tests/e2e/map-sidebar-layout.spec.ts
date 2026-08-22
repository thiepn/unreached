import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1000, height: 640 } });

test("map sidebar keeps country browser, attribution and boundary note from overlapping", async ({ page }) => {
  await page.goto("./#/", { waitUntil: "domcontentloaded" });

  const panel = page.locator(".explore-panel--map");
  await expect(panel).toBeVisible();
  await expect(page.getByText("Browse map areas", { exact: true })).toBeVisible();
  await expect(page.locator("#desktop-country-search")).toBeAttached();

  const diagnostics = await page.evaluate(() => {
    const panel = document.querySelector<HTMLElement>(".explore-panel--map");
    const search = document.querySelector<HTMLElement>(".explore-panel--map .country-search");
    const list = document.querySelector<HTMLElement>(".explore-panel--map .country-list");
    const source = document.querySelector<HTMLElement>(".explore-panel--map .map-source-stack");
    const boundary = document.querySelector<HTMLElement>(".explore-panel--map .boundary-note");

    if (!panel || !search || !list || !source || !boundary) {
      return { missing: true } as const;
    }

    const rect = (element: HTMLElement) => {
      const box = element.getBoundingClientRect();
      return { top: box.top, bottom: box.bottom, height: box.height };
    };

    return {
      missing: false,
      panel: {
        clientHeight: panel.clientHeight,
        scrollHeight: panel.scrollHeight,
        overflowY: getComputedStyle(panel).overflowY,
      },
      search: rect(search),
      list: rect(list),
      source: rect(source),
      boundary: rect(boundary),
    } as const;
  });

  expect(diagnostics.missing, JSON.stringify(diagnostics, null, 2)).toBe(false);
  if (diagnostics.missing) return;

  expect(diagnostics.panel.overflowY).toBe("auto");
  expect(diagnostics.search.height).toBeGreaterThanOrEqual(40);
  expect(diagnostics.list.height).toBeGreaterThan(0);
  expect(diagnostics.list.bottom, JSON.stringify(diagnostics, null, 2)).toBeLessThanOrEqual(diagnostics.source.top + 1);
  expect(diagnostics.source.bottom, JSON.stringify(diagnostics, null, 2)).toBeLessThanOrEqual(diagnostics.boundary.top + 1);
});
