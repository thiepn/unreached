import type { Page } from "@playwright/test";

export const VISIBLE_TEST_PEID = 910001;
export const VISIBLE_TEST_PEOPLE = "Browser Test People";
export const RELATED_TEST_PEID = 910002;
export const UNCOVERED_TEST_PEID = 910003;

export const PEOPLE_GROUPS_TEST_RECORDS = [
  {
    PEID: VISIBLE_TEST_PEID,
    PGID: "PG910001",
    NmDisp: VISIBLE_TEST_PEOPLE,
    NmAlt: "Test Community",
    ISOalpha3: "BEN",
    Ctry: "Benin",
    Regn: "Africa",
    RegnSub: "Western Africa",
    Pop: 120000,
    Latitude: 9.3,
    Longitude: 2.3,
    ROL: "fon",
    Lang: "Fon",
    LangFamily: "Niger-Congo",
    ROR: "R6",
    Rlgn: "Traditional Religion",
    RlgnDiv: "Traditional",
    EvngLvl: "Less than 2%",
    CongExst: "Yes",
    Plnting: "Active",
    EngStat: "Engaged",
    GSEC: 2,
    GSECbrf: "Initial Church Planting",
    GSEClng: "Synthetic browser certification GSEC description.",
    SPI: 1,
    SPIdesc: "Synthetic SPI",
    LPI: 1,
    LPIname: "Synthetic LPI",
    LPIdesc: "Synthetic LPI description",
    Affbloc: "Sub-Saharan African Peoples",
    PplClstr: "Browser Test Cluster",
    PplNm: VISIBLE_TEST_PEOPLE,
    Ethne: "Browser Test Ethne",
    Bible: "Available",
    Jesus: "Not Available",
    ResTot: 2,
    PeopleDesc: "Synthetic PeopleGroups provider description used only by browser certification.",
    LocationDesc: "Synthetic location description used only by browser certification.",
    UpdatedDate: "2026-08-21T00:00:00.000Z"
  },
  {
    PEID: RELATED_TEST_PEID,
    PGID: "PG910002",
    NmDisp: VISIBLE_TEST_PEOPLE,
    ISOalpha3: "NGA",
    Ctry: "Nigeria",
    Regn: "Africa",
    RegnSub: "Western Africa",
    Pop: null,
    ROL: "fon",
    Lang: "Fon",
    LangFamily: "Niger-Congo",
    ROR: "R6",
    Rlgn: "Traditional Religion",
    EvngLvl: "5% to 10%",
    GSEC: 5,
    GSECbrf: "Established",
    Bible: "Unknown",
    Jesus: "Available",
    Affbloc: "Sub-Saharan African Peoples",
    PplClstr: "Browser Test Cluster",
    PplNm: VISIBLE_TEST_PEOPLE,
    UpdatedDate: "2026-08-22T00:00:00.000Z"
  },
  {
    PEID: UNCOVERED_TEST_PEID,
    PGID: "PG910003",
    NmDisp: "Second Browser People",
    ISOalpha3: "BEN",
    Ctry: "Benin",
    Regn: "Africa",
    RegnSub: "Western Africa",
    Pop: 50000,
    ROL: "yor",
    Lang: "Yoruba",
    ROR: "R1",
    Rlgn: "Islam",
    EvngLvl: "Less than 2%",
    GSEC: 1,
    GSECbrf: "No Active Church Planting",
    Bible: "Not Available",
    Jesus: "Not Available",
    Affbloc: "Sub-Saharan African Peoples",
    PplClstr: "Second Browser Cluster",
    PplNm: "Second Browser People",
    UpdatedDate: "2026-08-20T00:00:00.000Z"
  }
] as const;

export async function installPeopleGroupsFixture(page: Page): Promise<void> {
  await page.route(/https:\/\/peoplegroups\.org\/wp-json\/pg\/v1\/people-groups\/PG[0-9]+$/, async (route) => {
    const pgid = route.request().url().split("/").pop()?.toUpperCase() ?? "";
    const record = PEOPLE_GROUPS_TEST_RECORDS.find((item) => item.PGID === pgid) ?? null;
    if (!record) {
      await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ message: "Not found" }) });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(record),
    });
  });

  await page.route(/https:\/\/peoplegroups\.org\/wp-json\/pg\/v1\/people-groups(?:\?.*)?$/, async (route) => {
    const url = new URL(route.request().url());
    const pageNumber = Number(url.searchParams.get("page") ?? "1");
    const body = pageNumber === 1 ? PEOPLE_GROUPS_TEST_RECORDS : [];
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Expose-Headers": "X-WP-Total, X-WP-TotalPages",
        "X-WP-Total": String(PEOPLE_GROUPS_TEST_RECORDS.length),
        "X-WP-TotalPages": "1"
      },
      body: JSON.stringify(body)
    });
  });
}
