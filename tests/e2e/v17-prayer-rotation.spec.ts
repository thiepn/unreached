import { expect, test } from "@playwright/test";

const records = [
  { PEID: 12319, PGID: "PG012319", NmDisp: "Fon", ISOalpha3: "BEN", Ctry: "Benin", Pop: 2000000, ROL: "fon", Lang: "Fon", Rlgn: "Protestantism", GSEC: 1, GSECbrf: "GSEC 1", Bible: "Available", Jesus: "Available", ResTot: 2, UpdatedDate: "2026-08-24T00:00:00.000Z" },
  { PEID: 11954, PGID: "PG011954", NmDisp: "Somali", ISOalpha3: "SOM", Ctry: "Somalia", Pop: 12000000, ROL: "som", Lang: "Somali", Rlgn: "Islam", GSEC: 1, GSECbrf: "GSEC 1", Bible: "Available", Jesus: "Available", ResTot: 2, UpdatedDate: "2026-08-24T00:00:00.000Z" },
  { PEID: 24277, PGID: "PG024277", NmDisp: "Kazakh", ISOalpha3: "KAZ", Ctry: "Kazakhstan", Pop: 13000000, ROL: "kaz", Lang: "Kazakh", Rlgn: "Islam", GSEC: 2, GSECbrf: "GSEC 2", Bible: "Available", Jesus: "Available", ResTot: 2, UpdatedDate: "2026-08-24T00:00:00.000Z" },
];

const prayerState = {
  version: 2,
  savedPeoples: [],
  prayerList: [
    { sourcePeopleId: 24277, peopleGroupId: "people-entity:peoplegroups:24277", name: "Kazakh", countryName: "Kazakhstan", languageName: "Kazakh", addedAt: "2026-08-21T10:00:00.000Z", lastPrayedAt: "2026-08-23T20:00:00.000Z" },
    { sourcePeopleId: 12319, peopleGroupId: "people-entity:peoplegroups:12319", name: "Fon", countryName: "Benin", languageName: "Fon", addedAt: "2026-08-22T10:00:00.000Z", lastPrayedAt: null },
    { sourcePeopleId: 11954, peopleGroupId: "people-entity:peoplegroups:11954", name: "Somali", countryName: "Somalia", languageName: "Somali", addedAt: "2026-08-20T10:00:00.000Z", lastPrayedAt: null },
  ],
  recent: [],
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
        "X-WP-Total": String(records.length),
        "X-WP-TotalPages": "1",
      },
      body: JSON.stringify(pageNumber === 1 ? records : []),
    });
  });
});

async function installPrayerState(page: import("@playwright/test").Page) {
  await page.addInitScript((value) => {
    localStorage.setItem("unreached.personal.v2", JSON.stringify(value));
  }, prayerState);
}

test("v1.7 Saved workspace orders prayer rotation without changing stored list order", async ({ page }) => {
  await installPrayerState(page);
  await page.goto("./#/saved", { waitUntil: "domcontentloaded" });

  const next = page.locator("[data-prayer-rotation-next]");
  await expect(next).toHaveAttribute("data-prayer-rotation-next", "11954");
  await expect(next).toContainText("Somali");
  await expect(page.getByText(/does not rank urgency, importance, unreachedness, or prayer faithfulness/i)).toBeVisible();

  const cards = page.locator("[data-prayer-list-peid]");
  await expect(cards.nth(0)).toHaveAttribute("data-prayer-list-peid", "11954");
  await expect(cards.nth(1)).toHaveAttribute("data-prayer-list-peid", "12319");
  await expect(cards.nth(2)).toHaveAttribute("data-prayer-list-peid", "24277");

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("unreached.personal.v2") ?? "null"));
  expect(stored.prayerList.map((entry: { sourcePeopleId: number }) => entry.sourcePeopleId)).toEqual([24277, 12319, 11954]);
  expect(stored.version).toBe(2);
});

test("v1.7 daily prayer chooses the next private rotation entry", async ({ page }) => {
  await installPrayerState(page);
  await page.goto("./#/pray", { waitUntil: "domcontentloaded" });

  const daily = page.locator(".prayer-daily");
  await expect(daily.getByText("Next from your private prayer rotation")).toBeVisible({ timeout: 15_000 });
  await expect(daily.getByRole("heading", { name: "Somali" })).toBeVisible();
  await expect(daily.getByText(/not a priority ranking/i)).toBeVisible();
});

test("v1.7 prayer rotation respects country scope", async ({ page }) => {
  await installPrayerState(page);
  await page.goto("./#/pray?country=KAZ", { waitUntil: "domcontentloaded" });

  const daily = page.locator(".prayer-daily");
  await expect(daily.getByText("Next from your private prayer rotation")).toBeVisible({ timeout: 15_000 });
  await expect(daily.getByRole("heading", { name: "Kazakh" })).toBeVisible();
});

test("v1.7 recording prayer exposes the next eligible return point", async ({ page }) => {
  await installPrayerState(page);
  await page.goto("./#/pray/11954", { waitUntil: "domcontentloaded" });

  const record = page.getByRole("button", { name: "Record prayer today" });
  await expect(record).toBeVisible({ timeout: 15_000 });
  await record.click();
  await expect(page.getByRole("button", { name: "Prayer noted today" })).toBeDisabled();

  const next = page.locator("[data-next-prayer-peid]");
  await expect(next).toHaveAttribute("data-next-prayer-peid", "12319");
  await expect(next).toContainText("Continue with Fon");

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("unreached.personal.v2") ?? "null"));
  expect(stored.version).toBe(2);
  expect(stored.prayerList.find((entry: { sourcePeopleId: number }) => entry.sourcePeopleId === 11954).lastPrayedAt).toBeTruthy();
  expect(stored.prayerList[0].rotationScore).toBeUndefined();
  expect(stored.prayerList[0].priorityScore).toBeUndefined();
});
