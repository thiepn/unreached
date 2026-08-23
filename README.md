# Unreached

**Explore the peoples. Understand their world. Pray for the nations.**

Unreached is a browser-based Christian world atlas for discovering unreached peoples, exploring country, language and mission context, and praying with source-aware information.

- **Live site:** https://www.thiepn.dev/unreached/
- **Repository:** https://github.com/thiepn/unreached
- **Platform:** static Preact/Vite application deployed through GitHub Pages
- **Core loop:** **Explore → Understand → Pray**
- **Current phase:** **U12F — Reviewed Editorial Context Migration & Identity Correction**

## Real-data architecture

U12 uses **PeopleGroups.org / IMB Global Research** as the production people-group runtime source. The public application reads the provider's read-only API directly from the browser; Unreached does **not** ship a bundled mirror of the PeopleGroups.org corpus.

### Identity and methodology

A full live-corpus audit on **23 August 2026** established the current API identity behavior used by this release:

- 12,370 **PGIDs**
- 12,370 **PEIDs**
- zero PEIDs attached to more than one PGID
- zero PEIDs spanning more than one country
- every current PGID numeric suffix equals its PEID

Accordingly:

- **PGID** is treated as the PeopleGroups.org people-group-in-country source record identifier.
- **PEID** remains the provider's numeric entity field and the compatibility key used by existing Unreached routes, but it is **not** treated as a cross-country grouping key.
- Every current runtime people profile contains exactly one PEID/PGID country-context record.
- Duplicate PEIDs fail closed because they would violate the certified current-provider contract.
- Cross-country related records use explicit source taxonomy, prioritizing **`PplNm` / ROP3 people name**, followed by source cluster and affinity bloc. They are never manufactured by PEID aggregation.
- Valid PeopleGroups.org **ROL / ISO 639-3** values identify live language records.
- Reviewed editorial context is attached only through explicitly certified PEID + PGID + name + country + language evidence.
- Legacy numeric IDs are never treated as PEIDs merely because the numbers happen to match.
- IMB **GSEC** remains source-native:
  - GSEC 0–3 → `unreached`
  - GSEC 4–6 → `other`
  - missing → `unknown`
- `other` is deliberately not renamed `reached`.
- Joshua Project `JPScale`, `Frontier`, and exact evangelical percentages are not fabricated from IMB fields.
- Bible and Jesus Film fields remain raw source availability labels rather than translation-completeness claims.
- Unknown values remain unknown rather than being silently converted to zero.

### Production publication modes

| Domain | Production state |
| --- | --- |
| Mission atlas | Natural Earth geography + live PeopleGroups.org PGID country-context aggregation |
| Peoples | One live PeopleGroups.org PEID/PGID source record per route |
| Countries | Natural Earth geography + live PeopleGroups.org country-context records |
| Languages & resources | Live PeopleGroups.org ISO 639-3 aggregation over PGID source records + raw resource fields |
| Prayer | One live GSEC 0–3 source record + fixed release-certified prayer template |
| Reviewed editorial context | Reviewed source-record-authored profiles with intentionally partial coverage |
| ProgressBible translation-progress data | Permission-gated and not used |
| Ethnologue proprietary taxonomy | Permission-gated and not used |

PeopleGroups.org runtime reads are policy-approved independently from static redistribution. The reviewed editorial layer publishes authored claims and source links rather than a static mirror of the provider database. Third-party people-photo reuse remains blocked unless separately authorized.

## Live product surfaces

### Mission Atlas

The root map uses the shared PeopleGroups.org runtime corpus. Its production layers are intentionally limited to source-native or narrowly derived measures:

- **GSEC 0–3 population share** — among PGID records with both known population and known GSEC
- **GSEC 0–3 context share** — among PGID records with known GSEC
- **GSEC coverage** — share of represented PGID records with a reported GSEC value
- **Population estimate coverage** — share of represented PGID records with a population estimate
- **People-group contexts** — direct count of PeopleGroups.org PGID country-context records

Every layer preserves no-data states. Population/context denominators are explicit and are not presented as national census statistics. The atlas does not infer Frontier, JPScale, normalized Scripture completeness, or an evangelical percentage from incompatible fields.

### People Explorer

`#/peoples` searches and filters current PeopleGroups.org people-group-in-country records by:

- source-native GSEC status
- country
- source-backed language and religion
- raw Bible availability label
- source population estimate
- PEID / PGID / people / country text search

`#/peoples/:PEID` keeps the existing numeric route for compatibility but displays one current PEID/PGID record only:

- PEID and PGID source identity
- country
- population estimate when reported
- GSEC and evangelical-level source text
- language and religion source labels
- Bible / Jesus Film availability
- engagement and church-planting fields where reported
- PeopleGroups.org taxonomy, including `PplNm` / ROP3 people name
- attributed provider descriptions
- source update date and methodology notes
- reviewed contextual article when one has passed the U12F publication gate

Related records across countries are shown only from explicit source taxonomy. Matching ROP3 people names rank above shared cluster or affinity-bloc relationships.

### Reviewed Editorial Context

The U7 editorial model is migrated to schema v2 and attaches to a **specific current PeopleGroups source record**, not an inferred global PEID aggregate.

A published contextual profile carries:

- target PEID and canonical `people-entity:peoplegroups:<PEID>` route identity
- verified PGID anchor(s)
- country and ISO 639-3 identity anchors
- verified people name
- explicit identity-match evidence
- source-cited factual claims
- multi-source synthesis where needed
- clearly labeled interpretation where appropriate
- current-claim `asOf` and `reviewAfter` dates
- sensitivity and editorial-review metadata

Publication fails closed when PEID, PGID, country, language or verified name no longer matches the current PeopleGroups.org corpus. A legacy ID may be retained only as migration provenance and cannot establish identity by numeric coincidence.

Coverage is intentionally partial. Records without a reviewed contextual article retain their live source profile and receive a clear unpublished state rather than generic AI-generated cultural, religious or spiritual filler.

The first U12F production profile is **Fon of Benin — PEID 12319 / PG012319**. The live API record, human-readable PeopleGroups profile, resource material and external historical sources are kept distinct and cited claim-by-claim.

### Country Explorer

`#/countries` and `#/countries/:ISO3` combine Natural Earth geography with PeopleGroups.org people-group-in-country records.

Country aggregation explicitly identifies its denominator. Represented population and religion/language shares are based only on source records with known values; they are not presented as national census statistics.

### Languages & Resources

`#/languages` groups the shared runtime corpus by valid PeopleGroups.org `ROL` / ISO 639-3 code.

`#/languages/:ISO6393` displays:

- source-reported language name and family
- number of PEID/PGID people-group records reporting the ISO code
- country count
- represented population with population-field coverage
- GSEC 0–3 / 4–6 / unknown record counts
- links to each separate people-group-in-country record
- raw Bible availability-label distribution
- raw Jesus Film availability-label distribution
- raw total-resource-field coverage and values
- source load date and newest provider update date
- explicit denominator: PeopleGroups.org PGID country-context records reporting that ISO 639-3 language

Same-named people records in multiple countries remain separate records. The language surface does **not** infer `translation-needed`, `portions`, `New Testament`, or `complete Bible` from PeopleGroups.org's generic Bible-availability field. ProgressBible registered translation-progress data and Ethnologue proprietary taxonomy remain excluded without compatible permission.

### Prayer

`#/pray` uses current PeopleGroups.org records whose own GSEC value is 0–3 as prayer subjects.

Prayer wording comes from fixed release-certified template **`u12c-v1`**. Runtime interpolation is limited to the selected source record's people name, country, PEID/PGID, GSEC, and resource fields. Same-named records in other countries are not silently merged into the prayer profile, and Unreached does not generate arbitrary person-by-person factual or spiritual claims.

Focused prayer keeps the existing 2/5/10-minute pacing modes without scores, streaks, leaderboards, completion ranks, or public prayer activity.

### Search, Saved, and Recent

- `/` or `Ctrl/Cmd+K` opens global search.
- Opening search lazily loads the shared live people/country/language runtime corpus; the closed dialog does not trigger a large source download.
- Current GSEC 0–3 people-group records can be saved locally for prayer.
- People, country and language recent visits remain browser-local under `unreached.personal.v1`.
- Legacy saved snapshots remain readable after the identity correction; legacy `mixed` state is retained only as backward-compatible snapshot metadata.

## Runtime reliability

PeopleGroups.org responses are treated as untrusted external input.

The runtime includes:

- Zod validation
- 10-second per-request timeout
- maximum 250 records/page
- maximum 100 pages / 25,000 records
- pagination and advertised-count consistency checks
- duplicate PGID detection
- duplicate PEID rejection under the current certified identity contract
- GSEC 0–6 bounds
- fail-closed schema drift handling
- one shared application-session corpus store
- origin-local IndexedDB cache
- 24-hour fresh cache window
- 7-day explicit stale fallback window
- best-effort cache behavior so browser-storage failure cannot block a healthy live API

The normal browser suite uses a deterministic intercepted provider corpus that follows the current one-PEID/one-PGID contract. A separate **PeopleGroups Live Certification** workflow checks individual editorial anchors, the complete real corpus, and browser CORS/API behavior. It also verifies every published editorial PEID/PGID/country/language identity mapping against current provider data.

## Local development

Requires Node.js 22.12+.

```bash
npm install
npm run dev
```

Full production validation:

```bash
npm run check
```

Important focused checks:

```bash
npm run data:check
npm run peoplegroups:check
npm run peoplegroups:runtime-check
npm run peoplegroups:visible-check
npm run peoplegroups:editorial-identity-live-check
npm run peoplegroups:live-corpus-check
npm run geography:check
npm run visualization:check
npm run visualization:live-check
npm run country:check
npm run people:check
npm run context:check
npm run prayer:check
npm run language:check
npm run discovery:check
npm run release:check
npm run e2e
```

Vite is configured for the `/unreached/` project path.

## Current stack

- Vite 8
- TypeScript 7
- Preact 10
- MapLibre GL JS 5.24
- Natural Earth v5.1.1 Admin-0 geography
- Zod runtime schemas
- browser-local IndexedDB + localStorage personalization
- GitHub Actions + GitHub Pages
- locally bundled Newsreader + Source Sans 3 typography
- no backend, account system, analytics SDK, external map tile service, prayer scoring, or client-side API secret

## Development phases

- **U0 — Product Constitution, Definitions & Data Legality** ✅
- **U1 — Production Architecture & Design System** ✅
- **U2 — Data Pipeline & Domain Model** ✅
- **U3 — Global Map Foundation** ✅
- **U4 — Mission Visualization Engine** ✅
- **U5 — Country Explorer** ✅
- **U6 — People Group Explorer** ✅
- **U7 — Context & Why Unreached?** ✅ architecture/review system; production migration completed through U12F
- **U8 — Prayer Experience** ✅
- **U9 — Languages & Scripture Integration** ✅ architecture; legacy publication dataset superseded by U12E runtime semantics
- **U10 — Search, Discovery & Local Personalization** ✅
- **U11 — Release Hardening & Data Expansion** ✅
- **U12A — Provider Foundation & Semantic Isolation** ✅
- **U12B — Real Data Runtime Architecture** ✅ with PEID semantics corrected by U12F live-corpus certification
- **U12C — Visible Real-Data Integration** ✅ with people-record semantics corrected by U12F
- **U12D — Live Mission Visualization** ✅
- **U12E — Live Language & Resource Integration** ✅ production-certified; people-record terminology corrected by U12F
- **U12F — Reviewed Editorial Context Migration & Identity Correction** 🚧 implementation/certification

See [`docs/U12_RELEASE_GATES.md`](docs/U12_RELEASE_GATES.md) and [`docs/PEOPLEGROUPS_RUNTIME_ARCHITECTURE.md`](docs/PEOPLEGROUPS_RUNTIME_ARCHITECTURE.md) for the data/publication contract.

## Product rule

A feature belongs only if it directly strengthens **Explore → Understand → Pray** while preserving source meaning, uncertainty, editorial provenance, and user privacy.
