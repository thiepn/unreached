import { expect, test, type Page } from "@playwright/test";

const LOCAL_PERSON_ID = 12319;
const REMOTE_PERSON_ID = 24277;
const LOCAL_STORAGE = "unreached.personal.v2";
const SYNC_STORAGE = "unreached.sync.v1";

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

async function seed(page: Page, personal: unknown, sync: unknown | null = null) {
  await page.addInitScript(({ personalState, syncState, personalKey, syncKey }) => {
    localStorage.setItem(personalKey, JSON.stringify(personalState));
    if (syncState) localStorage.setItem(syncKey, JSON.stringify(syncState));
    else localStorage.removeItem(syncKey);
  }, { personalState: personal, syncState: sync, personalKey: LOCAL_STORAGE, syncKey: SYNC_STORAGE });
}

async function installHealth(page: Page, ok = true) {
  await page.route("**/unreached-sync/health", async (route) => {
    await route.fulfill({ status: ok ? 200 : 503, contentType: "application/json", body: JSON.stringify(ok ? { ok: true, version: "2.0.0" } : { error: "offline" }) });
  });
}

test.describe("v2.0 optional private accounts", () => {
  // These journeys certify the sync protocol/runtime through Playwright route fixtures.
  // Blocking the already-deployed app service worker keeps those fixtures authoritative;
  // v1.9 separately certifies the real production service worker and offline shell.
  test.use({ serviceWorkers: "block" });

  test("local-only remains complete when the private backend is unavailable", async ({ page }) => {
    await seed(page, personalization());
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
      stateCalls += 1;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(snapshot()) });
    });
    await page.route("**/unreached-sync/private/sync", async (route) => {
      syncBody = JSON.parse(route.request().postData() ?? "null") as { mutations?: Array<{ sourcePeopleId?: number; [key: string]: unknown }> };
      const localItem = savedItem(localSaved, 5);
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(snapshot([savedItem(remoteSaved, 4), localItem], 5)) });
    });

    await page.goto("./#/account");
    await expect(page.getByRole("heading", { name: "Signed in · sync not enabled" })).toBeVisible();
    await expect(page.getByText(/Choose the explicit merge below before anything is uploaded/)).toBeVisible();

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
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(snapshot([mirrorItem], 11)) });
    });
    await page.route("**/unreached-sync/private/sync", async (route) => {
      const body = JSON.parse(route.request().postData() ?? "{}") as { mutations?: Record<string, unknown>[] };
      mutation = body.mutations?.[0] ?? null;
      const tombstone = { ...mirrorItem, present: false, payload: null, revision: 12, updatedAt: "2026-08-25T03:00:00.000Z" };
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(snapshot([tombstone], 12)) });
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
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(snapshot([mirrorItem], 6)) });
    });
    await page.route("**/unreached-sync/private/sync", async (route) => {
      syncCalls += 1;
      const remoteItem = savedItem(remoteSaved, 7);
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(snapshot([mirrorItem, remoteItem], 7)) });
    });
    await page.route("**/unreached-sync/private/account", async (route) => {
      expect(route.request().method()).toBe("DELETE");
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ deleted: true }) });
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
  });
});
