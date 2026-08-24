import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  const record = {
    PEID: 12319,
    PGID: "PG012319",
    NmDisp: "Fon",
    NmAlt: null,
    ISOalpha3: "BEN",
    Ctry: "Benin",
    Regn: "Africa",
    RegnSub: "Western Africa",
    Pop: 2000000,
    Latitude: 7.5,
    Longitude: 2.1,
    ROL: "fon",
    Lang: "Fon",
    LangFamily: "Niger-Congo",
    ROR: "R2",
    Rlgn: "Protestantism",
    RlgnDiv: "Protestant",
    EvngLvl: "Less than 2%",
    CongExst: "Unknown",
    Plnting: "Unknown",
    EngStat: "Engaged",
    GSEC: 1,
    GSECbrf: "No Active Church Planting",
    GSEClng: "Synthetic browser fixture matching the certified source identity only.",
    SPI: null,
    SPIdesc: null,
    LPI: null,
    LPIname: null,
    LPIdesc: null,
    Affbloc: "Sub-Saharan African Peoples",
    PplClstr: "Guinean",
    PplNm: "Fon",
    Ethne: "Fon",
    Bible: "Available",
    Jesus: "Available",
    ResTot: 2,
    PeopleDesc: null,
    LocationDesc: null,
    UpdatedDate: "2026-08-24T00:00:00.000Z"
  };

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
      body: JSON.stringify(pageNumber === 1 ? [record] : [])
    });
  });
});

test("v1.3 manifest loads the reviewed Fon shard only onto its verified PEID route", async ({ page }) => {
  await page.goto("./#/peoples/12319", { waitUntil: "domcontentloaded" });

  const editorial = page.locator(".context-editorial");
  await expect(editorial).toBeVisible({ timeout: 15_000 });
  await expect(editorial.getByText("Reviewed editorial context", { exact: true })).toBeVisible();
  await expect(editorial.getByText(/PeopleGroups PEID 12319/)).toBeVisible();
  await expect(editorial.getByText(/PG012319/)).toBeVisible();
  await expect(editorial.getByRole("heading", { name: "Who are they?" })).toBeVisible();
  await expect(editorial.getByRole("heading", { name: "Why are they unreached?" })).toBeVisible();
  await expect(editorial.getByText(/does not infer spiritual resistance/i)).toBeVisible();
  await expect(editorial.getByText(/Review by Feb 24, 2027/).first()).toBeVisible();

  await page.goto("./#/peoples/999999", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".context-editorial")).toHaveCount(0);
  await expect(page.getByText(/Reviewed context not yet published for this source record/i)).toBeVisible();
});
