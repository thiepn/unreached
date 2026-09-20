import { mkdir } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

const artifactDir = "artifacts/v3-phase15";

const records = [
  {
    PEID: 950001, PGID: "PG950001", NmDisp: "Fon South", ISOalpha3: "BEN", Ctry: "Benin",
    Regn: "Africa", RegnSub: "Western Africa", Pop: 120000, ROL: "fon", Lang: "Fon",
    LangFamily: "Niger-Congo", ROR: "R6", Rlgn: "Traditional Religion", EvngLvl: "Less than 2%",
    GSEC: 2, Bible: "Available", Jesus: "Not Available", ResTot: 2,
    UpdatedDate: "2026-09-18T00:00:00.000Z",
  },
  {
    PEID: 950002, PGID: "PG950002", NmDisp: "Fon North", ISOalpha3: "NGA", Ctry: "Nigeria",
    Regn: "Africa", RegnSub: "Western Africa", Pop: null, ROL: "fon", Lang: "Fon",
    LangFamily: "Niger-Congo", ROR: "R6", Rlgn: "Traditional Religion", EvngLvl: "5% to 10%",
    GSEC: 5, Bible: "Unknown", Jesus: "Available", ResTot: null,
    UpdatedDate: "2026-09-19T00:00:00.000Z",
  },
  {
    PEID: 950003, PGID: "PG950003", NmDisp: "Yoruba Test", ISOalpha3: "BEN", Ctry: "Benin",
    Regn: "Africa", RegnSub: "Western Africa", Pop: 80000, ROL: "yor", Lang: "Yoruba",
    LangFamily: "Niger-Congo", ROR: "R1", Rlgn: "Christianity", EvngLvl: "5% to 10%",
    GSEC: 5, Bible: "Available", Jesus: "Available", ResTot: 4,
    UpdatedDate: "2026-09-17T00:00:00.000Z",
  },
  {
    PEID: 950004, PGID: "PG950004", NmDisp: "Ewe Test", ISOalpha3: "GHA", Ctry: "Ghana",
    Regn: "Africa", RegnSub: "Western Africa", Pop: 70000, ROL: "ewe", Lang: "Ewe",
    LangFamily: "Niger-Congo", ROR: "R1", Rlgn: "Christianity", EvngLvl: "5% to 10%",
    GSEC: 5, Bible: "Available", Jesus: "Available", ResTot: 4,
    UpdatedDate: "2026-09-16T00:00:00.000Z",
  },
  {
    PEID: 950005, PGID: "PG950005", NmDisp: "French Test", ISOalpha3: "BEN", Ctry: "Benin",
    Regn: "Africa", RegnSub: "Western Africa", Pop: 50000, ROL: "fra", Lang: "French",
    LangFamily: "Indo-European", ROR: "R1", Rlgn: "Christianity", EvngLvl: "5% to 10%",
    GSEC: 5, Bible: "Available", Jesus: "Available", ResTot: 6,
    UpdatedDate: "2026-09-15T00:00:00.000Z",
  },
] as const;

async function installFixture(page: Page): Promise<void> {
  await page.route(/https:\/\/peoplegroups\.org\/wp-json\/pg\/v1\/people-groups\/PG[0-9]+$/, async (route) => {
    const pgid = route.request().url().split("/").pop()?.toUpperCase();
    const record = records.find((item) => item.PGID === pgid);
    await route.fulfill({
      status: record ? 200 : 404,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(record ?? { message: "Not found" }),
    });
  });

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

test.beforeAll(async () => {
  await mkdir(artifactDir, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  await installFixture(page);
});

test("language intelligence preserves mixed and partial source evidence", async ({ page }) => {
  await page.goto("./#/languages/fon");

  const panel = page.locator('[data-phase15-language-intelligence="true"]');
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("heading", { name: "Read the evidence behind the resource labels." })).toBeVisible();
  await expect(panel.getByText("Source evidence, not a translation-status database.", { exact: true })).toBeVisible();

  const bible = panel.locator(".language-intelligence-summary-grid article").filter({ hasText: "Bible availability reporting" });
  await expect(bible).toContainText("All 2 contexts report a value · mixed reported labels");
  await expect(bible).toContainText("Available (1)");
  await expect(bible).toContainText("Unknown (1)");

  const resources = panel.locator(".language-intelligence-summary-grid article").filter({ hasText: "Resource-count reporting" });
  await expect(resources).toContainText("1/2 contexts report a value · uniform reported label");
  await expect(resources).toContainText("2 (1)");

  const family = panel.locator(".language-intelligence-summary-grid article").filter({ hasText: "Language-family reporting" });
  await expect(family).toContainText("All 2 contexts report a value · uniform reported label");
  await expect(family).toContainText("Niger-Congo (2)");

  await panel.screenshot({ path: `${artifactDir}/fon-intelligence.png` });
});

test("family and same-country relationships remain distinct", async ({ page }) => {
  await page.goto("./#/languages/fon");
  const panel = page.locator('[data-phase15-language-intelligence="true"]');

  const family = panel.locator('[aria-labelledby="family-context-heading"]');
  await expect(family.getByRole("link", { name: /Yoruba/ })).toBeVisible();
  await expect(family.getByRole("link", { name: /Ewe/ })).toBeVisible();
  await expect(family.getByRole("link", { name: /French/ })).toHaveCount(0);
  await expect(family).toContainText("does not establish mutual intelligibility");

  const countries = panel.locator('[aria-labelledby="country-language-context-heading"]');
  await expect(countries.getByRole("link", { name: /Yoruba/ })).toBeVisible();
  await expect(countries.getByRole("link", { name: /French/ })).toBeVisible();
  await expect(countries.getByRole("link", { name: /Ewe/ })).toHaveCount(0);
  await expect(countries).toContainText("does not mean the people represented here are bilingual");
});

test("PGID evidence exposes the exact source records behind language resource claims", async ({ page }) => {
  await page.goto("./#/languages/fon");
  const panel = page.locator('[data-phase15-language-intelligence="true"]');
  const details = panel.locator(".language-intelligence-evidence");
  await details.locator(":scope > summary").click();

  const rows = details.locator("tbody tr");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText("PG950001");
  await expect(rows.nth(0)).toContainText("Available");
  await expect(rows.nth(0)).toContainText("Not Available");
  await expect(rows.nth(0)).toContainText("2");
  await expect(rows.nth(1)).toContainText("PG950002");
  await expect(rows.nth(1)).toContainText("Unknown");
  await expect(rows.nth(1)).toContainText("Not reported");

  const combinations = panel.locator(".language-intelligence-combinations li");
  await expect(combinations).toHaveCount(2);
});

test("Phase 15 intelligence stays readable on a narrow mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/languages/fon");
  const panel = page.locator('[data-phase15-language-intelligence="true"]');
  await expect(panel).toBeVisible();

  const overflow = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(overflow.width).toBeLessThanOrEqual(overflow.client + 1);

  await panel.screenshot({ path: `${artifactDir}/fon-intelligence-mobile.png` });
});
