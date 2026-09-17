import { mkdir } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

import {
  installPeopleGroupsFixture,
  UNCOVERED_TEST_PEID,
  VISIBLE_TEST_PEID,
  VISIBLE_TEST_PEOPLE,
} from "./peoplegroups-fixture";

const artifactDir = "artifacts/v3-phase11";
const storageKey = "unreached.personal.v2";

async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.client + 1);
}

async function installMemoryState(page: Page): Promise<void> {
  await page.addInitScript(({ key, savedId, prayerId, savedName }) => {
    localStorage.setItem(key, JSON.stringify({
      version: 3,
      savedPeoples: [{
        sourcePeopleId: savedId,
        peopleGroupId: `people-entity:peoplegroups:${savedId}`,
        name: savedName,
        largestCountryName: "Benin",
        primaryLanguageName: "Fon",
        classification: "unreached",
        frontier: false,
        savedAt: "2026-09-15T08:00:00.000Z",
      }],
      prayerList: [{
        sourcePeopleId: prayerId,
        peopleGroupId: `people-entity:peoplegroups:${prayerId}`,
        name: "Second Browser People",
        countryName: "Benin",
        languageName: "Yoruba",
        addedAt: "2026-09-14T08:00:00.000Z",
        lastPrayedAt: "2026-09-15T09:30:00.000Z",
      }],
      recent: [{
        kind: "country",
        key: "BEN",
        label: "Benin",
        secondary: "Country",
        href: "#/countries/BEN",
        visitedAt: "2026-09-16T10:00:00.000Z",
      }],
      personalNotes: [{
        sourcePeopleId: savedId,
        text: "Remember the language and Scripture context before praying.",
        updatedAt: "2026-09-16T09:00:00.000Z",
      }],
      prayerMemory: [
        {
          sourcePeopleId: prayerId,
          peopleGroupId: `people-entity:peoplegroups:${prayerId}`,
          name: "Second Browser People",
          countryName: "Benin",
          languageName: "Yoruba",
          prayedAt: "2026-09-16T07:30:00.000Z",
        },
        {
          sourcePeopleId: savedId,
          peopleGroupId: `people-entity:peoplegroups:${savedId}`,
          name: savedName,
          countryName: "Benin",
          languageName: "Fon",
          prayedAt: "2026-09-15T07:30:00.000Z",
        },
      ],
    }));
  }, { key: storageKey, savedId: VISIBLE_TEST_PEID, prayerId: UNCOVERED_TEST_PEID, savedName: VISIBLE_TEST_PEOPLE });
}

test.beforeAll(async () => {
  await mkdir(artifactDir, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  await installPeopleGroupsFixture(page);
  await installMemoryState(page);
});

test("Saved separates bookmarks, prayer intent, memory and recents", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("./#/saved");

  await expect(page.getByRole("heading", { level: 1, name: "Saved" })).toBeVisible();
  await expect(page.getByText("Private by default.", { exact: true })).toBeVisible();
  await expect(page.getByText(/Private notes, prayer memory, and recent browsing never enter that sync protocol/)).toBeVisible();

  const saved = page.locator('[data-memory-section="saved"]');
  const prayer = page.locator('[data-memory-section="prayer-list"]');
  const memory = page.locator('[data-memory-section="prayer-memory"]');
  const recent = page.locator('[data-memory-section="recent"]');

  await expect(saved.getByRole("heading", { name: "Saved peoples" })).toBeVisible();
  await expect(saved.getByRole("link", { name: VISIBLE_TEST_PEOPLE })).toBeVisible();
  await expect(saved).toContainText("does not automatically add them to your prayer list");

  await expect(prayer.getByRole("heading", { name: "Prayer list" })).toBeVisible();
  await expect(prayer.getByRole("link", { name: "Second Browser People" }).first()).toBeVisible();
  await expect(prayer).toContainText("never a ranking of need or importance");

  await expect(memory.getByRole("heading", { name: "Prayer memory" })).toBeVisible();
  await expect(memory).toContainText("not a prayer total or measure of faithfulness");
  await expect(recent).not.toHaveAttribute("open", "");
  await expect(recent.locator("summary")).toContainText("Recently viewed");

  await page.screenshot({ path: `${artifactDir}/personal-memory-desktop.png`, fullPage: true });
});

test("private notes persist locally without changing source content", async ({ page }) => {
  await page.goto("./#/saved");

  const editor = page.locator(`[data-private-note-peid="${VISIBLE_TEST_PEID}"]`);
  const textarea = editor.getByRole("textbox", { name: `Private note for ${VISIBLE_TEST_PEOPLE}` });
  await expect(textarea).toHaveValue("Remember the language and Scripture context before praying.");

  const nextNote = "Follow up on Scripture access and remember this people in prayer.";
  await textarea.fill(nextNote);
  await editor.getByRole("button", { name: "Save note" }).click();

  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), storageKey);
  expect(stored.version).toBe(3);
  expect(stored.personalNotes).toEqual(expect.arrayContaining([
    expect.objectContaining({ sourcePeopleId: VISIBLE_TEST_PEID, text: nextNote }),
  ]));

  await page.reload();
  await expect(page.getByRole("textbox", { name: `Private note for ${VISIBLE_TEST_PEOPLE}` })).toHaveValue(nextNote);
  await expect(page.getByText("Personal, not part of the people profile.", { exact: false })).toBeVisible();
});

test("prayer memory is bounded local history with explicit deletion", async ({ page }) => {
  await page.goto("./#/saved");

  const memory = page.locator('[data-memory-section="prayer-memory"]');
  await expect(memory.locator(".v3-memory-timeline li")).toHaveCount(2);
  await expect(memory).toContainText("Kept only on this device. At most the 30 latest recorded prayer moments are retained.");
  await memory.getByRole("button", { name: "Clear prayer memory" }).click();
  await expect(memory.locator(".v3-memory-timeline")).toHaveCount(0);
  await expect(memory.getByText("No prayer memory recorded yet.")).toBeVisible();

  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), storageKey);
  expect(stored.prayerMemory).toEqual([]);
  expect(stored.prayerList).toHaveLength(1);
});

test("Personal Mission Memory remains readable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/saved");

  await expect(page.getByRole("heading", { level: 1, name: "Saved" })).toBeVisible();
  await expect(page.locator('[data-memory-section="saved"]')).toBeVisible();
  await expect(page.locator('[data-memory-section="prayer-list"]')).toBeVisible();
  await expect(page.locator('[data-memory-section="prayer-memory"]')).toBeVisible();
  await assertNoHorizontalOverflow(page);

  const controls = page.locator([
    ".v3-memory-hero__actions a",
    ".v3-memory-card__actions a",
    ".v3-memory-card__actions button",
    ".v3-memory-return > a",
    ".saved-prayer-session-launcher__actions a",
    ".v3-memory-note button",
    ".v3-memory-clear",
    ".v3-memory-empty a",
  ].join(", "));
  const heights = await controls.evaluateAll((nodes) => nodes.map((node) => (node as HTMLElement).getBoundingClientRect().height));
  expect(heights.length).toBeGreaterThan(0);
  expect(heights.every((height) => height >= 43.5)).toBe(true);

  await page.screenshot({ path: `${artifactDir}/personal-memory-mobile.png`, fullPage: true });
});
