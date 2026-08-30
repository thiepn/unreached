import { expect, test } from "@playwright/test";

import { installPeopleGroupsFixture, VISIBLE_TEST_PEID, VISIBLE_TEST_PEOPLE } from "./peoplegroups-fixture";

test.beforeEach(async ({ page }) => {
  await installPeopleGroupsFixture(page);
});

test("newcomer sees meaning before technical identifiers", async ({ page }) => {
  await page.goto(`./#/peoples/${VISIBLE_TEST_PEID}`);

  await expect(page.getByRole("heading", { name: VISIBLE_TEST_PEOPLE, exact: true, level: 1 })).toBeVisible();
  await expect(page.getByText("A people-group record in Benin that the current mission-data source classifies as unreached.", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Why is this people group marked unreached?" })).toBeVisible();
  await expect(page.locator(".people-profile-hero").getByText(/PEID|PGID|GSEC/)).toHaveCount(0);
});

test("primary overview is limited to four understandable facts", async ({ page }) => {
  await page.goto(`./#/peoples/${VISIBLE_TEST_PEID}`);

  const metrics = page.locator(".people-metric-grid--essential .people-metric");
  await expect(metrics).toHaveCount(4);
  await expect(metrics.nth(0)).toContainText("120K");
  await expect(metrics.nth(1)).toContainText("Traditional Religion");
  await expect(metrics.nth(2)).toContainText("Fon");
  await expect(metrics.nth(3)).toContainText("Available");

  await expect(page.getByText("GSEC code", { exact: true })).toBeHidden();
});

test("mission terminology can be explained in place", async ({ page }) => {
  await page.goto(`./#/peoples/${VISIBLE_TEST_PEID}`);

  const help = page.getByText("What does unreached mean?", { exact: true });
  await expect(help).toBeVisible();
  await help.click();
  await expect(page.getByText("A mission-status label Unreached shows when the source places a people-group record in GSEC 0–3.", { exact: true })).toBeVisible();
});

test("prayer is a first-class action without hiding research depth", async ({ page }) => {
  await page.goto(`./#/peoples/${VISIBLE_TEST_PEID}`);

  const primaryPrayer = page.getByRole("link", { name: /Pray for this people/ });
  await expect(primaryPrayer).toBeVisible();
  await expect(primaryPrayer).toHaveAttribute("href", `#/pray/${VISIBLE_TEST_PEID}`);

  const research = page.getByText("Detailed data, sources & methodology", { exact: true });
  await expect(research).toBeVisible();
  await research.click();
  await expect(page.getByText(`PEID ${VISIBLE_TEST_PEID} · PGID PG910001 · BEN`, { exact: true })).toBeVisible();
  await expect(page.locator(".people-disclosure--sources").getByText("2 · Initial Church Planting", { exact: true })).toBeVisible();
});

test("comprehension-first profile remains usable at narrow mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(`./#/peoples/${VISIBLE_TEST_PEID}`);
  await expect(page.getByRole("heading", { name: VISIBLE_TEST_PEOPLE, exact: true, level: 1 })).toBeVisible();

  const overflow = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(overflow.width).toBeLessThanOrEqual(overflow.client);
});

test("map starts with a plain-language mission view and keeps research views opt in", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 760 });
  await page.goto("./#/", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "Explore unreached peoples." })).toBeVisible();
  const current = page.locator(".explore-panel--phase10 .mission-view-current");
  await expect(current).toContainText("Unreached population share");
  await expect(current).toContainText("Not national census data.");

  const picker = page.locator(".explore-panel--phase10 .mission-view-picker");
  await expect(picker).not.toHaveAttribute("open", "");
  await expect(picker.locator("select")).not.toBeVisible();
  await picker.locator("summary").click();
  await expect(picker.locator("select")).toBeVisible();
  await expect(picker.locator("select")).toContainText("Unreached people-group share");
  await expect(picker.locator("select")).toContainText("Mission-status data coverage");
  await expect(picker.locator("select")).toContainText("Source people-group records");
});

test("selected country explains the map result before source breakdown", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 760 });
  await page.goto("./#/", { waitUntil: "domcontentloaded" });

  const search = page.locator("#desktop-country-search");
  await search.fill("Benin");
  const benin = page.locator(".explore-panel--phase10 .country-row", { hasText: "Benin" }).first();
  await expect(benin).toBeVisible();
  await benin.click();

  const selected = page.locator(".selected-area--phase10");
  await expect(selected).toContainText("Benin");
  const summary = selected.locator(".selected-mission-summary--comprehension");
  await expect(summary).toBeVisible({ timeout: 15_000 });
  await expect(summary.locator(".selected-mission-meaning")).toContainText("classified as unreached");
  await expect(summary.locator(".selected-mission-primary")).toContainText("Unreached population share");

  const details = summary.locator(".selected-mission-details");
  await expect(details).not.toHaveAttribute("open", "");
  await expect(details.locator(".selected-mission-grid")).not.toBeVisible();
  await expect(selected.getByRole("link", { name: "Open country profile →" })).toHaveAttribute("href", "#/countries/BEN");
  await expect(selected.getByRole("link", { name: "Pray for this country’s peoples →" })).toHaveAttribute("href", "#/pray?country=BEN");
});

test("research map layer IDs remain URL compatible", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 760 });
  await page.goto("./#/?layer=gsec-coverage", { waitUntil: "domcontentloaded" });

  const current = page.locator(".explore-panel--phase10 .mission-view-current");
  await expect(current).toContainText("Mission-status data coverage");
  await expect(current).toHaveAttribute("data-map-view-kind", "research");

  const picker = page.locator(".explore-panel--phase10 .mission-view-picker");
  await picker.locator("summary").click();
  const select = picker.locator("select");
  await expect(select).toHaveValue("gsec-coverage");
  await select.selectOption("population-coverage");
  await expect(page).toHaveURL(/layer=population-coverage/);
  await expect(current).toContainText("Population-data coverage");
});

test("country starts with three metrics and people before research tables", async ({ page }) => {
  await page.goto("./#/countries/BEN");
  await expect(page.getByRole("heading", { name: "Benin", exact: true, level: 1 })).toBeVisible({ timeout: 15_000 });

  const metrics = page.locator(".country-metric-grid--comprehension .country-metric");
  await expect(metrics).toHaveCount(3);
  await expect(metrics.nth(0)).toContainText("Unreached people groups");
  await expect(metrics.nth(1)).toContainText("People groups represented");
  await expect(metrics.nth(2)).toContainText("not national census population");

  await expect(page.getByRole("heading", { name: "Largest unreached peoples represented" })).toBeVisible();
  const largest = page.locator(".country-largest-people-list");
  await expect(largest.getByRole("link", { name: new RegExp(VISIBLE_TEST_PEOPLE) })).toBeVisible();

  const research = page.locator(".country-research-disclosure");
  await expect(research).not.toHaveAttribute("open", "");
  await expect(research.locator(".country-people-table")).not.toBeVisible();
  await research.locator(":scope > summary").click();
  await expect(research.locator(".country-people-table")).toBeVisible();
  await expect(research.getByText(`PGID PG910001 · PEID ${VISIBLE_TEST_PEID}`, { exact: true })).toBeVisible();
});

test("people explorer cards hide source identifiers and expose normal context filters", async ({ page }) => {
  await page.goto("./#/peoples");
  await expect(page.getByRole("heading", { name: "Find a people group." })).toBeVisible();

  const primary = page.locator(".people-primary-context-filters");
  await expect(primary.getByRole("combobox", { name: "Country" })).toBeVisible();
  await expect(primary.getByRole("combobox", { name: "Language" })).toBeVisible();
  await expect(primary.getByRole("combobox", { name: "Religion" })).toBeVisible();
  await expect(page.locator("#people-search")).toHaveAttribute("placeholder", "Search people, country or language");

  const card = page.locator(".people-card--comprehension", { hasText: VISIBLE_TEST_PEOPLE }).first();
  await expect(card).toBeVisible({ timeout: 15_000 });
  await expect(card).toContainText("Population");
  await expect(card).toContainText("Bible resources");
  await expect(card).toContainText("Learn about this people");
  await expect(card.getByText(/PEID|PGID|GSEC/)).toHaveCount(0);
});
