# Unreached — Operations, Retention and Recovery

## Scope

This document defines the maintenance baseline for the public GitHub Pages application, the PeopleGroups.org runtime dependency and the optional Cloudflare Worker + D1 private-continuity service. It does not introduce analytics, prayer-performance tracking or additional user data.

## Private-sync retention

### `sync_users`

The authenticated email address is used transiently to verify identity and to derive the SHA-256 user key. The private service does not intentionally retain the plaintext email address after the Phase 4 migration. The legacy `email` storage column remains for rollback compatibility but is scrubbed to the hash value, and D1 triggers force both that compatibility column and `identity_hash` to equal `user_id`.

The account row is retained until the user deletes private account data. Account deletion remains the authoritative retention boundary and cascades dependent rows.

### `sync_items`

Active Saved/prayer entries and deletion tombstones are retained until account deletion or a future protocol migration that proves an equivalent anti-resurrection guarantee.

Tombstones must **not** receive a simple age-based TTL. An old offline device can reconnect after an arbitrary interval; removing the tombstone would allow stale state to resurrect a deletion that was already accepted elsewhere.

### `sync_mutations`

Mutation identifiers and their outcomes are retained until account deletion under the current protocol. They provide retry idempotency. They are not prayer history and do not store prayer-event details.

The mutation ledger must **not** be pruned by a simple age-based TTL in the current protocol. A sufficiently old duplicate mutation could otherwise be accepted again after its idempotency record disappeared. Compaction requires a future protocol revision with an explicit causal horizon/device-acknowledgement mechanism.

### Prayer timestamps

Only the single latest `lastPrayedAt` timestamp for an active prayer-list item is retained. Intermediate prayer events, counts, totals, streaks, completion history and session history remain out of scope.

## Account deletion

`DELETE /unreached-sync/private/account` deletes the `sync_users` row for the authenticated hash-derived user key. Foreign-key cascades delete the associated `sync_items` and `sync_mutations` rows. The current browser then disconnects private sync. Device-local Saved/prayer data remains until the user separately clears browser storage.

A deletion incident check should verify:

1. the authenticated account endpoint returned `{ deleted: true }`;
2. a new authenticated snapshot for that account starts from an empty server state;
3. no old item or mutation row is returned;
4. local browser data was not falsely represented as server-deleted.

## D1 backup and point-in-time recovery

Cloudflare D1 Time Travel is the primary production point-in-time recovery mechanism. Current Cloudflare documentation states that Time Travel is automatic for production-storage D1 databases and provides a plan-dependent recovery window. Always verify the active account/database window before relying on a specific duration.

Before every production migration, the deployment workflow captures the current Time Travel bookmark with:

```sh
npx wrangler d1 time-travel info unreached-private-continuity --config wrangler.generated.jsonc
```

`d1 time-travel info` operates on the remote D1 database; it does not use a `--remote` flag. The output is uploaded as deployment evidence. This is a recovery reference, not a database export.

For recovery beyond the currently available Time Travel window, a manual SQL export may be taken during an announced maintenance window. Do not schedule full D1 exports as a routine high-frequency job: Cloudflare documents that an export can block other database requests while it runs.

## Migration procedure

1. Run the isolated Worker certification, including local migrations and schema assertions.
2. Confirm root and Worker dependency audits are green.
3. Capture the production D1 Time Travel bookmark.
4. Apply remote migrations.
5. Verify the expected schema/data invariant before deployment continues.
6. Deploy the Worker.
7. Verify the public health endpoint and Access protection in the deployment workflow.
8. Require **Unreached Worker Production Certification** to verify the deployed Worker security headers, production-origin CORS contract and Access boundary.
9. Run scheduled/explicit operations health against the public application, PeopleGroups.org and Worker.

For the Phase 4 identity migration specifically, verify:

- `identity_hash` exists;
- every `sync_users.identity_hash` equals `user_id`;
- every legacy `sync_users.email` value also equals `user_id` rather than a plaintext address;
- the hash-enforcement triggers exist.

## Rollback

### Application-only regression

If a GitHub Pages change is defective and no persistent schema was changed, redeploy the last certified application SHA and run canonical production certification again.

### Worker regression without D1 corruption

If the deployed Worker is defective but the database state is valid, prefer a forward fix compatible with the current schema. Do not blindly deploy a historical Worker that predates a privacy/schema migration.

### Migration or D1 corruption

If a migration produced an invalid database state:

1. stop further migrations/writes where practical;
2. identify the pre-migration bookmark captured by the deployment;
3. verify that the bookmark corresponds to the intended deployment boundary;
4. restore D1 with Time Travel using the documented Cloudflare restore command and that bookmark/timestamp;
5. deploy the Worker version compatible with the restored schema;
6. run Worker health, Access protection and private-sync certification;
7. record the incident and the restore bookmark returned by Cloudflare so the restore itself can be undone if necessary.

A Time Travel restore is destructive and cancels in-flight operations. Treat it as an incident action, not a routine rollback button.

## Monitoring

### Every six hours

`Unreached Operations Health` checks:

- canonical GitHub Pages entry point;
- public privacy page and manifest identity;
- a lightweight PeopleGroups.org runtime request plus production-origin CORS;
- private-sync Worker health and security headers;
- Access bootstrap non-anonymous behavior.

It publishes the `unreached/operations-health` commit status.

### Weekly

`PeopleGroups Live Certification` performs the heavier live-corpus/CORS/editorial-identity audit once per week in addition to existing release-triggered runs.

`Dependency Security and License Audit` performs root/Worker vulnerability and dependency-license checks once per week and produces SBOM evidence.

### Release/deployment triggered

Normal CI, browser certification, PeopleGroups live certification, private-sync certification/deployment and canonical Pages certification remain blocking release evidence on relevant changes.

`Unreached Worker Production Certification` runs after a successful private-sync deployment and verifies the actual deployed Worker health response, security headers, CORS policy and unauthenticated Access boundary. It publishes `unreached/worker-production` against the deployed Worker SHA.

## Incident response

### Severity 1 — privacy/auth/data integrity

Examples: unauthorized private data access, plaintext identity persistence, cross-account state, destructive D1 corruption.

- Disable or isolate the affected private-sync path if necessary.
- Preserve logs and the current D1 Time Travel bookmark.
- Stop migrations/deployments that could destroy evidence.
- Determine affected data/account scope.
- Restore or forward-fix only after the scope is understood.
- Re-run private-sync and operations certification before reopening normal service.

### Severity 2 — production availability or provider breakage

Examples: canonical Pages outage, Worker outage, incompatible PeopleGroups schema/CORS change.

- Confirm whether the failure is app, hosting, Worker or upstream-provider specific.
- Preserve local-only functionality; do not convert an upstream outage into destructive cache/data behavior.
- Use the last validated PeopleGroups browser snapshot only within the documented stale-fallback policy.
- Restore service and rerun the relevant production gate.

### Severity 3 — non-destructive regression

Examples: UI/browser compatibility regression without data loss or privacy impact.

- Fix or revert the affected code.
- Run the full browser matrix and canonical deployment certification.

## Credentials and least privilege

- GitHub Actions receives Cloudflare credentials only in the private Worker deployment workflow.
- Credentials must never be committed, echoed into public artifacts or bundled into the frontend.
- Prefer narrowly scoped Cloudflare API tokens over global credentials.
- Rotate deployment credentials after suspected exposure and verify the old token is revoked.
- Access JWTs remain session-only in the browser and are never written to localStorage.

## GitHub repository protection

`main` should require pull requests and the relevant CI/certification checks before release integration. Repository-protection configuration is an external GitHub administration setting, not something the application build can enforce. Its state must be verified during the final Phase 5 release audit.

## Maintenance cadence

Monthly or before each release candidate:

- review dependency/security alerts;
- confirm scheduled health workflows are succeeding;
- review provider terms and source-policy dates when due;
- verify D1 Time Travel availability for the active plan/database;
- verify Cloudflare deployment token scope;
- inspect failed production-status checks rather than suppressing them;
- keep product scope frozen unless a separately approved release reopens development.
