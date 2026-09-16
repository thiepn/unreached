import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import { installPeopleGroupsFixture, VISIBLE_TEST_PEID } from "./peoplegroups-fixture";

const captureEnabled = process.env.V3_PHASE0_CAPTURE === "1";

test.skip(!captureEnabled, "V3 Phase 0 visual capture runs only in the dedicated baseline workflow.");

test.beforeEach(async ({ page }) => {
  await installPeopleGroupsFixture(page);
});

const routes = [
  { name: "explore", path: "./#/" },
  { name: "peoples", path: "./#/peoples" },
  { name: "people-detail", path: `./#/peoples/${VISIBLE_TEST_PEID}` },
  { name: "countries", path: "./#/countries" },
  { name: "country-detail", path: "./#/countries/BEN" },
  { name: "languages", path: "./#/languages" },
  { name: "language-detail", path: "./#/languages/fon" },
  { name: "reviewed-coverage", path: "./#/coverage" },
  { name: "pray", path: "./#/pray" },
  { name: "prayer-focus", path: `./#/pray/${VISIBLE_TEST_PEID}` },
  { name: "prayer-session", path: "./#/pray/session" },
  { name: "saved", path: "./#/saved" },
  { name: "account", path: "./#/account" },
  { name: "about", path: "./#/about" },
] as const;

for (const route of routes) {
  test(`capture pre-V3 ${route.name} baseline`, async ({ page }, testInfo) => {
    await page.goto(route.path, { waitUntil: "domcontentloaded" });
    await expect(page.locator("#main-content")).toBeVisible();
    await expect(page.locator(".route-loading")).toHaveCount(0, { timeout: 15_000 });

    // Let deterministic fixture-backed data and deferred layout work settle.
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => undefined);
    await page.waitForTimeout(250);

    const outputDir = join(process.cwd(), "artifacts", "v3-phase0", "visual", testInfo.project.name);
    await mkdir(outputDir, { recursive: true });

    await page.screenshot({
      path: join(outputDir, `${route.name}.png`),
      fullPage: true,
      animations: "disabled",
    });

    const metadata = await page.evaluate(() => ({
      title: document.title,
      hash: window.location.hash,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      document: {
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
      },
      body: {
        scrollWidth: document.body.scrollWidth,
        scrollHeight: document.body.scrollHeight,
      },
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      capturedAt: new Date().toISOString(),
    }));

    await writeFile(
      join(outputDir, `${route.name}.json`),
      `${JSON.stringify(metadata, null, 2)}\n`,
      "utf8",
    );
  });
}
