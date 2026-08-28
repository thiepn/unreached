# Phase 4 — Reproducibility, Security and Operations

## Goal

Make the feature-complete Unreached release reproducible, defensible and maintainable without adding product scope.

## Reproducible toolchain

- Application and Worker dependency graphs are committed as npm lockfileVersion 3 lockfiles.
- CI and deployment use `npm ci` rather than resolver-changing `npm install`.
- Node is pinned by repository `.nvmrc` to `22.23.2` across workflows.
- Generated Wrangler configuration, Playwright reports and transient test artifacts are ignored.

## Dependency assurance

`Dependency Security and License Audit` runs for dependency changes, on main, manually and weekly. It:

1. installs both graphs from the lockfiles;
2. blocks high-or-critical npm audit findings;
3. checks lockfile license metadata and rejects clearly restrictive/strong-copyleft identifiers pending manual review;
4. generates application and Worker CycloneDX SBOM artifacts.

Dependency/license policy remains separate from `THIRD_PARTY_NOTICES.md`; the audit prevents unnoticed graph drift while the notice explains the release licensing boundary.

## Private-sync identity minimization

Cloudflare Access still verifies the authenticated email transiently because it is the identity claim used to derive the stable account key. D1 no longer intentionally retains that plaintext value.

Migration `0003_hash_only_identity.sql`:

- adds `identity_hash`;
- replaces existing legacy `email` values with the SHA-256-derived `user_id`;
- backfills `identity_hash` from `user_id`;
- installs compatibility triggers so both the legacy column and semantic hash column remain hash-only even if an older compatible SQL path writes the legacy column.

The new Worker writes only the hash value into persistent identity fields. The verified email may still be returned to the currently authenticated browser in the account response, but it is not used as a D1 persistence field.

Tombstones and mutation IDs are not given arbitrary TTLs because doing so would weaken stale-device deletion protection and retry idempotency under the existing protocol.

## Security controls

### Public application

The static application and privacy page carry document-level Content Security Policy and `no-referrer` policy metadata. The app policy limits scripts/fonts/assets to expected origins and restricts network connections to the application origin, PeopleGroups.org and the private-sync Worker, with localhost WebSocket allowances for development.

GitHub Pages does not provide repository-controlled arbitrary response-header configuration. These meta policies are therefore intentionally described as document-level defenses, not as a substitute for edge HTTP headers. Stronger response-header enforcement would require control of the serving proxy/CDN/DNS path outside this repository.

### Private Worker

Worker responses retain `no-store`, CSP, `no-referrer` and `nosniff`, and add explicit framing and browser-capability restrictions. The auth bootstrap remains intentionally compatible with the opener flow; cross-origin isolation headers that would sever `window.opener` are not enabled.

## Recovery controls

The private Worker deployment captures a D1 Time Travel bookmark before migrations and retains the output as deployment evidence. Remote schema/data invariants are checked after migrations and before release completion.

The recovery procedure, tombstone/mutation retention rationale, account deletion validation, incident severities and rollback sequence are documented in `docs/OPERATIONS_AND_RECOVERY.md`.

## Monitoring

- PeopleGroups full-corpus certification: weekly plus existing release-triggered runs.
- Pages/PeopleGroups/Worker lightweight operational health: every six hours.
- Dependency vulnerability/license audit: weekly plus dependency-change runs.
- Existing canonical Pages and private Worker deployment gates remain authoritative for release changes.

## Blocking gate

`scripts/operations/phase4-check.ts` runs inside the production build and rejects:

- absent/drifted lockfiles;
- unpinned Node workflows;
- `npm install` in CI/deployment where `npm ci` is required;
- missing scheduled health/audit workflows;
- missing static CSP/referrer policy;
- missing Worker security headers;
- plaintext-email persistence paths;
- missing hash-only D1 migration controls;
- missing recovery/retention documentation;
- generated deployment artifacts not ignored by Git.

## Exit criterion

Phase 4 is complete only when one exact PR SHA passes application CI, full browser certification, private-sync Worker certification and dependency/security/license audit. After merge, the same integrated line must pass Pages deployment/canonical certification, PeopleGroups live certification, private Worker deployment/health checks and scheduled-operations health before Phase 5 begins.
