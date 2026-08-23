import { expect, test } from "@playwright/test";

import { VISIBLE_TEST_PEID, VISIBLE_TEST_PEOPLE } from "./peoplegroups-fixture";

const records = [{
  PEID: VISIBLE_TEST_PEID, PGID: "PG910001", NmDisp: VISIBLE_TEST_PEOPLE, ISOalpha3: "BEN", Ctry: "Benin",
  Regn: "Africa", RegnSub: "Western Africa", Pop: 120000, ROL: "fon", Lang: "Fon", LangFamily: "Niger-Congo",
  ROR: "R6", Rlgn: "Traditional Religion", EvngLvl: "Less than 2%", GSEC: 2, GSECbrf: "Initial Church Planting",
  Bible: "Available", Jesus: "Not Available", ResTot: 2, Affbloc: "Sub-Saharan African Peoples", PplClstr: "Browser Test Cluster",
  PplNm: VISIBLE_TEST_PEOPLE, UpdatedDate: "2026-08-24T00:00:00.000Z",
}];

async function installSingleRecordCorpus(page: import("@playwright/test").Page, onRequest?: () => void) {
  await page.route(/https:\/\/peoplegroups\.org\/wp-json\/pg\/v1\/people-groups(?:\?.*)?$/, async (route) => {
    onRequest?.();
    await route.fulfill({ status: 200, contentType: "application/json", headers: {
      "Access-Control-Allow-Origin": "*", "Access-Control-Expose-Headers": "X-WP-Total, X-WP-TotalPages",
      "X-WP-Total": "1", "X-WP-TotalPages": "1",
    }, body: JSON.stringify(records) });
  });
}

test("opening global Search is instant and does not load the remote corpus until a query is typed", async ({ page }) => {
  let providerRequests = 0;
  await installSingleRecordCorpus(page, () => { providerRequests += 1; });

  await page.goto("./#/about");
  await page.keyboard.press("/");
  const dialog = page.getByRole("dialog", { name: "Search Unreached" });
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(250);
  expect(providerRequests).toBe(0);
  await expect(dialog.getByText(/full remote corpus is loaded only when you need it/i)).toBeVisible();

  const search = dialog.getByRole("searchbox", { name: "Search peoples, countries or languages" });
  await search.fill(String(VISIBLE_TEST_PEID));
  await expect.poll(() => providerRequests).toBeGreaterThan(0);
  await expect(dialog.getByRole("link", { name: new RegExp(VISIBLE_TEST_PEOPLE) }).first()).toBeVisible({ timeout: 15_000 });
});

test("people profile makes prayer primary while keeping deep source detail opt-in", async ({ page }) => {
  await installSingleRecordCorpus(page);
  await page.goto(`./#/peoples/${VISIBLE_TEST_PEID}`);
  await expect(page.getByRole("heading", { name: VISIBLE_TEST_PEOPLE })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("link", { name: /Pray now/ })).toBeVisible();
  await expect(page.locator(".people-metric-grid--essential .people-metric")).toHaveCount(4);
  const details = page.locator(".people-disclosure").filter({ hasText: "Sources, taxonomy & methodology" });
  await expect(details).not.toHaveAttribute("open", "");
});

test("country index is progressively bounded", async ({ page }) => {
  await installSingleRecordCorpus(page);
  await page.goto("./#/countries");
  await expect(page.getByRole("heading", { name: "Find a country." })).toBeVisible();
  await expect(page.locator(".country-card")).toHaveCount(48);
  await expect(page.getByRole("button", { name: "Show 48 more" })).toBeVisible();
});
