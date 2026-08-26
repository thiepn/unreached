import { expect, test, type Page } from "@playwright/test";

async function waitForRegistration(page: Page): Promise<void> {
  await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) throw new Error("service workers unavailable");
    await navigator.serviceWorker.ready;
  });
}

async function ensureControlled(page: Page): Promise<void> {
  await waitForRegistration(page);
  if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))) {
    await page.reload({ waitUntil: "domcontentloaded" });
  }
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
}

test.describe("Phase 2 service-worker deployment correctness", () => {
  test.use({ serviceWorkers: "allow" });
  test.skip(({ browserName }) => browserName !== "chromium", "Service-worker lifecycle semantics are certified once in Chromium; deterministic dist checks certify the generated worker across builds.");

  test("first install does not take over the already-open tab", async ({ page }) => {
    await page.goto("./#/about");
    await waitForRegistration(page);
    expect(await page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(false);

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("precache keeps build chunks but excludes mutable data trees", async ({ page }) => {
    await page.goto("./#/about");
    await ensureControlled(page);

    const snapshot = await page.evaluate(async () => {
      const names = await caches.keys();
      const shellNames = names.filter((name) => /^unreached-shell-[0-9a-f]{16}$/.test(name));
      const current = shellNames.at(-1) ?? null;
      const urls = current ? (await (await caches.open(current)).keys()).map((request) => new URL(request.url).pathname) : [];
      return { shellNames, current, urls };
    });

    expect(snapshot.current).toMatch(/^unreached-shell-[0-9a-f]{16}$/);
    expect(snapshot.urls.some((path) => path.startsWith("/unreached/assets/"))).toBe(true);
    expect(snapshot.urls.some((path) => path.startsWith("/unreached/data/"))).toBe(false);
    expect(snapshot.urls.some((path) => path.startsWith("/unreached/maps/"))).toBe(false);
  });
});
