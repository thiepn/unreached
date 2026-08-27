import { expect, test, type Page } from "@playwright/test";

import { installPeopleGroupsFixture, VISIBLE_TEST_PEOPLE } from "./peoplegroups-fixture";

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
});
