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
  GSECbrf: "Less than 2% Evangelical, No Active CP Activity",
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

test("v1.6 migrates v1 local personalization without losing saved or recent data", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("unreached.personal.v1", JSON.stringify({
      version: 1,
      savedPeoples: [{
        sourcePeopleId: 12319,
        peopleGroupId: "people-entity:peoplegroups:12319",
        name: "Fon",
        largestCountryName: "Benin",
        primaryLanguageName: "Fon",
        classification: "unreached-only",
        frontier: null,
        savedAt: "2026-08-24T18:00:00.000Z"
      }],
      recent: [{
        kind: "people",
        key: "12319",
        label: "Fon",
        secondary: "Benin",
        href: "#/peoples/12319",
        visitedAt: "2026-08-24T18:05:00.000Z"
      }]
    }));
  });

  await page.goto("./#/saved", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Saved & prayer" })).toBeVisible();
  await expect(page.locator(".saved-person-card").getByText("Fon", { exact: true })).toBeVisible();
  await expect(page.locator(".recent-list").getByText("Fon", { exact: true })).toBeVisible();
  await expect(page.getByText("Your private prayer list is empty.")).toBeVisible();
});

test("v1.6 can add a live prayer subject to the private list and persist v2 locally", async ({ page }) => {
  await page.goto("./#/pray", { waitUntil: "domcontentloaded" });

  const libraryCard = page.locator(".prayer-card-grid .prayer-card").filter({ hasText: "Fon" }).first();
  await expect(libraryCard).toBeVisible({ timeout: 15_000 });
  await libraryCard.getByRole("button", { name: "Add Fon to private prayer list" }).click();
  await expect(libraryCard.getByRole("button", { name: "Remove Fon from private prayer list" })).toBeVisible();

  await page.goto("./#/saved", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-prayer-list-peid="12319"]')).toBeVisible();
  await expect(page.locator('[data-prayer-list-peid="12319"]')).toContainText("No prayer date recorded");

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("unreached.personal.v2") ?? "null"));
  expect(stored.version).toBe(2);
  expect(stored.prayerList).toHaveLength(1);
  expect(stored.prayerList[0].sourcePeopleId).toBe(12319);
  expect(stored.prayerList[0].lastPrayedAt).toBeNull();
  expect(stored.prayerList[0].prayerCount).toBeUndefined();
  expect(stored.prayerList[0].streak).toBeUndefined();
});

test("v1.6 daily prayer prefers an eligible person already in the private list", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("unreached.personal.v2", JSON.stringify({
      version: 2,
      savedPeoples: [],
      prayerList: [{
        sourcePeopleId: 12319,
        peopleGroupId: "people-entity:peoplegroups:12319",
        name: "Fon",
        countryName: "Benin",
        languageName: "Fon",
        addedAt: "2026-08-24T18:00:00.000Z",
        lastPrayedAt: null
      }],
      recent: []
    }));
  });

  await page.goto("./#/pray", { waitUntil: "domcontentloaded" });
  const daily = page.locator(".prayer-daily");
  await expect(daily.getByText(/private prayer (list|rotation)/i)).toBeVisible({ timeout: 15_000 });
  await expect(daily.getByRole("heading", { name: "Fon" })).toBeVisible();
});

test("v1.6 focused prayer records only the latest local prayer timestamp", async ({ page }) => {
  await page.goto("./#/pray/12319", { waitUntil: "domcontentloaded" });

  const record = page.getByRole("button", { name: "Record prayer today" });
  await expect(record).toBeVisible({ timeout: 15_000 });
  await record.click();
  await expect(page.getByRole("button", { name: "Prayer noted today" })).toBeDisabled();

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("unreached.personal.v2") ?? "null"));
  expect(stored.prayerList).toHaveLength(1);
  expect(stored.prayerList[0].sourcePeopleId).toBe(12319);
  expect(Date.parse(stored.prayerList[0].lastPrayedAt)).not.toBeNaN();
  expect(stored.prayerList[0].prayerCount).toBeUndefined();
  expect(stored.prayerList[0].totalPrayers).toBeUndefined();
  expect(stored.prayerList[0].prayerStreak).toBeUndefined();
});
