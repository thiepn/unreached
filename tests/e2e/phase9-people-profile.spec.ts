import { expect, test } from "@playwright/test";

import { installPeopleGroupsFixture, RELATED_TEST_PEID, VISIBLE_TEST_PEID, VISIBLE_TEST_PEOPLE } from "./peoplegroups-fixture";

test.beforeEach(async ({ page }) => {
  await installPeopleGroupsFixture(page);
});

test("source context appears before prayer actions", async ({ page }) => {
  await page.goto(`./#/peoples/${VISIBLE_TEST_PEID}`);
  await expect(page.getByRole("heading", { name: VISIBLE_TEST_PEOPLE })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Understand the source context" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Read the available description" })).toBeVisible();
  await expect(page.getByRole("heading", { name: `Pray for ${VISIBLE_TEST_PEOPLE}.` })).toBeVisible();

  const order = await page.evaluate(() => {
    const context = document.querySelector('[data-profile-stage="understand"]');
    const action = document.querySelector('[data-profile-stage="act"]');
    const reference = document.querySelector('[data-profile-stage="reference"]');
    if (!context || !action || !reference) return "missing";
    const contextBeforeAction = Boolean(context.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING);
    const actionBeforeReference = Boolean(action.compareDocumentPosition(reference) & Node.DOCUMENT_POSITION_FOLLOWING);
    return contextBeforeAction && actionBeforeReference ? "context-action-reference" : "wrong-order";
  });
  expect(order).toBe("context-action-reference");
});

test("prayer eligible profile offers contextual next step", async ({ page }) => {
  await page.goto(`./#/peoples/${VISIBLE_TEST_PEID}`);
  await expect(page.getByText("Source context reviewed", { exact: true })).toBeVisible();

  const prayer = page.getByRole("link", { name: /Pray with this context/ });
  await expect(prayer).toBeVisible();
  await expect(prayer).toHaveAttribute("href", `#/pray/${VISIBLE_TEST_PEID}`);
  await expect(page.getByRole("button", { name: "Save for later" })).toBeVisible();

  const source = page.locator(".people-section--source");
  const action = page.locator(".people-profile-action-stage");
  const sourceBox = await source.boundingBox();
  const actionBox = await action.boundingBox();
  expect(sourceBox).not.toBeNull();
  expect(actionBox).not.toBeNull();
  expect(actionBox!.y).toBeGreaterThan(sourceBox!.y + sourceBox!.height);
});

test("non prayer eligible profile keeps save path without prayer CTA", async ({ page }) => {
  await page.goto(`./#/peoples/${RELATED_TEST_PEID}`);
  await expect(page.getByRole("heading", { name: "Save this people-group record." })).toBeVisible();
  await expect(page.getByText("Prayer guide not available", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Pray with this context/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Save profile" })).toBeVisible();
  await expect(page.getByText("No provider description is available for this record.", { exact: true })).toBeVisible();
});

test("mobile profile journey has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`./#/peoples/${VISIBLE_TEST_PEID}`);
  await expect(page.getByRole("heading", { name: VISIBLE_TEST_PEOPLE })).toBeVisible();
  await page.locator(".people-profile-action-stage").scrollIntoViewIfNeeded();
  await expect(page.getByRole("link", { name: /Pray with this context/ })).toBeVisible();

  const overflow = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(overflow.width).toBeLessThanOrEqual(overflow.client);

  const action = await page.locator(".people-profile-action-stage").boundingBox();
  expect(action).not.toBeNull();
  expect(action!.width).toBeLessThanOrEqual(390);
});
