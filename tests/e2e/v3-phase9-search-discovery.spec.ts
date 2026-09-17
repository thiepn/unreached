import { mkdir } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

import {
  installPeopleGroupsFixture,
  PEOPLE_GROUPS_TEST_RECORDS,
  VISIBLE_TEST_PEID,
  VISIBLE_TEST_PEOPLE,
} from "./peoplegroups-fixture";

const artifactDir = "artifacts/v3-phase9";
const FON_PEID = 12319;

const FON_RECORD = {
  PEID: FON_PEID,
  PGID: "PG012319",
  NmDisp: "Fon",
  ISOalpha3: "BEN",
  Ctry: "Benin",
  Regn: "Africa",
  RegnSub: "Western Africa",
  Pop: 4580000,
  Latitude: 7.2,
  Longitude: 2.1,
  ROL: "fon",
  Lang: "Fon",
  LangFamily: "Niger-Congo",
  ROR: "R4",
  Rlgn: "Protestantism",
  EvngLvl: "Less than 2%",
  CongExst: "Yes",
  Plnting: "No Active CP Activity",
  EngStat: "Engaged",
  GSEC: 1,
  GSECbrf: "Less than 2% Evangelical, No Active CP Activity",
  GSEClng: "Less than 2% evangelical with no active church planting activity.",
  Affbloc: "Sub-Saharan African Peoples",
  PplClstr: "Guinean",
  PplNm: "Fon",
  Ethne: "Fon",
  Bible: "Available",
  Jesus: "Available",
  ResTot: 3,
  PeopleDesc: "Provider description for the Fon of Benin used by Phase 9 browser certification.",
  UpdatedDate: "2026-08-24T00:00:00.000Z",
} as const;

async function installReviewedFonCatalog(page: Page): Promise<void> {
  await page.route("https://peoplegroups.org/wp-json/pg/v1/people-groups/PG012319", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(FON_RECORD),
    });
  });

  await page.route(/https:\/\/peoplegroups\.org\/wp-json\/pg\/v1\/people-groups(?:\?.*)?$/, async (route) => {
    const url = new URL(route.request().url());
    const pageNumber = Number(url.searchParams.get("page") ?? "1");
    const body = pageNumber === 1 ? [...PEOPLE_GROUPS_TEST_RECORDS, FON_RECORD] : [];
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Expose-Headers": "X-WP-Total, X-WP-TotalPages",
        "X-WP-Total": String(body.length),
        "X-WP-TotalPages": "1",
      },
      body: JSON.stringify(body),
    });
  });
}

async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.client + 1);
}

test.beforeAll(async () => {
  await mkdir(artifactDir, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  await installPeopleGroupsFixture(page);
});

test("full search unifies people, region, country and language destinations", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("./#/search");
  await expect(page.getByRole("heading", { level: 1, name: "Find a people or place." })).toBeVisible();

  const input = page.getByRole("searchbox", { name: "Search the atlas" });

  await input.fill(String(VISIBLE_TEST_PEID));
  const peopleLink = page.getByRole("link", { name: new RegExp(VISIBLE_TEST_PEOPLE) }).first();
  await expect(peopleLink).toHaveAttribute("href", `#/peoples/${VISIBLE_TEST_PEID}`);
  await expect(peopleLink.getByText("Source profile", { exact: true })).toBeVisible();

  await input.fill("Africa");
  await expect(page.getByRole("link", { name: /Africa.*Region/i }).first()).toHaveAttribute("href", "#/regions/africa");

  await input.fill("Benin");
  await expect(page.getByRole("link", { name: /Benin.*Country/i }).first()).toHaveAttribute("href", "#/countries/BEN");

  await input.fill("Fon");
  await expect(page.getByRole("link", { name: /Fon.*Language/i }).first()).toHaveAttribute("href", "#/languages/fon");

  await page.screenshot({ path: `${artifactDir}/search-desktop.png`, fullPage: true });
});

test("search distinguishes reviewed depth without turning it into priority", async ({ page }) => {
  await installReviewedFonCatalog(page);
  await page.goto("./#/search?q=Fon");

  const fonProfile = page.locator('a.v3-search-result[href="#/peoples/12319"]');
  await expect(fonProfile).toBeVisible({ timeout: 15_000 });
  await expect(fonProfile.getByText("Reviewed context", { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/does not indicate that a people group is more important, more urgent or more worthy of prayer/i)).toBeVisible();
});

test("Peoples opens with guided collections and keeps refinements optional", async ({ page }) => {
  await installReviewedFonCatalog(page);
  await page.goto("./#/peoples");

  await expect(page.getByRole("heading", { level: 1, name: "Find a people group." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Begin with a path, not a filter wall." })).toBeVisible({ timeout: 15_000 });

  const refine = page.locator(".v3-discovery-refine");
  await expect(refine).not.toHaveAttribute("open", "");

  const reviewed = page.locator('[data-collection-id="reviewed-context"]');
  await expect(reviewed.getByRole("heading", { name: "Reviewed context" })).toBeVisible();
  await expect(reviewed.getByRole("link", { name: /Fon/ })).toHaveAttribute("href", `#/peoples/${FON_PEID}`);
  await expect(reviewed).toContainText("not a ranking of mission importance or urgency");

  const acrossRegions = page.locator('[data-collection-id="across-regions"]');
  await expect(acrossRegions).toContainText("not scored or ranked");
  await expect(page.locator('[data-collection-id="language-pathways"]')).toBeVisible();

  await page.screenshot({ path: `${artifactDir}/peoples-guided-desktop.png`, fullPage: true });
});

test("quick search includes regions and hands off to full Search", async ({ page }) => {
  await page.goto("./#/");
  await page.getByRole("button", { name: "Search people, countries and languages" }).click();
  const dialog = page.getByRole("dialog", { name: "Search Unreached" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("searchbox").fill("Africa");
  await expect(dialog.getByRole("link", { name: /Africa/ }).first()).toHaveAttribute("href", "#/regions/africa");
  await expect(dialog.getByRole("link", { name: /Full search/ })).toHaveAttribute("href", "#/search?q=Africa");
});

test("direct people search keeps the definitive profile URL", async ({ page }) => {
  await page.goto(`./#/search?q=${VISIBLE_TEST_PEID}`);
  const result = page.locator(`a.v3-search-result[href="#/peoples/${VISIBLE_TEST_PEID}"]`);
  await expect(result).toBeVisible({ timeout: 15_000 });
  await result.click();
  await expect(page).toHaveURL(new RegExp(`#\/peoples\/${VISIBLE_TEST_PEID}$`));
  await expect(page.locator(".v3-people-profile")).toBeVisible();
});

test("Search and Peoples stay within the mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("./#/search?q=Benin");
  await expect(page.getByRole("heading", { level: 1, name: "Find a people or place." })).toBeVisible();
  await expect(page.getByText(/result.*for “Benin”/i)).toBeVisible({ timeout: 15_000 });
  await assertNoHorizontalOverflow(page);
  await page.screenshot({ path: `${artifactDir}/search-mobile.png`, fullPage: true });

  await page.goto("./#/peoples");
  await expect(page.getByRole("heading", { level: 1, name: "Find a people group." })).toBeVisible();
  await expect(page.locator('[data-collection-id="language-pathways"]')).toBeVisible({ timeout: 15_000 });
  await assertNoHorizontalOverflow(page);
  await page.screenshot({ path: `${artifactDir}/peoples-mobile.png`, fullPage: true });
});
