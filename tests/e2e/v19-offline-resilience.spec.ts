import { expect, test, type Page } from "@playwright/test";

import { installPeopleGroupsFixture, VISIBLE_TEST_PEOPLE } from "./peoplegroups-fixture";

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

test.describe("v1.9 offline resilience", () => {
  test("owned app shell and reviewed editorial coverage return offline", async ({ page, context }) => {
    await page.goto("./#/coverage");
    await expect(page.getByRole("heading", { name: "Browse the profiles with deeper context." })).toBeVisible();
    await ensureServiceWorkerControl(page);

    await context.setOffline(true);
    try {
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "Browse the profiles with deeper context." })).toBeVisible();
      await expect(page.locator('[data-data-state="offline-empty"]')).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });

  test("validated PeopleGroups snapshot powers an offline return", async ({ page, context }) => {
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

  test("first offline mission-data visit fails clearly instead of inventing records", async ({ page, context }) => {
    await page.goto("./#/coverage");
    await ensureServiceWorkerControl(page);

    await context.setOffline(true);
    try {
      await page.evaluate(() => { window.location.hash = "#/peoples"; });
      await expect(page.locator('[data-data-state="offline-empty"]')).toBeVisible();
      await expect(page.getByText(/no validated PeopleGroups cache is available yet/i)).toBeVisible();
      await expect(page.getByText(/Reconnect once to prepare mission data for offline return/i)).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });

  test("reconnection revalidates an offline-empty mission-data surface", async ({ page, context }) => {
    await installPeopleGroupsFixture(page);
    await page.goto("./#/coverage");
    await ensureServiceWorkerControl(page);

    await context.setOffline(true);
    await page.evaluate(() => { window.location.hash = "#/peoples"; });
    await expect(page.locator('[data-data-state="offline-empty"]')).toBeVisible();

    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    await expect(page.getByText(VISIBLE_TEST_PEOPLE, { exact: true }).first()).toBeVisible();
    await expect(page.locator('[data-data-state="live"]')).toBeVisible();
  });
});
