import { mkdir } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

import { installPeopleGroupsFixture, RELATED_TEST_PEID, VISIBLE_TEST_PEID, VISIBLE_TEST_PEOPLE } from "./peoplegroups-fixture";

const artifactDir = "artifacts/v3-phase8";
const FON_PEID = 12319;

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
        PeopleDesc: "Provider description for the Fon of Benin used by Phase 8 browser certification.",
        UpdatedDate: "2026-08-24T00:00:00.000Z",
      }),
    });
  });
}

test.beforeAll(async () => {
  await mkdir(artifactDir, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  await installPeopleGroupsFixture(page);
});

test("source-only people profile labels its editorial depth instead of inventing narrative", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`./#/peoples/${VISIBLE_TEST_PEID}`);

  const profile = page.locator(".v3-people-profile");
  await expect(profile).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: VISIBLE_TEST_PEOPLE, exact: true })).toBeVisible();
  await expect(profile).toHaveAttribute("data-editorial-tier", "source", { timeout: 15_000 });
  await expect(page.getByText("Source context only", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Reviewed editorial context is not yet published for this record.", { exact: true })).toBeVisible();
  await expect(page.locator(".v3-people-article__section")).toHaveCount(0);
  await expect(page.locator(".context-editorial")).toHaveCount(0);

  const hero = page.locator(".v3-people-hero");
  await expect(hero.getByText(/PEID|PGID|GSEC/)).toHaveCount(0);
  await page.screenshot({ path: `${artifactDir}/source-profile.png`, fullPage: true });
});

test("reviewed profile becomes one cohesive atlas article with evidence and prayer context", async ({ page }) => {
  await installFonRouteRecord(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`./#/peoples/${FON_PEID}`);

  const profile = page.locator(".v3-people-profile");
  await expect(page.getByRole("heading", { level: 1, name: "Fon", exact: true })).toBeVisible();
  await expect(profile).toHaveAttribute("data-editorial-tier", "reviewed", { timeout: 15_000 });
  await expect(page.getByText("Reviewed editorial context available", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Context before conclusions." })).toBeVisible();
  await expect(page.locator(".v3-people-editorial__deck")).toContainText("The Fon of Benin are an ethnolinguistic community");
  await expect(page.getByRole("heading", { name: "Who they are" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Gospel-access context" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pray from what is actually known." })).toBeVisible();
  await expect(page.getByText(/faithful, humble and loving Christian witness among Fon/)).toBeVisible();
  await expect(page.getByText(/Colossians 4:5–6/)).toBeVisible();
  await expect(page.locator(".context-editorial")).toHaveCount(0);

  const evidence = page.locator(".v3-people-evidence").first();
  await evidence.locator(":scope > summary").click();
  await expect(evidence.getByText(/UNESCO describes the Royal Palaces of Abomey/)).toBeVisible();
  await expect(evidence.getByRole("link", { name: "Royal Palaces of Abomey" })).toBeVisible();

  await page.screenshot({ path: `${artifactDir}/reviewed-fon-profile.png`, fullPage: true });
});

test("profile preserves World to Region to Country to People continuity", async ({ page }) => {
  await page.goto(`./#/peoples/${VISIBLE_TEST_PEID}`);
  const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(breadcrumb.getByRole("link", { name: "World" })).toHaveAttribute("href", "#/regions");
  await expect(breadcrumb.getByRole("link", { name: "Africa" })).toHaveAttribute("href", "#/regions/africa");
  await expect(breadcrumb.getByRole("link", { name: "Benin" })).toHaveAttribute("href", "#/countries/BEN");
  await expect(breadcrumb).toContainText(VISIBLE_TEST_PEOPLE);
});

test("mission classification remains understandable and technical detail stays opt in", async ({ page }) => {
  await page.goto(`./#/peoples/${VISIBLE_TEST_PEID}`);
  await expect(page.getByRole("heading", { name: "Why is this people group marked unreached?" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Understand the source context" })).toBeVisible();
  await expect(page.getByText("Less than 2%", { exact: true }).first()).toBeVisible();

  const details = page.locator(".v3-people-research-disclosure");
  await expect(details).not.toHaveAttribute("open", "");
  await expect(details.getByText(`PEID ${VISIBLE_TEST_PEID} · PGID PG910001 · BEN`, { exact: true })).toBeHidden();
  await details.locator(":scope > summary").click();
  await expect(details.getByText(`PEID ${VISIBLE_TEST_PEID} · PGID PG910001 · BEN`, { exact: true })).toBeVisible();
  await expect(details.getByText("2 · Initial Church Planting", { exact: true })).toBeVisible();
});

test("prayer eligibility and source-only fallback remain truthful", async ({ page }) => {
  await page.goto(`./#/peoples/${RELATED_TEST_PEID}`);
  await expect(page.locator(".v3-people-profile")).toHaveAttribute("data-editorial-tier", "source", { timeout: 15_000 });
  await expect(page.getByRole("link", { name: /Pray for this people/ })).toHaveCount(0);
  await expect(page.getByText("Prayer guide not available", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save profile" })).toBeVisible();
});

test("definitive profile remains readable without horizontal overflow on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`./#/peoples/${VISIBLE_TEST_PEID}`);
  await expect(page.getByRole("heading", { level: 1, name: VISIBLE_TEST_PEOPLE, exact: true })).toBeVisible();
  await expect(page.locator(".v3-people-profile")).toHaveAttribute("data-editorial-tier", "source", { timeout: 15_000 });

  const dimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.client + 1);
  await expect(page.getByRole("link", { name: /Pray with this context/ })).toBeVisible();
  await page.screenshot({ path: `${artifactDir}/mobile-source-profile.png`, fullPage: true });
});
