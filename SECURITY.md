# Security Policy

## Reporting a vulnerability

Do not publish credentials, Access tokens, private account exports, confidential field information or reproducible private-data exposure details in a public GitHub issue.

For a suspected security or privacy vulnerability, contact the repository owner through a private channel available on the owner's GitHub profile or established project contact channel. Include only the minimum information needed to reproduce the problem safely.

Useful details include:

- affected Unreached URL or component;
- release/commit if known;
- browser/device or Worker endpoint involved;
- concise reproduction steps using non-sensitive test data;
- expected versus observed behavior;
- whether authentication, private sync or D1 data integrity is involved.

## Supported release

Security fixes target the current production release and its immediate finalization/release-candidate branch. Historical phase branches are not maintained as supported deployments.

## Sensitive data boundary

Unreached must not be used to publish confidential missionary, church-worker, prayer or field-security information. The private continuity service is limited to Saved/prayer membership, source-backed identity snapshots and the single latest prayer timestamp described in `PRIVACY.md`.

## Operational response

Security incidents are handled under `docs/OPERATIONS_AND_RECOVERY.md`, including credential rotation, D1 recovery and production recertification requirements.
