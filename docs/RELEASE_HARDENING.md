# U11 — Release Hardening & Data Expansion

U11 freezes the V1 product architecture and treats new feature work as out of scope unless required to correct a release defect.

## Release-hardening changes

### Build and deployment

- project version advances to `0.11.0` for the final engineering phase
- build now performs U2–U10 checks plus U11 release-policy and generated-dist checks
- GitHub Actions wrappers are updated to current Node-24-based action releases where available
- Pages deployment still occurs only from `main`
- Vite remains rooted at `/unreached/`

### Browser certification

Playwright 1.62.1 is used for cross-browser production-build smoke tests. See `BROWSER_CERTIFICATION.md`.

### Search and personalization resilience

U10 browser-local state remains deliberately small and versioned. U11 certification includes storage-disabled behavior and route/search smoke checks. There is no account migration or cloud sync path in V1.

### SEO and application identity

The release shell now includes:

- canonical production URL
- index/follow robots metadata
- Open Graph and Twitter summary metadata
- application name and theme color
- `/unreached/`-scoped web manifest
- first-party SVG app icon
- `robots.txt`

Hash routes remain the V1 routing choice. Deep entity pages therefore do not receive independent server-rendered SEO documents. Clean routes/prerendering are a post-V1 architecture decision rather than a release-time rewrite.

### PWA/offline decision

V1 includes install metadata but **does not register a service worker or persistent offline application cache**.

Reason: important mission/editorial datasets can be revocable, corrected or freshness-sensitive. A service worker would introduce another invalidation layer before the source-removal and stale-data lifecycle is mature. Browser HTTP caching and the existing generated static assets are sufficient for V1.

### About / release transparency

The previous U11 placeholder is replaced by a real About page containing:

- core definitions
- methodology rules
- current source permission state
- uncertainty/unknown semantics
- freshness behavior
- boundary disclaimer
- explanation of why source-gated data may be unavailable

## Production-data policy

Data expansion is permission-led, not feature-led. U11 preserves fail-closed production statuses for Joshua Project-derived mission/country/people/language data, ProgressBible registered data and proprietary Ethnologue data. Natural Earth geography remains approved.

See `SOURCE_RELEASE_AUDIT.md`.

## Release candidate boundary

U11 code completion means:

1. all build/data/source-policy checks pass;
2. all Playwright browser projects pass;
3. no known source-permission violation is present;
4. the stacked U11 PR is mergeable.

It does **not** by itself claim that `main` has been deployed or that real-device post-deployment smoke tests have happened. Those are the final V1 certification/promotion gates after the stacked PRs are integrated.
