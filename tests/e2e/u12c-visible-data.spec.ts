import { expect, test } from "@playwright/test";

import { installPeopleGroupsFixture, VISIBLE_TEST_PEID, VISIBLE_TEST_PEOPLE } from "./peoplegroups-fixture";

test.beforeEach(async ({ page }) => {
  await installPeopleGroupsFixture(page);
});

test("live people and country surfaces preserve one-record PEID, PGID and GSEC semantics", async ({ page }) => {
  await page.goto("./#/peoples");
  await expect(page.getByRole("heading", { name: "Find a people group." })).toBeVisible();
  const peopleLink = page.getByRole("link", { name: new RegExp(VISIBLE_TEST_PEOPLE) }).first();
  await expect(peopleLink).toBeVisible({ timeout: 15_000 });
  await peopleLink.click();

  await expect(page.getByRole("heading", { name: VISIBLE_TEST_PEOPLE, exact: true })).toBeVisible();
  await expect(page.getByText(`PEID ${VISIBLE_TEST_PEID}`, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/PEID 910001 · PGID PG910001/)).toBeVisible();
  await expect(page.getByText("Unreached", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("2", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/PeopleGroups.org estimate for Benin/)).toBeVisible();
  await expect(page.getByText("Bible: Available", { exact: true })).toBeVisible();
  await expect(page.getByText(/one PGID country-context record for this PEID/)).toBeVisible();
  await expect(page.getByText(/does not treat PEID as a cross-country grouping key/)).toBeVisible();

  await expect(page.getByText("PGID PG910002", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Mixed GSEC status", { exact: true })).toHaveCount(0);
  await expect(page.getByText("JP scale", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Christian adherents", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Frontier", { exact: true })).toHaveCount(0);

  await page.goto("./#/countries/BEN");
  await expect(page.getByRole("heading", { name: "Benin", exact: true })).toBeVisible();
  const unreachedSection = page.getByLabel("Unreached people contexts");
  await expect(unreachedSection.getByRole("heading", { name: "Unreached people contexts" })).toBeVisible();
  await expect(unreachedSection.getByRole("link", { name: VISIBLE_TEST_PEOPLE, exact: true })).toBeVisible();
  await expect(unreachedSection.getByText("GSEC 0–3", { exact: true }).first()).toBeVisible();
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

  const save = page.getByRole("button", { name: "Save for Prayer" });
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
