# U2 — Data Architecture

## Goal

Unreached owns a stable normalized domain model. External providers are adapters, not the application model.

```text
approved source
    ↓
build-time fetch / snapshot
    ↓
raw source adapter
    ↓
runtime schema validation
    ↓
normalized entities + field provenance
    ↓
cross-reference invariants
    ↓
deterministic chunk builder
    ↓
versioned manifest
    ↓
static browser data files (only after release-policy approval)
```

The browser must never require a Joshua Project API key and must never depend directly on raw provider field names.

## Canonical entities

### Region
Stable region identity and display name.

### Country
`country:<ISO3>` identity, region relationship, population metric, and mission summary. U2 can derive a minimal country shell from PGIC data; U5 will enrich it from the country endpoint.

### PeopleGroup
Global people-group identity (`people:<PeopleID3>`), global population, language/religion relationships, and source-provided global mission classification.

### PeopleGroupInCountry
Country-specific expression of a global people group (`people-country:<PeopleID3>:<ISO3>`), with population, location, coordinates, mission metrics, and Scripture/resource status.

### Language
`language:<ISO639-3>` identity, status, scope counts, mission summary, and Scripture/resource status.

### Religion
Normalized Joshua Project primary-religion code and label.

## Values and uncertainty

Population and percentage values are modeled as `{ value, quality, asOf }` rather than naked numbers.

Rules:

- missing stays `null` / `unknown`;
- rounded and estimated source data must not be presented as exact;
- `0` is different from unknown;
- source classifications are retained rather than recomputed at ingest time;
- display formatting belongs to UI layers, not the data pipeline.

## Provenance

Imported entities carry field-level provenance records with:

- normalized field path;
- source ID;
- source record ID;
- source field;
- retrieval timestamp;
- source date when available;
- transformation note.

This permits future UI source disclosure and makes transformed values auditable.

## Source-policy enforcement

`data/source-registry.json` is now operational, not merely descriptive. Every source declares three explicit gates:

- `developmentIngestionAllowed`
- `publicReleaseAllowed`
- `browserRedistributionAllowed`

U2 CI proves that:

- Joshua Project is allowed for development ingestion;
- Joshua Project public/static redistribution remains blocked pending the U0 permission gate;
- Natural Earth is allowed for public release;
- ProgressBible registered data remains blocked without permission.

No later build step should bypass these gates.

## Fixtures

`data/fixtures/joshua.synthetic.json` contains intentionally fictional values. It validates the pipeline without copying or publishing a real mission dataset.

Generated fixture artifacts are ignored by Git and are never a production source.

## Deterministic chunks

Normalized records are sorted by stable entity ID before chunking. Every chunk receives a SHA-256 digest and is listed in a manifest.

Default chunk size: 250 records.

This gives later phases:

- predictable caching;
- integrity verification;
- selective browser loading;
- reproducible builds;
- a clean migration path when schemas change.

## Versioning

There are two independent versions:

1. `schemaVersion` — shape/semantics of normalized data.
2. `datasetVersion` — a particular generated snapshot.

A schema change requires a migration or regeneration strategy. A routine source refresh normally changes only the dataset version.

## Secrets

`JOSHUA_PROJECT_API_KEY` is build-time only.

- `.env*` files are ignored except `.env.example`.
- the Vite client receives no key.
- CI validation does not call Joshua Project.
- source fetching must run only in an authorized build/local environment.
- request URLs containing the key must never be logged.

## Security and sensitive data

The normalized U2 model intentionally does not ingest or expose worker identities, underground church locations, covert contact information, or other sensitive ministry details. Future fields must pass the U0 safety policy before entering the model.

## Production-data gate

U2 proves architecture using synthetic fixtures only. A public mission dataset is not generated in this phase. Full Joshua Project-derived static publication remains blocked until the written-permission gate recorded in U0 is satisfied.
