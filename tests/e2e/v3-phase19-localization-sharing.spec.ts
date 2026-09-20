import { mkdir } from "node:fs/promises";

import { expect, test } from "@playwright/test";

import {
  RELATED_TEST_PEID,
  UNCOVERED_TEST_PEID,
  VISIBLE_TEST_PEID,
  installPeopleGroupsFixture,
} from "./peoplegroups-fixture";

const PRIVATE_KEY = "unreached.personal.v2";
const artifactDir = "artifacts/v3-phase19";

test.beforeAll(async () => {
  await mkdir(artifactDir, { recursive: true });
});

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

test("church sharing generates a minimal German link and resolves current source eligibility", async ({ page, browser }) => {
  await page.goto("./?senderSecret=DO-NOT-SHARE#/saved");

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
  expect(shareUrl).not.toContain("senderSecret");
  expect(shareUrl).not.toContain("DO-NOT-SHARE");

  const recipientContext = await browser.newContext();
  const recipient = await recipientContext.newPage();
  await installPeopleGroupsFixture(recipient);
  await recipient.goto(shareUrl);

  const shared = recipient.locator('[data-phase19-shared-prayer="ready"]');
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

  const persisted = await recipient.evaluate((key) => window.localStorage.getItem(key), PRIVATE_KEY);
  expect(persisted).toBeNull();
  await recipientContext.close();
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

  await shared.screenshot({ path: artifactDir + "/shared-prayer-mobile.png" });
});

test("church sharing can choose beyond the first twelve and reconciles same-length membership changes", async ({ page }) => {
  const entries = Array.from({ length: 14 }, (_, index) => {
    const id = 920001 + index;
    return {
      sourcePeopleId: id,
      peopleGroupId: "people-entity:peoplegroups:" + id,
      name: "Prayer person " + String(index + 1),
      countryName: "Country " + String(index + 1),
      languageName: "Language " + String(index + 1),
      addedAt: "2026-09-01T10:00:00.000Z",
      lastPrayedAt: null,
    };
  });
  const state = {
    version: 3,
    savedPeoples: [],
    prayerList: entries,
    recent: [],
    personalNotes: [],
    prayerMemory: [],
  };

  await page.addInitScript(({ key, value }) => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, { key: PRIVATE_KEY, value: state });
  await page.goto("./#/saved");

  const builder = page.locator('[data-phase19-church-share="true"]');
  await expect(builder).toBeVisible();
  await expect(builder.getByText("People to include · 12/12", { exact: true })).toBeVisible();

  const thirteenth = builder.getByRole("checkbox").nth(12);
  await expect(thirteenth).toBeDisabled();

  await builder.getByRole("checkbox").first().uncheck();
  await expect(thirteenth).toBeEnabled();
  await thirteenth.check();

  await builder.getByRole("button", { name: "Generate share link" }).click();
  const shareUrl = await builder.getByLabel("Generated prayer collection share link").inputValue();
  const peopleIds = await page.evaluate((value) => {
    const encoded = new URL(value).hash.split("?c=", 2)[1] ?? "";
    const normalized = decodeURIComponent(encoded).replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
    return (JSON.parse(atob(padded)) as { peopleIds: number[] }).peopleIds;
  }, shareUrl);
  expect(peopleIds).toContain(920013);
  expect(peopleIds).not.toContain(920001);
  expect(peopleIds).toHaveLength(12);

  const replacementId = 930001;
  const replacementState = {
    ...state,
    prayerList: [
      entries[0]!,
      {
        ...entries[1],
        sourcePeopleId: replacementId,
        peopleGroupId: "people-entity:peoplegroups:" + replacementId,
        name: "Replacement prayer person",
      },
      ...entries.slice(2),
    ],
  };
  await page.evaluate(({ key, value }) => {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("unreached:personalization-change"));
  }, { key: PRIVATE_KEY, value: replacementState });

  await expect(builder.getByText("Replacement prayer person", { exact: true })).toBeVisible();
  await expect(builder.getByText("Prayer person 2", { exact: true })).toHaveCount(0);
  await expect(builder.getByText("People to include · 11/12", { exact: true })).toBeVisible();
  await expect(builder.getByRole("checkbox").first()).toBeEnabled();
});

