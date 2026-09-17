import { mkdir } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

const artifactDir = "artifacts/v3-phase13";
const HUI_PEID = 7206;
const HUI_PGID = "PG007206";
const JOSHUA_URL = "https://unreached-private-continuity.thiepn.workers.dev/unreached-sources/joshua-project/people/12140CH";

async function installHuiPeopleGroupsRecord(page: Page): Promise<void> {
  await page.route(`https://peoplegroups.org/wp-json/pg/v1/people-groups/${HUI_PGID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        PEID: HUI_PEID,
        PGID: HUI_PGID,
        NmDisp: "Hui",
        ISOalpha3: "CHN",
        Ctry: "China",
        Regn: "Asia",
        RegnSub: "Eastern Asia",
        Pop: 13800000,
        Latitude: 35.8,
        Longitude: 104.1,
        ROL: "cmn",
        Lang: "Mandarin Chinese",
        ROR: "R6",
        Rlgn: "Islam",
        RlgnDiv: "Sunni",
        EvngLvl: "Less than 2%",
        CongExst: "Yes",
        Plnting: "No Active CP Activity",
        EngStat: "Engaged",
        GSEC: 1,
        GSECbrf: "Less than 2% Evangelical, No Active CP Activity",
        GSEClng: "Less than 2% evangelical with no active church planting activity.",
        Affbloc: "East Asian Peoples",
        PplClstr: "Hui",
        PplNm: "Hui",
        Ethne: "Hui",
        Bible: "Available",
        Jesus: "Available",
        ResTot: 4,
        PeopleDesc: "Provider description used only by Phase 13 browser certification.",
        UpdatedDate: "2026-09-16T00:00:00.000Z",
      }),
    });
  });
}

function joshuaPayload(leastReached: boolean) {
  return {
    source: "joshua-project-api",
    peopleId3: 12140,
    rog3: "CH",
    peopleId3Rog3: "12140CH",
    peopleName: "Hui",
    countryName: "China",
    percentAdherents: 0.6,
    percentEvangelical: 0.1,
    jpScale: 1,
    leastReached,
    frontier: true,
    retrievedAt: "2026-09-17T19:30:00.000Z",
    sourceProfileUrl: "https://joshuaproject.net/people_groups/12140/CH",
  };
}

test.beforeAll(async () => {
  await mkdir(artifactDir, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  await installHuiPeopleGroupsRecord(page);
});

test("Joshua Project comparison is opt-in, attributed and keeps source methodologies separate", async ({ page }) => {
  let requests = 0;
  await page.route(JOSHUA_URL, async (route) => {
    requests += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" },
      body: JSON.stringify(joshuaPayload(true)),
    });
  });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`./#/peoples/${HUI_PEID}`);

  const panel = page.locator('[data-phase13-multi-source="true"]');
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("heading", { name: "Compare source methodologies" })).toBeVisible();
  await expect(panel.getByText("A manually reviewed cross-source identity link is available.", { exact: true })).toBeVisible();
  expect(requests).toBe(0);

  await panel.getByRole("button", { name: "Compare mission sources" }).click();
  await expect(panel.locator('[data-comparison-state="agreement"]')).toBeVisible();
  await expect(panel.getByText("Sources currently agree", { exact: true })).toBeVisible();
  await expect(panel.getByText("PeopleGroups.org / IMB", { exact: true })).toBeVisible();
  await expect(panel.getByText("Joshua Project", { exact: true })).toBeVisible();
  await expect(panel.getByText("Christian adherents", { exact: true })).toBeVisible();
  await expect(panel.getByText("0.6%", { exact: true })).toBeVisible();
  await expect(panel.getByRole("link", { name: "Data provided by Joshua Project" })).toHaveAttribute("href", "https://joshuaproject.net/people_groups/12140/CH");
  expect(requests).toBe(1);

  await page.screenshot({ path: `${artifactDir}/hui-source-agreement.png`, fullPage: true });
});

test("source disagreement stays visible instead of being reconciled into one verdict", async ({ page }) => {
  await page.route(JOSHUA_URL, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" },
      body: JSON.stringify(joshuaPayload(false)),
    });
  });

  await page.goto(`./#/peoples/${HUI_PEID}`);
  const panel = page.locator('[data-phase13-multi-source="true"]');
  await panel.getByRole("button", { name: "Compare mission sources" }).click();

  await expect(panel.locator('[data-comparison-state="disagreement"]')).toBeVisible();
  await expect(panel.getByText("Sources currently differ", { exact: true })).toBeVisible();
  await expect(panel.getByText(/preserves both assertions instead of choosing a winner/)).toBeVisible();
  await expect(panel.getByText("Unreached", { exact: true }).first()).toBeVisible();
  await expect(panel.getByText("Does not meet this source's unreached rule", { exact: true })).toBeVisible();
});

test("an unconfigured Worker fails visibly without replacing the canonical profile", async ({ page }) => {
  await page.route(JOSHUA_URL, async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" },
      body: JSON.stringify({ error: "Joshua Project comparison is not configured on this deployment." }),
    });
  });

  await page.goto(`./#/peoples/${HUI_PEID}`);
  const panel = page.locator('[data-phase13-multi-source="true"]');
  await panel.getByRole("button", { name: "Compare mission sources" }).click();

  await expect(panel.getByText("Secondary source unavailable.", { exact: true })).toBeVisible();
  await expect(panel.getByText("Joshua Project comparison is not configured on this deployment.", { exact: true })).toBeVisible();
  await expect(panel.getByRole("button", { name: /Retry comparison/ })).toBeVisible();
  await expect(panel.locator("[data-comparison-state]")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1, name: "Hui", exact: true })).toBeVisible();
});

test("a mismatched secondary identity is rejected instead of being compared", async ({ page }) => {
  await page.route(JOSHUA_URL, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" },
      body: JSON.stringify({
        ...joshuaPayload(true),
        peopleId3: 15755,
        peopleId3Rog3: "15755CH",
        peopleName: "Uyghur",
        sourceProfileUrl: "https://joshuaproject.net/people_groups/15755/CH",
      }),
    });
  });

  await page.goto(`./#/peoples/${HUI_PEID}`);
  const panel = page.locator('[data-phase13-multi-source="true"]');
  await panel.getByRole("button", { name: "Compare mission sources" }).click();

  await expect(panel.getByText("Secondary source unavailable.", { exact: true })).toBeVisible();
  await expect(panel.getByText("The secondary source record did not match the reviewed cross-source identity link.", { exact: true })).toBeVisible();
  await expect(panel.locator("[data-comparison-state]")).toHaveCount(0);
  await expect(panel.getByRole("link", { name: "Data provided by Joshua Project" })).toHaveCount(0);
});

test("Phase 13 comparison remains readable on mobile", async ({ page }) => {
  await page.route(JOSHUA_URL, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(joshuaPayload(true)) });
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`./#/peoples/${HUI_PEID}`);
  const panel = page.locator('[data-phase13-multi-source="true"]');
  await panel.getByRole("button", { name: "Compare mission sources" }).click();
  await expect(panel.locator('[data-comparison-state="agreement"]')).toBeVisible();

  const dimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.client + 1);
  await page.screenshot({ path: `${artifactDir}/hui-source-agreement-mobile.png`, fullPage: true });
});