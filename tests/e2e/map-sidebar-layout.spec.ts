import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1000, height: 640 } });

test("map sidebar keeps country discovery usable while provenance stays opt-in", async ({ page }) => {
  await page.goto("./#/", { waitUntil: "domcontentloaded" });

  const panel = page.locator(".explore-panel--map");
  await expect(panel).toBeVisible();
  await expect(page.getByText("Find a country", { exact: true })).toBeVisible();
  await expect(page.locator("#desktop-country-search")).toBeVisible();
  const provenance = page.locator(".map-provenance");
  await expect(provenance).not.toHaveAttribute("open", "");
  await expect(provenance.locator("summary")).toContainText("Sources & boundaries");

  const diagnostics = await page.evaluate(() => {
    const panel = document.querySelector<HTMLElement>(".explore-panel--map");
    const search = document.querySelector<HTMLElement>(".explore-panel--map .country-search");
    const list = document.querySelector<HTMLElement>(".explore-panel--map .country-list");
    if (!panel || !search || !list) return { missing: true } as const;
    const rect = (element: HTMLElement) => {
      const box = element.getBoundingClientRect();
      return { top: box.top, bottom: box.bottom, height: box.height };
    };
    return { missing: false, panel: { clientHeight: panel.clientHeight, scrollHeight: panel.scrollHeight, overflowY: getComputedStyle(panel).overflowY }, search: rect(search), list: rect(list) } as const;
  });

  expect(diagnostics.missing, JSON.stringify(diagnostics, null, 2)).toBe(false);
  if (diagnostics.missing) return;
  expect(diagnostics.panel.overflowY).toBe("auto");
  expect(diagnostics.search.height).toBeGreaterThanOrEqual(40);
  expect(diagnostics.list.height).toBeGreaterThan(0);

  await provenance.locator("summary").click();
  await expect(provenance.locator(".map-source-stack")).toBeVisible();
  await expect(provenance.locator(".boundary-note")).toBeVisible();
});