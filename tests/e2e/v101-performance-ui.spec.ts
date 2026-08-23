import { expect, test, type Page } from "@playwright/test";

function isoCode(index: number): string {
  const a = Math.floor(index / (26 * 26)) % 26;
  const b = Math.floor(index / 26) % 26;
  const c = index % 26;
  return String.fromCharCode(97 + a, 97 + b, 97 + c);
}

function largeCorpus() {
  return Array.from({ length: 120 }, (_, index) => {
    const id = 920000 + index;
    const languageCode = isoCode(index);
    return {
      PEID: id,
      PGID: `PG${id}`,
      NmDisp: `Performance Test People ${String(index + 1).padStart(3, "0")}`,
      ISOalpha3: "BEN",
      Ctry: "Benin",
      Regn: "Africa",
      RegnSub: "Western Africa",
      Pop: 100000 + index,
      ROL: languageCode,
      Lang: `Test Language ${String(index + 1).padStart(3, "0")}`,
      LangFamily: "Synthetic Test Family",
      ROR: "R1",
      Rlgn: "Islam",
      EvngLvl: "Less than 2%",
      GSEC: 1,
      GSECbrf: "No Active Church Planting",
      Bible: "Available",
      Jesus: "Not Available",
      ResTot: 1,
      Affbloc: "Synthetic Test Bloc",
      PplClstr: "Synthetic Test Cluster",
      PplNm: `Performance Test People ${String(index + 1).padStart(3, "0")}`,
      UpdatedDate: "2026-08-24T00:00:00.000Z",
    };
  });
}

async function installLargeCorpus(page: Page) {
  const records = largeCorpus();
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

async function expectNoHorizontalOverflow(page: Page) {
  await expect.poll(async () => page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))).toEqual(expect.objectContaining({ clientWidth: expect.any(Number) }));
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test.beforeEach(async ({ page }) => {
  await installLargeCorpus(page);
});

test("primary navigation exposes Languages and Search on every viewport", async ({ page }) => {
  await page.goto("./#/countries");
  await expect(page.getByRole("link", { name: "Languages", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Search people, countries and languages" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("People Explorer bounds the initial DOM and progressively reveals results", async ({ page }) => {
  await page.goto("./#/peoples");
  await expect(page.getByRole("heading", { name: "Find a people group." })).toBeVisible();
  await expect(page.locator(".people-card")).toHaveCount(48);
  await expect(page.getByText(/Showing 48 of 120 matching records/)).toBeVisible();
  const more = page.getByRole("button", { name: "Show 48 more" });
  await expect(more).toBeVisible();
  await more.click();
  await expect(page.locator(".people-card")).toHaveCount(96);
  await expectNoHorizontalOverflow(page);
});

test("Languages renders with restored design tokens and bounded cards", async ({ page }) => {
  await page.goto("./#/languages");
  await expect(page.getByRole("heading", { name: "Explore languages and resources." })).toBeVisible();
  await expect(page.locator(".language-card")).toHaveCount(60);
  await expect(page.getByText(/Showing 60 of 120 matching languages/)).toBeVisible();

  const style = await page.locator(".language-card").first().evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      border: computed.borderTopWidth,
      background: computed.backgroundColor,
      font: getComputedStyle(element.querySelector("h2")!).fontFamily,
    };
  });
  expect(style.border).not.toBe("0px");
  expect(style.background).not.toBe("rgba(0, 0, 0, 0)");
  expect(style.font.toLowerCase()).toContain("newsreader");
  await expectNoHorizontalOverflow(page);
});

test("Prayer, Saved and About retain visible surfaces after token restoration", async ({ page }) => {
  for (const route of ["pray", "saved", "about"]) {
    await page.goto(`./#/${route}`);
    await expect(page.locator("main")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});
