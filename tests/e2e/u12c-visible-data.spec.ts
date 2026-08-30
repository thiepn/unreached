import { expect, test } from "@playwright/test";

import { installPeopleGroupsFixture, VISIBLE_TEST_PEID, VISIBLE_TEST_PEOPLE } from "./peoplegroups-fixture";

test.beforeEach(async ({ page }) => { await installPeopleGroupsFixture(page); });

test("live people and country surfaces preserve one-record PEID, PGID and GSEC semantics", async ({ page }) => {
  await page.goto("./#/peoples");
  await expect(page.getByRole("heading", { name: "Find a people group." })).toBeVisible();
  const peopleLink = page.getByRole("link", { name: new RegExp(VISIBLE_TEST_PEOPLE) }).first();
  await expect(peopleLink).toBeVisible({ timeout: 15_000 });
  await peopleLink.click();

  const profile = page.locator("article.people-profile--v11");
  await expect(profile).toBeVisible({ timeout: 15_000 });
  await expect(profile.getByRole("heading", { name: VISIBLE_TEST_PEOPLE, exact: true, level: 1 })).toBeVisible();
  await expect(profile.locator(".people-profile-hero").getByText(/PEID|PGID|GSEC/)).toHaveCount(0);
  await expect(profile.getByText("Unreached", { exact: true }).first()).toBeVisible();
  await expect(profile.getByText(/Estimate for this record in Benin/)).toBeVisible();
  await expect(profile.locator(".people-metric-grid--essential").getByText("Available", { exact: true })).toBeVisible();
  await expect(profile.getByRole("heading", { name: "Understand the source context" })).toBeVisible();
  await expect(profile.getByRole("link", { name: /Pray with this context/ })).toBeVisible();

  const statusDetails = profile.locator(".unreached-source-classification");
  await expect(statusDetails).not.toHaveAttribute("open", "");
  await statusDetails.locator(":scope > summary").click();
  await expect(statusDetails.getByText("2", { exact: true })).toBeVisible();
  await expect(statusDetails.getByText("Initial Church Planting", { exact: true })).toBeVisible();

  const sourceDetails = profile.locator(".people-disclosure--sources").filter({ hasText: "Detailed data, sources & methodology" });
  await expect(sourceDetails).not.toHaveAttribute("open", "");
  await sourceDetails.locator(":scope > summary").click();
  await expect(sourceDetails.getByText(`PEID ${VISIBLE_TEST_PEID} · PGID PG910001 · BEN`, { exact: true })).toBeVisible();
  await expect(sourceDetails.getByText("2 · Initial Church Planting", { exact: true })).toBeVisible();
  await expect(sourceDetails.getByText(/does not treat PEID as a cross-country grouping key/)).toBeVisible();

  await expect(profile.getByText("PGID PG910002", { exact: true })).toHaveCount(0);
  await expect(profile.getByText("Mixed GSEC status", { exact: true })).toHaveCount(0);
  await expect(profile.getByText("JP scale", { exact: true })).toHaveCount(0);
  await expect(profile.getByText("Christian adherents", { exact: true })).toHaveCount(0);
  await expect(profile.getByText("Frontier", { exact: true })).toHaveCount(0);

  await page.goto("./#/countries/BEN");
  await expect(page.getByRole("heading", { name: "Benin", exact: true })).toBeVisible();
  await expect(page.locator(".country-metric-grid--comprehension .country-metric")).toHaveCount(3);
  await expect(page.getByRole("heading", { name: "Largest unreached peoples represented" })).toBeVisible();

  const research = page.locator(".country-research-disclosure");
  await expect(research).not.toHaveAttribute("open", "");
  await research.locator(":scope > summary").click();
  const unreachedSection = page.getByLabel("Unreached people contexts");
  await expect(unreachedSection.getByRole("heading", { name: "Unreached people contexts" })).toBeVisible();
  await expect(unreachedSection.getByRole("link", { name: VISIBLE_TEST_PEOPLE, exact: true })).toBeVisible();
  await expect(unreachedSection.getByText("GSEC 0–3 source records", { exact: true })).toBeVisible();
  await expect(page.getByText(/people-group-in-country records returned by PeopleGroups.org/)).toBeVisible();
});

test("live people can be searched, saved locally and opened in certified prayer flow", async ({ page }) => {
  await page.goto("./#/countries");
  await page.keyboard.press("/");
  const dialog = page.getByRole("dialog", { name: "Search Unreached" });
  const search = dialog.getByRole("searchbox", { name: "Search peoples, countries or languages" });
  await search.fill(String(VISIBLE_TEST_PEID));
  const result = dialog.getByRole("link", { name: new RegExp(VISIBLE_TEST_PEOPLE) }).first();
  await expect(result).toBeVisible({ timeout: 15_000 });
  await result.click();

  const save = page.getByRole("button", { name: "Save for later" });
  await expect(save).toBeVisible();
  await save.click();
  await expect(page.getByRole("button", { name: "Remove from saved" })).toBeVisible();

  await page.goto("./#/saved");
  const savedCard = page.locator("article.saved-person-card").filter({ has: page.getByRole("link", { name: VISIBLE_TEST_PEOPLE, exact: true }) });
  await expect(savedCard).toBeVisible();
  await expect(savedCard.getByText("Unreached", { exact: true })).toBeVisible();

  await page.goto(`./#/pray/${VISIBLE_TEST_PEID}`);
  await expect(page.getByRole("heading", { name: `Pray for ${VISIBLE_TEST_PEOPLE}` })).toBeVisible();
  await expect(page.getByText(/GSEC 0–3/).first()).toBeVisible();
  await expect(page.getByText(/Benin/).first()).toBeVisible();
  await expect(page.getByText(/Template u12c-v1 is fixed and release-certified/)).toBeVisible();
  await expect(page.getByText(/good news of Jesus Christ/)).toBeVisible();
  await expect(page.getByText(/prayer score/i)).toBeVisible();
});