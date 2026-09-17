import { mkdir } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

import {
  installPeopleGroupsFixture,
  UNCOVERED_TEST_PEID,
  VISIBLE_TEST_PEID,
  VISIBLE_TEST_PEOPLE,
} from "./peoplegroups-fixture";

const artifactDir = "artifacts/v3-phase10";

async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.client + 1);
}

async function installPrayerList(page: Page): Promise<void> {
  await page.addInitScript(({ first, second }) => {
    localStorage.setItem("unreached.personal.v2", JSON.stringify({
      version: 2,
      savedPeoples: [],
      prayerList: [
        {
          sourcePeopleId: first,
          peopleGroupId: `people-entity:peoplegroups:${first}`,
          name: "Browser Test People",
          countryName: "Benin",
          languageName: "Fon",
          addedAt: "2026-09-02T10:00:00.000Z",
          lastPrayedAt: null,
        },
        {
          sourcePeopleId: second,
          peopleGroupId: `people-entity:peoplegroups:${second}`,
          name: "Second Browser People",
          countryName: "Benin",
          languageName: "Yoruba",
          addedAt: "2026-09-01T10:00:00.000Z",
          lastPrayedAt: null,
        },
      ],
      recent: [],
    }));
  }, { first: VISIBLE_TEST_PEID, second: UNCOVERED_TEST_PEID });
}

test.beforeAll(async () => {
  await mkdir(artifactDir, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  await installPeopleGroupsFixture(page);
});

test("daily focus is primary and the live catalog is progressive", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("./#/pray");

  await expect(page.getByRole("heading", { level: 1, name: "Pray with context." })).toBeVisible();
  const daily = page.locator('[data-v3-prayer-daily="true"]');
  await expect(daily.getByRole("heading", { name: "People to Pray for Today" })).toBeVisible({ timeout: 15_000 });
  await expect(daily.getByText(/not a ranking of urgency or importance/i)).toBeVisible();

  const picker = page.locator("details.v3-prayer-picker");
  await expect(picker).not.toHaveAttribute("open", "");
  await expect(picker.locator(".prayer-card-grid")).not.toBeVisible();

  const order = await page.evaluate(() => {
    const dailyFocus = document.querySelector('[data-v3-prayer-daily="true"]');
    const choose = document.querySelector("details.v3-prayer-picker");
    if (!dailyFocus || !choose) return "missing";
    return dailyFocus.compareDocumentPosition(choose) & Node.DOCUMENT_POSITION_FOLLOWING ? "daily-first" : "picker-first";
  });
  expect(order).toBe("daily-first");

  await page.screenshot({ path: `${artifactDir}/prayer-landing-desktop.png`, fullPage: true });
});

test("private rotation becomes a gentle daily return point", async ({ page }) => {
  await installPrayerList(page);
  await page.goto("./#/pray");

  const daily = page.locator(".prayer-daily");
  await expect(daily.getByText("Next from your private prayer rotation", { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(daily.getByRole("heading", { name: "Second Browser People" })).toBeVisible();
  await expect(daily.getByText(/not a priority ranking/i)).toBeVisible();

  const rhythm = page.locator(".v3-prayer-rhythm");
  await expect(rhythm.getByRole("heading", { name: "Return to people you chose." })).toBeVisible();
  await expect(rhythm.locator('[data-prayer-session-size="3"]')).toHaveAttribute("href", "#/pray/session?size=3");
  await expect(rhythm.locator('[data-prayer-session-size="5"]')).toHaveAttribute("href", "#/pray/session?size=5");
  await expect(rhythm.locator('[data-prayer-session-size="all"]')).toHaveAttribute("href", "#/pray/session?size=all");
  await expect(rhythm).toContainText("never becomes a score or obligation");
});

test("focused prayer puts context before prompts", async ({ page }) => {
  await page.goto(`./#/pray/${VISIBLE_TEST_PEID}`);

  await expect(page.getByRole("heading", { level: 1, name: `Pray for ${VISIBLE_TEST_PEOPLE}` })).toBeVisible({ timeout: 15_000 });
  const context = page.locator('[data-v3-prayer-context="true"]');
  await expect(context.getByRole("heading", { name: "Hold a few source facts in view." })).toBeVisible();
  await expect(context).toContainText("Benin");
  await expect(context).toContainText("Fon");
  await expect(context).toContainText("Unreached · GSEC 0–3");

  const prompt = page.locator(".v3-prayer-prompt");
  const order = await page.evaluate(() => {
    const contextNode = document.querySelector('[data-v3-prayer-context="true"]');
    const promptNode = document.querySelector(".v3-prayer-prompt");
    if (!contextNode || !promptNode) return "missing";
    return contextNode.compareDocumentPosition(promptNode) & Node.DOCUMENT_POSITION_FOLLOWING ? "context-first" : "prompt-first";
  });
  expect(order).toBe("context-first");
  await expect(prompt).toContainText("good news of Jesus Christ");

  const hero = page.locator(".v3-prayer-focus__hero");
  await expect(hero.getByText(/PEID|PGID/)).toHaveCount(0);

  const lengths = page.getByRole("group", { name: "Prayer guide length" });
  await expect(page.locator(".prayer-step-dots span")).toHaveCount(5);
  await lengths.getByRole("button", { name: /Short.*3 prompts/ }).click();
  await expect(page.locator(".prayer-step-dots span")).toHaveCount(3);
  await lengths.getByRole("button", { name: /Extended.*7 prompts/ }).click();
  await expect(page.locator(".prayer-step-dots span")).toHaveCount(7);
  await expect(page.getByText(/No timer runs, and there is no completion target/)).toBeVisible();

  const record = page.getByRole("button", { name: "Record prayer today" });
  await record.click();
  await expect(page.getByRole("button", { name: "Prayer noted today" })).toBeDisabled();

  const source = page.locator("details.v3-prayer-source-detail");
  await expect(source).not.toHaveAttribute("open", "");
  await source.locator("summary").click();
  await expect(source).toContainText(`PEID ${VISIBLE_TEST_PEID}`);
});

test("choose another people remains available on demand", async ({ page }) => {
  await page.goto("./#/pray");

  const picker = page.locator("details.v3-prayer-picker");
  await picker.locator(":scope > summary").click();
  await expect(picker).toHaveAttribute("open", "");
  const search = picker.getByRole("searchbox", { name: "Search prayer subjects" });
  await search.fill("Second Browser People");

  const card = picker.locator(".v3-prayer-card").filter({ hasText: "Second Browser People" });
  await expect(card).toBeVisible({ timeout: 15_000 });
  await expect(card.getByRole("link", { name: /Pray for this people/ })).toHaveAttribute("href", `#/pray/${UNCOVERED_TEST_PEID}`);
  await card.getByRole("button", { name: /Add Second Browser People to private prayer list/ }).click();
  await expect(card.getByRole("button", { name: /Remove Second Browser People from private prayer list/ })).toBeVisible();
});

test("guided session preserves a frozen non-competitive rotation", async ({ page }) => {
  await installPrayerList(page);
  await page.goto("./#/pray/session?size=3");

  const session = page.locator('[data-v3-prayer="session"]');
  await expect(session).toHaveAttribute("data-prayer-session-plan", `${UNCOVERED_TEST_PEID},${VISIBLE_TEST_PEID}`, { timeout: 15_000 });
  await expect(page.getByRole("heading", { level: 1, name: "Pray through your rotation." })).toBeVisible();
  await expect(page.getByText("Person 1 of 2")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Second Browser People" })).toBeVisible();
  await expect(page.locator(".prayer-session__prompt-list article")).toHaveCount(3);
  await expect(page.getByText(/navigation aid, not a completion target/i)).toBeVisible();
  await expect(page.getByText(/stores no session history/i)).toBeVisible();

  await page.getByRole("button", { name: "Record prayer today" }).click();
  await page.getByRole("button", { name: "Next person" }).click();
  await expect(page.getByText("Person 2 of 2")).toBeVisible();
  await expect(page.getByRole("heading", { name: VISIBLE_TEST_PEOPLE })).toBeVisible();
  await expect(session).toHaveAttribute("data-prayer-session-plan", `${UNCOVERED_TEST_PEID},${VISIBLE_TEST_PEID}`);
});

test("Prayer 3.0 remains readable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/pray");
  await expect(page.getByRole("heading", { level: 1, name: "Pray with context." })).toBeVisible();
  await expect(page.locator('[data-v3-prayer-daily="true"]')).toBeVisible({ timeout: 15_000 });
  await assertNoHorizontalOverflow(page);
  await page.screenshot({ path: `${artifactDir}/prayer-landing-mobile.png`, fullPage: true });

  await page.goto(`./#/pray/${VISIBLE_TEST_PEID}`);
  await expect(page.getByRole("heading", { level: 1, name: `Pray for ${VISIBLE_TEST_PEOPLE}` })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('[data-v3-prayer-context="true"]')).toBeVisible();
  await expect(page.locator(".v3-prayer-prompt")).toBeVisible();
  await assertNoHorizontalOverflow(page);
  await page.screenshot({ path: `${artifactDir}/prayer-focus-mobile.png`, fullPage: true });
});
