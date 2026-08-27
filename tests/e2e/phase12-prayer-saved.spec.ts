import { expect, test, type Page } from "@playwright/test";

import { installPeopleGroupsFixture, VISIBLE_TEST_PEID } from "./peoplegroups-fixture";

async function installLargePrayerFixture(page: Page, count = 55) {
  const records = Array.from({ length: count }, (_, index) => ({
    PEID: 930000 + index,
    PGID: `PG${930000 + index}`,
    NmDisp: `Prayer Test People ${String(index + 1).padStart(2, "0")}`,
    ISOalpha3: "BEN",
    Ctry: "Benin",
    Pop: 100000 - index,
    ROL: "fon",
    Lang: "Fon",
    Rlgn: "Traditional Religion",
    GSEC: 2,
    GSECbrf: "Initial Church Planting",
    Bible: "Available",
    Jesus: "Available",
    ResTot: 2,
    UpdatedDate: "2026-08-27T00:00:00.000Z",
  }));

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
}

test("focused prayer uses prompt-length choices rather than pseudo-time modes", async ({ page }) => {
  await installPeopleGroupsFixture(page);
  await page.goto(`./#/pray/${VISIBLE_TEST_PEID}`);

  const group = page.getByRole("group", { name: "Prayer guide length" });
  await expect(group.getByRole("button", { name: /Short.*3 prompts/ })).toBeVisible();
  await expect(group.getByRole("button", { name: /Standard.*5 prompts/ })).toHaveAttribute("aria-pressed", "true");
  await expect(group.getByRole("button", { name: /Extended.*7 prompts/ })).toBeVisible();
  await expect(page.getByText("No timer runs, and there is no completion target.")).toBeVisible();
  await expect(page.getByText(/\b(?:2|5|10) min\b/)).toHaveCount(0);

  await expect(page.locator(".prayer-step-dots span")).toHaveCount(5);
  await group.getByRole("button", { name: /Short/ }).click();
  await expect(page.locator(".prayer-step-dots span")).toHaveCount(3);
  await group.getByRole("button", { name: /Extended/ }).click();
  await expect(page.locator(".prayer-step-dots span")).toHaveCount(7);
});

test("Prayer library progressively reveals every matching subject", async ({ page }) => {
  await installLargePrayerFixture(page, 55);
  await page.goto("./#/pray");

  const library = page.locator(".prayer-library");
  await expect(library.locator(".prayer-library-progress")).toContainText("Showing 24 of 55");
  await expect(library.locator(".prayer-card-grid .prayer-card")).toHaveCount(24);

  await library.getByRole("button", { name: "Show 24 more" }).click();
  await expect(library.locator(".prayer-card-grid .prayer-card")).toHaveCount(48);
  await expect(library.locator(".prayer-library-progress")).toContainText("Showing 48 of 55");

  await library.getByRole("button", { name: "Show 7 more" }).click();
  await expect(library.locator(".prayer-card-grid .prayer-card")).toHaveCount(55);
  await expect(library.locator(".prayer-library-progress")).toContainText("Showing 55 of 55");
  await expect(library.locator(".prayer-library-more")).toHaveCount(0);
});

test("My lists keeps secondary storage policy and Recent content collapsed by default", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("unreached.personal.v2", JSON.stringify({
      version: 2,
      savedPeoples: [],
      prayerList: [],
      recent: [{ kind: "country", key: "BEN", label: "Benin", secondary: "Country", href: "#/countries/BEN", visitedAt: "2026-08-27T10:00:00.000Z" }],
    }));
  });
  await installPeopleGroupsFixture(page);
  await page.goto("./#/saved");

  await expect(page.getByRole("heading", { name: "My lists" })).toBeVisible();
  await expect(page.locator("details.saved-policy-note")).toHaveCount(2);
  await expect(page.locator("details.saved-policy-note[open]")).toHaveCount(0);
  const recent = page.locator("details.saved-recent-section");
  await expect(recent).not.toHaveAttribute("open", "");
  await expect(recent.locator("summary")).toContainText("Recent");
  await recent.locator("summary").click();
  await expect(recent).toHaveAttribute("open", "");
  await expect(recent.getByRole("link", { name: /Benin/ })).toBeVisible();
});
