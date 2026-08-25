import { expect, test, type Page, type Route } from "@playwright/test";

const LOCAL_PERSON_ID = 12319;
const REMOTE_PERSON_ID = 24277;
const LOCAL_STORAGE = "unreached.personal.v2";
const SYNC_STORAGE = "unreached.sync.v1";
const ACCESS_STORAGE = "unreached.sync.access.v1";
const TEST_ACCESS_TOKEN = "testheader.testpayload.testsignature";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

const localSaved = {
  sourcePeopleId: LOCAL_PERSON_ID,
  peopleGroupId: `people-entity:peoplegroups:${LOCAL_PERSON_ID}`,
  name: "Local Fon",
  largestCountryName: "Benin",
  primaryLanguageName: "Fon",
  classification: "unreached",
  frontier: false,
  savedAt: "2026-08-25T01:00:00.000Z",
};

const remoteSaved = {
  sourcePeopleId: REMOTE_PERSON_ID,
  peopleGroupId: `people-entity:peoplegroups:${REMOTE_PERSON_ID}`,
  name: "Remote Kazakh",
  largestCountryName: "Kazakhstan",
  primaryLanguageName: "Kazakh",
  classification: "unreached",
  frontier: false,
  savedAt: "2026-08-24T01:00:00.000Z",
};

const recentVisit = {
  kind: "country",
  key: "BEN",
  label: "Benin",
  secondary: null,
  href: "#/countries/BEN",
  visitedAt: "2026-08-25T01:30:00.000Z",
};

function personalization(savedPeoples = [localSaved]) {
  return { version: 2, savedPeoples, prayerList: [], recent: [recentVisit] };
}

function savedItem(payload = remoteSaved, revision = 4, present = true) {
  return {
    kind: "saved",
    sourcePeopleId: payload.sourcePeopleId,
    present,
    revision,
    payload: present ? payload : null,
    lastPrayedAt: null,
    updatedAt: "2026-08-25T02:00:00.000Z",
  };
}

function snapshot(items = [savedItem()], revision = 4) {
  return { account: { email: "reader@example.com" }, revision, items };
}

async function seed(page: Page, personal: unknown, sync: unknown | null = null, authenticated = true) {
  await page.addInitScript(({ personalState, syncState, personalKey, syncKey, accessKey, accessToken, withAccess }) => {
    localStorage.setItem(personalKey, JSON.stringify(personalState));
    if (syncState) localStorage.setItem(syncKey, JSON.stringify(syncState));
    else localStorage.removeItem(syncKey);
    if (withAccess) sessionStorage.setItem(accessKey, accessToken);
    else sessionStorage.removeItem(accessKey);
  }, {
    personalState: personal,
    syncState: sync,
    personalKey: LOCAL_STORAGE,
    syncKey: SYNC_STORAGE,
    accessKey: ACCESS_STORAGE,
    accessToken: TEST_ACCESS_TOKEN,
    withAccess: authenticated,
  });
}

async function handlePreflight(route: Route): Promise<boolean> {
  if (route.request().method() !== "OPTIONS") return false;
  await route.fulfill({ status: 204, headers: CORS_HEADERS });
  return true;
}

async function fulfillJson(route: Route, status: number, value: unknown): Promise<void> {
  await route.fulfill({
    status,
    contentType: "application/json",
    headers: CORS_HEADERS,
    body: JSON.stringify(value),
  });
}

function expectBearer(route: Route): void {
  expect(route.request().headers().authorization).toBe(`Bearer ${TEST_ACCESS_TOKEN}`);
}

async function installHealth(page: Page, ok = true) {
  await page.route("**/unreached-sync/health", async (route) => {
    await fulfillJson(route, ok ? 200 : 503, ok ? { ok: true, version: "2.0.0" } : { error: "offline" });
  });
}

test.describe("v2.0 optional private accounts", () => {
  // These journeys certify the sync protocol/runtime through Playwright route fixtures.
  // Blocking the already-deployed app service worker keeps those fixtures authoritative;
  // v1.9 separately certifies the real production service worker and offline shell.
  test.use({ serviceWorkers: "block" });

  test("local-only remains complete when the private backend is unavailable", async ({ page }) => {
    await seed(page, personalization(), null, false);
    await installHealth(page, false);
    await page.goto("./#/account");

    await expect(page.getByRole("heading", { name: "Use Unreached locally, or carry a small private list across devices." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Local-only mode" })).toBeVisible();
    await expect(page.getByText("Your browser-local data continues to work normally.")).toBeVisible();

    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), LOCAL_STORAGE);
    expect(stored.savedPeoples).toHaveLength(1);
    expect(stored.recent).toHaveLength(1);
  });

  test("first activation explicitly merges local and remote state and never uploads recent history", async ({ page }) => {
    await seed(page, personalization());
    await installHealth(page);

    let syncBody: { mutations?: Array<{ sourcePeopleId?: number; [key: string]: unknown }> } | null = null;
    let stateCalls = 0;
    await page.route("**/unreached-sync/private/state", async (route) => {
      if (await handlePreflight(route)) return;
      expectBearer(route);
      stateCalls += 1;
      await fulfillJson(route, 200, snapshot());
    });
    await page.route("**/unreached-sync/private/sync", async (route) => {
      if (await handlePreflight(route)) return;
      expectBearer(route);
      syncBody = JSON.parse(route.request().postData() ?? "null") as { mutations?: Array<{ sourcePeopleId?: number; [key: string]: unknown }> };
      const localItem = savedItem(localSaved, 5);
      await fulfillJson(route, 200, snapshot([savedItem(remoteSaved, 4), localItem], 5));
    });

    await page.goto("./#/account");
    await expect(page.getByRole("heading", { name: "Signed in · sync not enabled" })).toBeVisible();
    await expect(page.getByText(/Choose the explicit merge below before any local Saved or prayer data is uploaded/)).toBeVisible();

    await page.getByRole("button", { name: "Merge this device & enable sync" }).click();
    await expect(page.getByRole("heading", { name: "Private sync enabled" })).toBeVisible();
    await expect.poll(() => syncBody).not.toBeNull();
    expect(stateCalls).toBeGreaterThan(0);

    const bodyText = JSON.stringify(syncBody);
    expect(bodyText).not.toContain("recent");
    expect(bodyText).not.toContain("visitedAt");
    expect(syncBody?.mutations?.some((mutation) => mutation.sourcePeopleId === LOCAL_PERSON_ID)).toBe(true);

    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), LOCAL_STORAGE);
    expect(stored.savedPeoples.map((item: { sourcePeopleId: number }) => item.sourcePeopleId).sort()).toEqual([LOCAL_PERSON_ID, REMOTE_PERSON_ID].sort());
    expect(stored.recent).toEqual([recentVisit]);
    expect(await page.evaluate((key) => localStorage.getItem(key), ACCESS_STORAGE)).toBeNull();
    expect(await page.evaluate((key) => sessionStorage.getItem(key), ACCESS_STORAGE)).toBe(TEST_ACCESS_TOKEN);
  });

  test("a local deletion becomes a revision-based tombstone mutation instead of resurrecting remote data", async ({ page }) => {
    const mirrorItem = savedItem(remoteSaved, 11);
    const syncState = {
      version: 1,
      enabled: true,
      accountEmail: "reader@example.com",
      lastServerRevision: 11,
      mirror: { [`saved:${REMOTE_PERSON_ID}`]: mirrorItem },
      pending: [],
      lastSyncedAt: "2026-08-25T02:00:00.000Z",
      lastError: null,
    };
    await seed(page, personalization([]), syncState);
    await installHealth(page);

    let mutation: Record<string, unknown> | null = null;
    await page.route("**/unreached-sync/private/state", async (route) => {
      if (await handlePreflight(route)) return;
      expectBearer(route);
      await fulfillJson(route, 200, snapshot([mirrorItem], 11));
    });
    await page.route("**/unreached-sync/private/sync", async (route) => {
      if (await handlePreflight(route)) return;
      expectBearer(route);
      const body = JSON.parse(route.request().postData() ?? "{}") as { mutations?: Record<string, unknown>[] };
      mutation = body.mutations?.[0] ?? null;
      const tombstone = { ...mirrorItem, present: false, payload: null, revision: 12, updatedAt: "2026-08-25T03:00:00.000Z" };
      await fulfillJson(route, 200, snapshot([tombstone], 12));
    });

    await page.goto("./#/account");
    await expect.poll(() => mutation).not.toBeNull();
    expect(mutation?.action).toBe("delete");
    expect(mutation?.sourcePeopleId).toBe(REMOTE_PERSON_ID);
    expect(mutation?.baseItemRevision).toBe(11);
  });

  test("offline changes queue locally, reconnect, and account deletion leaves personalization on-device", async ({ page, context }) => {
    const mirrorItem = savedItem(localSaved, 6);
    const syncState = {
      version: 1,
      enabled: true,
      accountEmail: "reader@example.com",
      lastServerRevision: 6,
      mirror: { [`saved:${LOCAL_PERSON_ID}`]: mirrorItem },
      pending: [],
      lastSyncedAt: "2026-08-25T02:00:00.000Z",
      lastError: null,
    };
    await seed(page, personalization([localSaved]), syncState);
    await installHealth(page);

    let syncCalls = 0;
    await page.route("**/unreached-sync/private/state", async (route) => {
      if (await handlePreflight(route)) return;
      expectBearer(route);
      await fulfillJson(route, 200, snapshot([mirrorItem], 6));
    });
    await page.route("**/unreached-sync/private/sync", async (route) => {
      if (await handlePreflight(route)) return;
      expectBearer(route);
      syncCalls += 1;
      const remoteItem = savedItem(remoteSaved, 7);
      await fulfillJson(route, 200, snapshot([mirrorItem, remoteItem], 7));
    });
    await page.route("**/unreached-sync/private/account", async (route) => {
      if (await handlePreflight(route)) return;
      expectBearer(route);
      expect(route.request().method()).toBe("DELETE");
      await fulfillJson(route, 200, { deleted: true });
    });

    await page.goto("./#/account");
    await expect(page.getByRole("heading", { name: "Private sync enabled" })).toBeVisible();

    await context.setOffline(true);
    await page.evaluate(({ personalKey, eventName, remote }) => {
      const state = JSON.parse(localStorage.getItem(personalKey) ?? "null");
      state.savedPeoples.push(remote);
      localStorage.setItem(personalKey, JSON.stringify(state));
      window.dispatchEvent(new Event(eventName));
    }, { personalKey: LOCAL_STORAGE, eventName: "unreached:personalization-change", remote: remoteSaved });

    await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null").pending.length, SYNC_STORAGE)).toBe(1);
    expect(syncCalls).toBe(0);

    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    await expect.poll(() => syncCalls).toBeGreaterThan(0);
    await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null").pending.length, SYNC_STORAGE)).toBe(0);

    page.on("dialog", (dialog) => void dialog.accept());
    await page.getByRole("button", { name: "Delete private account data" }).click();
    await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null").enabled, SYNC_STORAGE)).toBe(false);
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), LOCAL_STORAGE);
    expect(stored.savedPeoples.length).toBeGreaterThan(0);
    expect(stored.recent).toEqual([recentVisit]);
    expect(await page.evaluate((key) => sessionStorage.getItem(key), ACCESS_STORAGE)).toBeNull();
  });
});
