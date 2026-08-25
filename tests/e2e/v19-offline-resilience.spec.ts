import { expect, test, type Page } from "@playwright/test";

import { installPeopleGroupsFixture, VISIBLE_TEST_PEOPLE } from "./peoplegroups-fixture";

const PEOPLEGROUPS_API = /https:\/\/peoplegroups\.org\/wp-json\/pg\/v1\/people-groups(?:\?.*)?$/;

async function ensureServiceWorkerControl(page: Page): Promise<void> {
  await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) throw new Error("service workers unavailable in this browser");
    await navigator.serviceWorker.ready;
  });
  if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))) {
    await page.reload({ waitUntil: "domcontentloaded" });
  }
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
}

async function preloadPeoplesRouteWithoutMissionCache(page: Page): Promise<void> {
  await page.route(PEOPLEGROUPS_API, async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Intentional route-code preload failure" }),
    });
  });
  await page.goto("./#/peoples");
  await expect(page.getByRole("heading", { name: "Find a people group." })).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("Live people-group data is temporarily unavailable");
  await page.evaluate(() => { window.location.hash = "#/coverage"; });
  await expect(page.getByRole("heading", { name: "Browse the profiles with deeper context." })).toBeVisible();
  await page.unroute(PEOPLEGROUPS_API);
}

test.describe("v1.9 production offline shell", () => {
  test.use({ serviceWorkers: "allow" });

  test("owned app shell and reviewed editorial coverage return offline", async ({ page, context, browserName }) => {
    test.skip(browserName !== "chromium", "Playwright Firefox/WebKit offline top-level reload fails before service-worker navigation handling; Chromium certifies the production shell while deterministic dist checks certify the same worker for every engine.");

    await page.goto("./#/coverage");
    await expect(page.getByRole("heading", { name: "Browse the profiles with deeper context." })).toBeVisible();
    await ensureServiceWorkerControl(page);

    await context.setOffline(true);
    try {
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "Browse the profiles with deeper context." })).toBeVisible();
      await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    } finally {
      await context.setOffline(false);
    }
  });

  test("validated PeopleGroups snapshot powers an offline return", async ({ page, context, browserName }) => {
    test.skip(browserName !== "chromium", "Playwright Firefox/WebKit cannot reliably execute a service-worker-backed top-level reload while context offline; provider cache semantics are certified cross-engine below and by the deterministic v1.9 gate.");

    await installPeopleGroupsFixture(page);
    await page.goto("./#/peoples");
    await expect(page.getByText(VISIBLE_TEST_PEOPLE, { exact: true }).first()).toBeVisible();
    await expect(page.locator('[data-data-state="live"]')).toBeVisible();
    await ensureServiceWorkerControl(page);

    await context.setOffline(true);
    try {
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(page.getByText(VISIBLE_TEST_PEOPLE, { exact: true }).first()).toBeVisible();
      await expect(page.locator('[data-data-state="cached"]')).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });
});

test.describe("v1.9 offline mission-data runtime", () => {
  // These tests exercise the provider/store behavior itself. Blocking service workers keeps
  // Playwright route fixtures authoritative instead of letting a controlling worker bypass them.
  // Preload the lazy Peoples route while online using an intentional provider failure so every
  // engine has the route module available without writing a valid PeopleGroups cache.
  test.use({ serviceWorkers: "block" });

  test("first offline mission-data visit fails clearly instead of inventing records", async ({ page, context }) => {
    await preloadPeoplesRouteWithoutMissionCache(page);

    await context.setOffline(true);
    try {
      await page.evaluate(() => { window.location.hash = "#/peoples"; });
      await expect(page.getByRole("heading", { name: "Find a people group." })).toBeVisible();
      await expect(page.locator('[data-data-state="offline-empty"]')).toBeVisible();
      await expect(page.getByText(/no validated PeopleGroups cache is available yet/i)).toBeVisible();
      await expect(page.getByText(/Reconnect once to prepare mission data for offline return/i)).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });

  test("reconnection revalidates an offline-empty mission-data surface", async ({ page, context }) => {
    await preloadPeoplesRouteWithoutMissionCache(page);
    await installPeopleGroupsFixture(page);

    await context.setOffline(true);
    await page.evaluate(() => { window.location.hash = "#/peoples"; });
    await expect(page.getByRole("heading", { name: "Find a people group." })).toBeVisible();
    await expect(page.locator('[data-data-state="offline-empty"]')).toBeVisible();

    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    await expect(page.getByText(VISIBLE_TEST_PEOPLE, { exact: true }).first()).toBeVisible();
    await expect(page.locator('[data-data-state="live"]')).toBeVisible();
  });
});
