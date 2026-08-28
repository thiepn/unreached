import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFile(resolve(root, path), "utf8");

function requireText(source: string, marker: string, label: string): void {
  if (!source.includes(marker)) throw new Error(`Phase 4: missing ${label}`);
}

const nodeVersion = (await read(".nvmrc")).trim();
if (nodeVersion !== "22.23.2") throw new Error(`Phase 4: .nvmrc must pin Node 22.23.2, found ${nodeVersion}`);

const rootPackage = JSON.parse(await read("package.json")) as { name?: string; version?: string; scripts?: Record<string, string> };
const workerPackage = JSON.parse(await read("worker/package.json")) as { name?: string; version?: string };
const rootLock = JSON.parse(await read("package-lock.json")) as { name?: string; version?: string; lockfileVersion?: number };
const workerLock = JSON.parse(await read("worker/package-lock.json")) as { name?: string; version?: string; lockfileVersion?: number };
for (const [label, pkg, lock] of [["root", rootPackage, rootLock], ["worker", workerPackage, workerLock]] as const) {
  if (lock.lockfileVersion !== 3) throw new Error(`Phase 4: ${label} lockfile must use lockfileVersion 3.`);
  if (lock.name !== pkg.name || lock.version !== pkg.version) throw new Error(`Phase 4: ${label} package and lockfile identity/version drifted.`);
}
if (!rootPackage.scripts?.["operations:check"]?.includes("scripts/operations/phase4-check.ts")) throw new Error("Phase 4: operations:check is not wired.");
if (!rootPackage.scripts?.build?.includes("npm run operations:check")) throw new Error("Phase 4: operations:check must block production builds.");
if (!rootPackage.scripts?.["audit:licenses"]?.includes("dependency-license-audit.mjs")) throw new Error("Phase 4: dependency license audit script is not wired.");

const workflowDir = resolve(root, ".github/workflows");
const workflowNames = (await readdir(workflowDir)).filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"));
for (const name of workflowNames) {
  const source = await read(`.github/workflows/${name}`);
  if (/npm install --no-audit --no-fund/.test(source)) throw new Error(`Phase 4: ${name} still uses npm install instead of npm ci.`);
  if (/node-version:\s*["']?22(?:["']|\s|$)/m.test(source)) throw new Error(`Phase 4: ${name} still floats on Node 22.`);
  if (source.includes("actions/setup-node@") && !source.includes('node-version-file: ".nvmrc"')) {
    throw new Error(`Phase 4: ${name} must use the repository .nvmrc.`);
  }
}

for (const required of [
  ".github/workflows/dependency-audit.yml",
  ".github/workflows/operations-health.yml",
  ".github/workflows/worker-production-cert.yml",
  "docs/OPERATIONS_AND_RECOVERY.md",
  "docs/PHASE4_REPRO_SECURITY_OPERATIONS.md",
  "SECURITY.md",
  "worker/migrations/0003_hash_only_identity.sql",
]) {
  if (!existsSync(resolve(root, required))) throw new Error(`Phase 4: required artifact missing: ${required}`);
}

const peopleGroupsWorkflow = await read(".github/workflows/peoplegroups-live.yml");
requireText(peopleGroupsWorkflow, "schedule:", "scheduled PeopleGroups certification");
requireText(peopleGroupsWorkflow, 'cron: "17 4 * * 3"', "weekly PeopleGroups certification cadence");
const operationsWorkflow = await read(".github/workflows/operations-health.yml");
requireText(operationsWorkflow, "schedule:", "scheduled operations health workflow");
requireText(operationsWorkflow, "unreached/operations-health", "operations health commit status");
const dependencyWorkflow = await read(".github/workflows/dependency-audit.yml");
requireText(dependencyWorkflow, "npm audit --audit-level=high", "high-severity dependency audit");
requireText(dependencyWorkflow, "npm run audit:licenses", "dependency license audit workflow step");
const workerProductionWorkflow = await read(".github/workflows/worker-production-cert.yml");
for (const marker of [
  "workflow_run:",
  "Unreached Private Sync Deployment",
  "unreached/worker-production",
  "permissions-policy",
  "x-frame-options",
  "access-control-allow-origin",
  "Sign-in complete. You can return to Unreached.",
]) requireText(workerProductionWorkflow.toLowerCase(), marker.toLowerCase(), `Worker production certification marker ${marker}`);

const indexHtml = await read("index.html");
requireText(indexHtml, 'http-equiv="Content-Security-Policy"', "application CSP meta policy");
requireText(indexHtml, 'name="referrer" content="no-referrer"', "application referrer policy");
requireText(indexHtml, "https://peoplegroups.org", "PeopleGroups CSP connect source");
requireText(indexHtml, "https://unreached-private-continuity.thiepn.workers.dev", "private-sync CSP connect source");
const privacyHtml = await read("public/privacy.html");
requireText(privacyHtml, 'http-equiv="Content-Security-Policy"', "privacy-page CSP meta policy");
requireText(privacyHtml, 'name="referrer" content="no-referrer"', "privacy-page referrer policy");

const worker = await read("worker/src/index.ts");
for (const marker of [
  '"Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()"',
  '"X-Frame-Options": "DENY"',
  "identity_hash",
]) requireText(worker, marker, `Worker security marker ${marker}`);
requireText(worker, "VALUES (?1, ?1, ?1, 0, ?2, ?2)", "hash-only Worker identity write");
if (worker.includes(".bind(identity.userId, identity.email, now)")) throw new Error("Phase 4: Worker must not persist the verified plaintext email.");
const hashMigration = await read("worker/migrations/0003_hash_only_identity.sql");
requireText(hashMigration, "ADD COLUMN identity_hash TEXT", "hash-only identity semantic column");
requireText(hashMigration, "SET email = user_id", "legacy identity plaintext scrub");
requireText(hashMigration, "identity_hash = user_id", "hash-only identity backfill");
requireText(hashMigration, "sync_users_hash_only_after_insert", "hash-only insert trigger");
requireText(hashMigration, "sync_users_hash_only_after_email_update", "hash-only compatibility update trigger");

const gitignore = await read(".gitignore");
for (const marker of ["worker/wrangler.generated.jsonc", "worker/.wrangler/", "playwright-report/", "test-results/"]) {
  requireText(gitignore, marker, `generated-artifact ignore ${marker}`);
}

const operationsDoc = await read("docs/OPERATIONS_AND_RECOVERY.md");
for (const marker of ["Time Travel", "tombstone", "mutation", "rollback", "incident", "account deletion", "plaintext email", "Unreached Worker Production Certification"]) {
  requireText(operationsDoc.toLowerCase(), marker.toLowerCase(), `operations documentation topic ${marker}`);
}
requireText(operationsDoc, "npx wrangler d1 time-travel info unreached-private-continuity --config wrangler.generated.jsonc", "correct D1 Time Travel bookmark command");
if (operationsDoc.includes("npx wrangler d1 time-travel info unreached-private-continuity --remote")) {
  throw new Error("Phase 4: D1 Time Travel info documentation must not use the unsupported --remote flag.");
}
const phase4Doc = await read("docs/PHASE4_REPRO_SECURITY_OPERATIONS.md");
requireText(phase4Doc, "22.23.2", "Phase 4 pinned Node documentation");
requireText(phase4Doc, "GitHub Pages", "GitHub Pages security-header limitation documentation");

console.log("Phase 4 reproducibility/security/operations checks passed: lockfiles and Node are pinned, workflows use npm ci, privacy identity storage is hash-only, static and deployed Worker security policies are certified, and scheduled recovery/health controls are wired.");
