import { expect, test, type Page } from "@playwright/test";

import { installPeopleGroupsFixture } from "./peoplegroups-fixture";

async function installPrivateSyncUnavailable(page: Page): Promise<void> {
  await page.route("**/unreached-sync/health", async (route) => route.fulfill({
    status: 503,
    contentType: "application/json",
    body: JSON.stringify({ error: "phase5-certification-offline" }),
  }));
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    route: location.hash,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth, JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

async function waitForServiceWorkerControl(page: Page): Promise<void> {
  await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) throw new Error("service workers unavailable");
    await navigator.serviceWorker.ready;
  });
  if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))) {
    await page.reload({ waitUntil: "domcontentloaded" });
  }
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
}

test.beforeEach(async ({ page }) => {
  await installPeopleGroupsFixture(page);
  await installPrivateSyncUnavailable(page);
});

test("PWA manifest and install assets are production-ready", async ({ page }) => {
  await page.goto("./#/about");
  const result = await page.evaluate(async () => {
    const manifestResponse = await fetch("/unreached/site.webmanifest", { cache: "no-store" });
    const manifest = await manifestResponse.json() as {
      id: string;
      start_url: string;
      scope: string;
      display: string;
      icons: Array<{ src: string; sizes: string; type: string; purpose?: string }>;
    };
    const required = ["/unreached/icon.svg", "/unreached/icon-192.png", "/unreached/icon-512.png", "/unreached/apple-touch-icon.png"];
    const assetStatuses = await Promise.all(required.map(async (url) => ({ url, status: (await fetch(url, { cache: "no-store" })).status })));
    const appleTouch = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')?.getAttribute("href") ?? null;
    const capable = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-capable"]')?.content ?? null;
    const appTitle = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-title"]')?.content ?? null;
    return { manifestStatus: manifestResponse.status, manifest, assetStatuses, appleTouch, capable, appTitle };
  });

  expect(result.manifestStatus).toBe(200);
  expect(result.manifest.id).toBe("/unreached/");
  expect(result.manifest.start_url).toBe("/unreached/#/");
  expect(result.manifest.scope).toBe("/unreached/");
  expect(result.manifest.display).toBe("standalone");
  expect(result.manifest.icons.some((icon) => icon.src === "/unreached/icon-192.png" && icon.sizes === "192x192" && icon.type === "image/png")).toBe(true);
  expect(result.manifest.icons.some((icon) => icon.src === "/unreached/icon-512.png" && icon.sizes === "512x512" && icon.type === "image/png" && (icon.purpose ?? "").includes("maskable"))).toBe(true);
  expect(result.assetStatuses.every((asset) => asset.status === 200), JSON.stringify(result.assetStatuses)).toBe(true);
  expect(result.appleTouch).toBe("/unreached/apple-touch-icon.png");
  expect(result.capable).toBe("yes");
  expect(result.appTitle).toBe("Unreached");
});

test("portrait and landscape device-class layouts remain usable without horizontal overflow", async ({ page }) => {
  const routes = ["/", "/explore", "/peoples", "/pray", "/account", "/about"];
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    for (const route of routes) {
      await page.goto(`./#${route}`);
      await expect(page.locator("#main-content")).toBeVisible();
      await expect(page.locator("main")).toHaveCount(1);
      await expectNoHorizontalOverflow(page);
    }
  }
});

test("200%-zoom-equivalent narrow desktop boundary preserves readable layout", async ({ page }) => {
  // A 1280px physical viewport at 200% browser zoom exposes roughly 640 CSS px.
  // Playwright does not expose cross-browser browser-chrome zoom, so the release
  // gate certifies the equivalent CSS layout boundary without claiming hardware UI zoom.
  await page.setViewportSize({ width: 640, height: 900 });
  for (const route of ["/", "/peoples", "/countries", "/languages", "/pray", "/saved", "/account", "/about"]) {
    await page.goto(`./#${route}`);
    await expect(page.locator("#main-content")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});

test.describe("Phase 5 offline PWA acceptance", () => {
  test.use({ serviceWorkers: "allow" });
  test.skip(({ browserName }) => browserName !== "chromium", "Service-worker lifecycle is certified in Chromium; deterministic worker checks cover generated release assets.");

  test("offline controlled shell relaunch keeps local routes available", async ({ page, context }) => {
    await page.goto("./#/about");
    await waitForServiceWorkerControl(page);
    await expect(page.locator("#main-content")).toBeVisible();

    await context.setOffline(true);
    try {
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(page.locator("#main-content")).toBeVisible();
      await expect(page.locator("body")).toContainText("Unreached");

      await page.evaluate(() => {
        window.location.hash = "#/saved";
      });
      await expect.poll(() => page.evaluate(() => location.hash)).toBe("#/saved");
      await expect(page.locator("#main-content")).toContainText("My lists");
      await expectNoHorizontalOverflow(page);
    } finally {
      await context.setOffline(false);
    }
  });
});
