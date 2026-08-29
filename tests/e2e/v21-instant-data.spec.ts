import { expect, test, type Page } from "@playwright/test";

import { installPeopleGroupsFixture, PEOPLE_GROUPS_TEST_RECORDS, VISIBLE_TEST_PEOPLE } from "./peoplegroups-fixture";

const DB_NAME = "unreached-peoplegroups-v1";
const PREPARED_STORE = "prepared";

async function waitForPreparedSnapshot(page: Page): Promise<void> {
  await expect.poll(async () => page.evaluate(async ({ dbName, storeName }) => {
    return await new Promise<boolean>((resolve) => {
      const request = indexedDB.open(dbName);
      request.onerror = () => resolve(false);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.close();
          resolve(false);
          return;
        }
        const transaction = db.transaction(storeName, "readonly");
        const get = transaction.objectStore(storeName).get("active");
        get.onerror = () => { db.close(); resolve(false); };
        get.onsuccess = () => { const ready = Boolean(get.result); db.close(); resolve(ready); };
      };
    });
  }, { dbName: DB_NAME, storeName: PREPARED_STORE }), { timeout: 5_000 }).toBe(true);
}

async function agePreparedSnapshot(page: Page, ageMs: number): Promise<void> {
  await page.evaluate(async ({ dbName, storeName, storedAt }) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(dbName);
      request.onerror = () => reject(request.error ?? new Error("cache open failed"));
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.close();
          reject(new Error("prepared snapshot store missing"));
          return;
        }
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const get = store.get("active");
        get.onerror = () => reject(get.error ?? new Error("prepared snapshot read failed"));
        get.onsuccess = () => {
          if (!get.result) {
            reject(new Error("prepared snapshot missing"));
            return;
          }
          store.put({ ...get.result, storedAt });
        };
        transaction.oncomplete = () => { db.close(); resolve(); };
        transaction.onerror = () => { const error = transaction.error; db.close(); reject(error ?? new Error("prepared snapshot update failed")); };
      };
    });
  }, { dbName: DB_NAME, storeName: PREPARED_STORE, storedAt: new Date(Date.now() - ageMs).toISOString() });
}

test.describe("P2.1 instant data and background revalidation", () => {
  test.use({ serviceWorkers: "block" });

  test("repeat visits hydrate instantly and stale data stays visible while refresh waits", async ({ page }) => {
    await installPeopleGroupsFixture(page);
    await page.goto("./#/peoples");
    await expect(page.getByText(VISIBLE_TEST_PEOPLE).first()).toBeVisible();
    await waitForPreparedSnapshot(page);

    await page.unrouteAll({ behavior: "wait" });
    let providerRequests = 0;
    let releaseRefresh!: () => void;
    const refreshGate = new Promise<void>((resolve) => { releaseRefresh = resolve; });
    await page.route(/https:\/\/peoplegroups\.org\/wp-json\/pg\/v1\/people-groups(?:\?.*)?$/, async (route) => {
      providerRequests += 1;
      await refreshGate;
      await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "intentional delayed refresh" }) });
    });

    await page.reload();
    await expect(page.getByText(VISIBLE_TEST_PEOPLE).first()).toBeVisible({ timeout: 1_500 });
    await page.waitForTimeout(500);
    expect(providerRequests).toBe(0);

    await agePreparedSnapshot(page, 2 * 24 * 60 * 60 * 1000);
    await page.reload();
    await expect(page.getByText(VISIBLE_TEST_PEOPLE).first()).toBeVisible({ timeout: 1_500 });
    await expect.poll(() => providerRequests, { timeout: 3_000 }).toBeGreaterThan(0);

    releaseRefresh();
    await expect(page.getByText(VISIBLE_TEST_PEOPLE).first()).toBeVisible();
  });

  test("prepared cache hydrates on non-data routes without idle callbacks", async ({ page }) => {
    await installPeopleGroupsFixture(page);
    await page.goto("./#/peoples");
    await expect(page.getByText(VISIBLE_TEST_PEOPLE).first()).toBeVisible();
    await waitForPreparedSnapshot(page);

    await page.addInitScript(() => {
      Object.defineProperty(window, "requestIdleCallback", {
        configurable: true,
        value: () => 1,
      });
    });
    await page.goto("./#/about");
    await page.reload();

    await expect(page.locator('[data-data-state="cached"]')).toBeVisible({ timeout: 1_000 });
    await expect(page.getByRole("heading", { name: /Know what the map means/i })).toBeVisible();
  });

  test("cold People Explorer is usable before the full corpus finishes", async ({ page }) => {
    const firstRecord = PEOPLE_GROUPS_TEST_RECORDS[0];
    const secondRecord = PEOPLE_GROUPS_TEST_RECORDS[2];
    let releaseSecondPage!: () => void;
    const secondPageGate = new Promise<void>((resolve) => { releaseSecondPage = resolve; });

    await page.route(/https:\/\/peoplegroups\.org\/wp-json\/pg\/v1\/people-groups(?:\?.*)?$/, async (route) => {
      const url = new URL(route.request().url());
      const pageNumber = Number(url.searchParams.get("page") ?? "1");
      if (pageNumber === 2) await secondPageGate;
      const body = pageNumber === 1 ? [firstRecord] : pageNumber === 2 ? [secondRecord] : [];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Expose-Headers": "X-WP-Total, X-WP-TotalPages",
          "X-WP-Total": "2",
          "X-WP-TotalPages": "2",
        },
        body: JSON.stringify(body),
      });
    });

    await page.goto("./#/peoples");

    const progressive = page.locator('[data-progressive-catalog="true"]');
    await expect(progressive).toBeVisible({ timeout: 2_000 });
    await expect(progressive).toContainText("Showing 1 validated source records received so far");
    await expect(page.getByText(VISIBLE_TEST_PEOPLE).first()).toBeVisible();
    await expect(page.getByRole("searchbox", { name: "Search people groups" })).toBeEnabled();
    await expect(page.locator('[data-data-state="refreshing"]')).toBeVisible();
    await expect(page.getByText("Second Browser People")).toHaveCount(0);

    releaseSecondPage();

    await expect(page.getByText("Second Browser People").first()).toBeVisible({ timeout: 3_000 });
    await expect(progressive).toHaveCount(0);
  });
});
