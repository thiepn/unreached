import { expect, test } from "@playwright/test";

import { installPeopleGroupsFixture } from "./peoplegroups-fixture";

test.beforeEach(async ({ page }) => {
  await installPeopleGroupsFixture(page);
});

test("newcomer can understand unreached and start today's prayer from Explore", async ({ page }) => {
  await page.goto("./#/", { waitUntil: "domcontentloaded" });

  const mobile = (page.viewportSize()?.width ?? 1280) <= 760;
  let actions;

  if (mobile) {
    const sheet = page.locator(".mobile-map-sheet--phase10");
    await expect(sheet).toBeVisible();
    await sheet.locator(":scope > summary").click();
    actions = sheet.locator(".explore-newcomer-actions--mobile");
  } else {
    actions = page.locator(".explore-panel--phase10 .explore-newcomer-actions");
  }

  await expect(actions).toBeVisible();

  const help = actions.locator(".term-help");
  const helpSummary = help.locator(":scope > summary");
  await expect(helpSummary).toContainText("What does “unreached” mean?");
  await expect(help).not.toHaveAttribute("open", "");
  await expect(help.getByText(/GSEC 0–3/)).not.toBeVisible();

  await helpSummary.click();
  const explanation = help.locator(".term-help__body p");
  await expect(explanation.first()).toContainText("established evangelical Christian presence is limited");
  await expect(explanation.nth(1)).toContainText("GSEC 0–3");

  const prayToday = actions.getByRole("link", { name: "Pray today →" });
  await expect(prayToday).toHaveAttribute("href", "#/pray");
  await prayToday.click();

  await expect(page).toHaveURL(/#\/pray$/);
  await expect(page.getByRole("heading", { name: "Understand enough to pray specifically." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "People to Pray for Today" })).toBeVisible({ timeout: 15_000 });
});
