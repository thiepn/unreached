import { expect, test } from "@playwright/test";

const records = [
  { PEID: 12319, PGID: "PG012319", NmDisp: "Fon", ISOalpha3: "BEN", Ctry: "Benin", Pop: 2000000, ROL: "fon", Lang: "Fon", Rlgn: "Protestantism", GSEC: 1, GSECbrf: "GSEC 1", Bible: "Available", Jesus: "Available", ResTot: 2, UpdatedDate: "2026-08-24T00:00:00.000Z" },
  { PEID: 11954, PGID: "PG011954", NmDisp: "Somali", ISOalpha3: "SOM", Ctry: "Somalia", Pop: 12000000, ROL: "som", Lang: "Somali", Rlgn: "Islam", GSEC: 1, GSECbrf: "GSEC 1", Bible: "Available", Jesus: "Available", ResTot: 2, UpdatedDate: "2026-08-24T00:00:00.000Z" },
  { PEID: 24277, PGID: "PG024277", NmDisp: "Kazakh", ISOalpha3: "KAZ", Ctry: "Kazakhstan", Pop: 13000000, ROL: "kaz", Lang: "Kazakh", Rlgn: "Islam", GSEC: 2, GSECbrf: "GSEC 2", Bible: "Available", Jesus: "Available", ResTot: 2, UpdatedDate: "2026-08-24T00:00:00.000Z" },
  { PEID: 24529, PGID: "PG024529", NmDisp: "Tajiks", ISOalpha3: "TJK", Ctry: "Tajikistan", Pop: 9000000, ROL: "tgk", Lang: "Tajik", Rlgn: "Islam", GSEC: 2, GSECbrf: "GSEC 2", Bible: "Available", Jesus: "Available", ResTot: 2, UpdatedDate: "2026-08-24T00:00:00.000Z" },
];

const prayerState = {
  version: 2,
  savedPeoples: [],
  prayerList: [
    { sourcePeopleId: 24277, peopleGroupId: "people-entity:peoplegroups:24277", name: "Kazakh", countryName: "Kazakhstan", languageName: "Kazakh", addedAt: "2026-08-21T10:00:00.000Z", lastPrayedAt: "2026-08-23T20:00:00.000Z" },
    { sourcePeopleId: 12319, peopleGroupId: "people-entity:peoplegroups:12319", name: "Fon", countryName: "Benin", languageName: "Fon", addedAt: "2026-08-22T10:00:00.000Z", lastPrayedAt: null },
    { sourcePeopleId: 11954, peopleGroupId: "people-entity:peoplegroups:11954", name: "Somali", countryName: "Somalia", languageName: "Somali", addedAt: "2026-08-20T10:00:00.000Z", lastPrayedAt: null },
    { sourcePeopleId: 24529, peopleGroupId: "people-entity:peoplegroups:24529", name: "Tajiks", countryName: "Tajikistan", languageName: "Tajik", addedAt: "2026-08-19T10:00:00.000Z", lastPrayedAt: "2026-08-24T20:00:00.000Z" },
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

async function installPrayerState(page: import("@playwright/test").Page, value = prayerState) {
  await page.addInitScript((state) => {
    localStorage.setItem("unreached.personal.v2", JSON.stringify(state));
  }, value);
}

test("v1.8 Saved workspace exposes 3, 5 and full guided-session launchers", async ({ page }) => {
  await installPrayerState(page);
  await page.goto("./#/saved", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "Pray through several return points." })).toBeVisible();
  await expect(page.locator('[data-prayer-session-size="3"]')).toHaveAttribute("href", /#\/pray\/session\?size=3$/);
  await expect(page.locator('[data-prayer-session-size="5"]')).toHaveAttribute("href", /#\/pray\/session\?size=5$/);
  await expect(page.locator('[data-prayer-session-size="all"]')).toHaveAttribute("href", /#\/pray\/session\?size=all$/);
  await expect(page.getByText(/No session history or completion record is created/i)).toBeVisible();
});

test("v1.8 3-person session freezes the current rotation plan and opens the first person", async ({ page }) => {
  await installPrayerState(page);
  await page.goto("./#/pray/session?size=3", { waitUntil: "domcontentloaded" });

  const session = page.locator("[data-prayer-session-plan]");
  await expect(session).toHaveAttribute("data-prayer-session-plan", "11954,12319,24277", { timeout: 15_000 });
  await expect(page.getByText("Person 1 of 3")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Somali" })).toBeVisible();
  await expect(page.locator(".prayer-session__prompt-list article")).toHaveCount(3);
  await expect(page.getByText(/navigation aid, not a completion target/i)).toBeVisible();

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("unreached.personal.v2") ?? "null"));
  expect(stored.prayerList.map((entry: { sourcePeopleId: number }) => entry.sourcePeopleId)).toEqual([24277, 12319, 11954, 24529]);
  expect(stored.sessionHistory).toBeUndefined();
  expect(stored.sessionCount).toBeUndefined();
});

test("v1.8 recording inside a session preserves the frozen next person and latest-only storage", async ({ page }) => {
  await installPrayerState(page);
  await page.goto("./#/pray/session?size=3", { waitUntil: "domcontentloaded" });

  const session = page.locator("[data-prayer-session-plan]");
  await expect(session).toHaveAttribute("data-prayer-session-plan", "11954,12319,24277", { timeout: 15_000 });
  await page.getByRole("button", { name: "Record prayer today" }).click();
  await expect(page.getByRole("button", { name: "Prayer noted today" })).toBeDisabled();
  await page.getByRole("button", { name: "Next person" }).click();

  await expect(page.getByText("Person 2 of 3")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Fon" })).toBeVisible();
  await expect(session).toHaveAttribute("data-prayer-session-plan", "11954,12319,24277");

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("unreached.personal.v2") ?? "null"));
  expect(stored.prayerList.find((entry: { sourcePeopleId: number }) => entry.sourcePeopleId === 11954).lastPrayedAt).toBeTruthy();
  expect(stored.prayerList[0].sessionPosition).toBeUndefined();
  expect(stored.prayerList[0].sessionCompletedAt).toBeUndefined();
});

test("v1.8 full session includes every currently eligible listed person", async ({ page }) => {
  await installPrayerState(page);
  await page.goto("./#/pray/session?size=all", { waitUntil: "domcontentloaded" });

  await expect(page.locator("[data-prayer-session-plan]")).toHaveAttribute("data-prayer-session-plan", "11954,12319,24277,24529", { timeout: 15_000 });
  await expect(page.getByText("Person 1 of 4")).toBeVisible();
  await expect(page.getByText(/full eligible prayer list was frozen/i)).toBeVisible();
});

test("v1.8 session fails gently when the private prayer list is empty", async ({ page }) => {
  await installPrayerState(page, { version: 2, savedPeoples: [], prayerList: [], recent: [] });
  await page.goto("./#/pray/session?size=3", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "No eligible people are in your prayer list." })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("link", { name: "Choose people to pray for" })).toBeVisible();
});
