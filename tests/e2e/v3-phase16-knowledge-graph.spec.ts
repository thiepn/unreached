import { mkdir } from "node:fs/promises";

import { expect, test } from "@playwright/test";

import { installPeopleGroupsFixture, VISIBLE_TEST_PEID } from "./peoplegroups-fixture";

const artifactDir = "artifacts/v3-phase16";

test.beforeAll(async () => {
  await mkdir(artifactDir, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  await installPeopleGroupsFixture(page);
});

test("people profile exposes an inspectable typed knowledge graph", async ({ page }) => {
  await page.goto("./#/peoples/" + VISIBLE_TEST_PEID);

  const graph = page.locator('[data-phase16-knowledge-graph="true"]');
  await expect(graph).toBeVisible();
  await expect(graph.getByRole("heading", { name: "Trace how this profile's facts and evidence connect." })).toBeVisible();
  await expect(graph.getByText("Connections do not become stronger by appearing in the graph.", { exact: true })).toBeVisible();
  await expect(graph).toHaveAttribute("data-graph-focus", "people:peoplegroups:910001");

  const sourceRecord = graph.getByRole("button", { name: /Has source record.*PG910001/i });
  await expect(sourceRecord).toBeVisible();
  await sourceRecord.click();

  await expect(graph).toHaveAttribute("data-graph-focus", "source-record:peoplegroups:PG910001");
  await expect(graph.getByRole("heading", { level: 3, name: "PG910001" })).toBeVisible();

  await graph.getByRole("button", { name: /Source facts/ }).click();
  await expect(graph.getByRole("button", { name: /Country context.*Benin/i })).toBeVisible();
  await expect(graph.getByRole("button", { name: /Primary language reported.*Fon/i })).toBeVisible();
  await expect(graph.getByRole("button", { name: /Mission classification/i })).toBeVisible();

  const countryEdge = graph.locator(".mission-knowledge-graph__edge").filter({ hasText: "Country context" });
  await countryEdge.locator("summary").click();
  await expect(countryEdge).toContainText("ISOalpha3");
  await expect(countryEdge).toContainText("Ctry");
  await expect(countryEdge).toContainText("PG910001");

  await graph.getByRole("button", { name: /Source taxonomy/ }).click();
  await expect(graph.getByRole("button", { name: /ROP3 people name.*Browser Test People/i })).toBeVisible();
  await expect(graph.getByRole("button", { name: /People cluster.*Browser Test Cluster/i })).toBeVisible();

  await page.screenshot({ path: artifactDir + "/people-knowledge-graph.png", fullPage: true });
});

test("related-record graph edges expose the exact taxonomy relationship", async ({ page }) => {
  await page.goto("./#/peoples/" + VISIBLE_TEST_PEID);
  const graph = page.locator('[data-phase16-knowledge-graph="true"]');

  await graph.getByRole("button", { name: /Related records/ }).click();
  const related = graph.locator(".mission-knowledge-graph__edge").filter({ hasText: "Same ROP3 people name" });
  await expect(related).toBeVisible({ timeout: 15_000 });
  await expect(related).toContainText("PEID 910002");

  await related.locator("summary").click();
  await expect(related).toContainText("PplNm");
  await expect(related).toContainText("PG910001");
  await expect(related).toContainText("PG910002");
  await expect(related).toContainText(/not proof that the records are one universal ethnic identity/i);
});

test("knowledge graph focus navigation is reversible", async ({ page }) => {
  await page.goto("./#/peoples/" + VISIBLE_TEST_PEID);
  const graph = page.locator('[data-phase16-knowledge-graph="true"]');

  await graph.getByRole("button", { name: /Has source record.*PG910001/i }).click();
  await expect(graph).toHaveAttribute("data-graph-focus", "source-record:peoplegroups:PG910001");

  await graph.getByRole("button", { name: /Back to people record/ }).click();
  await expect(graph).toHaveAttribute("data-graph-focus", "people:peoplegroups:910001");
});

test("knowledge graph stays within the mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/peoples/" + VISIBLE_TEST_PEID);

  const graph = page.locator('[data-phase16-knowledge-graph="true"]');
  await expect(graph).toBeVisible();

  const overflow = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(overflow.width).toBeLessThanOrEqual(overflow.client + 1);

  await page.screenshot({ path: artifactDir + "/people-knowledge-graph-mobile.png", fullPage: true });
});
