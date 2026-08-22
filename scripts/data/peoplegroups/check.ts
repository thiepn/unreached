import { adaptPeopleGroupsRecord, rawPeopleGroupsRecordSchema } from "./adapter.js";

const retrievedAt = "2026-08-22T20:00:00.000Z";

const officialApiExample = {
  OBJECTID: 10508,
  PEID: 12345,
  PGID: "PG012345",
  Name: "Nateni",
  NmDisp: "Nateni",
  NmAlt: null,
  ISOalpha3: "BEN",
  Ctry: "Benin",
  Regn: "Africa",
  RegnSub: "Western Africa",
  Pop: 131000,
  Rlgn: "Ethnoreligion - Animism",
  Lang: "Nateni",
  LangFamily: "Atlantic-Congo",
  ROL: "ntm",
  LPI: 1,
  LPIname: "Pioneer Unreached People Group",
  LPIdesc: "0.1% to 0.5% Evangelical",
  SPI: 1,
  SPIdesc: "Engaged yet Unreached",
  GSEC: 1,
  GSECbrf: "Less than 2% Evangelical, No Active CP Activity",
  GSEClng: "this people group is less than 2% evangelical, some evangelical resources are available, but there has been no active church planting among them within the past two years",
  EvngLvl: "Less than 2%",
  CongExst: "Yes",
  Plnting: "No Churches Planted",
  EngStat: "Engaged",
  Bible: "Available",
  Jesus: "Not Available",
  ResTot: 3,
  PeopleDesc: "an indigenous community of Benin; a dialect subgroup of Nateni (ntm)",
  PicURL: "https://joshuaproject.net/assets/media/profiles/photos/p13251.jpg",
  PicCrdt: "Photo courtesy of Joshua Project. Photo Source: Matt & Sarah Murdock",
  Photo: "Y",
  Latitude: 10.52,
  Longitude: 1.22,
  UpdatedDate: "2026-03-27T04:24:27.000+00:00",
};

const record = adaptPeopleGroupsRecord(officialApiExample, { retrievedAt });

if (record.sourceId !== "peoplegroups-org-api") throw new Error("PeopleGroups source identity was not preserved.");
if (record.sourceRecordId !== "PG012345" || record.peopleEntityId !== 12345) throw new Error("PGID/PEID identities were not preserved.");
if (record.country.iso3 !== "BEN" || record.language.iso6393 !== "ntm") throw new Error("Country/language identifiers were not normalized correctly.");
if (record.population.value !== 131000 || record.population.quality !== "estimated") throw new Error("Population estimate semantics changed.");
if (record.coordinates?.latitude !== 10.52 || record.coordinates.longitude !== 1.22) throw new Error("Coordinates were not preserved.");
if (record.mission.methodology !== "imb-peoplegroups") throw new Error("IMB methodology marker missing.");
if (record.mission.evangelicalLevel !== "Less than 2%") throw new Error("Evangelical-level descriptor changed.");
if (record.mission.gsec.code !== 1 || record.mission.lpi.code !== 1 || record.mission.spi.code !== 1) throw new Error("IMB mission indices were not preserved.");
if (record.resources.bibleAvailability !== "Available") throw new Error("Bible availability source label changed.");
if (record.photoReference?.redistributionApproved !== false) throw new Error("Third-party photo reference must remain non-redistributable by default.");
if (record.sourceUpdatedAt !== officialApiExample.UpdatedDate) throw new Error("Source freshness timestamp was lost.");

const mission = record.mission as Record<string, unknown>;
for (const forbidden of ["jpScale", "frontier", "percentChristian", "percentEvangelical"]) {
  if (forbidden in mission) throw new Error(`IMB staging adapter must not fabricate Joshua-specific mission field: ${forbidden}`);
}

const bible = record.resources as Record<string, unknown>;
if ("bibleStatus" in bible) throw new Error("PeopleGroups 'Bible: Available' must not be converted into a translation-completeness status without a defined mapping.");

const missionProvenance = record.provenance.find((item) => item.field === "mission.gsec");
if (!missionProvenance || missionProvenance.sourceId !== "peoplegroups-org-api") throw new Error("Mission provenance is incomplete.");
if (!missionProvenance.transformation?.includes("not mapped to Joshua Project JPScale")) throw new Error("Cross-methodology non-mapping rule is not recorded in provenance.");

let invalidCoordinateRejected = false;
try {
  adaptPeopleGroupsRecord({ ...officialApiExample, Latitude: 95 }, { retrievedAt });
} catch {
  invalidCoordinateRejected = true;
}
if (!invalidCoordinateRejected) throw new Error("Invalid coordinates must fail closed.");

let invalidIdRejected = false;
try {
  rawPeopleGroupsRecordSchema.parse({ ...officialApiExample, PGID: "12345" });
} catch {
  invalidIdRejected = true;
}
if (!invalidIdRejected) throw new Error("Invalid PeopleGroups PGID must fail closed.");

console.log("U12A PeopleGroups.org staging adapter checks passed.");
