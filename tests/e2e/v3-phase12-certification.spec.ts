import { mkdir } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

import {
  installPeopleGroupsFixture,
  VISIBLE_TEST_PEID,
  VISIBLE_TEST_PEOPLE,
} from "./peoplegroups-fixture";

const artifactDir = "artifacts/v3-phase12";
const FON_PEID = 12319;

async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.client + 1);
}

async function installFonRouteRecord(page: Page): Promise<void> {
  await page.route("https://peoplegroups.org/wp-json/pg/v1/people-groups/PG012319", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        PEID: FON_PEID,
        PGID: "PG012319",
        NmDisp: "Fon",
        ISOalpha3: "BEN",
        Ctry: "Benin",
        Regn: "Africa",
        RegnSub: "Western Africa",
        Pop: 4580000,
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
        PeopleDesc: "Provider description for the Fon of Benin used by Phase 12 browser certification.",
        UpdatedDate: "2026-08-24T00:00:00.000Z",
      }),
    });
  });
}

async function selectBeninFromDesktopFinder(page: Page): Promise<void> {
  const search = page.locator("#desktop-country-search");
  await expect(search).toBeVisible();
  await search.fill("Benin");
  const row = page.locator(".explore-v3__country-index .country-row", { hasText: "Benin" }).first();
  await row.scrollIntoViewIfNeeded();
  await expect(row).toBeVisible();
  await row.click();
  await expect(page.locator(".explore-v3__selected").getByRole("heading", { name: "Benin" })).toBeVisible();
}

async function selectBeninFromMobileFinder(page: Page): Promise<void> {
  const sheet = page.locator(".explore-v3__mobile-sheet");
  await expect(sheet).toBeVisible();
  if ((await sheet.getAttribute("open")) === null) await sheet.locator(":scope > summary").click();
  const search = sheet.locator("#mobile-country-search");
  await search.scrollIntoViewIfNeeded();
  await expect(search).toBeVisible();
  await search.fill("Benin");
  const row = sheet.locator(".explore-v3__mobile-finder .country-row", { hasText: "Benin" }).first();
  await row.scrollIntoViewIfNeeded();
  await expect(row).toBeVisible();
  await row.click();
  await expect(sheet.getByText("Selected country", { exact: true })).toBeVisible();
  await expect(sheet.locator(":scope > summary strong")).toHaveText("Benin");
}

test.beforeAll(async () => {
  await mkdir(artifactDir, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  await installPeopleGroupsFixture(page);
});

test("3.0 core loop connects world discovery to people, prayer and memory", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("./#/", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { level: 1, name: "Explore unreached peoples." })).toBeVisible();
  await selectBeninFromDesktopFinder(page);

  const selected = page.locator(".explore-v3__selected");
  await expect(selected).toContainText("People behind the map", { timeout: 15_000 });
  const peopleLink = selected.locator(`a[href="#/peoples/${VISIBLE_TEST_PEID}"]`, { hasText: VISIBLE_TEST_PEOPLE });
  await expect(peopleLink).toBeVisible();
  await peopleLink.click();

  await expect(page.getByRole("heading", { level: 1, name: VISIBLE_TEST_PEOPLE, exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".v3-people-profile")).toHaveAttribute("data-editorial-tier", "source");
  await page.getByRole("button", { name: "Save profile" }).click();
  await page.getByRole("link", { name: /Pray with this context/ }).click();

  await expect(page.getByRole("heading", { level: 1, name: `Pray for ${VISIBLE_TEST_PEOPLE}` })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Add to private prayer list" }).click();
  await page.getByRole("button", { name: "Record prayer today" }).click();
  await expect(page.getByRole("button", { name: "Prayer noted today" })).toBeDisabled();

  await page.goto("./#/saved");
  await expect(page.getByRole("heading", { level: 1, name: "Saved" })).toBeVisible();
  await expect(page.locator('[data-memory-section="saved"]')).toContainText(VISIBLE_TEST_PEOPLE);
  await expect(page.locator('[data-memory-section="prayer-list"]')).toContainText(VISIBLE_TEST_PEOPLE);
  await expect(page.locator('[data-memory-section="prayer-memory"]')).toContainText(VISIBLE_TEST_PEOPLE);
  await assertNoHorizontalOverflow(page);
  await page.screenshot({ path: `${artifactDir}/unreached-3-core-loop.png`, fullPage: true });
});

test("reviewed editorial baseline still renders as an evidence-backed atlas article", async ({ page }) => {
  await installFonRouteRecord(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`./#/peoples/${FON_PEID}`);

  await expect(page.getByRole("heading", { level: 1, name: "Fon", exact: true })).toBeVisible();
  await expect(page.locator(".v3-people-profile")).toHaveAttribute("data-editorial-tier", "reviewed", { timeout: 15_000 });
  await expect(page.getByText("Reviewed editorial context available", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Who they are" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Gospel-access context" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pray from what is actually known." })).toBeVisible();
  await expect(page.locator(".v3-people-evidence").first()).toBeVisible();
  await assertNoHorizontalOverflow(page);
  await page.screenshot({ path: `${artifactDir}/unreached-3-reviewed-profile.png`, fullPage: true });
});

test("mobile Explore country selection follows the bottom-sheet interaction model", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/", { waitUntil: "domcontentloaded" });

  await selectBeninFromMobileFinder(page);
  const sheet = page.locator(".explore-v3__mobile-sheet");
  await expect(sheet).toHaveAttribute("open", "");
  await expect(sheet).toContainText("People behind the map", { timeout: 15_000 });
  await expect(sheet.getByRole("link", { name: "Explore country" })).toHaveAttribute("href", "#/countries/BEN");
  await assertNoHorizontalOverflow(page);
  await page.screenshot({ path: `${artifactDir}/unreached-3-mobile-explore.png`, fullPage: true });
});
