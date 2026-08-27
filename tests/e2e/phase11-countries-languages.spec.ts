import { expect, test, type Page } from "@playwright/test";

const RECORD_COUNT = 65;
const FIRST_BATCH = 40;

function phase11Records() {
  return Array.from({ length: RECORD_COUNT }, (_, index) => {
    const peid = 920001 + index;
    return {
      PEID: peid,
      PGID: `PG${peid}`,
      NmDisp: `Phase 11 People ${String(index + 1).padStart(2, "0")}`,
      ISOalpha3: "BEN",
      Ctry: "Benin",
      Regn: "Africa",
      RegnSub: "Western Africa",
      Pop: 100000 + index * 1000,
      Latitude: 9.3,
      Longitude: 2.3,
      ROL: "fon",
      Lang: "Fon",
      LangFamily: "Niger-Congo",
      ROR: "R6",
      Rlgn: "Traditional Religion",
      RlgnDiv: "Traditional",
      EvngLvl: "Less than 2%",
      CongExst: "Yes",
      Plnting: "Active",
      EngStat: "Engaged",
      GSEC: 2,
      GSECbrf: "Initial Church Planting",
      Bible: "Available",
      Jesus: "Available",
      Affbloc: "Sub-Saharan African Peoples",
      PplClstr: "Phase 11 Cluster",
      PplNm: `Phase 11 People ${String(index + 1).padStart(2, "0")}`,
      UpdatedDate: "2026-08-26T00:00:00.000Z",
    };
  });
}

async function installLargeCountryLanguageFixture(page: Page) {
  const records = phase11Records();
  await page.route(/https:\/\/peoplegroups\.org\/wp-json\/pg\/v1\/people-groups(?:\?.*)?$/, async (route) => {
    const url = new URL(route.request().url());
    const pageNumber = Number(url.searchParams.get("page") ?? "1");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Expose-Headers": "X-WP-Total, X-WP-TotalPages",
        "X-WP-Total": String(records.length),
        "X-WP-TotalPages": "1",
      },
      body: JSON.stringify(pageNumber === 1 ? records : []),
    });
  });
}

test.beforeEach(async ({ page }) => {
  await installLargeCountryLanguageFixture(page);
});

test("country detail progressively reveals every unreached record without silent truncation", async ({ page }) => {
  await page.goto("./#/countries/BEN");

  const section = page.locator(".country-section").filter({ has: page.locator("#unreached-people-heading") });
  const rows = section.locator(".country-people-table tbody tr");
  await expect(section.locator(".detail-record-progress")).toContainText(`Showing ${FIRST_BATCH} of ${RECORD_COUNT}`);
  await expect(rows).toHaveCount(FIRST_BATCH);
  await expect(section).toContainText("PEID and PGID as a one-to-one record identity");
  await expect(section).not.toContainText("A PEID can appear in multiple countries");

  const more = section.getByRole("button", { name: `Show ${RECORD_COUNT - FIRST_BATCH} more` });
  await expect(more).toBeVisible();
  await more.click();
  await expect(rows).toHaveCount(RECORD_COUNT);
  await expect(section.locator(".detail-record-progress")).toContainText(`Showing ${RECORD_COUNT} of ${RECORD_COUNT}`);
  await expect(section.locator(".result-load-more--detail")).toHaveCount(0);

  await expect(page.locator("main")).toHaveCount(1);
});

test("language detail uses the same progressive record contract", async ({ page }) => {
  await page.goto("./#/languages/fon");

  const section = page.locator(".language-section").filter({ has: page.locator("#language-peoples-heading") });
  const rows = section.locator(".language-table tbody tr");
  await expect(section.locator(".detail-record-progress")).toContainText(`Showing ${FIRST_BATCH} of ${RECORD_COUNT}`);
  await expect(rows).toHaveCount(FIRST_BATCH);
  await expect(section).toContainText("PEID and PGID as a one-to-one record identity");

  const more = section.getByRole("button", { name: `Show ${RECORD_COUNT - FIRST_BATCH} more` });
  await more.click();
  await expect(rows).toHaveCount(RECORD_COUNT);
  await expect(section.locator(".detail-record-progress")).toContainText(`Showing ${RECORD_COUNT} of ${RECORD_COUNT}`);
  await expect(section.locator(".result-load-more--detail")).toHaveCount(0);

  await expect(page.locator("main")).toHaveCount(1);
});

test("country and language detail tables stay within a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/countries/BEN");
  await expect(page.locator(".country-people-table tbody tr")).toHaveCount(FIRST_BATCH);
  let overflow = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(overflow.width).toBeLessThanOrEqual(overflow.client);

  await page.goto("./#/languages/fon");
  await expect(page.locator(".language-table tbody tr")).toHaveCount(FIRST_BATCH);
  overflow = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(overflow.width).toBeLessThanOrEqual(overflow.client);
});
