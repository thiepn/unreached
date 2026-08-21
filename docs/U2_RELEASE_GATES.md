# U2 — Release Gates

**Phase:** Data Pipeline & Domain Model

## Domain model

- [x] Runtime schemas exist for Region, Country, PeopleGroup, PeopleGroupInCountry, Language, Religion, mission metrics, and Scripture resources.
- [x] Stable canonical IDs are defined.
- [x] Unknown and zero values remain distinct.
- [x] Numeric mission values carry quality metadata.
- [x] Field-level provenance model exists.
- [x] Cross-reference and duplicate-ID invariants exist.
- [x] Dataset and manifest schemas are versioned.

## Source pipeline

- [x] Source registry is machine-enforced.
- [x] Development/public/browser permissions are separate gates.
- [x] Joshua Project adapter boundary exists.
- [x] Joshua Project API key is build-time only.
- [x] Deprecated resource fields are excluded.
- [x] Provider `LeastReached`/frontier classifications are retained rather than silently recalculated.
- [x] Deterministic chunk builder exists.
- [x] SHA-256 chunk integrity metadata exists.
- [x] Synthetic cross-linked development fixtures exist.
- [x] Generated fixture output is not committed.

## Policy checks

- [x] Joshua Project development ingestion allowed.
- [x] Joshua Project public release remains blocked until permission gate changes.
- [x] Joshua Project browser redistribution remains blocked until permission gate changes.
- [x] Natural Earth public release allowed.
- [x] ProgressBible registered data remains blocked without permission.

## Validation

- [x] script TypeScript check passes
- [x] application TypeScript check passes
- [x] source-registry validation passes
- [x] synthetic raw adapters pass
- [x] normalized dataset schema passes
- [x] cross-reference invariants pass
- [x] deterministic chunk test passes
- [x] Vite production build passes

GitHub Actions U2 CI passed on 2026-08-21 after correcting a heterogeneous-collection invariant typing defect discovered by the first CI run.

## External release gates retained from U0

- Full-scale Joshua Project-derived static publication still requires written confirmation.
- Third-party imagery still requires per-item rights approval.

These gates do not block U3 map development using synthetic/local approved data.

## Exit condition

U2 is **code-complete and build-validated**. U3 can consume the normalized data contracts without depending on raw provider API shapes or client-side credentials.
