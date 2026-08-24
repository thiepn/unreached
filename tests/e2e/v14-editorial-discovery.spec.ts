import { expect, test } from "@playwright/test";

const fonRecord = {
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
      body: JSON.stringify(pageNumber === 1 ? [fonRecord] : [])
    });
  });
});

test("v1.4 reviewed coverage is a first-class local discovery surface", async ({ page }) => {
  let peoplegroupsRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("peoplegroups.org/wp-json/pg/v1/people-groups")) peoplegroupsRequests += 1;
  });

  await page.goto("./#/coverage", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "Browse the profiles with deeper context." })).toBeVisible();
  await expect(page.getByText("Coverage is an editorial-publication measure.")).toBeVisible();
  await expect(page.locator("[data-editorial-coverage-grid] [data-editorial-peid]")).toHaveCount(6);
  await expect(page.getByText("6 reviewed profiles does not mean these groups are more important, more urgent, or more unreached than groups without an article.")).toBeVisible();
  expect(peoplegroupsRequests).toBe(0);

  await page.getByPlaceholder("Search name, country, language, PEID or PGID").fill("Hui");
  await expect(page.locator("[data-editorial-coverage-grid] [data-editorial-peid]")).toHaveCount(1);
  await expect(page.locator('[data-editorial-peid="7206"]')).toBeVisible();
});

test("v1.4 people discovery can explicitly filter to reviewed context without changing default ranking", async ({ page }) => {
  await page.goto("./#/peoples", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("link", { name: /Browse reviewed context/i })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Reviewed context", { exact: true })).toBeVisible();

  await page.locator(".people-filter-panel").evaluate((element: HTMLDetailsElement) => { element.open = true; });
  await page.getByLabel("Reviewed context only").check();
  await expect(page.getByText(/reviewed editorial coverage only/i)).toBeVisible();
  await expect(page.locator(".people-card")).toHaveCount(1);
  await expect(page.locator(".people-card").getByText("Fon", { exact: true })).toBeVisible();
});

test("v1.4 country pages expose reviewed articles for that country", async ({ page }) => {
  await page.goto("./#/countries/BEN", { waitUntil: "domcontentloaded" });

  const coverage = page.locator(".country-editorial-coverage");
  await expect(coverage).toBeVisible({ timeout: 15_000 });
  await expect(coverage.getByRole("heading", { name: "Deeper context published for Benin" })).toBeVisible();
  await expect(coverage.getByRole("link", { name: /Fon/ })).toHaveAttribute("href", "#/peoples/12319");
  await expect(coverage.getByText(/publication coverage, not a ranking of mission importance/i)).toBeVisible();
});

test("v1.4 reviewed articles provide previous, next and all-coverage navigation", async ({ page }) => {
  await page.goto("./#/peoples/12319", { waitUntil: "domcontentloaded" });

  const navigation = page.locator(".context-coverage-nav");
  await expect(navigation).toBeVisible({ timeout: 15_000 });
  await expect(navigation.getByRole("link", { name: /Reviewed profile 2 of 6/ })).toHaveAttribute("href", "#/coverage");
  await expect(navigation.getByRole("link", { name: /Bengali Sunni Muslims/ })).toHaveAttribute("href", "#/peoples/1156");
  await expect(navigation.getByRole("link", { name: /Hui/ })).toHaveAttribute("href", "#/peoples/7206");
});
