# Joshua Project → Unreached Mapping Baseline

**Reviewed:** 2026-08-21  
**API:** Joshua Project v1

U2 supports the stable fields required by the V1 product. Raw source objects are parsed with passthrough schemas so unrecognized provider fields do not automatically become part of the Unreached public model.

## PGIC — People Groups in Countries

| Joshua Project | Unreached |
|---|---|
| `PeopleID3` | global `peopleGroupId` |
| `ISO3` | `countryId` |
| `PeopNameInCountry` | name |
| `Population` | estimated population metric |
| `ROL3` | primary language relationship |
| `RLG3` | primary religion relationship |
| `RegionCode` | region relationship |
| `LocationInCountry` | location text |
| `Latitude`, `Longitude` | coordinates |
| `PercentAdherents` | Christian-adherent percentage |
| `PercentEvangelical` | evangelical percentage |
| `LeastReached` | unreached/reached classification |
| `Frontier` | frontier flag |
| `JPScale` | JP progress scale |
| `BibleStatus` | normalized Scripture enum |
| `PortionsYear`, `NTYear`, `BibleYear` | Scripture milestone text |
| `HasAudioRecordings` | audio resource flag |
| `HasJesusFilm` | Jesus Film resource flag |

`LeastReached` is retained as the provider classification. U2 does not infer it from percentages.

## PGAC — People Groups Across Countries

| Joshua Project | Unreached |
|---|---|
| `PeopleID3` | `people:<id>` |
| `PeopleName` | global name |
| `AffinityBloc` | affinity bloc |
| `PeopleCluster` | cluster |
| `PopulationPGAC` | global population |
| `ROL3PGAC` | primary language relationship |
| `RLG3PGAC` | primary religion relationship |
| `PercentChristianPGAC` | Christian-adherent percentage |
| `PercentEvangelicalPGAC` | evangelical percentage |
| `LeastReachedPGAC` | global unreached/reached classification |
| `FrontierPGAC` | global frontier flag |
| `JPScalePGAC` | global progress scale |

`ROG3Largest` is not promoted to an ISO3 country relationship because ROG3 and ISO3 are different registries. U2 does not guess that mapping.

## Languages

| Joshua Project | Unreached |
|---|---|
| `ROL3` | `language:<ISO639-3>` |
| `Language` | name |
| `Status` | normalized language-status enum |
| `NbrCountries` | country count |
| `NbrPGICs` | people-group-in-country count |
| `RLG3` | primary religion relationship |
| `PercentAdherents` | Christian-adherent percentage |
| `PercentEvangelical` | evangelical percentage |
| `LeastReached` | source-derived language unreached classification |
| `JPScale` | source-derived language progress scale |
| `BibleStatus` | normalized Scripture enum |
| `PortionsYear`, `NTYear`, `Bible` | Scripture milestones |
| `HasAudioRecordings` | audio resource flag |
| `HasJesusFilm` | Jesus Film resource flag |

## Deliberately excluded in U2

- deprecated `AudioRecordings` and `JF` fields;
- provider profile prose and summaries;
- `HowReach` and `Obstacles` as ready-to-display editorial content;
- photos and maps without separate rights validation;
- detailed security/worker information;
- ambiguous provider codes whose semantics are not documented well enough for stable normalization.

Later phases may add fields only with a documented mapping, provenance, safety review, and source-policy approval.
