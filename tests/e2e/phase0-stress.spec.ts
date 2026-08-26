import { expect, test, type Page, type Route } from "@playwright/test";

import { installPeopleGroupsFixture } from "./peoplegroups-fixture";

test.beforeEach(({ browserName }) => {
  test.skip(browserName !== "chromium", "Phase 0 stress baselines run once in Chromium; the release suite owns the full browser matrix.");
});

function largeLanguageRecord(index: number) {
  const id = 920_000 + index;
  return {
    PEID: id,
    PGID: `PG${id}`,
    NmDisp: `Baseline Language People ${index + 1}`,
    ISOalpha3: "BEN",
    Ctry: "Benin",
    Regn: "Africa",
    RegnSub: "Western Africa",
    Pop: 10_000 + index,
    ROL: "bas",
    Lang: "Baseline Language",
    LangFamily: "Baseline Family",
    ROR: "R1",
    Rlgn: "Islam",
    EvngLvl: "Less than 2%",
    GSEC: 1,
    GSECbrf: "No Active Church Planting",
    Bible: "Available",
    Jesus: "Not Available",
    Affbloc: "Baseline Bloc",
    PplClstr: "Baseline Cluster",
    PplNm: `Baseline Language People ${index + 1}`,
    UpdatedDate: "2026-08-26T00:00:00.000Z",
  };
}

async function installLargeLanguageFixture(page: Page, count = 550) {
  const records = Array.from({ length: count }, (_, index) => largeLanguageRecord(index));
  const pageSize = 250;
  const totalPages = Math.ceil(records.length / pageSize);
  await page.route(/https:\/\/peoplegroups\.org\/wp-json\/pg\/v1\/people-groups(?:\?.*)?$/, async (route: Route) => {
    const url = new URL(route.request().url());
    const pageNumber = Number(url.searchParams.get("page") ?? "1");
    const start = (pageNumber - 1) * pageSize;
    const body = records.slice(start, start + pageSize);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Expose-Headers": "X-WP-Total, X-WP-TotalPages",
        "X-WP-Total": String(records.length),
        "X-WP-TotalPages": String(totalPages),
      },
      body: JSON.stringify(body),
    });
  });
}

async function seedStalePreparedSnapshot(page: Page) {
  await page.goto("./#/about");
  await page.evaluate(async () => {
    const storedAt = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const snapshot = {
      schemaVersion: 1,
      key: "active",
      storedAt,
      totalPages: 1,
      totalRecords: 1,
      records: [{ PGID: "PG999001" }],
      contexts: [{}],
      entities: [{}],
      countrySummaries: [{}],
    };
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("unreached-peoplegroups-v1", 2);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("pages")) db.createObjectStore("pages", { keyPath: "page" });
        if (!db.objectStoreNames.contains("prepared")) db.createObjectStore("prepared", { keyPath: "key" });
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction("prepared", "readwrite");
        transaction.objectStore("prepared").put(snapshot);
        transaction.oncomplete = () => { db.close(); resolve(); };
        transaction.onerror = () => { const error = transaction.error; db.close(); reject(error); };
      };
    });
  });
  await page.reload();
}

test.describe("Phase 0 stress envelope", () => {
  test("550 people records in one language produce a measurable large-table baseline", async ({ page }) => {
    await installLargeLanguageFixture(page);
    const startedAt = Date.now();
    await page.goto("./#/languages/bas");
    const rows = page.locator(".language-table tbody tr");
    await expect(rows).toHaveCount(550, { timeout: 20_000 });
    const durationMs = Date.now() - startedAt;
    await test.info().attach("large-language-baseline.json", {
      body: Buffer.from(JSON.stringify({ records: 550, renderedRows: await rows.count(), routeReadyMs: durationMs }, null, 2)),
      contentType: "application/json",
    });
  });

  test("a 48-hour prepared snapshot is reproducibly exposed as stale cache", async ({ page }) => {
    await seedStalePreparedSnapshot(page);
    await expect(page.locator(".data-state")).toHaveAttribute("data-data-state", "stale", { timeout: 10_000 });
  });

  test("4x CPU throttled mobile shell remains operable and records baseline timing", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium");
    await page.setViewportSize({ width: 390, height: 844 });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await installPeopleGroupsFixture(page);
    const startedAt = Date.now();
    await page.goto("./#/peoples");
    await expect(page.locator("#people-search")).toBeVisible({ timeout: 15_000 });
    const readyMs = Date.now() - startedAt;
    await page.locator("#people-search").fill("Browser Test");
    await expect(page.getByText(/matches/)).toBeVisible();
    await test.info().attach("throttled-mobile-baseline.json", {
      body: Buffer.from(JSON.stringify({ viewport: "390x844", cpuThrottle: 4, peopleSearchReadyMs: readyMs }, null, 2)),
      contentType: "application/json",
    });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  });
});
