import { mkdir } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

const artifactDir = "artifacts/v3-phase14";
const HUI_PEID = 7206;
const HUI_PGID = "PG007206";
const JOSHUA_URL = "https://unreached-private-continuity.thiepn.workers.dev/unreached-sources/joshua-project/people/12140CH";

interface HuiFixtureState {
  gsec: number;
  population: number;
  evangelicalLevel: string;
  updatedDate: string;
}

const initialState: HuiFixtureState = {
  gsec: 1,
  population: 13_800_000,
  evangelicalLevel: "Less than 2%",
  updatedDate: "2026-09-16T00:00:00.000Z",
};

const changedState: HuiFixtureState = {
  gsec: 4,
  population: 13_900_000,
  evangelicalLevel: "2% or Greater",
  updatedDate: "2026-09-20T00:00:00.000Z",
};

async function installHuiPeopleGroupsRecord(page: Page, current: () => HuiFixtureState): Promise<void> {
  await page.route(`https://peoplegroups.org/wp-json/pg/v1/people-groups/${HUI_PGID}`, async (route) => {
    const state = current();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        PEID: HUI_PEID,
        PGID: HUI_PGID,
        NmDisp: "Hui",
        ISOalpha3: "CHN",
        Ctry: "China",
        Regn: "Asia",
        RegnSub: "Eastern Asia",
        Pop: state.population,
        Latitude: 35.8,
        Longitude: 104.1,
        ROL: "cmn",
        Lang: "Mandarin Chinese",
        ROR: "R6",
        Rlgn: "Islam",
        RlgnDiv: "Sunni",
        EvngLvl: state.evangelicalLevel,
        CongExst: "Yes",
        Plnting: "No Active CP Activity",
        EngStat: "Engaged",
        GSEC: state.gsec,
        GSECbrf: state.gsec <= 3 ? "Less than 2% Evangelical" : "Other GSEC status",
        GSEClng: state.gsec <= 3 ? "Synthetic unreached state." : "Synthetic changed GSEC state.",
        Affbloc: "East Asian Peoples",
        PplClstr: "Hui",
        PplNm: "Hui",
        Ethne: "Hui",
        Bible: "Available",
        Jesus: "Available",
        ResTot: 4,
        PeopleDesc: "Provider description used only by Phase 14 browser certification.",
        UpdatedDate: state.updatedDate,
      }),
    });
  });
}

async function deleteIndexedDb(page: Page, name: string): Promise<void> {
  await page.evaluate(async (databaseName) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(databaseName);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error(`Could not delete ${databaseName}`));
      request.onblocked = () => reject(new Error(`Deletion of ${databaseName} was blocked`));
    });
  }, name);
}

async function installChangedProviderState(page: Page, setState: (state: HuiFixtureState) => void): Promise<void> {
  setState(changedState);
  await deleteIndexedDb(page, "unreached-peoplegroups-v1");
  await page.reload();
}

test.beforeAll(async () => {
  await mkdir(artifactDir, { recursive: true });
});

test("history begins with one verified local state and repeated visits de-duplicate", async ({ page }) => {
  let state = initialState;
  await installHuiPeopleGroupsRecord(page, () => state);

  await page.goto(`./#/peoples/${HUI_PEID}`);
  const panel = page.locator('[data-phase14-history="true"]');

  await expect(panel).toBeVisible();
  await expect(panel.getByRole("heading", { name: "Source history on this device" })).toBeVisible();
  await expect(panel.getByText("Observed history, not reconstructed history.", { exact: true })).toBeVisible();
  await expect(panel.getByText("History starts with this verified source observation.", { exact: true })).toBeVisible();
  await expect(panel).toHaveAttribute("data-history-count", "1");

  await page.reload();
  await expect(panel).toHaveAttribute("data-history-count", "1");
  await expect(panel.getByText("History starts with this verified source observation.", { exact: true })).toBeVisible();

  await page.screenshot({ path: `${artifactDir}/hui-history-baseline.png`, fullPage: true });
});

test("a real tracked source change creates a distinct timeline point with exact changes", async ({ page }) => {
  let state = initialState;
  await installHuiPeopleGroupsRecord(page, () => state);

  await page.goto(`./#/peoples/${HUI_PEID}`);
  const panel = page.locator('[data-phase14-history="true"]');
  await expect(panel).toHaveAttribute("data-history-count", "1");

  await installChangedProviderState(page, (next) => { state = next; });

  await expect(panel).toHaveAttribute("data-history-count", "2");
  await expect(panel.getByText("2 distinct local source states", { exact: true })).toBeVisible();
  await expect(panel.getByText("Mission classification", { exact: true })).toBeVisible();
  await expect(panel.getByText("Unreached → Does not meet IMB unreached rule", { exact: true })).toBeVisible();
  await expect(panel.getByText("GSEC", { exact: true }).first()).toBeVisible();
  await expect(panel.getByText("1 → 4", { exact: true })).toBeVisible();
  await expect(panel.getByText("Population estimate", { exact: true })).toBeVisible();
  await expect(panel.getByText("13,800,000 → 13,900,000", { exact: true })).toBeVisible();

  await page.screenshot({ path: `${artifactDir}/hui-history-change.png`, fullPage: true });
});

test("reset discards earlier local states and retains only the current source state", async ({ page }) => {
  let state = initialState;
  await installHuiPeopleGroupsRecord(page, () => state);

  await page.goto(`./#/peoples/${HUI_PEID}`);
  const panel = page.locator('[data-phase14-history="true"]');
  await expect(panel).toHaveAttribute("data-history-count", "1");

  await installChangedProviderState(page, (next) => { state = next; });
  await expect(panel).toHaveAttribute("data-history-count", "2");

  await panel.getByRole("button", { name: /Reset local history to current state/ }).click();
  await expect(panel).toHaveAttribute("data-history-count", "1");
  await expect(panel.getByText("History starts with this verified source observation.", { exact: true })).toBeVisible();
  await expect(panel.getByText("1 → 4", { exact: true })).toHaveCount(0);
});

test("Joshua Project comparison stays outside the historical ledger", async ({ page }) => {
  let state = initialState;
  await installHuiPeopleGroupsRecord(page, () => state);
  await page.route(JOSHUA_URL, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" },
      body: JSON.stringify({
        source: "joshua-project-api",
        peopleId3: 12140,
        rog3: "CH",
        peopleId3Rog3: "12140CH",
        peopleName: "Hui",
        countryName: "China",
        percentAdherents: 0.6,
        percentEvangelical: 0.1,
        jpScale: 1,
        leastReached: true,
        frontier: true,
        retrievedAt: "2026-09-19T20:30:00.000Z",
        sourceProfileUrl: "https://joshuaproject.net/people_groups/12140/CH",
      }),
    });
  });

  await page.goto(`./#/peoples/${HUI_PEID}`);
  const history = page.locator('[data-phase14-history="true"]');
  await expect(history).toHaveAttribute("data-history-count", "1");

  const comparison = page.locator('[data-phase13-multi-source="true"]');
  await comparison.getByRole("button", { name: "Compare mission sources" }).click();
  await expect(comparison.locator('[data-comparison-state="agreement"]')).toBeVisible();

  const stored = await page.evaluate(async (pgid) => {
    return new Promise<unknown[]>((resolve, reject) => {
      const open = indexedDB.open("unreached-mission-history-v1", 1);
      open.onerror = () => reject(open.error ?? new Error("History database could not be opened."));
      open.onsuccess = () => {
        const db = open.result;
        const transaction = db.transaction("peoplegroups-observations", "readonly");
        const request = transaction.objectStore("peoplegroups-observations").index("pgid").getAll(pgid);
        request.onerror = () => reject(request.error ?? new Error("History records could not be read."));
        request.onsuccess = () => {
          db.close();
          resolve(request.result as unknown[]);
        };
      };
    });
  }, HUI_PGID);

  expect(stored).toHaveLength(1);
  expect(JSON.stringify(stored)).not.toContain("12140CH");
  expect(JSON.stringify(stored)).not.toContain("percentEvangelical");
  expect(JSON.stringify(stored)).not.toContain("joshua-project-api");
});

test("historical mission intelligence stays readable without horizontal overflow on mobile", async ({ page }) => {
  let state = initialState;
  await installHuiPeopleGroupsRecord(page, () => state);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`./#/peoples/${HUI_PEID}`);
  const panel = page.locator('[data-phase14-history="true"]');
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("heading", { name: "Source history on this device" })).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.client + 1);

  await page.screenshot({ path: `${artifactDir}/hui-history-mobile.png`, fullPage: true });
});
