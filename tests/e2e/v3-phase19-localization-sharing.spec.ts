import { expect, test } from "@playwright/test";

import {
  RELATED_TEST_PEID,
  UNCOVERED_TEST_PEID,
  VISIBLE_TEST_PEID,
  installPeopleGroupsFixture,
} from "./peoplegroups-fixture";

const PRIVATE_KEY = "unreached.personal.v2";

function privateState() {
  return {
    version: 3,
    savedPeoples: [],
    prayerList: [
      {
        sourcePeopleId: VISIBLE_TEST_PEID,
        peopleGroupId: "people-entity:peoplegroups:" + VISIBLE_TEST_PEID,
        name: "Browser Test People",
        countryName: "Benin",
        languageName: "Fon",
        addedAt: "2026-09-01T10:00:00.000Z",
        lastPrayedAt: "2026-09-18T20:00:00.000Z",
      },
      {
        sourcePeopleId: RELATED_TEST_PEID,
        peopleGroupId: "people-entity:peoplegroups:" + RELATED_TEST_PEID,
        name: "Stale private snapshot",
        countryName: "Nigeria",
        languageName: "Fon",
        addedAt: "2026-09-02T10:00:00.000Z",
        lastPrayedAt: null,
      },
      {
        sourcePeopleId: UNCOVERED_TEST_PEID,
        peopleGroupId: "people-entity:peoplegroups:" + UNCOVERED_TEST_PEID,
        name: "Second Browser People",
        countryName: "Benin",
        languageName: "Yoruba",
        addedAt: "2026-09-03T10:00:00.000Z",
        lastPrayedAt: null,
      },
    ],
    recent: [],
    personalNotes: [
      {
        sourcePeopleId: VISIBLE_TEST_PEID,
        text: "ULTRA-PRIVATE-NOTE-MUST-NEVER-SHARE",
        updatedAt: "2026-09-19T22:00:00.000Z",
      },
    ],
    prayerMemory: [
      {
        sourcePeopleId: VISIBLE_TEST_PEID,
        peopleGroupId: "people-entity:peoplegroups:" + VISIBLE_TEST_PEID,
        name: "Browser Test People",
        countryName: "Benin",
        languageName: "Fon",
        prayedAt: "2026-09-19T22:30:00.000Z",
      },
    ],
  };
}

test.beforeEach(async ({ page }) => {
  await installPeopleGroupsFixture(page);
  await page.addInitScript(({ key, state }) => {
    window.localStorage.setItem(key, JSON.stringify(state));
  }, { key: PRIVATE_KEY, state: privateState() });
});

test("church sharing generates a minimal German link and resolves current source eligibility", async ({ page }) => {
  await page.goto("./#/saved");

  const builder = page.locator('[data-phase19-church-share="true"]');
  await expect(builder).toBeVisible();
  await expect(builder.getByRole("heading", { name: "Create a privacy-safe prayer collection." })).toBeVisible();

  await builder.getByLabel("Collection title").fill("Gemeinde Gebetsliste");
  await builder.getByLabel("Recipient language").selectOption("de");
  await builder.getByRole("button", { name: "Generate share link" }).click();

  const linkInput = builder.getByLabel("Generated prayer collection share link");
  await expect(linkInput).toBeVisible();
  const shareUrl = await linkInput.inputValue();
  expect(shareUrl).toContain("#/share/prayer?c=");
  expect(shareUrl).not.toContain("ULTRA-PRIVATE-NOTE-MUST-NEVER-SHARE");
  expect(shareUrl).not.toContain("Browser%20Test%20People");

  await page.evaluate((key) => window.localStorage.removeItem(key), PRIVATE_KEY);
  await page.goto(shareUrl);

  const shared = page.locator('[data-phase19-shared-prayer="ready"]');
  await expect(shared).toBeVisible({ timeout: 15_000 });
  await expect(shared).toHaveAttribute("data-shared-locale", "de");
  await expect(shared.getByRole("heading", { level: 1, name: "Gemeinsam beten: Gemeinde Gebetsliste" })).toBeVisible();
  await expect(shared.getByText("2 aktuell zum Gebet verfügbare Einträge", { exact: true })).toBeVisible();

  const eligible = shared.locator('[data-shared-prayer-peid="' + VISIBLE_TEST_PEID + '"]');
  await expect(eligible).toBeVisible();
  await expect(eligible.getByRole("link", { name: /Für diese Menschen beten/ })).toHaveAttribute("href", "#/pray/" + VISIBLE_TEST_PEID);

  await expect(shared.getByRole("heading", { name: "Nicht verfügbare oder geänderte Einträge" })).toBeVisible();
  await expect(shared.getByText("PEID " + RELATED_TEST_PEID, { exact: true })).toBeVisible();
  await expect(shared.getByText("Aktueller Quelldatensatz ist nicht als GSEC 0–3 klassifiziert", { exact: true })).toBeVisible();
  await expect(shared.locator('a[href="#/pray/' + RELATED_TEST_PEID + '"]')).toHaveCount(0);

  const persisted = await page.evaluate((key) => window.localStorage.getItem(key), PRIVATE_KEY);
  expect(persisted).toBeNull();
});

test("malformed collection links fail closed without starting the prayer runtime", async ({ page }) => {
  await page.goto("./#/share/prayer?c=not-valid!");

  const invalid = page.locator('[data-phase19-shared-prayer="invalid"]');
  await expect(invalid).toBeVisible();
  await expect(invalid.getByRole("heading", { name: "This prayer collection link is invalid." })).toBeVisible();
  await expect(page.locator('[data-shared-prayer-peid]')).toHaveCount(0);
});

test("shared prayer collection remains usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/saved");

  const builder = page.locator('[data-phase19-church-share="true"]');
  await expect(builder).toBeVisible();
  await builder.getByLabel("Collection title").fill("Mobile church prayer");
  await builder.getByRole("button", { name: "Generate share link" }).click();
  const shareUrl = await builder.getByLabel("Generated prayer collection share link").inputValue();

  await page.goto(shareUrl);
  const shared = page.locator('[data-phase19-shared-prayer="ready"]');
  await expect(shared).toBeVisible({ timeout: 15_000 });

  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.client + 1);

  await shared.screenshot({ path: "artifacts/v3-phase19/shared-prayer-mobile.png" });
});
