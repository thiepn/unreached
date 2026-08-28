from pathlib import Path
import json


def read(path: str) -> str:
    return Path(path).read_text(encoding="utf-8")


def write(path: str, text: str) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(text, encoding="utf-8")


# Package scripts: make Phase 4 a blocking build policy.
pkg = json.loads(read("package.json"))
pkg["scripts"]["operations:check"] = "tsx scripts/operations/phase4-check.ts"
pkg["scripts"]["audit:licenses"] = "node scripts/operations/dependency-license-audit.mjs"
build = pkg["scripts"]["build"]
if "npm run operations:check" not in build:
    build = build.replace("npm run css:check && npm run release:check", "npm run css:check && npm run operations:check && npm run release:check")
pkg["scripts"]["build"] = build
write("package.json", json.dumps(pkg, indent=2) + "\n")

# Generated/transient files must never be committed.
ignore = read(".gitignore")
for entry in ["worker/wrangler.generated.jsonc", "worker/.wrangler/", ".wrangler/", "playwright-report/", "test-results/", "coverage/", ".audit/", ".recovery/"]:
    if entry not in ignore.splitlines():
        ignore += entry + "\n"
write(".gitignore", ignore)

# Existing workflows use the same pinned Node and lockfile-preserving npm ci.
workflows = [
    ".github/workflows/ci.yml",
    ".github/workflows/browser-cert.yml",
    ".github/workflows/deploy-pages.yml",
    ".github/workflows/deploy-sync-worker.yml",
    ".github/workflows/peoplegroups-live.yml",
    ".github/workflows/sync-worker-cert.yml",
]
for path in workflows:
    text = read(path)
    text = text.replace('node-version: "22"', 'node-version-file: ".nvmrc"')
    text = text.replace("node-version: 22", 'node-version-file: ".nvmrc"')
    text = text.replace("npm install --no-audit --no-fund", "npm ci --no-audit --no-fund")
    write(path, text)

people = read(".github/workflows/peoplegroups-live.yml")
if "  schedule:\n" not in people:
    people = people.replace("on:\n  push:\n", 'on:\n  schedule:\n    - cron: "17 4 * * 3"\n  push:\n', 1)
write(".github/workflows/peoplegroups-live.yml", people)

# Static document-level policies. GitHub Pages cannot be configured here to
# emit arbitrary response headers, so these are intentionally meta policies.
index = read("index.html")
if 'http-equiv="Content-Security-Policy"' not in index:
    marker = '    <meta name="color-scheme" content="light dark" />\n'
    policy = """    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://peoplegroups.org https://unreached-private-continuity.thiepn.workers.dev ws://localhost:* ws://127.0.0.1:*; worker-src 'self' blob:; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'" />
    <meta name="referrer" content="no-referrer" />
"""
    if marker not in index:
        raise SystemExit("index security insertion marker missing")
    index = index.replace(marker, marker + policy, 1)
write("index.html", index)

privacy_html = read("public/privacy.html")
if 'http-equiv="Content-Security-Policy"' not in privacy_html:
    marker = '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n'
    policy = """  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; base-uri 'self'; form-action 'none'" />
  <meta name="referrer" content="no-referrer" />
"""
    if marker not in privacy_html:
        raise SystemExit("privacy security insertion marker missing")
    privacy_html = privacy_html.replace(marker, marker + policy, 1)
privacy_html = privacy_html.replace(
    "an account key derived by hashing the authenticated email.</p>",
    "an account key derived by hashing the authenticated email. The verified email is used transiently for authentication but Unreached does not intentionally persist the plaintext email address in D1.</p>",
)
write("public/privacy.html", privacy_html)

privacy = read("PRIVACY.md")
privacy = privacy.replace(
    "- an account key derived from the authenticated email by SHA-256 hashing.\n",
    "- an account key derived from the authenticated email by SHA-256 hashing.\n\nThe verified email claim is used transiently for authentication and account display/export responses. After the Phase 4 migration, Unreached does not intentionally persist the plaintext email address in D1; persistent identity fields contain the hash-derived user key.\n",
)
write("PRIVACY.md", privacy)

personalization = read("docs/PERSONALIZATION_PRIVACY.md")
personalization = personalization.replace(
    "- a SHA-256-derived account key based on the authenticated email.\n",
    "- a SHA-256-derived account key based on the authenticated email.\n\nThe verified email is used transiently for authentication but is not intentionally persisted as plaintext in D1 after the Phase 4 hash-only identity migration.\n",
)
write("docs/PERSONALIZATION_PRIVACY.md", personalization)

v20 = read("docs/V20_PRIVATE_CONTINUITY.md")
v20 = v20.replace(
    "CORS is restricted to `https://www.thiepn.dev`, allows only the required methods/headers, and does not enable credentialed cross-origin cookies. The Worker never trusts a client-supplied user ID. The normalized authenticated email is SHA-256 hashed to form the D1 user key.\n",
    "CORS is restricted to `https://www.thiepn.dev`, allows only the required methods/headers, and does not enable credentialed cross-origin cookies. The Worker never trusts a client-supplied user ID. The normalized authenticated email is SHA-256 hashed to form the D1 user key. The verified email is used transiently for the authenticated response but, after the Phase 4 migration, D1 persistent identity fields are hash-only; the legacy compatibility column is scrubbed/enforced to the same hash value.\n",
)
v20 = v20.replace(
    "- `sync_users` — authenticated account identity and global revision;",
    "- `sync_users` — hash-derived account identity and global revision; the verified plaintext email is not intentionally persisted after the Phase 4 migration;",
)
write("docs/V20_PRIVATE_CONTINUITY.md", v20)

# Worker: persist only the SHA-256-derived user ID in compatibility/hash fields.
worker = read("worker/src/index.ts")
header_marker = '      "Referrer-Policy": "no-referrer",\n      "X-Content-Type-Options": "nosniff",\n'
header_replacement = header_marker + '      "X-Frame-Options": "DENY",\n      "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",\n'
if worker.count(header_marker) < 2:
    raise SystemExit("Worker security header markers missing")
worker = worker.replace(header_marker, header_replacement, 2)
old_ensure = '''async function ensureUser(env: Env, identity: { email: string; userId: string }): Promise<void> {
  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO sync_users (user_id, email, revision, created_at, updated_at)
    VALUES (?1, ?2, 0, ?3, ?3)
    ON CONFLICT(user_id) DO UPDATE SET email = excluded.email, updated_at = excluded.updated_at
  `).bind(identity.userId, identity.email, now).run();
}'''
new_ensure = '''async function ensureUser(env: Env, identity: { userId: string }): Promise<void> {
  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO sync_users (user_id, email, identity_hash, revision, created_at, updated_at)
    VALUES (?1, ?1, ?1, 0, ?2, ?2)
    ON CONFLICT(user_id) DO UPDATE SET
      email = excluded.email,
      identity_hash = excluded.identity_hash,
      updated_at = excluded.updated_at
  `).bind(identity.userId, now).run();
}'''
if old_ensure not in worker:
    raise SystemExit("Worker ensureUser marker missing")
worker = worker.replace(old_ensure, new_ensure, 1)
options_marker = '          "Cache-Control": "no-store",\n'
options_replacement = options_marker + '          "Referrer-Policy": "no-referrer",\n          "X-Content-Type-Options": "nosniff",\n          "X-Frame-Options": "DENY",\n          "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",\n'
if options_marker not in worker:
    raise SystemExit("Worker OPTIONS marker missing")
worker = worker.replace(options_marker, options_replacement, 1)
write("worker/src/index.ts", worker)

# Sync architecture gate now enforces hash-only identity migration.
sync_gate = read("scripts/sync/v20-check.ts")
old = 'const phase1Migration = await readText("worker/migrations/0002_phase1_atomic_mutations.sql");\n'
new = old + 'const phase4Migration = await readText("worker/migrations/0003_hash_only_identity.sql");\n'
if old not in sync_gate:
    raise SystemExit("v20 phase1 migration marker missing")
sync_gate = sync_gate.replace(old, new, 1)
auth_marker = 'if (!workerRouter.includes(\'request.headers.get("Cf-Access-Jwt-Assertion")\')) throw new Error("Sign-in bootstrap must require a Cloudflare Access assertion.");\n'
auth_addition = auth_marker + 'if (!workerRouter.includes("identity_hash") || !workerRouter.includes("VALUES (?1, ?1, ?1, 0, ?2, ?2)")) throw new Error("Phase 4 Worker must persist only the hash-derived identity.");\nif (workerRouter.includes(".bind(identity.userId, identity.email, now)")) throw new Error("Phase 4 Worker must not persist the verified plaintext email.");\n'
if auth_marker not in sync_gate:
    raise SystemExit("v20 auth marker missing")
sync_gate = sync_gate.replace(auth_marker, auth_addition, 1)
migration_marker = 'for (const column of ["claim_token", "outcome", "applied_revision"]) {\n  if (!phase1Migration.includes(`ADD COLUMN ${column}`)) throw new Error(`Phase 1 D1 migration missing ${column}.`);\n}\n'
migration_addition = migration_marker + 'if (!phase4Migration.includes("ADD COLUMN identity_hash") || !phase4Migration.includes("SET email = user_id") || !phase4Migration.includes("SET email = NEW.user_id")) throw new Error("Phase 4 D1 migration must scrub and enforce hash-only identity storage.");\nfor (const trigger of ["sync_users_hash_only_after_insert", "sync_users_hash_only_after_email_update"]) {\n  if (!phase4Migration.includes(trigger)) throw new Error(`Phase 4 D1 migration missing ${trigger}.`);\n}\n'
if migration_marker not in sync_gate:
    raise SystemExit("v20 migration marker missing")
sync_gate = sync_gate.replace(migration_marker, migration_addition, 1)
write("scripts/sync/v20-check.ts", sync_gate)

# Correct Phase 4 gate for rollback-compatible legacy column naming.
phase4_gate = read("scripts/operations/phase4-check.ts")
old = '''if (/INSERT INTO sync_users \\(user_id, email/.test(worker) || /SET email\\s*=/.test(worker)) {
  throw new Error("Phase 4: Worker must not persist authenticated email addresses.");
}
'''
new = '''requireText(worker, "VALUES (?1, ?1, ?1, 0, ?2, ?2)", "hash-only Worker identity write");
if (worker.includes(".bind(identity.userId, identity.email, now)")) throw new Error("Phase 4: Worker must not persist the verified plaintext email.");
'''
if old not in phase4_gate:
    raise SystemExit("Phase 4 gate Worker marker missing")
phase4_gate = phase4_gate.replace(old, new, 1)
old = '''requireText(hashMigration, "RENAME COLUMN email TO identity_hash", "hash-only identity migration rename");
requireText(hashMigration, "SET identity_hash = user_id", "hash-only identity backfill");
'''
new = '''requireText(hashMigration, "ADD COLUMN identity_hash TEXT", "hash-only identity semantic column");
requireText(hashMigration, "SET email = user_id", "legacy identity plaintext scrub");
requireText(hashMigration, "SET identity_hash = user_id", "hash-only identity backfill");
requireText(hashMigration, "sync_users_hash_only_after_insert", "hash-only insert trigger");
requireText(hashMigration, "sync_users_hash_only_after_email_update", "hash-only compatibility update trigger");
'''
if old not in phase4_gate:
    raise SystemExit("Phase 4 gate migration marker missing")
phase4_gate = phase4_gate.replace(old, new, 1)
write("scripts/operations/phase4-check.ts", phase4_gate)

# Private Worker certification exercises migrations locally.
cert = read(".github/workflows/sync-worker-cert.yml")
cert_marker = "      - name: Verify deployment template remains secret-free\n"
cert_steps = '''      - name: Apply D1 migrations to an isolated local database
        working-directory: worker
        run: |
          rm -rf .wrangler
          npx wrangler d1 migrations apply unreached-private-continuity --local --config wrangler.generated.jsonc

      - name: Verify local hash-only identity schema
        working-directory: worker
        shell: bash
        run: |
          set -euo pipefail
          result=$(npx wrangler d1 execute unreached-private-continuity --local --config wrangler.generated.jsonc --json --command "SELECT (SELECT COUNT(*) FROM pragma_table_info('sync_users') WHERE name='identity_hash') AS identity_hash_columns, (SELECT COUNT(*) FROM sqlite_master WHERE type='trigger' AND name LIKE 'sync_users_hash_only_%') AS hash_triggers, (SELECT COUNT(*) FROM sync_users WHERE email <> user_id OR identity_hash IS NULL OR identity_hash <> user_id) AS invalid_rows;")
          printf '%s' "$result" | jq -e '.[0].results[0] | .identity_hash_columns == 1 and .hash_triggers >= 2 and .invalid_rows == 0' >/dev/null

'''
if cert_marker not in cert:
    raise SystemExit("sync cert marker missing")
cert = cert.replace(cert_marker, cert_steps + cert_marker, 1)
write(".github/workflows/sync-worker-cert.yml", cert)

# Production Worker deployment captures a Time Travel bookmark and verifies migration.
deploy = read(".github/workflows/deploy-sync-worker.yml")
deploy_marker = '''      - name: Apply D1 migrations
        working-directory: worker
        run: npx wrangler d1 migrations apply "$D1_NAME" --remote --config wrangler.generated.jsonc
'''
deploy_steps = '''      - name: Capture pre-migration D1 Time Travel bookmark
        working-directory: worker
        shell: bash
        run: |
          set -euo pipefail
          mkdir -p ../.recovery
          npx wrangler d1 time-travel info "$D1_NAME" --config wrangler.generated.jsonc | tee ../.recovery/d1-pre-migration.txt

      - name: Upload pre-migration recovery reference
        uses: actions/upload-artifact@v7
        with:
          name: d1-pre-migration-bookmark
          path: .recovery/d1-pre-migration.txt
          retention-days: 30

      - name: Apply D1 migrations
        working-directory: worker
        run: npx wrangler d1 migrations apply "$D1_NAME" --remote --config wrangler.generated.jsonc

      - name: Verify remote hash-only identity invariant
        working-directory: worker
        shell: bash
        run: |
          set -euo pipefail
          result=$(npx wrangler d1 execute "$D1_NAME" --remote --config wrangler.generated.jsonc --json --command "SELECT (SELECT COUNT(*) FROM pragma_table_info('sync_users') WHERE name='identity_hash') AS identity_hash_columns, (SELECT COUNT(*) FROM sqlite_master WHERE type='trigger' AND name LIKE 'sync_users_hash_only_%') AS hash_triggers, (SELECT COUNT(*) FROM sync_users WHERE email <> user_id OR identity_hash IS NULL OR identity_hash <> user_id) AS invalid_rows;")
          printf '%s' "$result" | jq -e '.[0].results[0] | .identity_hash_columns == 1 and .hash_triggers >= 2 and .invalid_rows == 0' >/dev/null
'''
if deploy_marker not in deploy:
    raise SystemExit("deploy migration marker missing")
deploy = deploy.replace(deploy_marker, deploy_steps, 1)
old_access = '''      - name: Verify Access protects sign-in bootstrap
        env:
          BACKEND_ORIGIN: ${{ steps.backend.outputs.origin }}
        run: |
          STATUS=$(curl --silent --show-error -o /dev/null -w '%{http_code}' "$BACKEND_ORIGIN/unreached-sync/private/auth/start?returnOrigin=https%3A%2F%2Fwww.thiepn.dev")
          case "$STATUS" in
            200|301|302|303|307|308|401|403) ;;
            *) echo "Unexpected sign-in bootstrap status: $STATUS"; exit 1 ;;
          esac
          echo "Unauthenticated sign-in bootstrap returned HTTP $STATUS as expected."
'''
new_access = '''      - name: Verify Access protects sign-in bootstrap
        env:
          BACKEND_ORIGIN: ${{ steps.backend.outputs.origin }}
        shell: bash
        run: |
          set -euo pipefail
          body=$(mktemp)
          STATUS=$(curl --silent --show-error -o "$body" -w '%{http_code}' "$BACKEND_ORIGIN/unreached-sync/private/auth/start?returnOrigin=https%3A%2F%2Fwww.thiepn.dev")
          case "$STATUS" in
            200|301|302|303|307|308|401|403) ;;
            *) echo "Unexpected sign-in bootstrap status: $STATUS"; cat "$body"; exit 1 ;;
          esac
          if [[ "$STATUS" == "200" ]] && grep -q "Sign-in complete. You can return to Unreached." "$body"; then
            echo "Authenticated completion page was anonymously reachable." >&2
            exit 1
          fi
          echo "Unauthenticated sign-in bootstrap returned HTTP $STATUS without exposing the authenticated completion page."
'''
if old_access not in deploy:
    raise SystemExit("deploy access marker missing")
deploy = deploy.replace(old_access, new_access, 1)
write(".github/workflows/deploy-sync-worker.yml", deploy)

# Canonical deployment must retain static security-policy metadata.
pages = read(".github/workflows/deploy-pages.yml")
pages_marker = '          if (!html.includes("/unreached/")) throw new Error("Production HTML is missing /unreached/ scoped assets");\n'
pages_add = pages_marker + '          if (!html.includes(\'http-equiv="Content-Security-Policy"\')) throw new Error("Production HTML is missing the document CSP policy");\n          if (!html.includes(\'name="referrer" content="no-referrer"\')) throw new Error("Production HTML is missing the referrer policy");\n'
if pages_marker not in pages:
    raise SystemExit("pages policy marker missing")
pages = pages.replace(pages_marker, pages_add, 1)
write(".github/workflows/deploy-pages.yml", pages)

# Finalization status truth.
finalization = read("docs/FINALIZATION_PLAN.md")
finalization = finalization.replace(
    "**Status:** implementation complete; exact-SHA PR and post-merge certification required  \n**Release target:** `2.1.1`  \n**Branch:** `phase/phase3-release-truth-privacy-licensing`",
    "**Status:** completed  \n**Merged SHA:** `ae0a5654ea149ccec27b3b331384b13895392b48`  \n**Release:** `2.1.1`",
)
phase4_heading = "## Phase 4 — Reproducibility, Security and Operations\n\n"
if phase4_heading in finalization and "**Status:** implementation complete; certification required" not in finalization:
    finalization = finalization.replace(phase4_heading, phase4_heading + "**Status:** implementation complete; certification required  \n**Branch:** `phase/phase4-repro-security-operations`\n\n", 1)
write("docs/FINALIZATION_PLAN.md", finalization)
