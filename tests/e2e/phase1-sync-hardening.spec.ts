import { expect, test, type Page } from "@playwright/test";

import { installPeopleGroupsFixture, VISIBLE_TEST_PEID, VISIBLE_TEST_PEOPLE } from "./peoplegroups-fixture";

const SYNC_STORAGE_KEY = "unreached.sync.v1";
const PERSONALIZATION_STORAGE_KEY = "unreached.personal.v2";
const TOKEN_KEY = "unreached.sync.access.v1";
const VALID_SHAPE_TOKEN = "aaaaaaaaaa.bbbbbbbbbb.cccccccccc";

async function seedBoundDevice(page: Page, withToken: boolean) {
  await page.addInitScript(({ syncKey, personalKey, tokenKey, token, useToken }) => {
    const id = 900001;
    const payload = { sourcePeopleId: id, peopleGroupId: `people-entity:peoplegroups:${id}`, name: `Bound person ${id}`, largestCountryName: "Testland", primaryLanguageName: "Test", classification: "unreached", frontier: false, savedAt: "2026-08-26T12:00:00.000Z" };
    const item = { kind: "saved", sourcePeopleId: id, present: true, revision: 1, payload, lastPrayedAt: null, updatedAt: "2026-08-26T12:00:00.000Z" };
    localStorage.setItem(syncKey, JSON.stringify({ version: 2, enabled: true, accountEmail: "owner@example.com", accountMismatchEmail: null, lastServerRevision: 1, mirror: { [`saved:${id}`]: item }, pending: [], lastSyncedAt: "2026-08-26T12:00:00.000Z", lastError: null }));
    localStorage.setItem(personalKey, JSON.stringify({ version: 2, savedPeoples: [], prayerList: [], recent: [] }));
    if (useToken) sessionStorage.setItem(tokenKey, token);
  }, { syncKey: SYNC_STORAGE_KEY, personalKey: PERSONALIZATION_STORAGE_KEY, tokenKey: TOKEN_KEY, token: VALID_SHAPE_TOKEN, useToken: withToken });
}

test.describe("Phase 1 private-sync and storage integrity", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Phase 1 integrity regressions run once in Chromium; the existing release suite owns the full browser matrix.");

  test("a differently authenticated account receives zero pending uploads", async ({ page }) => {
    await seedBoundDevice(page, true);
    let syncPosts = 0;
    await page.route("**/unreached-sync/health", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) }));
    await page.route("**/unreached-sync/private/state", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ account: { email: "intruder@example.com" }, revision: 0, items: [] }) }));
    await page.route("**/unreached-sync/private/sync", async (route) => { syncPosts += 1; await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Upload must not occur" }) }); });
    await page.goto("./#/account");
    await expect(page.getByRole("heading", { name: "Sync paused · different account" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: "Export private data" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Delete private account data" })).toHaveCount(0);
    await page.waitForTimeout(750);
    expect(syncPosts).toBe(0);
    const syncState = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), SYNC_STORAGE_KEY);
    expect(syncState.accountEmail).toBe("owner@example.com");
    expect(syncState.accountMismatchEmail).toBe("intruder@example.com");
    expect(syncState.pending).toHaveLength(1);
    expect(syncState.pending[0].action).toBe("delete");
  });

  test("a new tab without its session token pauses the existing device binding", async ({ page }) => {
    await seedBoundDevice(page, false);
    let privateRequests = 0;
    await page.route("**/unreached-sync/health", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) }));
    await page.route("**/unreached-sync/private/**", async (route) => { privateRequests += 1; await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "No authenticated private request expected" }) }); });
    await page.goto("./#/account");
    await expect(page.getByRole("heading", { name: "Sync paused · sign in again" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: /Sign in again/i })).toBeVisible();
    await page.waitForTimeout(500);
    expect(privateRequests).toBe(0);
    const syncState = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), SYNC_STORAGE_KEY);
    expect(syncState.enabled).toBe(true);
    expect(syncState.accountEmail).toBe("owner@example.com");
  });

  test("blocked personalization storage keeps the current tab state coherent", async ({ page }) => {
    await page.addInitScript((personalKey) => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key: string, value: string) {
        if (key === personalKey) throw new DOMException("Phase 1 blocked personalization storage", "QuotaExceededError");
        return originalSetItem.call(this, key, value);
      };
    }, PERSONALIZATION_STORAGE_KEY);
    await installPeopleGroupsFixture(page);
    await page.goto(`./#/peoples/${VISIBLE_TEST_PEID}`);
    const save = page.getByRole("button", { name: "Save for later" });
    await expect(save).toBeVisible({ timeout: 10_000 });
    await save.click();
    await expect(page.getByRole("button", { name: "Remove from saved" })).toBeVisible();
    expect(await page.evaluate((key) => localStorage.getItem(key), PERSONALIZATION_STORAGE_KEY)).toBeNull();
    await page.goto("./#/saved");
    await expect(page.getByRole("heading", { name: "My lists" })).toBeVisible({ timeout: 10_000 });
    const savedCard = page.locator(".saved-person-card").filter({ hasText: VISIBLE_TEST_PEOPLE });
    await expect(savedCard).toHaveCount(1);
    await expect(savedCard).toBeVisible();
  });
});
