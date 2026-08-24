import { expect, test } from "@playwright/test";

const kazakhRecord = {
  PEID: 24277,
  PGID: "PG024277",
  NmDisp: "Kazakh",
  NmAlt: null,
  ISOalpha3: "KAZ",
  Ctry: "Kazakhstan",
  Regn: "Asia",
  RegnSub: "Central Asia",
  Pop: 12390000,
  Latitude: 48,
  Longitude: 68,
  ROL: "kaz",
  Lang: "Kazakh",
  LangFamily: "Turkic",
  ROR: "R2",
  Rlgn: "Islam - Sunni",
  RlgnDiv: "Islam",
  EvngLvl: "Less than 2%",
  CongExst: "Unknown",
  Plnting: "Unknown",
  EngStat: "Engaged",
  GSEC: 2,
  GSECbrf: "Less than 2% Evangelical, Dispersed CP Activity",
  GSEClng: "Synthetic browser fixture matching the certified source identity only.",
  SPI: null,
  SPIdesc: null,
  LPI: null,
  LPIname: null,
  LPIdesc: null,
  Affbloc: "Central Asian Peoples",
  PplClstr: "Kazakh",
  PplNm: "Kazakh",
  Ethne: "Kazakh",
  Bible: "Available",
  Jesus: "Available",
  ResTot: 2,
  PeopleDesc: null,
  LocationDesc: null,
  UpdatedDate: "2026-08-24T00:00:00.000Z"
};

test.beforeEach(async ({ page }) => {
  await page.route(/https:\/\/peoplegroups\.org\/wp-json\/pg\/v1\/people-groups(?:\?.*)?$/, async (route) => {
    const url = new URL(route.request().url());
    const pageNumber = Number(url.searchParams.get("page") ?? "1");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Expose-Headers": "X-WP-Total, X-WP-TotalPages",
        "X-WP-Total": "1",
        "X-WP-TotalPages": "1"
      },
      body: JSON.stringify(pageNumber === 1 ? [kazakhRecord] : [])
    });
  });
});

test("v1.5 publishes twelve reviewed profiles across seven explicit editorial regions", async ({ page }) => {
  let peoplegroupsRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("peoplegroups.org/wp-json/pg/v1/people-groups")) peoplegroupsRequests += 1;
  });

  await page.goto("./#/coverage", { waitUntil: "domcontentloaded" });

  await expect(page.locator("[data-editorial-coverage-grid] [data-editorial-peid]")).toHaveCount(12);
  await expect(page.getByText("12 reviewed profiles does not mean these groups are more important, more urgent, or more unreached than groups without an article.")).toBeVisible();
  await expect(page.getByText("7", { exact: true }).nth(0)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Broader, still intentionally partial." })).toBeVisible();
  await expect(page.getByText(/not a quota, a ranking, or evidence/i)).toBeVisible();
  expect(peoplegroupsRequests).toBe(0);
});

test("v1.5 regional navigation exposes editorial gaps without changing mission ranking", async ({ page }) => {
  await page.goto("./#/coverage", { waitUntil: "domcontentloaded" });

  await page.getByRole("button", { name: /Central Asia 2/ }).click();
  await expect(page.locator("[data-editorial-coverage-grid] [data-editorial-peid]")).toHaveCount(2);
  await expect(page.locator('[data-editorial-peid="24277"]')).toBeVisible();
  await expect(page.locator('[data-editorial-peid="24529"]')).toBeVisible();
  await expect(page.getByText("Showing 2 of 12 reviewed profiles · Central Asia")).toBeVisible();

  await page.getByLabel("Region").selectOption("Southeast Asia");
  await expect(page.locator("[data-editorial-coverage-grid] [data-editorial-peid]")).toHaveCount(2);
  await expect(page.locator('[data-editorial-peid="22052"]')).toBeVisible();
  await expect(page.locator('[data-editorial-peid="46650"]')).toBeVisible();
});

test("v1.5 newly reviewed profile is available on its canonical people route", async ({ page }) => {
  await page.goto("./#/peoples/24277", { waitUntil: "domcontentloaded" });

  const editorial = page.locator(".context-editorial");
  await expect(editorial).toBeVisible({ timeout: 15_000 });
  await expect(editorial.getByText("Reviewed editorial context", { exact: true })).toBeVisible();
  await expect(editorial.locator(".context-identity-note > span")).toContainText("PG024277");
  await expect(editorial.getByText(/UNESCO recognizes yurt-making knowledge/i)).toBeVisible();
  await expect(editorial.getByText(/culture or Islam is not treated as an inherent cause/i)).toBeVisible();
});
