import { expect, test, type Page } from "@playwright/test";

const SYNC_STORAGE_KEY = "unreached.sync.v1";
const PERSONALIZATION_STORAGE_KEY = "unreached.personal.v2";
const TOKEN_KEY = "unreached.sync.access.v1";
const TOKEN = "aaaaaaaaaa.bbbbbbbbbb.cccccccccc";

async function mockHealthySync(page: Page, email = "owner@example.com") {
  await page.route("**/unreached-sync/health", async (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true }),
  }));
  await page.route("**/unreached-sync/private/state", async (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ account: { email }, revision: 0, items: [] }),
  }));
  await page.route("**/unreached-sync/private/sync", async (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ account: { email }, revision: 0, items: [] }),
  }));
}

async function seedAuthenticated(page: Page) {
  await page.addInitScript(({ tokenKey, token }) => sessionStorage.setItem(tokenKey, token), { tokenKey: TOKEN_KEY, token: TOKEN });
}

async function seedEnabledDevice(page: Page) {
  await page.addInitScript(({ syncKey, personalKey, tokenKey, token }) => {
    localStorage.setItem(syncKey, JSON.stringify({
      version: 2,
      enabled: true,
      accountEmail: "owner@example.com",
      accountMismatchEmail: null,
      lastServerRevision: 0,
      mirror: {},
      pending: [],
      lastSyncedAt: "2026-08-27T12:00:00.000Z",
      lastError: null,
    }));
    localStorage.setItem(personalKey, JSON.stringify({ version: 2, savedPeoples: [], prayerList: [], recent: [] }));
    sessionStorage.setItem(tokenKey, token);
  }, { syncKey: SYNC_STORAGE_KEY, personalKey: PERSONALIZATION_STORAGE_KEY, tokenKey: TOKEN_KEY, token: TOKEN });
}

test("local-only Account shows one primary choice and hides technical detail by default", async ({ page }) => {
  await mockHealthySync(page);
  await page.goto("./#/account");

  await expect(page.locator(".account-page")).toHaveAttribute("data-account-state", "local");
  await expect(page.getByRole("heading", { name: "Local-only by default" })).toBeVisible();
  await expect(page.locator(".account-primary-actions").getByRole("button", { name: "Sign in privately" })).toBeVisible();
  await expect(page.locator(".account-primary-actions .button")).toHaveCount(1);

  const privacy = page.locator("details.account-privacy-disclosure");
  const controls = page.locator("details.account-controls-disclosure");
  const merge = page.locator("details.account-merge-disclosure");
  await expect(privacy).not.toHaveAttribute("open", "");
  await expect(controls).not.toHaveAttribute("open", "");
  await expect(merge).not.toHaveAttribute("open", "");
  await expect(privacy.getByRole("heading", { name: "What can sync" })).toBeHidden();

  await privacy.locator("summary").click();
  await expect(privacy.getByRole("heading", { name: "What can sync" })).toBeVisible();
  await expect(privacy.getByText("Recent browsing history stays on this device.")).toBeVisible();
});

test("signed-in unsynced Account makes explicit first merge primary and keeps account tools secondary", async ({ page }) => {
  await seedAuthenticated(page);
  await mockHealthySync(page);
  await page.goto("./#/account");

  await expect(page.locator(".account-page")).toHaveAttribute("data-account-state", "ready-to-enable");
  await expect(page.getByRole("heading", { name: "Signed in · sync not enabled" })).toBeVisible();
  await expect(page.locator(".account-primary-actions").getByRole("button", { name: "Merge this device & enable sync" })).toBeVisible();

  const controls = page.locator("details.account-controls-disclosure");
  await expect(controls.getByRole("button", { name: "Export private data" })).toBeHidden();
  await controls.locator("summary").click();
  await expect(controls.getByRole("button", { name: "Export private data" })).toBeVisible();
  await expect(controls.getByRole("button", { name: "Sign out" })).toBeVisible();

  const danger = page.locator("details.account-danger-disclosure");
  await expect(danger).toBeVisible();
  await expect(danger).not.toHaveAttribute("open", "");
  await expect(danger.getByRole("button", { name: "Delete private account data" })).toBeHidden();
});

test("enabled Account treats automatic sync as normal and moves manual controls behind disclosure", async ({ page }) => {
  await seedEnabledDevice(page);
  await mockHealthySync(page);
  await page.goto("./#/account");

  await expect(page.locator(".account-page")).toHaveAttribute("data-account-state", "enabled");
  await expect(page.getByRole("heading", { name: "Private sync enabled" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "No action needed." })).toBeVisible();
  await expect(page.getByText("Automatic sync is active")).toBeVisible();

  const controls = page.locator("details.account-controls-disclosure");
  await expect(controls.getByRole("button", { name: "Sync now" })).toBeHidden();
  await expect(controls.getByRole("button", { name: "Disconnect this device" })).toBeHidden();
  await controls.locator("summary").click();
  await expect(controls.getByRole("button", { name: "Sync now" })).toBeVisible();
  await expect(controls.getByRole("button", { name: "Export private data" })).toBeVisible();
  await expect(controls.getByRole("button", { name: "Disconnect this device" })).toBeVisible();
  await expect(controls.getByRole("button", { name: "Sign out" })).toBeVisible();
});

test("Account remains usable on a 390px mobile viewport without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockHealthySync(page);
  await page.goto("./#/account");
  await expect(page.getByRole("heading", { name: "Local-only by default" })).toBeVisible();

  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  await expect(page.locator(".account-primary-actions").getByRole("button", { name: "Sign in privately" })).toBeVisible();
});
