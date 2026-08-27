import { expect, test, type Page } from "@playwright/test";

const LARGE_CORPUS_SIZE = 4_000;
const PEOPLE_GROUPS_PAGE_SIZE = 250;

function languageCode(index: number): string {
  const value = index % (26 * 26 * 26);
  return String.fromCharCode(97 + Math.floor(value / 676), 97 + Math.floor((value % 676) / 26), 97 + (value % 26));
}

function record(index: number) {
  const peid = 300_000 + index;
  const languageIndex = index % 300;
  return {
    PEID: peid,
    PGID: `PG${String(peid).padStart(6, "0")}`,
    NmDisp: `Synthetic People ${index}`,
    ISOalpha3: index % 2 === 0 ? "BEN" : "NGA",
    Ctry: index % 2 === 0 ? "Benin" : "Nigeria",
    Regn: "Africa",
    RegnSub: "Western Africa",
    Pop: 10_000 + index * 100,
    ROL: languageCode(languageIndex),
    Lang: `Synthetic Language ${languageIndex}`,
    LangFamily: `Family ${languageIndex % 10}`,
    ROR: `R${index % 4}`,
    Rlgn: index % 2 === 0 ? "Islam" : "Traditional Religion",
    GSEC: index % 7,
    Bible: index % 2 === 0 ? "Available" : "Not Available",
    Jesus: "Available",
    ResTot: index % 5,
    Affbloc: `Affinity ${index % 8}`,
    PplClstr: `Cluster ${index % 30}`,
    PplNm: `Synthetic People ${index}`,
    UpdatedDate: "2026-08-27T00:00:00.000Z",
  };
}

async function installLargeCorpus(page: Page): Promise<void> {
  const records = Array.from({ length: LARGE_CORPUS_SIZE }, (_, index) => record(index));
  const totalPages = Math.ceil(records.length / PEOPLE_GROUPS_PAGE_SIZE);
  await page.route(/https:\/\/peoplegroups\.org\/wp-json\/pg\/v1\/people-groups(?:\?.*)?$/, async (route) => {
    const requestUrl = new URL(route.request().url());
    const requestedPage = Number(requestUrl.searchParams.get("page") ?? "1");
    const requestedPageSize = Number(requestUrl.searchParams.get("per_page") ?? String(PEOPLE_GROUPS_PAGE_SIZE));
    const start = (requestedPage - 1) * requestedPageSize;
    const body = JSON.stringify(records.slice(start, start + requestedPageSize));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Expose-Headers": "X-WP-Total, X-WP-TotalPages",
        "X-WP-Total": String(LARGE_CORPUS_SIZE),
        "X-WP-TotalPages": String(totalPages),
      },
      body,
    });
  });
}

test.describe("Phase 5 prepared search responsiveness", () => {
  test.use({ serviceWorkers: "block" });
  test.skip(({ browserName }) => browserName !== "chromium", "4x CPU search responsiveness is certified once in Chromium; deterministic Phase 5 benchmarks cover the 12,370-record corpus.");

  test("People, Prayer and global search remain responsive under 4x CPU", async ({ page }) => {
    test.setTimeout(90_000);
    await installLargeCorpus(page);
    await page.goto("./#/peoples");
    const peopleSearch = page.locator("#people-search");
    await expect(peopleSearch).toBeVisible({ timeout: 20_000 });

    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    try {
      let started = Date.now();
      await peopleSearch.fill("Synthetic People 3999");
      await expect(page.getByRole("heading", { name: "Synthetic People 3999" })).toBeVisible({ timeout: 2_000 });
      expect(Date.now() - started).toBeLessThan(800);

      await page.evaluate(() => { window.location.hash = "/pray"; });
      const prayerSearch = page.locator("#prayer-search");
      await expect(prayerSearch).toBeVisible();
      started = Date.now();
      await prayerSearch.fill("Synthetic People 3997");
      await expect(page.getByText("1 matching people entities. Showing up to 60 at once.")).toBeVisible({ timeout: 2_000 });
      expect(Date.now() - started).toBeLessThan(800);

      await page.locator("#main-content").focus();
      await page.keyboard.press("/");
      const dialogSearch = page.getByRole("searchbox", { name: "Search peoples, countries or languages" });
      await expect(dialogSearch).toBeVisible();
      started = Date.now();
      await dialogSearch.fill("Synthetic People 3999");
      await expect(page.getByRole("link", { name: /Synthetic People 3999/ }).first()).toBeVisible({ timeout: 2_000 });
      expect(Date.now() - started).toBeLessThan(800);
    } finally {
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
      await cdp.detach();
    }
  });
});
